//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

/*=====================
  VBOboxes.js library: 
  ===================== 
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		set of shapes made from a set vertices stored in one Vertex Buffer Object (VBO) and drawn by one 'shader program' that runs on your computer's 
		Graphical Processing Unit(GPU).  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
	accessed by the shader program through its 'attribute' and 'uniform' 
	variables.  Each VBObox object stores its own 'uniform' values in JavaScript; 
	its 'adjust()'	function computes newly-updated values and transfers them to 
	the GPU for use.
	---------------------------------------------
	A MESSY SET OF OBJECTS--NOT REALLY A 'CLASS'
	---------------------------------------------
As each 'VBObox' object will contain DIFFERENT GLSL shader programs, DIFFERENT attributes for each vertex, DIFFERENT numbers of vertices in VBOs, and DIFFERENT uniforms, I don't see any easy way to use the exact same object constructors and prototypes for all VBObox objects.  Individual VBObox objects may vary substantially, so I recommend that you copy and re-name an existing VBObox prototype object, rename it, and modify its contents as needed, as shown here. (e.g. to make the VBObox2 object, copy the VBObox1 constructor and all its prototype functions, then modify their contents for VBObox2 activities.)
Note that you don't really need a 'VBObox' object at all for simple, beginner-level WebGL/OpenGL programs: if all vertices contain exactly the same attributes (e.g. position, color, surface normal), and use the same shader program (e.g. same Vertex Shader and Fragment Shader), then our textbook's simple 'example code' will suffice.  But that's rare -- most genuinely useful WebGL/OpenGL programs need different sets of vertices with different sets of attributes rendered by different shader programs, where a customized VBObox object for each VBO/shader pair will help you remember and correctly implement all the WebGL/GLSL steps required for a working program.
*/
// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
//=============================================================================
// Tabs set to 2

function VBObox1() {
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object  that holds all data and 
// fcns needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat1;\n' +
  'attribute vec4 a_Pos1;\n' +
  'attribute vec3 a_Colr1;\n'+
  'varying vec3 v_Colr1;\n' +
  //
  'void main() {\n' +
  '  gl_Position = u_ModelMat1 * a_Pos1;\n' +
  '	 v_Colr1 = a_Colr1;\n' +
  ' }\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr1;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr1, 1.0);\n' + 
  '}\n';

	this.vboContents = //--------------------- Vertices that will fill VBO:
	new Float32Array ([						// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO)
	// 1st triangle:
  	 0.0,	 0.5,	0.0, 1.0,		1.0, 0.0, 0.0, //1 vertex:pos x,y,z,w; color: r,g,b
    -0.5, -0.5, 0.0, 1.0,		0.0, 1.0, 0.0,
     0.5, -0.5, 0.0, 1.0,		0.0, 0.0, 1.0,
 // 2nd triangle:
		 0.0,  0.0, 0.0, 1.0,   1.0, 1.0, 1.0,		// (white)
		 0.3,  0.0, 0.0, 1.0,   0.0, 0.0, 1.0,		// (blue)
		 0.0,  0.3, 0.0, 1.0,   0.5, 0.5, 0.5,		// (gray)
		 ]);

	this.vboVerts = 6;						// # of vertices held in 'vboContents' array;
	this.vboLoc;										// Vertex Buffer Object location# on the GPU
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
																	// bytes req'd for 1 array element;
																	// (why? used to compute stride and offset 
																	// in bytes for vertexAttribPointer() calls) 
	this.shaderLoc;									// Shader-program location # on the GPU, made 
																	// by compile/link of VERT_SRC and FRAG_SRC.
								//-------------------- Attribute locations in our shaders
	this.a_PosLoc;									// GPU location for 'a_Pos1' attribute
	this.a_ColrLoc;									// GPU location for 'a_Colr1' attribute

								//-------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();		// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;								// GPU location for u_ModelMat uniform
}

VBObox1.prototype.init = function(myGL) {
//=============================================================================
// Create& compile ompile this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of	all our shaders' attribute- and uniform-variables; 
// assign the correct portions of VBO contents as the data source for each 
// attribute, and transfer current values to the GPU for each uniform variable.
// (usually called only once, within main()) 

	this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
	this.vboLoc = myGL.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
  								this.vboLoc);				// the ID# the GPU uses for this buffer.
  											
 // Transfer data from our JavaScript Float32Array object to the just-bound VBO. 
 //  (Recall gl.bufferData() changes GPU's memory allocation: use 
 //		gl.bufferSubData() to modify buffer contents without changing its size)
 //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
 //	(see OpenGL ES specification for more info).  Your choices are:
 //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents rarely or never change.
 //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents may change often as our program runs.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded; for rapidly supplied & consumed VBOs.
  myGL.bufferData(gl.ARRAY_BUFFER, 			// GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  							 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos1');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Colr1');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr1');
    return -1;	// error exit.
  }
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		7*this.FSIZE,	// Stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false, 
  							7*this.FSIZE, 4*this.FSIZE);
  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
// Find & Set All Uniforms:--------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
	this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat1');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
}

//VBObox.prototype.drawMe = function() {
VBObox1.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.  	
  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Set the GPU's current buffer binding;
	myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for this buffer.
	// **** CAREFUL!  changing the buffer binding DOESN'T change the data 
	// source for 'attributes' in our shaders! To do that, we must instead call
	// gl.vertexAttribPointer(), which ties an attribute in a shader to the 
	// currently-bound buffer:
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //a) Tie shader  attributes to the currently bound buffer:
  myGL.vertexAttribPointer(this.a_PosLoc, 4, myGL.FLOAT, false, 
  													7*this.FSIZE, 0);		// stride, offset
  myGL.vertexAttribPointer(this.a_ColrLoc, 3, myGL.FLOAT, false, 
  													7*this.FSIZE, 4*this.FSIZE); // stride, offset
  // enable the newly-re-assigned attributes:
  myGL.enableVertexAttribArray(this.a_PosLoc);
	myGL.enableVertexAttribArray(this.a_ColrLoc);

  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.drawArrays(myGL.TRIANGLES, 		// select the drawing primitive to draw,
  							0, 										// location of 1st vertex to draw;
  							this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox1.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Adjust values for our uniforms,
  this.ModelMat.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  myGL.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 								// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
}

VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
/*
 *
 		********   YOU WRITE THIS! ********
 *
 *
*/
}

VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
/*
 *
 		********   YOU WRITE THIS! ********
 *
 *
*/
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
/*
 *
 		********   YOU WRITE THIS! ********
 *
 *
*/
}
/*
//==============================================================================
function VBObox2() {
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox' object  that holds all data and fcns 
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 


	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 


	this.vboContents = //--------------------- Vertices that will fill VBO:
	new Float32Array ([						// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO)

		 ]);

	this.vboVerts = 0;							// # of vertices held in 'vboContents' array;
	this.vboLoc;										// Vertex Buffer Object location# on the GPU
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
																	// bytes req'd for 1 array element;
																	// (why? used to compute stride and offset 
																	// in bytes for vertexAttribPointer() calls) 
	this.shaderLoc;									// Shader-program location # on the GPU, made 
																	// by compile/link of VERT_SRC and FRAG_SRC.
								//-------------------- Attribute locations in our shaders
	this.a_ATTRIB_1_LOC;						// GPU location for 'a_XXXX' attribute
	this.a_ATTRIB_2_LOC;						// GPU location for 'a_YYYY' attribute

								//-------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();		// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;								// GPU location for u_ModelMat uniform
}

VBObox1.prototype.init = function(myGL) {
//=============================================================================
// Create& compile ompile this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of	all our shaders' attribute- and uniform-variables; 
// assign the correct portions of VBO contents as the data source for each 
// attribute, and transfer current values to the GPU for each uniform variable.
// (usually called only once, within main()) 

	this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
	this.vboLoc = myGL.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
  								this.vboLoc);				// the ID# the GPU uses for this buffer.
  											
 // Transfer data from our JavaScript Float32Array object to the just-bound VBO. 
 //  (Recall gl.bufferData() changes GPU's memory allocation: use 
 //		gl.bufferSubData() to modify buffer contents without changing its size)
 //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
 //	(see OpenGL ES specification for more info).  Your choices are:
 //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents rarely or never change.
 //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents may change often as our program runs.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded; for rapidly supplied & consumed VBOs.
  myGL.bufferData(gl.ARRAY_BUFFER, 			// GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  							 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos1');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Colr1');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr1');
    return -1;	// error exit.
  }
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		7*this.FSIZE,	// Stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false, 
  							7*this.FSIZE, 4*this.FSIZE);
  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
// Find & Set All Uniforms:--------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
	this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat1');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
}

//VBObox.prototype.drawMe = function() {
VBObox1.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.  	
  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Set the GPU's current buffer binding;
	myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for this buffer.
	// **** CAREFUL!  changing the buffer binding DOESN'T change the data 
	// source for 'attributes' in our shaders! To do that, we must instead call
	// gl.vertexAttribPointer(), which ties an attribute in a shader to the 
	// currently-bound buffer:
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //a) Tie shader  attributes to the currently bound buffer:
  myGL.vertexAttribPointer(this.a_PosLoc, 4, myGL.FLOAT, false, 
  													7*this.FSIZE, 0);		// stride, offset
  myGL.vertexAttribPointer(this.a_ColrLoc, 3, myGL.FLOAT, false, 
  													7*this.FSIZE, 4*this.FSIZE); // stride, offset
  // enable the newly-re-assigned attributes:
  myGL.enableVertexAttribArray(this.a_PosLoc);
	myGL.enableVertexAttribArray(this.a_ColrLoc);

  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.drawArrays(myGL.TRIANGLES, 		// select the drawing primitive to draw,
  							0, 										// location of 1st vertex to draw;
  							this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox1.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Adjust values for our uniforms,
  this.ModelMat.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  myGL.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 								// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
}

/
VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//==============================================================================
//==============================================================================
//==============================================================================


/* 
	FINISH THIS LATER --  3-vertex VBO: pos, color attribs, isBlue uniform.


function VBOboxTEMPLATE() {
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox' object  that holds all data and fcns 
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate set of shaders.
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat1;\n' +
  'attribute vec4 a_Pos;\n' +
  'attribute vec3 a_Colr;\n'+
  'varying vec3 v_Colr1;\n' +
  //
  'void main() {\n' +
  '  gl_Position = a_Pos1;\n' +
  '	 v_Colr1 = a_Colr1;\n' +
  ' }\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +
  'varying vec3 v_Colr1;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr1, 1.0);\n' + 
  '}\n';

	this.vboContents = //--------------------- Vertices that will fill VBO:
	new Float32Array ([						// Array of vertex attribute values we will
  															// transfer to GPU's vertex buffer object (VBO)
	// 1st triangle:
  	 0.0,	 0.5,	0.0, 1.0,		1.0, 0.0, 0.0, //1 vertex:pos x,y,z,w; color: r,g,b
    -0.5, -0.5, 0.0, 1.0,		0.0, 1.0, 0.0,
     0.5, -0.5, 0.0, 1.0,		0.0, 0.0, 1.0,
 // 2nd triangle:
		 0.0,  0.0, 0.0, 1.0,   1.0, 1.0, 1.0,		// (white)
		 0.3,  0.0, 0.0, 1.0,   0.0, 0.0, 1.0,		// (blue)
		 0.0,  0.3, 0.0, 1.0,   0.5, 0.5, 0.5,		// (gray)
		 ]);

	this.vboVerts = 6;						// # of vertices held in 'vboContents' array;
	this.vboLoc;										// Vertex Buffer Object location# on the GPU
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
																	// bytes req'd for 1 array element;
																	// (why? used to compute stride and offset 
																	// in bytes for vertexAttribPointer() calls) 
	this.shaderLoc;									// Shader-program location # on the GPU, made 
																	// by compile/link of VERT_SRC and FRAG_SRC.
								//-------------------- Attribute locations in our shaders
	this.a_PosLoc;									// GPU location for 'a_Pos1' attribute
	this.a_ColrLoc;									// GPU location for 'a_Colr1' attribute

								//-------------------- Uniform locations &values in our shaders
	this.ModelMat = new Matrix4();		// Transforms CVV axes to model axes.
	this.u_ModelMatLoc;								// GPU location for u_ModelMat uniform
}

VBObox1.prototype.init = function(myGL) {
//=============================================================================
// Create& compile ompile this VBObox object's shaders to an executable 'program'
// ready for use in the GPU.  Create and fill a Float32Array that holds all VBO 
// vertices' values; create a new VBO on the GPU and fill it with those values. 
// Find the GPU location of	all our shaders' attribute- and uniform-variables; 
// assign the correct portions of VBO contents as the data source for each 
// attribute, and transfer current values to the GPU for each uniform variable.
// (usually called only once, within main()) 

	this.shaderLoc = createProgram(myGL, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}
	this.vboLoc = myGL.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
  								this.vboLoc);				// the ID# the GPU uses for this buffer.
  											
 // Transfer data from our JavaScript Float32Array object to the just-bound VBO. 
 //  (Recall gl.bufferData() changes GPU's memory allocation: use 
 //		gl.bufferSubData() to modify buffer contents without changing its size)
 //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
 //	(see OpenGL ES specification for more info).  Your choices are:
 //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents rarely or never change.
 //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
 //				contents may change often as our program runs.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded; for rapidly supplied & consumed VBOs.
  myGL.bufferData(gl.ARRAY_BUFFER, 			// GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  							 
// Find & Set All Attributes:------------------------------
  // a) Get the GPU location for each attribute var used in our shaders:
  this.a_PosLoc = gl.getAttribLocation(this.shaderLoc, 'a_Pos1');
  if(this.a_PosLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Pos1');
    return -1;	// error exit.
  }
 	this.a_ColrLoc = myGL.getAttribLocation(this.shaderLoc, 'a_Colr1');
  if(this.a_ColrLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_Colr1');
    return -1;	// error exit.
  }
  // b) Next, set up GPU to fill these attribute vars in our shader with 
  // values pulled from the currently-bound VBO (see 'gl.bindBuffer()).
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  myGL.vertexAttribPointer(
		this.a_PosLoc,//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		7*this.FSIZE,	// Stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  gl.vertexAttribPointer(this.a_ColrLoc, 3, gl.FLOAT, false, 
  							7*this.FSIZE, 4*this.FSIZE);
  // c) Enable this assignment of the attribute to its' VBO source:
  myGL.enableVertexAttribArray(this.a_PosLoc);
  myGL.enableVertexAttribArray(this.a_ColrLoc);
// Find & Set All Uniforms:--------------------------------
//Get GPU storage location for each uniform var used in our shader programs: 
	this.u_ModelMatLoc = myGL.getUniformLocation(this.shaderLoc, 'u_ModelMat1');
  if (!this.u_ModelMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMat1 uniform');
    return;
  }
}

//VBObox.prototype.drawMe = function() {
VBObox1.prototype.draw = function(myGL) {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.  	
  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Set the GPU's current buffer binding;
	myGL.bindBuffer(myGL.ARRAY_BUFFER,	// GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for this buffer.
	// **** CAREFUL!  changing the buffer binding DOESN'T change the data 
	// source for 'attributes' in our shaders! To do that, we must instead call
	// gl.vertexAttribPointer(), which ties an attribute in a shader to the 
	// currently-bound buffer:
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  //a) Tie shader  attributes to the currently bound buffer:
  myGL.vertexAttribPointer(this.a_PosLoc, 4, myGL.FLOAT, false, 
  													7*this.FSIZE, 0);		// stride, offset
  myGL.vertexAttribPointer(this.a_ColrLoc, 3, myGL.FLOAT, false, 
  													7*this.FSIZE, 4*this.FSIZE); // stride, offset
  // enable the newly-re-assigned attributes:
  myGL.enableVertexAttribArray(this.a_PosLoc);
	myGL.enableVertexAttribArray(this.a_ColrLoc);

  // ----------------------------Draw the contents of the currently-bound VBO:
  myGL.drawArrays(myGL.TRIANGLES, 		// select the drawing primitive to draw,
  							0, 										// location of 1st vertex to draw;
  							this.vboVerts);		// number of vertices to draw on-screen.
}

VBObox1.prototype.adjust = function(myGL) {
//=============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  myGL.useProgram(this.shaderLoc);	// In the GPU, SELECT our already-compiled
  																	// -and-linked executable shader program.
	// Adjust values for our uniforms,
  this.ModelMat.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
  this.ModelMat.translate(0.35, 0, 0);							// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  myGL.uniformMatrix4fv(this.u_ModelMatLoc,	// GPU location of the uniform
  										false, 								// use matrix transpose instead?
  										this.ModelMat.elements);	// send data from Javascript.
}

/
VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/
//==============================================================================

