const PARTICLE_ARRAY_BUF_SIZE = 17;

const PARTICLE_POS = 0;
const PARTICLE_VEL = 3;
const PARTICLE_FORCE = 6;
const PARTICLE_MASS = 9;
const PARTICLE_COL = 10;
const PARTICLE_SIZE = 14;
const PARTICLE_TIME_ALIVE = 15;
const PARTICLE_ROT = 16;

const PARTICLE_VBO_BUF_SIZE = 10;

const PARTICLE_VBO_POS = 0;
const PARTICLE_VBO_COL = 10;
const PARTICLE_VBO_SIZE = 14;
const PARTICLE_VBO_TIME_ALIVE = 15;
const PARTICLE_VBO_ROT = 16;



var fixedTimeStep = 1/30;

var maxTimeStep = .5;

class Particle {
	constructor(offset, sys) {
		this.sys = null;
		this.offset = offset;
		if(sys) {
			this.sys = sys;
		}
	}

	getPosition() {
		var pos = new Float32Array(3);
		pos[0] = this.sys.s1.stateVector[this.offset + PARTICLE_POS];
		pos[1] = this.sys.s1.stateVector[this.offset + PARTICLE_POS + 1];
		pos[2] = this.sys.s1.stateVector[this.offset + PARTICLE_POS + 2];
		return pos;
	}
	setPosition(pos) {
		this.sys.s1.stateVector[this.offset + PARTICLE_POS] = pos[0];
		this.sys.s1.stateVector[this.offset + PARTICLE_POS + 1] = pos[1];
		this.sys.s1.stateVector[this.offset + PARTICLE_POS + 2] = pos[2];
	}
	getVelocity() {
		var vel = new Float32Array(3);
		vel[0] = this.sys.s1.stateVector[this.offset + PARTICLE_VEL];
		vel[1] = this.sys.s1.stateVector[this.offset + PARTICLE_VEL + 1];
		vel[2] = this.sys.s1.stateVector[this.offset + PARTICLE_VEL + 2];
		return vel;
	}
	setVelocity(vel) {
		this.sys.s1.stateVector[this.offset + PARTICLE_VEL] = vel[0];
		this.sys.s1.stateVector[this.offset + PARTICLE_VEL + 1] = vel[1];
		this.sys.s1.stateVector[this.offset + PARTICLE_VEL + 2] = vel[2];
	}
	addForce(force) {
		this.sys.s1.stateVector[this.offset + PARTICLE_FORCE] += force[0];
		this.sys.s1.stateVector[this.offset + PARTICLE_FORCE + 1] += force[1];
		this.sys.s1.stateVector[this.offset + PARTICLE_FORCE + 2] += force[2];
	}
	getForce() {
		var force = new Float32Array(3);
		force[0] = this.sys.s1.stateVector[this.offset + PARTICLE_FORCE];
		force[1] = this.sys.s1.stateVector[this.offset + PARTICLE_FORCE + 1];
		force[2] = this.sys.s1.stateVector[this.offset + PARTICLE_FORCE + 2];
		return force;
	}
	setForce(force) {
		this.sys.s1.stateVector[this.offset + PARTICLE_FORCE] = force[0];
		this.sys.s1.stateVector[this.offset + PARTICLE_FORCE + 1] = force[1];
		this.sys.s1.stateVector[this.offset + PARTICLE_FORCE + 2] = force[2];
	}
	getMass() {
		return this.sys.s1.stateVector[this.offset + PARTICLE_MASS];
	}
	setMass(mass) {
		this.sys.s1.stateVector[this.offset + PARTICLE_MASS] = mass;
	}
	getColor() {
		var col = new Float32Array(4);
		col[0] = this.sys.s1.stateVector[this.offset + PARTICLE_COL];
		col[1] = this.sys.s1.stateVector[this.offset + PARTICLE_COL + 1];
		col[2] = this.sys.s1.stateVector[this.offset + PARTICLE_COL + 2];
		col[3] = this.sys.s1.stateVector[this.offset + PARTICLE_COL + 3];
		return col;
	}
	setColor(col) {
		this.sys.s1.stateVector[this.offset + PARTICLE_COL] = col[0];
		this.sys.s1.stateVector[this.offset + PARTICLE_COL + 1] = col[1];
		this.sys.s1.stateVector[this.offset + PARTICLE_COL + 2] = col[2];
		this.sys.s1.stateVector[this.offset + PARTICLE_COL + 3] = col[3];
	}
	getSize() {
		return this.sys.s1.stateVector[this.offset + PARTICLE_SIZE];
	}
	setSize(size) {
		this.sys.s1.stateVector[this.offset + PARTICLE_SIZE] = size;
	}
	getTimeAlive() {
		return this.sys.s1.stateVector[this.offset + PARTICLE_TIME_ALIVE];
	}
	setTimeAlive(time) {
		this.sys.s1.stateVector[this.offset + PARTICLE_TIME_ALIVE] = time;
	}
	getRotation() {
		return this.sys.s1.stateVector[this.offset + PARTICLE_ROT];
	}
	setRotation(rot) {
		this.sys.s1.stateVector[this.offset + PARTICLE_ROT] = rot;
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
			this.length = this.numParticles*PARTICLE_ARRAY_BUF_SIZE;
			this.stateVector = new Float32Array(this.length);
		}
		else if(type == "Float32Array") {
			this.length = In.length;
			this.numParticles = In.length/PARTICLE_ARRAY_BUF_SIZE;
			this.stateVector = Float32Array.from(In);
		}
		else if(type == "Number") {
			this.numParticles = In;
			this.length = this.numParticles*PARTICLE_ARRAY_BUF_SIZE;
			this.stateVector = new Float32Array(this.length);
		}
		else {
			throw new TypeError("Invalid argument type for particleState(In)");
		}

	}
	getParticlePosition(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		var pos = new Float32Array(3);
		pos[0] = this.stateVector[offset + PARTICLE_POS];
		pos[1] = this.stateVector[offset + PARTICLE_POS + 1];
		pos[2] = this.stateVector[offset + PARTICLE_POS + 2];
		return pos;
	}
	setParticlePosition(num, pos) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_POS] = pos[0];
		this.stateVector[offset + PARTICLE_POS + 1] = pos[1];
		this.stateVector[offset + PARTICLE_POS + 2] = pos[2];
	}
	getParticleVelocity(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		var vel = new Float32Array(3);
		vel[0] = this.stateVector[offset + PARTICLE_VEL];
		vel[1] = this.stateVector[offset + PARTICLE_VEL + 1];
		vel[2] = this.stateVector[offset + PARTICLE_VEL + 2];
		return vel;
	}
	setParticleVelocity(num, vel) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_VEL] = vel[0];
		this.stateVector[offset + PARTICLE_VEL + 1] = vel[1];
		this.stateVector[offset + PARTICLE_VEL + 2] = vel[2];
	}
	addParticleForce(num, force) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_FORCE] += force[0];
		this.stateVector[offset + PARTICLE_FORCE + 1] += force[1];
		this.stateVector[offset + PARTICLE_FORCE + 2] += force[2];
	}
	getParticleForce(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		var force = new Float32Array(3);
		force[0] = this.stateVector[offset + PARTICLE_FORCE];
		force[1] = this.stateVector[offset + PARTICLE_FORCE + 1];
		force[2] = this.stateVector[offset + PARTICLE_FORCE + 2];
		return force;
	}
	setParticleForce(num, force) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_FORCE] = force[0];
		this.stateVector[offset + PARTICLE_FORCE + 1] = force[1];
		this.stateVector[offset + PARTICLE_FORCE + 2] = force[2];
	}
	getParticleMass(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		return this.stateVector[offset + PARTICLE_MASS];
	}
	setParticleMass(num, mass) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_MASS] = mass;
	}
	getParticleColor(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		var col = new Float32Array(4);
		col[0] = this.stateVector[offset + PARTICLE_COL];
		col[1] = this.stateVector[offset + PARTICLE_COL + 1];
		col[2] = this.stateVector[offset + PARTICLE_COL + 2];
		col[3] = this.stateVector[offset + PARTICLE_COL + 3];
		return col;
	}
	setParticleColor(num, col) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_COL] = col[0];
		this.stateVector[offset + PARTICLE_COL + 1] = col[1];
		this.stateVector[offset + PARTICLE_COL + 2] = col[2];
		this.stateVector[offset + PARTICLE_COL + 3] = col[3];
	}
	getParticleSize(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		return this.stateVector[offset + PARTICLE_SIZE];
	}
	setParticleSize(num, size) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_SIZE] = size;
	}
	getParticleTimeAlive(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		return this.stateVector[offset + PARTICLE_TIME_ALIVE];
	}
	setParticleTimeAlive(num, time) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_TIME_ALIVE] = time;
	}
	getParticleRotation(num) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		return this.stateVector[offset + PARTICLE_ROT];
	}
	setParticleRotation(num, rot) {
		var offset = num*PARTICLE_ARRAY_BUF_SIZE;
		this.stateVector[offset + PARTICLE_ROT] = rot;
	}
	Dot(result){
		for(var i = 0; i < this.numParticles; i++) {
			result.setParticlePosition(i, this.getParticleVelocity(i));
			var a = this.getParticleForce(i);
			a[0] /= this.getParticleMass(i);
			a[1] /= this.getParticleMass(i);
			a[2] /= this.getParticleMass(i);
			result.setParticleVelocity(i, a);
			result.setParticleForce(i, [0, 0, 0]);
			result.setParticleMass(i, 0);
			result.setParticleSize(i, 0);
			result.setParticleColor(i, [0, 0, 0, 0]);
			result.setParticleTimeAlive(i, 1);
			result.setParticleRotation(i, 0);
		}
	}
	Dot2(result){
		for(var i = 0; i < this.numParticles; i++) {
			var a = this.getParticleForce(i);
			a[0] /= this.getParticleMass(i);
			a[1] /= this.getParticleMass(i);
			a[2] /= this.getParticleMass(i);
			result.setParticlePosition(i, a);
			result.setParticleVelocity(i, [0, 0, 0]);
			result.setParticleForce(i, [0, 0, 0]);
			result.setParticleMass(i, 0);
			result.setParticleSize(i, 0);
			result.setParticleColor(i, [0, 0, 0, 0]);
			result.setParticleTimeAlive(i, 0);
			result.setParticleRotation(i, 0);
		}
	}
}

const SOLVER_EULER = 0;
const SOLVER_IMPROVED_EULER = 1;
const SOLVER_IMPLICIT = 2;
const SOLVER_VEL_VERLET = 3;

var partSysSolver = SOLVER_IMPLICIT;

class particleSystem {
	constructor(numParticles, vertShader, fragShader) {
		this.Particles = [];
		for(var i = 0; i < numParticles; i++) {
			var p = new Particle(i*PARTICLE_ARRAY_BUF_SIZE);
			p.sys = this;
			this.Particles.push(p);
		}
		this.s0 = new particleState(numParticles);
		this.dt = new particleState(numParticles);
		this.s1 = new particleState(numParticles);
		this.s2 = new particleState(numParticles);
		this.vbo = new Float32Array(numParticles*PARTICLE_VBO_BUF_SIZE)
		this.numParticles = numParticles;
		this.solver = SOLVER_EULER;
		this.renderer = new renderObject(this.s1.stateVector, vertShader, fragShader)
		this.remainderTime = 0;
		this.fixedUpdate = [];
		this.forces = [];
		this.constraints = [];
	}

	init(gl, attrs, attrOffsets, attrSizes, unifs) {
		this.renderer.init(gl, attrs, attrOffsets, attrSizes, PARTICLE_ARRAY_BUF_SIZE, 
			unifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.POINTS);
	}

	applyForces(State) {
		for(var i = 0; i < this.numParticles; i ++) {
			State.setParticleForce(i, [0, 0, 0]);
		}

		for(var i = 0; i < this.forces.length; i++) {
			if(this.forces[i].active) {
				this.forces[i].apply(State);
			}
		}
	}

	solveEuler(dt, sys) {
		sys.s1.Dot(sys.dt);
		for(var i = 0; i < sys.s1.length; i++) {
			sys.s2.stateVector[i] = sys.s1.stateVector[i] + sys.dt.stateVector[i]*dt;
		}
		// console.log(this.s0.stateVector);
		// console.log(this.s0Dot.stateVector);
		// console.log(this.s1.stateVector);
	}

	solveImprovedEuler(dt, sys) {
		sys.solveEuler(dt/2, sys);
		sys.s2.Dot(sys.dt);
		for(var i = 0; i < sys.s1.length; i++) {
			sys.s2.stateVector[i] = sys.s1.stateVector[i] + sys.dt.stateVector[i]*dt;
		}
	}

	solveImplicit(dt, sys) {
		sys.solveEuler(dt, sys);
		sys.s2.Dot(sys.dt);
		for(var i = 0; i < sys.s1.length; i++) {
			sys.s2.stateVector[i] = sys.s1.stateVector[i] + sys.dt.stateVector[i]*dt;
		}
	}

	solveVelVet(dt, sys) {
		sys.s1.Dot2(sys.dt);
		for(var i = 0; i < sys.s1.length; i++) {

			var iMod = i%PARTICLE_ARRAY_BUF_SIZE;

			if(iMod >= PARTICLE_POS && iMod < PARTICLE_POS + 3) {
				sys.s2.stateVector[i] = sys.s1.stateVector[i] + 
											sys.s1.stateVector[i - PARTICLE_POS + PARTICLE_VEL]*dt + 
											.5*sys.dt.stateVector[i]*dt*dt;
			}
			else if(iMod == PARTICLE_TIME_ALIVE) {
				sys.s2.stateVector[i] = sys.s1.stateVector[i] + dt;
			}
			else {
				sys.s2.stateVector[i] = sys.s1.stateVector[i];
			}
		}
		sys.applyForces(sys.s2);
		for(var i = 0; i < sys.numParticles; i++) {
			for(var j = 0; j < 3; j++) {
				var ind = i*PARTICLE_ARRAY_BUF_SIZE + PARTICLE_VEL + j;
				sys.s2.stateVector[ind] = sys.s1.stateVector[ind] + 
										.5*(sys.dt.stateVector[ind - PARTICLE_VEL + PARTICLE_POS] + 
											sys.s2.stateVector[ind - PARTICLE_VEL + PARTICLE_FORCE]/
											sys.s2.stateVector[ind - PARTICLE_VEL + PARTICLE_MASS])*dt;
			}
		}
	}

	vboTransfer() {
		for(var i = 0; i < numParticles; i++) {
			var vboOffset = i*PARTICLE_VBO_BUF_SIZE;
			var svOffset = i*PARTICLE_ARRAY_BUF_SIZE;
			this.vbo[vboOffset + PARTICLE_VBO_POS] = this.s2.stateVector[svOffset + PARTICLE_POS];
			this.vbo[vboOffset + PARTICLE_VBO_POS + 1] = this.s2.stateVector[svOffset + PARTICLE_POS + 1];
			this.vbo[vboOffset + PARTICLE_VBO_POS + 2] = this.s2.stateVector[svOffset + PARTICLE_POS + 2];
			this.vbo[vboOffset + PARTICLE_VBO_COL] = this.s2.stateVector[svOffset + PARTICLE_COL];
			this.vbo[vboOffset + PARTICLE_VBO_COL + 1] = this.s2.stateVector[svOffset + PARTICLE_COL + 1];
			this.vbo[vboOffset + PARTICLE_VBO_COL + 2] = this.s2.stateVector[svOffset + PARTICLE_COL + 2];
			this.vbo[vboOffset + PARTICLE_VBO_COL + 3] = this.s2.stateVector[svOffset + PARTICLE_COL + 3];
			this.vbo[vboOffset + PARTICLE_VBO_SIZE] = this.s2.stateVector[svOffset + PARTICLE_SIZE];
			this.vbo[vboOffset + PARTICLE_VBO_TIME_ALIVE] = this.s2.stateVector[svOffset + PARTICLE_TIME_ALIVE];
			this.vbo[vboOffset + PARTICLE_VBO_ROT] = this.s2.stateVector[svOffset + PARTICLE_ROT];
		}
	}

	update(dt) {
		if(dt > maxTimeStep) {
			return;
		}
		// render();
		var totTime = dt + this.remainderTime;
		this.remainderTime = totTime % fixedTimeStep;
		var updates = (totTime - this.remainderTime)/fixedTimeStep;
		var solver;
		switch(partSysSolver) {
			case SOLVER_EULER:
				solver = this.solveEuler;
				break;
			case SOLVER_IMPROVED_EULER:
				solver = this.solveImprovedEuler;
				break;
			case SOLVER_IMPLICIT:
				solver = this.solveImplicit;
				break;
			case SOLVER_VEL_VERLET:
				solver = this.solveVelVet;
				break;
		}
		// console.log(totTime);
		// console.log(this.remainderTime);
		// console.log(updates);
		// console.log("\n");
		// render(gl);
		for(var i = 0; i < updates; i++) {
			for(var j in this.fixedUpdate) {
				this.fixedUpdate[j](this);
			}
			this.applyForces(this.s1);
			solver(fixedTimeStep, this);
			var tempState = this.s0;
			this.s0 = this.s1;
			this.s1 = this.s2;
			this.s2 = tempState;
			this.applyConstraints(this.s1);

		}

		// this.fixedUpdate = [];
	}

	applyConstraints(State) {
		for(var i = 0; i < this.constraints.length; i++) {
			this.constraints[i].apply(State);
		}
	}

	render(gl) {
		this.renderer.updateVBO(gl, this.s1.stateVector);
		this.renderer.draw(gl);
	}
}

class springSystem extends particleSystem {
	constructor(springs, particleVShader, particleFShader, springVShader, springFShader) {
		var numParticles = 0;
		var springIndices = new Float32Array(springs.length*2);
		for(var i = 0; i < springs.length; i++) {
			springIndices[i*2] = springs[i].endpoints[0];
			springIndices[i*2+1] = springs[i].endpoints[1];
			if(springs[i].endpoints[0] > numParticles) numParticles = springs[i].endpoints[0];
			if(springs[i].endpoints[1] > numParticles) numParticles = springs[i].endpoints[1];
		}
		super(numParticles + 1, particleVShader, particleFShader);
		this.springs = springs;
		this.springRenderer = new renderObject(this.s0.stateVector, springVShader, springFShader);
		this.springIndices = springIndices;

	}

	init(gl, pAttrs, pAttrOffsets, pAttrSizes, pUnifs, sAttrs, sAttrOffsets, sAttrSizes, sUnifs) {
		this.renderer.init(gl, pAttrs, pAttrOffsets, pAttrSizes, PARTICLE_ARRAY_BUF_SIZE, 
			pUnifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.POINTS);
		this.springRenderer.init(gl, sAttrs, sAttrOffsets, sAttrSizes, PARTICLE_ARRAY_BUF_SIZE, 
			sUnifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.LINES);
		this.springRenderer.vertBuffLoc = this.renderer.vertBuffLoc;
		this.springRenderer.bindIndexBuffer(gl, this.springIndices);
	}

	applyForces(State) {
		for(var i = 0; i < this.numParticles; i ++) {
			State.setParticleForce(i, [0, 0, 0]);
		}

		for(var i = 0; i < this.springs.length; i++) {
			if(this.springs[i].active) {
				this.springs[i].apply(State);
			}
		}

		for(var i = 0; i < forces.length; i++) {
			if(this.forces[i].active) {
				this.forces[i].apply(State);
			}
		}
	}

	render(gl) {
		this.renderer.updateVBO(gl, this.s1.stateVector);
		this.renderer.draw(gl);
		this.springRenderer.drawIndices(gl);
	}
}

class Cloth extends particleSystem {
	constructor(springs, rods, indices, vShader, fShader) {
		var numParticles = 0;
		for(var i = 0; i < springs.length; i++) {
			if(springs[i].endpoints[0] > numParticles) numParticles = springs[i].endpoints[0];
			if(springs[i].endpoints[1] > numParticles) numParticles = springs[i].endpoints[1];
		}
		super(numParticles + 1, vShader, fShader);
		this.springs = springs;
		this.indices = Float32Array.from(indices);
		this.rods = rods;
		this.withConstraints = false;
	}

	applyForces(State) {
		for(var i = 0; i < this.numParticles; i ++) {
			State.setParticleForce(i, [0, 0, 0]);
		}

		if(!this.withConstraints) {
			for(var i = 0; i < this.springs.length; i++) {
				if(this.springs[i].active) {
					this.springs[i].apply(State);
				}
			}
		}

		for(var i = 0; i < this.forces.length; i++) {
			if(this.forces[i].active) {
				this.forces[i].apply(State);
			}
		}
	}

	update(dt) {
		if(dt > maxTimeStep) {
			return;
		}
		// render();
		var totTime = dt + this.remainderTime;
		this.remainderTime = totTime % fixedTimeStep;
		var updates = (totTime - this.remainderTime)/fixedTimeStep;
		var solver;
		switch(partSysSolver) {
			case SOLVER_EULER:
				solver = this.solveEuler;
				break;
			case SOLVER_IMPROVED_EULER:
				solver = this.solveImprovedEuler;
				break;
			case SOLVER_IMPLICIT:
				solver = this.solveImplicit;
				break;
			case SOLVER_VEL_VERLET:
				solver = this.solveVelVet;
				break;
		}
		// console.log(totTime);
		// console.log(this.remainderTime);
		// console.log(updates);
		// console.log("\n");
		// render(gl);
		for(var i = 0; i < updates; i++) {
			for(var j in this.fixedUpdate) {
				this.fixedUpdate[j](this);
			}
			this.applyForces(this.s1);
			solver(fixedTimeStep, this);
			var tempState = this.s0;
			this.s0 = this.s1;
			this.s1 = this.s2;
			this.s2 = tempState;
			this.applyConstraints(this.s1);
			if(this.withConstraints) {
				this.applyConstraints(this.s1);
				this.applyConstraints(this.s1);
				this.applyConstraints(this.s1);
			}
		}
	}

	applyConstraints(State) {
		for(var i = 0; i < this.constraints.length; i++) {
			this.constraints[i].apply(State);
		}
		if(this.withConstraints) {
			for(var i = 0; i < this.rods.length; i++) {
				this.rods[i].apply(State);
			}
		}
	}



	init(gl, attrs, attrOffsets, attrSizes, unifs) {
		this.renderer.init(gl, attrs, attrOffsets, attrSizes, PARTICLE_ARRAY_BUF_SIZE, 
			unifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.TRIANGLES);
		this.renderer.bindIndexBuffer(gl, this.indices);
	}

	render(gl) {
		this.renderer.updateVBO(gl, this.s1.stateVector);
		this.renderer.drawIndices(gl);
	}
}




