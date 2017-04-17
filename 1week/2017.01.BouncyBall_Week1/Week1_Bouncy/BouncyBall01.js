//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
//	 ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// BouncyBall.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//		--converted to 2D->4D; 
//		--Draw 3 verts in our one Vertex Buffer Object as points
//		--Fragment shader draw POINTS primitives as round and 'soft' shapes
//			by using the built-in variable 'gl_PointCoord' that exists ONLY for
//			drawing WebGL's 'gl.POINTS' primitives, and no others.
//==============================================================================
// Vertex shader program:
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'void main() {\n' +
  '  gl_PointSize = 30.0;\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '}\n';
// Each instance computes all the on-screen attributes for just one VERTEX,
// The program gets all its info for that vertex through the 'attribute vec4' 
// variable a_Position, which feeds it values for one vertex taken from from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function. 

//==============================================================================// Fragment shader program:
var FSHADER_SOURCE =
  'void main() {\n' +
  '  precision mediump float;\n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '  if(dist < 0.5) { \n' +	
	'  	gl_FragColor = vec4(1.0-4.0*dist*dist, 0.0, 0.0, 1.0);\n' +
	'  } else { discard; }\n' +
  '}\n';
// --Each instance computes on-screen color (& more) for just one PIXEL.
// --Draw large POINTS primitives as ROUND instead of square.  HOW?
//   See pg. 377 in  textbook: "WebGL Programming Guide".  The vertex shaders' 
// gl_PointSize value sets POINTS primitives' on-screen width and height, and
// by default draws POINTS as a square on-screen.  In the fragment shader, the 
// built-in input variable 'gl_PointCoord' gives the fragment's location within
// that 2D on-screen square; value (0,0) at squares' lower-left corner, (1,1) at
// upper right, and (0.5,0.5) at the center.  The built-in 'distance()' function
// lets us discard any fragment outside the 0.5 radius of POINTS made circular.
// (CHALLENGE: make a 'soft' point: color falls to zero as radius grows to 0.5)?
// -- NOTE! gl_PointCoord is UNDEFINED for all drawing primitives except POINTS;
// thus our 'draw()' function can't draw a LINE_LOOP primitive unless we turn off
// our round-point rendering.  
// -- Where can I find a list of ALL GLSL built-in variables?  See: 
// http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

// Global Variables -- Rotation angle rate (degrees/second)
var ANGLE_STEP = 45.0;

function main() {
//==============================================================================
  // Retrieve <canvas> element identifier
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

  // Write the positions of vertices into an array, transfer
  // array contents to a Vertex Buffer Object created in the
  // graphics hardware.
  var myVerts = initVertexBuffers(gl);
  if (myVerts < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }

  // Specify the color for clearing <canvas>
  gl.clearColor(0.2, 0.2, 0.2, 1);

  // Get storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  // initialize: current rotation angle
  var currentAngle = 0.0;
  // create Model matrix
  var modelMatrix = new Matrix4();

  // Start drawing
  var tick = function() {
    currentAngle = animate(currentAngle);  // Update the rotation angle
    draw(gl, myVerts, currentAngle, modelMatrix, u_ModelMatrix);   // Draw verts
    requestAnimationFrame(tick, canvas);  // Request browser to ?call tick()?
  };
  tick();
}

function initVertexBuffers(gl) {
//==============================================================================
  var vertices = new Float32Array ([
     0.0,  0.5, 0.0, 1.0,   // three particles' x,y,z,w position
    -0.5, -0.5, 0.0, 1.0,   
     0.5, -0.5, 0.0, 1.0,
  ]);
  var vcount = 3;   // The number of vertices

  // Create a buffer object
  var vertexBufferID = gl.createBuffer();
  if (!vertexBufferID) {
    console.log('Failed to create the buffer object');
    return -1;
  }

  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, select an existing buffer object and specify its use.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this memory; so far, we have just two choices:
  // target is either:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds the values we need 
  //			for rendering (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  // 			into a list stored elsewhere, such as object #s, face #s, edge #s, //			vertex #s)actual coordinates)
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferID);
  // Write data from our JavaScript array 'vertices' into the GPU, using it to
  // fill up the 'buffer object' we created and 'bound' to the 'target'.
  // Note the last argument: gl.STATIC_DRAW -- this is a 'hint' to the GPU that
  // tells the optimizer how we will actually use this buffer object's contents.
  // By providing this argument the GLSL compiler for our GPU can make the best use
  // of the GPU's extra-fast, extra-wide memory; STATIC_DRAW (google it!) means
  // that after we fill the buffer we will then read from it over and over.  The
  // GPU can then regard it as 'read-only' memory.
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Assign the buffer object to a_Position variable
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_PositionID, 4, gl.FLOAT, false, 0, 0);
	// websearch yields OpenGL version: 
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
				//	glVertexAttributePointer (
				//			index == which attribute variable will we use?
				//			size == how many dimensions for this attribute: 1,2,3 or 4?
				//			type == what data type did we store for those numbers?
				//			isNormalized == are these fixed-point values that we need
				//						normalize before use? true or false
				//			stride == #bytes (of other, interleaved data) between OUR values?
				//			pointer == offset; how many (interleaved) values to skip to reach
				//					our first value?
				//				)
  // Enable the assignment to a_Position variable
  gl.enableVertexAttribArray(a_PositionID);

  return vcount;
}

function draw(gl, n, currentAngle, modelMatrix, u_ModelMatrix) {
//==============================================================================  // Set the rotation matrix
  modelMatrix.setRotate(currentAngle, 0, 0, 1);
  modelMatrix.translate(0.35, 0, 0);
 
  // DRAW BOX:  Use this matrix to transform & draw our VBo's contents:
  		// Pass our current matrix to the vertex shaders:
  gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // DRAW BOX: Use this matrix to transform & draw our VBO's contents:
  gl.drawArrays(gl.LINE_LOOP, 0, n);
  gl.pointsize = 10;
  gl.drawArrays(gl.POINTS, 0, n);
}

// Last time that this function was called:  (used for animation timing)
var g_last = Date.now();

function animate(angle) {
//==============================================================================  // Calculate the elapsed time
  var now = Date.now();
  var elapsed = now - g_last;
  g_last = now;
  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + (ANGLE_STEP * elapsed) / 1000.0;
  return newAngle %= 360;
}

function onPlusButton() {
//==============================================================================
  ANGLE_STEP += 10; 
}

function onMinusButton() {
//==============================================================================
  ANGLE_STEP -= 10; 
}
