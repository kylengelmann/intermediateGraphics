var Physics = {
	drag: .99,
	g: -9.8
};



class physicsObject {
	constructor(Mass, Position, Velocity) {
		this.Mass = Mass;
		this.Position = new Float32Array ([Position[0], Position[1], Position[2]]);
		this.Velocity = new Float32Array ([Velocity[0], Velocity[1], Velocity[2]]);
		this.netForce = new Float32Array ([0, 0, 0]);
	}
	addForce(Force) {
		this.netForce[0] += Force[0];
		this.netForce[1] += Force[1];
		this.netForce[2] += Force[2];
	}
	setForce(Force) {
		this.netForce[0] = Force[0];
		this.netForce[1] = Force[1];
		this.netForce[2] = Force[2];
	}
	setPosition(Position) {
		this.Position[0] = Position[0];
		this.Position[1] = Position[1];
		this.Position[2] = Position[2];
	}
	setVelocity(Velocity) {
		this.Velocity[0] = Velocity[0];
		this.Velocity[1] = Velocity[1];
		this.Velocity[2] = Velocity[2];
	}
	update(dt) {

		this.addForce([0, 0, Physics.g*this.Mass]);
		// var a = new Float32Array ([this.netForce[0]/this.Mass, 
		// 	this.netForce[1]/this.Mass, this.netForce[2]/this.Mass]);

		// this.Position[0] += this.Velocity[0]*dt + .5*a[0]*dt*dt;
		// this.Position[1] += this.Velocity[1]*dt + .5*a[1]*dt*dt;
		// this.Position[2] += this.Velocity[2]*dt + .5*a[2]*dt*dt;

		this.Velocity[0] += this.netForce[0]/this.Mass*dt;
		this.Velocity[1] += this.netForce[1]/this.Mass*dt;
		this.Velocity[2] += this.netForce[2]/this.Mass*dt;

		this.Velocity[0] *= Physics.drag;
		this.Velocity[1] *= Physics.drag;
		this.Velocity[2] *= Physics.drag;

		this.Position[0] += this.Velocity[0]*dt;
		this.Position[1] += this.Velocity[1]*dt;
		this.Position[2] += this.Velocity[2]*dt;

		this.netForce[0] = 0;
		this.netForce[1] = 0;
		this.netForce[2] = 0;
	}
}

const PARTICLE_ARRAY_SIZE = 15;
const PARTICLE_VBO_SIZE = 8;

const PARTICLE_POS = 0;
const PARTICLE_VEL = 3;
const PARTICLE_FORCE = 6;
const PARTICLE_MASS = 9;
const PARTICLE_COL = 10;
const PARTICLE_SIZE = 14;

class particleSystem {
	constructor(numParticles) {
		var size = numParticles*PARTICLE_ARRAY_SIZE;
		this.s0 = new Float32Array(size);
		this.vbo = new Float32Array(numParticles*PARTICLE_VBO_SIZE)
		this.numParticles = numParticles;
		this.constraints = [];
		for(var i = 0; i < this.numParticles; i++) {
			this.setParticlePosition(i, [0, 0, 0]);
			this.setParticleVelocity(i, [0, 0, 0]);
			this.setParticleMass(i, 1);
			this.setParticleColor(i, [1, 1, 1, 1]);
			this.setParticleSize(i, 10);
		}
	}
	getParticlePosition(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var pos = new Float32Array(3);
		pos[0] = this.s0[offset + PARTICLE_POS];
		pos[1] = this.s0[offset + PARTICLE_POS + 1];
		pos[2] = this.s0[offset + PARTICLE_POS + 2];
		return pos;
	}
	setParticlePosition(num, pos) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.s0[offset + PARTICLE_POS] = pos[0];
		this.s0[offset + PARTICLE_POS + 1] = pos[1];
		this.s0[offset + PARTICLE_POS + 2] = pos[2];
		offset = num*PARTICLE_VBO_SIZE;
		this.vbo[offset] = pos[0];
		this.vbo[offset + 1] = pos[1];
		this.vbo[offset + 2] = pos[2];
	}
	getParticleVelocity(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var vel = new Float32Array(3);
		vel[0] = this.s0[offset + PARTICLE_VEL];
		vel[1] = this.s0[offset + PARTICLE_VEL + 1];
		vel[2] = this.s0[offset + PARTICLE_VEL + 2];
		return vel;
	}
	setParticleVelocity(num, vel) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.s0[offset + PARTICLE_VEL] = vel[0];
		this.s0[offset + PARTICLE_VEL + 1] = vel[1];
		this.s0[offset + PARTICLE_VEL + 2] = vel[2];
	}
	addParticleForce(num, force) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.s0[offset + PARTICLE_FORCE] += force[0];
		this.s0[offset + PARTICLE_FORCE + 1] += force[1];
		this.s0[offset + PARTICLE_FORCE + 2] += force[2];
	}
	getParticleForce(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var force = new Float32Array(3);
		force[0] = this.s0[offset + PARTICLE_FORCE];
		force[1] = this.s0[offset + PARTICLE_FORCE + 1];
		force[2] = this.s0[offset + PARTICLE_FORCE + 2];
		return force;
	}
	setParticleForce(num, force) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.s0[offset + PARTICLE_FORCE] = force[0];
		this.s0[offset + PARTICLE_FORCE + 1] = force[1];
		this.s0[offset + PARTICLE_FORCE + 2] = force[2];
	}
	getParticleMass(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		return this.s0[offset + PARTICLE_MASS];
	}
	setParticleMass(num, mass) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.s0[offset + PARTICLE_MASS] = mass;
	}
	getParticleColor(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var col = new Float32Array(4);
		col[0] = this.s0[offset + PARTICLE_COL];
		col[1] = this.s0[offset + PARTICLE_COL + 1];
		col[2] = this.s0[offset + PARTICLE_COL + 2];
		col[3] = this.s0[offset + PARTICLE_COL + 3];
		return col;
	}
	setParticleColor(num, col) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.s0[offset + PARTICLE_COL] = col[0];
		this.s0[offset + PARTICLE_COL + 1] = col[1];
		this.s0[offset + PARTICLE_COL + 2] = col[2];
		this.s0[offset + PARTICLE_COL + 3] = col[3];
		offset = num*PARTICLE_VBO_SIZE;
		this.vbo[offset + 3] = col[0];
		this.vbo[offset + 4] = col[1];
		this.vbo[offset + 5] = col[2];
		this.vbo[offset + 6] = col[3];
	}
	getParticleSize(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		return this.s0[offset + PARTICLE_SIZE];
	}
	setParticleSize(num, size) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.s0[offset + PARTICLE_SIZE] = size;
		offset = num*PARTICLE_VBO_SIZE;
		this.vbo[offset + 7] = size;
	}
	updateParticle(num, dt) {
		var pos = this.getParticlePosition(num);
		var vel = this.getParticleVelocity(num);
		var acc = this.getParticleForce(num);
		var mass = this.getParticleMass(num);

		acc[0] /= mass;
		acc[1] /= mass;
		acc[2] /= mass;

		vel[0] += acc[0]*dt;
		vel[1] += acc[1]*dt;
		vel[2] += acc[2]*dt;

		pos[0] += vel[0]*dt;
		pos[1] += vel[1]*dt;
		pos[2] += vel[2]*dt;

		this.setParticlePosition(num, pos);
		this.setParticleVelocity(num, vel);


	}
	update(dt) {
		for(var i = 0; i < this.numParticles; i++) {
			this.updateParticle(i, dt);
			var pos = this.getParticlePosition(i);

			for(var j = 0; j < this.constraints.length; j++) {
				this.constraints[j].update(this, i);
			}

		}
	}
}

class particleConstraint {
	constructor() {
		if(this.constructor === particleConstraint) {
			throw new TypeError('Abstract class "Widget" cannot be instantiated directly.');
		}
	}

	update(num) {

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

	update(particleSystem, num) {
		var pPos = particleSystem.getParticlePosition(num);
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

			var vel = particleSystem.getParticleVelocity(num);
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

			particleSystem.setParticlePosition(num, pPos);
			particleSystem.setParticleVelocity(num, vel);
		}
	}
}




