//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// TwoVBOs.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//
/* Demonstrate use of two separate VBOs with different contents & attributes. 
	01:--detailed explanatory comments; 
 	   --expand from 2D vertices to 4D; add 'a_color' attribute to each vertex
 	   --modify HTML-5 buttons & the fcns they call; soon to toggle VBOs on/off
	02:--create global vars to eliminate function arguments 
 			(later: organize all these globals into a sensible object-oriented design, 
 			e.g. ShapeBuf, Cam, GUI objects... YOU decide!)
	03:--add a_color attrib, v_colr varying to shaders for per-pixel colors;
			(change a_PositionID to a_PositionLoc; add precision specs to shaders)
		--draw(): SAME VBO twice, but not at same angle; buttons show/hide them
	04:--write initVBO2() fcn to create a 2nd VBO with different shapes and 
			colors, but same attribs as VBO 1. Note that after we call initVBO2() we 
			changed binding to VBO2; THUS we see ONLY VBO2 contents...
	05:--in draw(), change buffer binding (e.g. call bindBuffer()) BEFORE we make 
			the WebGL drawing call drawArray(). !? We STILL see only VBO2 contents!? 
			?Why?  
			Because the buffer-bind change isn't enough!.  
			It DOESN'T CHANGE THE DATA SOURCE for GLSL shader attributes: they're 
			still using VBO2!  Fix it in next version...
*/
//==============================================================================
// TABS set to 2.

//===============================================================================
// Vertex shader program:
var VSHADER_SOURCE =
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'attribute vec4 a_Position;\n' +
  'attribute vec3 a_Color;\n'+
  'uniform mat4 u_ModelMatrix;\n' +
  'varying vec3 v_Colr;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '	 v_Colr = a_Color;\n' +
  '}\n';
// Each instance on GPU computes all the on-screen attributes for just one 
// VERTEX, supplied by 'attribute vec4' variable a_Position, filled from one of 
// the Vertex Buffer Objects (VBOs) we created inside the GPU by calling 
// 'initVertexBuffers()' function.  The 'bindBuffer()' call selects which VBO.

//==============================================================================
// Fragment shader program:
var FSHADER_SOURCE =
  'precision mediump float;\n' +
	'varying vec3 v_Colr;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr,1.0);\n' + // vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';
// --Each instance computes all the on-screen attributes for just one PIXEL.
// -- built-in variables? http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

// Global Variables  (BAD IDEA! later, put them inside well-organized objects!)
// =============================
// for WebGL usage:
var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For VBOs:
var g_BufID1;										// 1st Vertex Buffer Object ID#, created by GPU
var g_BufID2;										// ID# for 2nd VBO.
var g_BufVerts1;								// # of vertices in our first VBO in the GPU.
var g_BufVerts2;								// # of vertices in our second VBO in the GPU.
		//----within VBO1:
var a_PositionLoc;							// GPU location for 'a_Position' attrib in VBO1
var a_ColorLoc;									// GPU location ofr 'a_Color' attrib in VBO1

// For animation:
var g_last = Date.now();				// Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var g_angleStep = 45.0;					// Rotation angle rate, in degrees/second.
var g_currentAngle = 0.0; 				// Current rotation angle
var g_ModelMatrix = new Matrix4();// Transforms CVV drawing axes to 'model' axes.
var u_ModelMatrixLoc;						// GPU storage location for u_ModelMatrix uniform
// For mouse/keyboard:
var g_show1 = 1;								// 0==Show, 1==Hide VBO1 contents on-screen.
var g_show2 = 1;								// 	"					"			VBO2		"				"				" 

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var g_canvasID = document.getElementById('webgl');

  // Create the the WebGL rendering context: the one giant JavaScript object that
  // contains the WebGL state machine, which consists of a large set of WebGL 
  // functions, built-in parameters and member data. Every WebGL function call
  // will follow this format:  gl.WebGLfunctionName(args);
  gl = getWebGLContext(g_canvasID);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Init shaders on GPU: load, compile, link, put into 'programs' using the 
  // textbook's 'initShader()' helper function library 'cuon-utils.js'
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Create and fill any/all Vertex Buffer Objects in the GPU:
  var n = initVBO1();			// init the first VBO: returns # of vertices created
  if (n < 0) {
    console.log('Failed to create FIRST vertex buffer object (VBO) in the GPU!');
    return;
  }
	n = initVBO2();					// init the 2nd VGO: returns # of vertices created.
	if (n < 0) {
		console.log('Failed to create SECOND vertex buffer object(VBO) in the GPU!');
	}
	
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>
  // Get GPU storage location for all uniform vars used by any of our shaders:
  u_ModelMatrixLoc = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrixLoc) { 
    console.log('Failed to get GPU storage location of u_ModelMatrix uniform');
    return;
  }
  // ==============ANIMATION=============
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simpler-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, and computing loads and respond to 
  //			on-screen window placement (skip battery-draining animation in any 
  //			window hidden behind others, or scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  var tick = function() {			// define our self-calling animation function:
    g_currentAngle = makeSpin(g_currentAngle);  // Update the rotation angle
    draw(); // Draw the triangle
    requestAnimationFrame(tick, g_canvasID); // Request that the browser ?calls tick
  };
  tick();
}

function makeSpin(angle) {
//==============================================================================
// Find the next rotation angle to use for on-screen drawing:
  // Calculate the elapsed time.
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Return the next rotation angle by adjusting it for the elapsed time.
  var newAngle = angle + (g_angleStep * elapsed) / 1000.0;
  return newAngle %= 360.0;					// keep angle >=0.0 and <360.0 degrees
}

function initVBO1() {
//==============================================================================
  var vertArray1 = new Float32Array ([		// Array of vertex attributes we will
  														// transfer to GPU's 1st vertex buffer object (VBO)
  	 0.0,	 0.5,	0.0, 1.0,		1.0, 0.0, 0.0,// 1 vertex: pos x,y,z,w; color: r,g,b 
    -0.5, -0.5, 0.0, 1.0,		0.0, 1.0, 0.0,
     0.5, -0.5, 0.0, 1.0,		0.0, 0.0, 1.0,
  ]);
  g_BufVerts1 = 3;   // The number of vertices in vertArray1
var FSIZE = vertArray1.BYTES_PER_ELEMENT;	// bytes req'd by just 1 array element;
																	// (why? helps us compute stride and offset 
																	// for getting attribute values from VBOs) 
// Create a buffer object in the graphics hardware: save its ID# in global var: 
 g_vboID1 = gl.createBuffer();	
 
  if (!g_vboID1) {
    console.log('Failed to create 1st vertex buffer object (VBO) in the GPU');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of this selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds actual attributes we //			need for rendering (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  // 			into a list of attributes we need; indices such as object #s, face #s, 
  //			edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER,				// GLenum 'target' for this GPU buffer 
  											g_vboID1);			// the ID# the GPU uses for this buffer.
  											
 // Transfer data from our JavaScript Float32Array object to the GPU, into the 
 // VBO (a named hunk of memory) we just created, identified by g_vboID1. 
 //  Recall that gl.bufferData() allocates and fills a *NEW* hunk of graphics 
 //		memory.  We always use gl.bufferData() in the creation of a new buffer.T
 //	The 'hint' we give helps the GPU manage memory for speed and efficiency,
 // and we selected it by following the OpenGL ES specification:
 //		--STATIC_DRAW is for vertex buffers that are rendered many times, 
 //				and whose contents are specified once and never change.
 //		--DYNAMIC_DRAW is for vertex buffers that are rendered many times, and 
 //				whose contents change during the rendering loop.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded.
  gl.bufferData(gl.ARRAY_BUFFER, 				// GLenum target (same as 'bindBuffer()')
 										 vertArray1, 				// data source: JavaScript Float32Array
  							gl.STATIC_DRAW);				// Usage hint.


	// -----------Tie shader's 'a_Position' attribute to bound buffer:-------------
  // a) Get the GPU location for the a_Position var in the graphics hardware:
  a_PositionLoc = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionLoc < 0) {
    console.log('Failed to get the GPU storage location of a_Position');
    return -1;
  }
  // b) Next, set GPU to fill 'a_Position' attribute variable for vertex with 
  // values stored in the buffer object chosen by 'gl.bindBuffer()' command.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		a_PositionLoc,//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		7*FSIZE,			// stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute valuessequentially from the
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset -- how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  // c) Enable this assignment of the a_Position attribute to the bound buffer:
  gl.enableVertexAttribArray(a_PositionLoc);
  //------------------------
  // Next attribute: a) get the GPU location...
 	a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorLoc < 0) {
    console.log('Failed to get the GPU storage location of a_Color');
    return -1;
  }
  // b) tell GPU how to retrieve attrib from the currently bound buffer:
  gl.vertexAttribPointer(a_ColorLoc, 3, gl.FLOAT, false, 7*FSIZE, 4*FSIZE);
  // c) Enable this assignment of a_Color attribute to the bound buffer:
  gl.enableVertexAttribArray(a_ColorLoc);
  //--------------------------------------------
  return g_BufVerts1;
}

function initVBO2() {
//==============================================================================
  var vertArray2 = new Float32Array ([		// Array of vertex attributes we will
  														// transfer to GPU's 1st vertex buffer object (VBO)
  	-0.3,	 0.7,	0.0, 1.0,		0.0, 1.0, 1.0,// 1 vertex: pos x,y,z,w; color: r,g,b 
    -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,
     0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,
  ]);
  g_BufVerts2 = 3;   // The number of vertices in vertArray1
var FSIZE = vertArray2.BYTES_PER_ELEMENT;	// bytes req'd by just 1 array element;
																	// (why? helps us compute stride and offset 
																	// for getting attribute values from VBOs) 
// Create a buffer object in the graphics hardware: save its ID# in global var: 
 g_vboID2 = gl.createBuffer();	
 
  if (!g_vboID2) {
    console.log('Failed to create 2nd vertex buffer object (VBO) in the GPU');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of this selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds actual attributes we //			need for rendering (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  // 			into a list of attributes we need; indices such as object #s, face #s, 
  //			edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER,				// GLenum 'target' for this GPU buffer 
  											g_vboID2);			// the ID# the GPU uses for this buffer.
 // Transfer data from our JavaScript Float32Array object to the GPU, into the 
 // VBO (a named hunk of memory) we just created, identified by g_vboID1. 
 //  Recall that gl.bufferData() allocates and fills a *NEW* hunk of graphics 
 //		memory.  We always use gl.bufferData() in the creation of a new buffer.T
 //	The 'hint' we give helps the GPU manage memory for speed and efficiency,
 // and we selected it by following the OpenGL ES specification:
 //		--STATIC_DRAW is for vertex buffers that are rendered many times, 
 //				and whose contents are specified once and never change.
 //		--DYNAMIC_DRAW is for vertex buffers that are rendered many times, and 
 //				whose contents change during the rendering loop.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded.
  gl.bufferData(gl.ARRAY_BUFFER, 				// GLenum target (same as 'bindBuffer()')
 										 vertArray2, 				// data source: JavaScript Float32Array
  							gl.STATIC_DRAW);				// Usage hint.

	// -----------Tie shader's 'a_Position' attribute to bound buffer:-------------
  // a) Get the GPU location for the a_Position var in the graphics hardware:
  a_PositionLoc = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionLoc < 0) {
    console.log('Failed to get the GPU storage location of a_Position');
    return -1;
  }
  // b) Next, set GPU to fill 'a_Position' attribute variable for vertex with 
  // values stored in the buffer object chosen by 'gl.bindBuffer()' command.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		a_PositionLoc,//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		7*FSIZE,			// stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute valuessequentially from the
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset -- how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  // c) Enable this assignment of the a_Position attribute to the bound buffer:
  gl.enableVertexAttribArray(a_PositionLoc);
  //------------------------
  // Next attribute: a) get the GPU location...
 	a_ColorLoc = gl.getAttribLocation(gl.program, 'a_Color');
  if(a_ColorLoc < 0) {
    console.log('Failed to get the GPU storage location of a_Color');
    return -1;
  }
  // b) tell GPU how to retrieve attrib from the currently bound buffer:
  gl.vertexAttribPointer(a_ColorLoc, 3, gl.FLOAT, false, 7*FSIZE, 4*FSIZE);
  // c) Enable this assignment of a_Color attribute to the bound buffer:
  gl.enableVertexAttribArray(a_ColorLoc);
  //--------------------------------------------

  return g_BufVerts2;
}

function draw() {
//==============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT);

	if(g_show1 == 1) {	// IF user didn't press HTML button to 'hide' VBO1:
	  // DRAW FIRST VBO:--------------------------
	  g_ModelMatrix.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
	  g_ModelMatrix.translate(0.35, 0, 0);						// then translate them.
	  //  Transfer 'g_NodelMatrix' values to the GPU's 'u_ModelMatrix' uniform: 
	  gl.uniformMatrix4fv(u_ModelMatrixLoc, 			// GPU location of the uniform
	  										false, 									// use matrix transpose instead?
	  										g_ModelMatrix.elements);// Javascript data to send to GPU
		// CHANGE BUFFER BINDING TO VBO1------------ (SURPRISE! Not enough!)
		gl.bindBuffer(gl.ARRAY_BUFFER,			// GLenum 'target' for this GPU buffer 
  											g_vboID1);			// the ID# the GPU uses for this buffer.
  	// **** SURPRISE!  changing the buffer binding DOESN'T change the data 
	  // Draw the contents of the currently-bound VBO:
	  gl.drawArrays(gl.TRIANGLES, 0, g_BufVerts1);
  }
  if(g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
	  // DRAW SECOND VBO:--------------------------- 	
	  g_ModelMatrix.setRotate(-g_currentAngle, 0, 0, 1);	// -spin drawing axes,
	  g_ModelMatrix.translate(0.55, 0, 0);					// then translate them further:
	  //  Transfer 'g_NodelMatrix' values to the GPU's 'u_ModelMatrix' uniform: 
	  gl.uniformMatrix4fv(u_ModelMatrixLoc, 			// GPU location of the uniform
	  										false, 									// use matrix transpose instead?
	  										g_ModelMatrix.elements);// Javascript data to send to GPU
		// CHANGE BUFFER BINDING TO VBO2------------ (SURPRISE! Not enough!)
		gl.bindBuffer(gl.ARRAY_BUFFER,		// GLenum 'target' for this GPU buffer 
									g_vboID2);					// the ID# the GPU uses for this buffer.
	  gl.drawArrays(gl.TRIANGLES, 0, g_BufVerts1);	// draw again.
  	// **** SURPRISE!  changing the buffer binding DOESN'T change the data 
	}
}

function VBO1toggle() {
//==============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show1 != 1) g_show1 = 1;				// show,
  else g_show1 = 0;										// hide.
  console.log('g_show1: '+g_show1);
}

function VBO2toggle() {
//==============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show2 != 1) g_show2 = 1;			// show,
  else g_show2 = 0;									// hide.
  console.log('g_show2: '+g_show2);
}
