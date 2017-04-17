class Force {
	constructor() {
		if(this.constructor === Force) {
			throw new TypeError('Abstract class "Force" cannot be instantiated directly.');
		}
	}
	apply(State) {
		for(var i = 0; i < State.numParticles; i++) {
			this.perParticle(State, i)
		}
	}

}

class constantAcceleration extends Force {
	constructor(acc) {
		super()
		this.acc = Float32Array.from(acc);
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
	constructor(drag) {
		super();
		this.drag = drag;
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
		this.length = length;
		this.k = k;
		this.endpoints = Float32Array.from(endpoints);
	}

	perParticle(State, i) {
		var force = Float32Array.from(State.getParticleVelocity(i));
		force[0] *= -this.drag;
		force[1] *= -this.drag;
		force[2] *= -this.drag;
		State.addParticleForce(i, force);
	}
}