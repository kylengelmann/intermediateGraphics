class renderObject {
	constructor(verts, vShader, fShader) {
		this.verts = verts;
		this.vertBuffLoc;
		this.vShader = vShader;
		this.fShader = fShader;
		this.attrLocs = {};
		this.attrOffsets;
		this.attrSizes;
		this.stride;
		this.unifLocs = {};
		this.numVerts;
		this.FSIZE = this.verts.BYTES_PER_ELEMENT;
		this.shaderLoc;
		this.glEnumTarget;
		this.glDrawType;
		this.glPrimitive;
	}
	init(gl, attrs, attrOffsets, attrSizes, Stride, unifs, glEnumTarget, glDrawType, glPrimitive) {
		this.attrLocs = {};
		for(var i = 0; i<attrs.length; i++) {
			this.attrLocs[attrs[i]] = -1;
		}
		this.attrOffsets = attrOffsets;
		this.attrSizes = attrSizes;
		this.unifLocs = {};
		for(var i = 0; i<unifs.length; i++) {
			this.unifLocs[unifs[i]] = -1;
		}

		this.stride = Stride;

		this.numVerts = this.verts.length/this.stride;
		this.FSIZE = this.verts.BYTES_PER_ELEMENT;
		this.shaderLoc;
		this.glEnumTarget = glEnumTarget;
		this.glDrawType = glDrawType;
		this.glPrimitive = glPrimitive;


		this.shaderLoc = createProgram(gl, this.vShader, this.fShader);
		gl.program = this.shaderLoc;
		if (!this.shaderLoc) {
    		console.log(this.constructor.name + 
    					'.init() failed to create executable Shaders on the GPU. Bye!');
    		return;
		}

		this.vertBuffLoc = gl.createBuffer();
		if (!this.vertBuffLoc) {
		    console.log(this.constructor.name + 
		    			'.init() failed to create VBO in GPU. Bye!'); 
		    return;
		}

		gl.bindBuffer(this.glEnumTarget, this.vertBuffLoc);

		gl.bufferData(this.glEnumTarget, this.verts, this.glDrawType);

		var attrNum = 0;

		for (var key in this.attrLocs) {
			if (this.attrLocs.hasOwnProperty(key)) {
				this.attrLocs[key] = gl.getAttribLocation(this.shaderLoc, key);
				if(this.attrLocs[key] < 0) {
    				console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute ' + key);
				    return -1;
  				}
  				gl.vertexAttribPointer(this.attrLocs[key], this.attrSizes[attrNum],
  									   gl.FLOAT, false, this.stride*this.FSIZE, 
  									   this.attrOffsets[attrNum]*this.FSIZE);

  				attrNum ++;

  				gl.enableVertexAttribArray(this.attrLocs[key]);
		 	}
		}

		for (var key in this.unifLocs) {
			if (this.unifLocs.hasOwnProperty(key)) {
				this.unifLocs[key] = gl.getUniformLocation(this.shaderLoc, key);
				if(this.unifLocs[key] < 0) {
    				console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of uniform ' + key);
				    return -1;
  				}
		 	}
		}
	}

	draw(gl) {
		gl.useProgram(this.shaderLoc);

		gl.bindBuffer(this.glEnumTarget, this.vertBuffLoc);



		var attrNum = 0;

		for (var key in this.attrLocs) {
			if (this.attrLocs.hasOwnProperty(key)) {

  				gl.vertexAttribPointer(this.attrLocs[key], this.attrSizes[attrNum],
  									   gl.FLOAT, false, this.stride*this.FSIZE, this.attrOffsets[attrNum]*this.FSIZE);

  				attrNum ++;

  				gl.enableVertexAttribArray(this.attrLocs[key]);
		 	}
		}

		gl.drawArrays(this.glPrimitive, 0, this.numVerts);
	}

	setMat4(gl, unif, matValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniformMatrix4fv(this.unifLocs[unif], false, matValues);
	}
	setMat3(gl, unif, matValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniformMatrix3fv(this.unifLocs[unif], false, matValues);
	}
	setMat2(gl, unif, matValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniformMatrix2fv(this.unifLocs[unif], false, matValues);
	}
	setVec4(gl, unif, vecValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniform4fv(this.unifLocs[unif], false, vecValues);
	}
	setVec3(gl, unif, vecValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniform3fv(this.unifLocs[unif], false, vecValues);
	}
	setVec2(gl, unif, vecValues) {
		gl.useProgram(this.shaderLoc);
		gl.uniform2fv(this.unifLocs[unif], false, vecValues);
	}
	setFloat(gl, unif, val) {
		gl.useProgram(this.shaderLoc);
		gl.uniform2fv(this.unifLocs[unif], false, val);
	}
	getUniform(gl, unif) {
		return gl.getUniform(this.shaderLoc, this.unifLocs[unif]);
	}
	updateVBO(gl, vbo) {
		gl.bindBuffer(this.glEnumTarget, this.vertBuffLoc);
		gl.bufferSubData(this.glEnumTarget, 0, vbo);
	}
}









