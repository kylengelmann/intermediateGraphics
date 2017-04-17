const PARTICLE_ARRAY_SIZE = 15;
const PARTICLE_VBO_SIZE = 8;

const PARTICLE_POS = 0;
const PARTICLE_VEL = 3;
const PARTICLE_FORCE = 6;
const PARTICLE_MASS = 9;
const PARTICLE_COL = 10;
const PARTICLE_SIZE = 14;


class Particle {
	constructor(pos, vel, mass, size, col) {
		this.position = new Float32Array([0, 0, 0]);
		this.velocity = new Float32Array([0, 0, 0]);
		this.mass = 1;
		this.size = 10;
		this.color = new Float32Array([0, 0, 0, 1]);
		if(pos) {
			this.position[0] = pos[0];
			this.position[1] = pos[1];
			this.position[2] = pos[2];
		}
		if(vel) {
			this.velocity[0] = vel[0];
			this.velocity[1] = vel[1];
			this.velocity[2] = vel[2];
		}
		if(mass) {
			this.mass = mass;
		}
		if(size) {
			this.size = size;
		}
		if(col) {
			this.color[0] = col[0];
			this.color[1] = col[1];
			this.color[2] = col[2];
			this.color[3] = col[3];
		}
	}
}

class particleState {
	constructor(In) {
		var type = In.constructor.name;
		if(type == "Array") {
			var arrType = In[0].constructor.name;
			if(arrType == "Number") {
				type = "Float32Array"
			}
			else if(arrType == "Particle"){
				type = arrType;
			}
		}
		if(type == "Particle") {
			this.numParticles = In.length;
			this.length = this.numParticles*PARTICLE_ARRAY_SIZE;
			this.stateVector = new Float32Array(this.length);
			for(var i = 0; i < this.numParticles; i++) {
				this.setParticlePosition(i, In[i].position);
				this.setParticleVelocity(i, In[i].velocity);
				this.setParticleMass(i, In[i].mass);
				this.setParticleColor(i, In[i].color);
				this.setParticleSize(i, In[i].size);
			}
		}
		else if(type == "Float32Array") {
			this.length = In.length;
			this.numParticles = In.length/PARTICLE_ARRAY_SIZE;
			this.stateVector = Float32Array.from(In);
		}
		else if(type == "Number") {
			this.numParticles = In;
			this.length = this.numParticles*PARTICLE_ARRAY_SIZE;
			this.stateVector = new Float32Array(this.length);
		}
		else {
			throw new TypeError("Invalid argument type for particleState(In)");
		}

	}
	getParticlePosition(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var pos = new Float32Array(3);
		pos[0] = this.stateVector[offset + PARTICLE_POS];
		pos[1] = this.stateVector[offset + PARTICLE_POS + 1];
		pos[2] = this.stateVector[offset + PARTICLE_POS + 2];
		return pos;
	}
	setParticlePosition(num, pos) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.stateVector[offset + PARTICLE_POS] = pos[0];
		this.stateVector[offset + PARTICLE_POS + 1] = pos[1];
		this.stateVector[offset + PARTICLE_POS + 2] = pos[2];
	}
	getParticleVelocity(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var vel = new Float32Array(3);
		vel[0] = this.stateVector[offset + PARTICLE_VEL];
		vel[1] = this.stateVector[offset + PARTICLE_VEL + 1];
		vel[2] = this.stateVector[offset + PARTICLE_VEL + 2];
		return vel;
	}
	setParticleVelocity(num, vel) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.stateVector[offset + PARTICLE_VEL] = vel[0];
		this.stateVector[offset + PARTICLE_VEL + 1] = vel[1];
		this.stateVector[offset + PARTICLE_VEL + 2] = vel[2];
	}
	addParticleForce(num, force) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.stateVector[offset + PARTICLE_FORCE] += force[0];
		this.stateVector[offset + PARTICLE_FORCE + 1] += force[1];
		this.stateVector[offset + PARTICLE_FORCE + 2] += force[2];
	}
	getParticleForce(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var force = new Float32Array(3);
		force[0] = this.stateVector[offset + PARTICLE_FORCE];
		force[1] = this.stateVector[offset + PARTICLE_FORCE + 1];
		force[2] = this.stateVector[offset + PARTICLE_FORCE + 2];
		return force;
	}
	setParticleForce(num, force) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.stateVector[offset + PARTICLE_FORCE] = force[0];
		this.stateVector[offset + PARTICLE_FORCE + 1] = force[1];
		this.stateVector[offset + PARTICLE_FORCE + 2] = force[2];
	}
	getParticleMass(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		return this.stateVector[offset + PARTICLE_MASS];
	}
	setParticleMass(num, mass) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.stateVector[offset + PARTICLE_MASS] = mass;
	}
	getParticleColor(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		var col = new Float32Array(4);
		col[0] = this.stateVector[offset + PARTICLE_COL];
		col[1] = this.stateVector[offset + PARTICLE_COL + 1];
		col[2] = this.stateVector[offset + PARTICLE_COL + 2];
		col[3] = this.stateVector[offset + PARTICLE_COL + 3];
		return col;
	}
	setParticleColor(num, col) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.stateVector[offset + PARTICLE_COL] = col[0];
		this.stateVector[offset + PARTICLE_COL + 1] = col[1];
		this.stateVector[offset + PARTICLE_COL + 2] = col[2];
		this.stateVector[offset + PARTICLE_COL + 3] = col[3];
	}
	getParticleSize(num) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		return this.stateVector[offset + PARTICLE_SIZE];
	}
	setParticleSize(num, size) {
		var offset = num*PARTICLE_ARRAY_SIZE;
		this.stateVector[offset + PARTICLE_SIZE] = size;
	}
	createTimeDerivative(){
		var dt = new particleState(this.numParticles);
		for(var i = 0; i < this.numParticles; i++) {
			dt.setParticlePosition(i, this.getParticleVelocity(i));
			var a = this.getParticleForce(i);
			a[0] /= this.getParticleMass(i);
			a[1] /= this.getParticleMass(i);
			a[2] /= this.getParticleMass(i);
			dt.setParticleVelocity(i, a);
			dt.setParticleForce(i, [0, 0, 0]);
			dt.setParticleMass(i, 0);
			dt.setParticleSize(i, 0);
			dt.setParticleColor(i, [0, 0, 0, 0]);
		}
		return dt;
	}
}

const SOLVER_EULER = 0;

class particleSystem {
	constructor(numParticles, vertShader, fragShader) {
		this.Particles = [];
		for(var i = 0; i < numParticles; i++) {
			var p = new Particle();
			this.Particles.push(p);
		}
		this.s0 = new particleState(this.Particles);
		this.s0Dot;
		this.s1 = new particleState(numParticles);
		this.numParticles = numParticles;
		this.solver = SOLVER_EULER;
		this.renderer = new renderObject(this.s0.stateVector, vertShader, fragShader)
	}

	init(gl, attrs, attrOffsets, attrSizes, unifs) {
		this.renderer.init(gl, attrs, attrOffsets, attrSizes, PARTICLE_ARRAY_SIZE, 
			unifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.POINTS);
	}

	applyForces(forces) {
		for(var i = 0; i < this.numParticles; i ++) {
			this.s0.setParticleForce(i, [0, 0, 0]);
		}
		for(var i = 0; i < forces.length; i++) {
			forces[i].apply(this.s0);
		}
	}

	solveEuler(dt) {
		this.s0Dot = this.s0.createTimeDerivative();
		for(var i = 0; i < this.s0.length; i++) {
			this.s1.stateVector[i] = this.s0.stateVector[i] + this.s0Dot.stateVector[i]*dt;
		}
	}

	update(dt) {
		// render();
		this.solveEuler(dt);
		var tempState = this.s0;
		this.s0 = this.s1;
		this.s1 = tempState;
	}

	applyConstraints(constraints) {
		for(var i = 0; i < constraints.length; i++) {
			constraints[i].apply(this.s0);
		}
	}

	render(gl) {
		this.renderer.updateVBO(gl, this.s0.stateVector);
		this.renderer.draw(gl);
	}
}




class particleConstraint {
	constructor() {
		if(this.constructor === particleConstraint) {
			throw new TypeError('Abstract class "particleConstraint" cannot be instantiated directly.');
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

	apply(State) {
		for(var i = 0; i < State.numParticles; i++) {
			this.updateParticle(State, i);
		}
	}
}




