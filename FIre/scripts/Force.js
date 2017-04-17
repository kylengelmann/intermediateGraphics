class Force {
	constructor() {
		if(this.constructor === Force) {
			throw new TypeError('Abstract class "Force" cannot be instantiated directly.');
		}
	}
	apply(State) {
		var numP;
		if(!this.particles) numP = State.numParticles;
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
		var p1 = Float32Array.from(State.getParticlePosition(this.endpoints[1]));
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
			force0[i] = dir[i]*this.k*dL;
			force1[i] = -dir[i]*this.k*dL;
		}
		State.addParticleForce(this.endpoints[0], force0);
		State.addParticleForce(this.endpoints[1], force1);
	}
}












class particleConstraint {
	constructor() {
		if(this.constructor === particleConstraint) {
			throw new TypeError('Abstract class "particleConstraint" cannot be instantiated directly.');
		}
	}

	apply(State) {
		for(var i = 0; i < State.numParticles; i++) {
			this.updateParticle(State, i);
		}
	}
}

class planeConstraint extends particleConstraint {
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

	updateParticle(State, num) {
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
				vel[0] -= 2.0*this.norm[0]*velDotNorm;
				vel[1] -= 2.0*this.norm[1]*velDotNorm;
				vel[2] -= 2.0*this.norm[2]*velDotNorm;
			}

			vel[0] *= loss;
			vel[1] *= loss;
			vel[2] *= loss;

			State.setParticlePosition(num, pPos);
			State.setParticleVelocity(num, vel);
		}
	}
}

class fixedConstraint extends particleConstraint {
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

class timeAliveConstraint extends particleConstraint {
	constructor(particles, times) {
		super();
		this.particles = particles;
		this.times = times;
	}

	apply(State) {
		for(var i = 0; i < this.particles.length; i++) {
			if(State.getParticleTimeAlive(this.particles[i]) >= this.times[i]) {
				State.setParticlePosition(this.particles[i], [NaN, NaN, NaN]);
				State.setParticleVelocity(this.particles[i], [0, 0, 0]);
			}
		}
	}
}







