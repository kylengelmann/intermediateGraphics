//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// TwoVBOs.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

/* Demonstrate use of two separate VBOs with different contents & attributes. 
	01:--detailed explanatory comments; 
 	   --expand from 2D vertices to 4D; add 'a_color' attribute to each vertex
 	   --modify HTML-5 buttons & the fcns they call; soon to toggle VBOs on/off
	02:--create global vars to eliminate function arguments 
 			(later: organize all these globals into a sensible object-oriented design, 
 			e.g. ShapeBuf, Cam, GUI objects... YOU decide!)
*/
//==============================================================================
// TABS set to 2.

//===============================================================================
// Vertex shader program:
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';
// Each instance on GPU computes all the on-screen attributes for just one 
// VERTEX, supplied by 'attribute vec4' variable a_Position, filled from one of 
// the Vertex Buffer Objects (VBOs) we created inside the GPU by calling 
// 'initVertexBuffers()' function.  The 'bindBuffer()' call selects which VBO.

//==============================================================================
// Fragment shader program:
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';
// --Each instance computes all the on-screen attributes for just one PIXEL.
// -- built-in variables? http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

// Global Variables  (BAD IDEA! put them inside well-organized objects!)
// =============================
var g_BufID1;										// 1st Vertex Buffer Object ID# sent from GPU
var g_BufID2;										// ID# for 2nd VBO.

var g_last = Date.now();				// Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var ANGLE_STEP = 45.0;					// Rotation angle rate, in degrees/second.
var currentAngle = 0.0; 				// Current rotation angle
var modelMatrix = new Matrix4();// Transforms CVV drawing axes to 'model' axes.

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Create and fill vertex buffer objects in the GPU:
  var n = initVertexBuffers(gl);			// returns # of vertices created
  if (n < 0) {
    console.log('Failed to create our vertex buffer objects.');
    return;
  }

  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>

  // Get storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }
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
  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix);   // Draw the triangle
    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick
  };
  tick();
}

function animate(angle) {
//==============================================================================
  // Calculate the elapsed time; return the angle for the current time.
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function initVertexBuffers(gl) {
//==============================================================================
  var vertArray1 = new Float32Array ([		// Array of vertex attributes we will
  														// transfer to GPU's 1st vertex buffer object (VBO)
  	 0.0,	 0.5,	0.0, 1.0,		1.0, 0.0, 0.0,// 1 vertex: pos x,y,z,w; color: r,g,b 
    -0.5, -0.5, 0.0, 1.0,		0.0, 1.0, 0.0,
     0.5, -0.5, 0.0, 1.0,		0.0, 0.0, 1.0,
  ]);
  var vertCount1 = 3;   // The number of vertices in vertArray1
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
  							gl.DYNAMIC_DRAW);				// Usage hint.


	// -----------Tie shader's 'a_Position' attribute to bound buffer:-------------
  // a) Get the ID# for the a_Position variable in the graphics hardware:
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the GPU storage location of a_Position');
    return -1;
  }
  // Next, set GPUT to fill 'a_Position' attribute variable for vertex with 
  // values stored in the buffer object chosen by 'gl.bindBuffer()' command.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		a_PositionID,	//index == ID# for the attribute var in your GLSL shaders;
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
  // Enable this assignment of the a_Position variable to the bound buffer:
  gl.enableVertexAttribArray(a_PositionID);
  return vertCount1;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================
  // Set the rotation matrix:
  modelMatrix.setRotate(currentAngle, 0, 0, 1);	// first rotate drawing axes,
  modelMatrix.translate(0.35, 0, 0);						// then translate them.
 
  // Update the value of the 'modelMatrix' uniform on the GPU: 
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.TRIANGLES, 0, n);
}

function toggle1() {
//==============================================================================
  ANGLE_STEP += 10; 
}

function toggle2() {
//==============================================================================
  ANGLE_STEP -= 10; 
}
