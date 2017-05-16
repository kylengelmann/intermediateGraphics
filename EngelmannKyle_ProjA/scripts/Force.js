class Force {
	constructor() {
		if(this.constructor === Force) {
			throw new TypeError('Abstract class "Force" cannot be instantiated directly.');
		}
		else {
			this.active = true;
		}
	}
	apply(State) {
		var numP;
		if(!this.particles) {
			this.particles = [];
			for(var i = 0; i < State.numParticles; i++) {
				this.particles[i] = i;
			}
		}
		numP = this.particles.length
		for(var i = 0; i < numP; i++) {
			this.perParticle(State, this.particles[i]);
		}
	}

}

class constantForce extends Force {
	constructor(force, particles) {
		super();
		this.force = Float32Array.from(force);
		if(particles) {
			this.particles = particles;
		}
	}

	perParticle(State, i) {
		State.addParticleForce(i, this.force);
	}
}

class constantVelocity extends Force {
	constructor(vel, particles) {
		super();
		this.vel = Float32Array.from(vel);
		if(particles) {
			this.particles = particles;
		}
	}

	perParticle(State, i) {
		State.setParticleVelocity(i, this.vel);
	}
}

class constantAcceleration extends Force {
	constructor(acc, particles) {
		super();
		this.acc = Float32Array.from(acc);
		if(particles) {
			this.particles = particles;
		}
	}

	perParticle(State, i) {
		var force = Float32Array.from(this.acc);
		var mass = State.getParticleMass(i);
		force[0] *= mass;
		force[1] *= mass;
		force[2] *= mass;
		State.addParticleForce(i, force);
	}
}

class dragForce extends Force {
	constructor(drag, particles) {
		super();
		this.drag = drag;
		if(particles) {
			this.particles = particles;
		}
	}
	perParticle(State, i) {
		var force = Float32Array.from(State.getParticleVelocity(i));
		force[0] *= -this.drag;
		force[1] *= -this.drag;
		force[2] *= -this.drag;
		State.addParticleForce(i, force);
	}
}

class springForce extends Force {
	constructor(length, k, endpoints) {
		super();
		this.length = length;
		this.k = k;
		this.endpoints = Float32Array.from(endpoints);
	}

	apply(State) {
		var p0 = Float32Array.from(State.getParticlePosition(this.endpoints[0]));
		var f0 = State.getParticleForce(this.endpoints[0]);
		var m0 = State.getParticleMass(this.endpoints[0]);
		var p1 = Float32Array.from(State.getParticlePosition(this.endpoints[1]));
		var f1 = State.getParticleForce(this.endpoints[1]);
		var m1 = State.getParticleMass(this.endpoints[1]);
		var dir = new Float32Array(3);
		var force0 = new Float32Array(3);
		var force1 = new Float32Array(3);
		for(var i = 0; i < 3; i++){
			dir[i] = p1[i] - p0[i];
		}
		var mag = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2])
		var dL = mag - this.length;
		for(var i = 0; i < 3; i++){
			dir[i] /= mag;
			// var transfered = (f1[i]*dir[i]*dir[i]*m0/(m0+m1) - f0[i]*dir[i]*dir[i]*m1/(m0+m1))*this.transfer;
			force0[i] = dir[i]*this.k*dL;// + transfered;
			force1[i] = -force0[i];
		}
		// console.log(force0);
		// console.log(force1);
		State.addParticleForce(this.endpoints[0], force0);
		State.addParticleForce(this.endpoints[1], force1);
	}
}

class boidsForce extends Force {
	constructor(radius, evasion, colAvoid, velAllign, flockConst) {
		super();
		this.radius = radius;
		this.colAvoid = colAvoid;
		this.velAllign = velAllign
		this.flockConst = flockConst;
		this.evasion = evasion;
		this.obstacles = [];
	}

	perParticle(State, num) {
		var p = State.getParticlePosition(num);
		var v = State.getParticleVelocity(num);
		var neighPos = [];
		var neighVel = [];
		var neighDist = [];
		for(var i = 0; i < State.numParticles; i++) {
			if(i != num) {
				var pos = State.getParticlePosition(i);
				var dir = new Float32Array(3);
				for(var j = 0; j < 3; j++){
					dir[j] = pos[j] - p[j];
				}
				var dist = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]);
				if(dist < this.radius) {
					neighDist.push(dist);
					neighPos.push(pos);
					neighVel.push(State.getParticleVelocity(i));
				}
			}
		}

		if(neighPos.length > 0) {
			var avgPos = new Float32Array([0, 0, 0]);
			var avgVel = new Float32Array([0, 0, 0]);
			var boidForce = new Float32Array([0, 0, 0]);
			var colForce = new Float32Array([0, 0, 0]);
			for(var i = 0; i < neighPos.length; i++) {
				for(var j = 0; j < 3; j++) {
					avgPos[j] += neighPos[i][j];
					colForce[j] += (p[j] - neighPos[i][j])/(neighDist[i]*neighDist[i])*this.colAvoid;
					avgVel[j] += neighVel[i][j];
				}
			}
			var obstForce = new Float32Array([0, 0, 0]);
			for(var i = 0; i < this.obstacles.length; i++) {
				var dist = this.obstacles[i].getDistance(p);
				var distMag = Math.sqrt(dist[0]*dist[0] + dist[1]*dist[1] + dist[2]*dist[2]);
				if(distMag <= this.radius) {
					for(var j = 0; j < 3; j++) {
						obstForce[j] += (dist[j])/(distMag*distMag*distMag)*this.evasion;
					}
				}
			}

			var aVelMag = Math.sqrt(avgVel[0]*avgVel[0] + avgVel[1]*avgVel[1] + avgVel[2]*avgVel[2]);
			var vMag = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
			var velForce = new Float32Array([0, 0, 0]);
			var flockForce = new Float32Array([0, 0, 0]);
			for(var i = 0; i < 3; i++) {
				avgPos[i] /= neighPos.length;
				flockForce[i] = (avgPos[i] - p[i])*this.flockConst;
				avgVel[i] /= neighPos.length;
				var diffVel = avgVel[i] - v[i];
				// var dotVel = avgVel[i]*v[i]/(vMag*aVelMag);
				velForce[i] += diffVel*this.velAllign;
				boidForce[i] += flockForce[i] + velForce[i] + obstForce[i] + colForce[i];
			}
			// console.log(colForce);
			// console.log(flockForce);
			// console.log(velForce);
			// console.log(boidForce);
			State.addParticleForce(num, boidForce);
		}

	}
}


// class boidsObstacle {
// 	constructor() {
// 		if(this.constructor === boidsObstacle) {
// 			throw new TypeError('Abstract class "boidsObstacle" cannot be instantiated directly.');
// 		}
// 	}
// }

class boidsWall {
	constructor(pos, norm) {
		this.pos = new Float32Array([0, 0, 0]);
		this.norm = new Float32Array([0, 0, 1]);
		if(pos) {
			this.pos[0] = pos[0];
			this.pos[1] = pos[1];
			this.pos[2] = pos[2];
		}
		if(norm) {
			var mag = Math.sqrt(norm[0]*norm[0] + norm[1]*norm[1] + norm[2]*norm[2]);
			this.norm[0] = norm[0]/mag;
			this.norm[1] = norm[1]/mag;
			this.norm[2] = norm[2]/mag;
		}
	}

	getDistance(pos) {
		var relPos = new Float32Array(3);
		relPos[0] = pos[0] - this.pos[0];
		relPos[1] = pos[1] - this.pos[1];
		relPos[2] = pos[2] - this.pos[2];
		var posDotNorm = relPos[0]*this.norm[0] + 
						 relPos[1]*this.norm[1] + 
						 relPos[2]*this.norm[2];

		var dist = new Float32Array([0, 0, 0]);
		for(var i = 0; i < 3; i++){
			dist[i] = this.norm[i]*posDotNorm;
		}

		return dist;
	} 
}

class boidsCylinder {
	constructor(pos, axis, radius) {
		this.pos = pos;
		this.axis = axis;
		this.axis = Float32Array.from(axis);
		var mag = Math.sqrt(axis[0]*axis[0] + axis[1]*axis[1] + axis[2]*axis[2]);
		for(var i = 0; i<3; i++){
			this.axis[i] /= mag;
		}
		this.radius = radius;
	}
	getDistance(pos) {
		var relPos = new Float32Array(3);
		relPos[0] = pos[0] - this.pos[0];
		relPos[1] = pos[1] - this.pos[1];
		relPos[2] = pos[2] - this.pos[2];

		var pDot = relPos[0]*this.axis[0] + relPos[1]*this.axis[1] + relPos[2]*this.axis[2];
		relPos[0] -= pDot*this.axis[0];
		relPos[1] -= pDot*this.axis[1];
		relPos[2] -= pDot*this.axis[2];

		var mag = Math.sqrt(relPos[0]*relPos[0] + relPos[1]*relPos[1] + relPos[2]*relPos[2]);

		for(var i = 0; i<3; i++) {
			relPos[i] *= (mag - this.radius)/mag;
		}

		return relPos;

	}
}

function cross(a, b) {
	var c = new Float32Array(3);
	c[0] = a[1]*b[2] - a[2]*b[1];
	c[1] = a[2]*b[0] - a[0]*b[2];
	c[2] = a[0]*b[1] - a[1]*b[0];
	return c;
}

class ringForce extends Force {
	constructor(axis, pos, spinStrength, correctiveStrength, particles) {
		super();
		this.axis = Float32Array.from(axis);
		var mag = Math.sqrt(axis[0]*axis[0] + axis[1]*axis[1] + axis[2]*axis[2]);
		for(var i = 0; i<3; i++){
			this.axis[i] /= mag;
		}
		this.pos = Float32Array.from(pos);
		this.spinStrength = spinStrength;
		this.correctiveStrength = correctiveStrength;
		if(particles) {
			this.particles = particles;
		}
	}

	perParticle(State, num) {
		var force = new Float32Array([0, 0, 0]);
		var perp = new Float32Array(3);
		var pPos = State.getParticlePosition(num);
		var pMass = State.getParticleMass(num);
		for(var i = 0; i<3; i++){
			perp[i] = pPos[i] - this.pos[i];
		}
		var dotAxis = perp[0]*this.axis[0] + perp[1]*this.axis[1] + perp[2]*this.axis[2]
		var mag = Math.sqrt(perp[0]*perp[0] + perp[1]*perp[1] + perp[2]*perp[2]);
		for(var i = 0; i<3; i++){
			perp[i] /= mag;
		}
		var spinForce = cross(this.axis, perp);
		var crossMag = Math.sqrt(spinForce[0]*spinForce[0] + spinForce[1]*spinForce[1] + spinForce[2]*spinForce[2]);
		var correctiveForce = Float32Array.from(this.axis);
		for(var i = 0; i<3; i++){
			spinForce[i] *= this.spinStrength*pMass/(mag*crossMag);
			correctiveForce[i] *= -dotAxis*this.correctiveStrength*pMass;
			force[i] = spinForce[i] + correctiveForce[i];
		}

		State.addParticleForce(num, force);
	}
}

const G_CONST = 6.67408/100000000000;

class gravitationalField {
	constructor(pos, mass) {
		this.pos = Float32Array.from(pos);
		this.mass = mass;
	}
	getField(pos) {
		var field = new Float32Array(3);
		var relPos = new Float32Array(3);
		for(var i = 0; i<3; i++){
			relPos[i] = pos[i] - this.pos[i];
		}
		var mag = Math.sqrt(relPos[0]*relPos[0] + relPos[1]*relPos[1] + relPos[2]*relPos[2]);
		for(var i = 0; i<3; i++){
			relPos[i] /= mag;
			field[i] = -G_CONST*this.mass/(mag*mag)*relPos[i];
		}
		return field;
	}
}

class gravitationalForce extends Force {
	constructor(field) {
		super();
		this.field = field;
	}
	perParticle(State, num) {
		var force = new Float32Array(3);
		var mass = State.getParticleMass(num);
		var field = this.field.getField(State.getParticlePosition(num));
		for(var i = 0; i<3; i++) {
			force[i] = field[i]*mass;
		}
		State.addParticleForce(num, force);
	}
}






class Constraint {
	constructor() {
		if(this.constructor === Constraint) {
			throw new TypeError('Abstract class "Constraint" cannot be instantiated directly.');
		}
	}

	apply(State) {
		for(var i = 0; i < State.numParticles; i++) {
			this.perParticle(State, i);
		}
	}
}

class planeConstraint extends Constraint {
	constructor(pos, norm, loss) {
		super();
		this.pos = new Float32Array([0, 0, 0]);
		this.norm = new Float32Array([0, 0, 1]);
		if(pos) {
			this.pos[0] = pos[0];
			this.pos[1] = pos[1];
			this.pos[2] = pos[2];
		}
		if(norm) {
			this.norm[0] = norm[0];
			this.norm[1] = norm[1];
			this.norm[2] = norm[2];
		}

		this.loss = loss;
	}

	perParticle(State, num) {
		var pPos = State.getParticlePosition(num);
		var relPos = new Float32Array(3);
		relPos[0] = pPos[0] - this.pos[0];
		relPos[1] = pPos[1] - this.pos[1];
		relPos[2] = pPos[2] - this.pos[2];
		var posDotNorm = relPos[0]*this.norm[0] + 
						 relPos[1]*this.norm[1] + 
						 relPos[2]*this.norm[2];
		if(posDotNorm < 0) {
			pPos[0] -= this.norm[0]*posDotNorm;
			pPos[1] -= this.norm[1]*posDotNorm;
			pPos[2] -= this.norm[2]*posDotNorm;

			var vel = State.getParticleVelocity(num);
			var velDotNorm = vel[0]*this.norm[0] + 
							 vel[1]*this.norm[1] + 
							 vel[2]*this.norm[2];

			if(velDotNorm < 0) {
				vel[0] -= (2.0 - this.loss)*this.norm[0]*velDotNorm;
				vel[1] -= (2.0 - this.loss)*this.norm[1]*velDotNorm;
				vel[2] -= (2.0 - this.loss)*this.norm[2]*velDotNorm;

			}

			State.setParticlePosition(num, pPos);
			State.setParticleVelocity(num, vel);
		}
	}
}

class fixedConstraint extends Constraint {
	constructor(particles, positions) {
		super();
		this.particles = particles;
		this.positions = positions;
	}

	apply(State) {
		for(var i = 0; i < this.particles.length; i++) {
			State.setParticlePosition(this.particles[i], this.positions[i]);
			State.setParticleVelocity(this.particles[i], [0, 0, 0]);
		}
	}
}

class timeAliveConstraint extends Constraint {
	constructor(time, resetFunction) {
		super();
		this.time = time;
		this.resetFunction = resetFunction;
	}

	apply(State) {
		for(var i = 0; i < State.numParticles; i++) {
			var t = State.getParticleTimeAlive(i);
			if(t >= this.time) {
				this.resetFunction(State, i);
				State.setParticleTimeAlive(i, 0);
			}
		}
	}
}

class rodConstraint extends Constraint {
	constructor(length, tolerance, endpoints) {
		super();
		this.length = length;
		this.endpoints = endpoints;
		this.tolerance = tolerance;
	}

	apply(State) {
		var m0 = State.getParticleMass(this.endpoints[0]);
		var v0 = State.getParticleVelocity(this.endpoints[0]);
		var p0 = State.getParticlePosition(this.endpoints[0]);

		var m1 = State.getParticleMass(this.endpoints[1]);
		var v1 = State.getParticleVelocity(this.endpoints[1]);
		var p1 = State.getParticlePosition(this.endpoints[1]);

		var dir = new Float32Array(3);


		for(var i = 0; i < 3; i++) {
			dir[i] = p1[i] - p0[i];
		}

		var l = Math.sqrt(dir[0]*dir[0] + dir[1]*dir[1] + dir[2]*dir[2]);

		var dl = l - this.length;

		if(dl*dl < this.tolerance*this.tolerance) {
			dl = 0;
		}
		var v0Dot = (v0[0]*dir[0] + v0[1]*dir[1] + v0[2]*dir[2])/l;
		var v1Dot = (v1[0]*dir[0] + v1[1]*dir[1] + v1[2]*dir[2])/l;

		for(var i = 0; i < 3; i++) {

			dir[i] /= l;
			p0[i] += dir[i]*dl*m1/(m0+m1);
			p1[i] -= dir[i]*dl*m0/(m0+m1);


			// dir[i] *= dir[i]/Math.abs(dir[i]+.0000001);

			var v0Tan = v0[i] - v0Dot*dir[i];
			var v1Tan = v1[i] - v1Dot*dir[i];

			var vDot = (v0Dot*m0/(m0+m1) + v1Dot*m1/(m0+m1))*dir[i];
			// var vDot = 0;

			v0[i] = v0Tan + vDot;
			v1[i] = v1Tan + vDot;
		}

		State.setParticlePosition(this.endpoints[0], p0);
		State.setParticleVelocity(this.endpoints[0], v0);

		State.setParticlePosition(this.endpoints[1], p1);
		State.setParticleVelocity(this.endpoints[1], v1);

	}
}

class sphereConstraint extends Constraint {
	constructor(pos, radius, loss) {
		super();
		this.pos = Float32Array.from(pos);
		this.radius = radius;
		this.loss = loss;
	}

	perParticle(State, num) {
		var pos = State.getParticlePosition(num);
		var vel = State.getParticleVelocity(num);
		var relPos = new Float32Array(3);
		for(var i = 0; i<3; i++){
			relPos[i] = pos[i] - this.pos[i];
		}
		var mag = Math.sqrt(relPos[0]*relPos[0] + relPos[1]*relPos[1] + relPos[2]*relPos[2]);
		if(mag <= this.radius) {
			for(var i = 0; i<3; i++) {
				relPos[i] /= mag;
				pos[i] *= (this.radius/mag);
			}
			State.setParticlePosition(num, pos)
			var velDot = relPos[0]*vel[0] + relPos[1]*vel[1] + relPos[2]*vel[2]
			if(velDot < 0) {
				for(var i = 0; i<3; i++) {
					vel[i] = (vel[i] - velDot*relPos[i]) - velDot*relPos[i]*(1 - this.loss);
				}
				State.setParticleVelocity(num, vel);
			}
		}
	}
}







