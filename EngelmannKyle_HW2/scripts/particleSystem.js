const PARTICLE_ARRAY_SIZE = 15;
const PARTICLE_VBO_SIZE = 8;

const PARTICLE_POS = 0;
const PARTICLE_VEL = 3;
const PARTICLE_FORCE = 6;
const PARTICLE_MASS = 9;
const PARTICLE_COL = 10;
const PARTICLE_SIZE = 14;

var fixedTimeStep = 1/240;

class Particle {
	constructor(offset, state) {
		this.state = null;
		this.offset = offset;
		if(state) {
			this.state = state;
		}
	}

	getPosition() {
		var pos = new Float32Array(3);
		pos[0] = this.state.stateVector[this.offset + PARTICLE_POS];
		pos[1] = this.state.stateVector[this.offset + PARTICLE_POS + 1];
		pos[2] = this.state.stateVector[this.offset + PARTICLE_POS + 2];
		return pos;
	}
	setPosition(pos) {
		this.state.stateVector[this.offset + PARTICLE_POS] = pos[0];
		this.state.stateVector[this.offset + PARTICLE_POS + 1] = pos[1];
		this.state.stateVector[this.offset + PARTICLE_POS + 2] = pos[2];
	}
	getVelocity() {
		var vel = new Float32Array(3);
		vel[0] = this.state.stateVector[this.offset + PARTICLE_VEL];
		vel[1] = this.state.stateVector[this.offset + PARTICLE_VEL + 1];
		vel[2] = this.state.stateVector[this.offset + PARTICLE_VEL + 2];
		return vel;
	}
	setVelocity(vel) {
		this.state.stateVector[this.offset + PARTICLE_VEL] = vel[0];
		this.state.stateVector[this.offset + PARTICLE_VEL + 1] = vel[1];
		this.state.stateVector[this.offset + PARTICLE_VEL + 2] = vel[2];
	}
	addForce(force) {
		this.state.stateVector[this.offset + PARTICLE_FORCE] += force[0];
		this.state.stateVector[this.offset + PARTICLE_FORCE + 1] += force[1];
		this.state.stateVector[this.offset + PARTICLE_FORCE + 2] += force[2];
	}
	getForce() {
		var force = new Float32Array(3);
		force[0] = this.state.stateVector[this.offset + PARTICLE_FORCE];
		force[1] = this.state.stateVector[this.offset + PARTICLE_FORCE + 1];
		force[2] = this.state.stateVector[this.offset + PARTICLE_FORCE + 2];
		return force;
	}
	setForce(force) {
		this.state.stateVector[this.offset + PARTICLE_FORCE] = force[0];
		this.state.stateVector[this.offset + PARTICLE_FORCE + 1] = force[1];
		this.state.stateVector[this.offset + PARTICLE_FORCE + 2] = force[2];
	}
	getMass() {
		return this.state.stateVector[this.offset + PARTICLE_MASS];
	}
	setMass(mass) {
		this.state.stateVector[this.offset + PARTICLE_MASS] = mass;
	}
	getColor() {
		var col = new Float32Array(4);
		col[0] = this.state.stateVector[this.offset + PARTICLE_COL];
		col[1] = this.state.stateVector[this.offset + PARTICLE_COL + 1];
		col[2] = this.state.stateVector[this.offset + PARTICLE_COL + 2];
		col[3] = this.state.stateVector[this.offset + PARTICLE_COL + 3];
		return col;
	}
	setColor(col) {
		this.state.stateVector[this.offset + PARTICLE_COL] = col[0];
		this.state.stateVector[this.offset + PARTICLE_COL + 1] = col[1];
		this.state.stateVector[this.offset + PARTICLE_COL + 2] = col[2];
		this.state.stateVector[this.offset + PARTICLE_COL + 3] = col[3];
	}
	getSize() {
		return this.state.stateVector[this.offset + PARTICLE_SIZE];
	}
	setSize(size) {
		this.state.stateVector[this.offset + PARTICLE_SIZE] = size;
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
				In[i].state = this;
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
const SOLVER_IMPROVED_EULER = 1;
const SOLVER_IMPLICIT = 2;

class particleSystem {
	constructor(numParticles, vertShader, fragShader) {
		this.Particles = [];
		for(var i = 0; i < numParticles; i++) {
			var p = new Particle(i*PARTICLE_ARRAY_SIZE);
			this.Particles.push(p);
		}
		this.s0 = new particleState(this.Particles);
		this.s0Dot;
		this.s1 = new particleState(numParticles);
		this.numParticles = numParticles;
		this.solver = SOLVER_EULER;
		this.renderer = new renderObject(this.s0.stateVector, vertShader, fragShader)
		this.remainderTime = 0;
		this.fixedUpdate = [];
	}

	init(gl, attrs, attrOffsets, attrSizes, unifs) {
		this.renderer.init(gl, attrs, attrOffsets, attrSizes, PARTICLE_ARRAY_SIZE, 
			unifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.POINTS);
	}

	applyForces(forces) {
		for(var i = 0; i < this.numParticles; i ++) {
			this.Particles[i].setForce([0, 0, 0]);
		}

		for(var i = 0; i < forces.length; i++) {
			forces[i].apply(this.s0);
		}
	}

	solveEuler(dt, sys) {
		sys.s0Dot = sys.s0.createTimeDerivative();
		for(var i = 0; i < sys.s0.length; i++) {
			sys.s1.stateVector[i] = sys.s0.stateVector[i] + sys.s0Dot.stateVector[i]*dt;
		}
		// console.log(this.s0.stateVector);
		// console.log(this.s0Dot.stateVector);
		// console.log(this.s1.stateVector);
	}

	solveImprovedEuler(dt, sys) {
		sys.solveEuler(dt/2, sys);
		var s1Dot = sys.s1.createTimeDerivative();
		for(var i = 0; i < sys.s0.length; i++) {
			sys.s1.stateVector[i] = sys.s0.stateVector[i] + s1Dot.stateVector[i]*dt;
		}
	}

	solveImplicit(dt, sys) {
		sys.solveEuler(dt, sys);
		var s1Dot = sys.s1.createTimeDerivative();
		for(var i = 0; i < sys.s0.length; i++) {
			sys.s1.stateVector[i] = sys.s0.stateVector[i] + s1Dot.stateVector[i]*dt;
		}
	}

	update(dt, forces, constraints) {
		// render();
		var totTime = dt + this.remainderTime;
		this.remainderTime = totTime % fixedTimeStep;
		var updates = (totTime - this.remainderTime)/fixedTimeStep;
		var solver;
		switch(this.solver) {
			case SOLVER_EULER:
				solver = this.solveEuler;
				break;
			case SOLVER_IMPROVED_EULER:
				solver = this.solveImprovedEuler;
				break;
			case SOLVER_IMPLICIT:
				solver = this.solveImplicit;
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
			this.applyForces(forces);
			solver(fixedTimeStep, this);
			var tempState = this.s0;
			this.s0 = this.s1;
			this.s1 = tempState;
			this.applyConstraints(constraints);
		}
		this.fixedUpdate = [];
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
		this.renderer.init(gl, pAttrs, pAttrOffsets, pAttrSizes, PARTICLE_ARRAY_SIZE, 
			pUnifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.POINTS);
		this.springRenderer.init(gl, sAttrs, sAttrOffsets, sAttrSizes, PARTICLE_ARRAY_SIZE, 
			sUnifs, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW, gl.LINES);
		this.springRenderer.vertBuffLoc = this.renderer.vertBuffLoc;
		this.springRenderer.bindIndexBuffer(gl, this.springIndices);
	}
	render(gl) {
		this.renderer.updateVBO(gl, this.s0.stateVector);
		this.renderer.draw(gl);
		this.springRenderer.drawIndices(gl);
	}
}




