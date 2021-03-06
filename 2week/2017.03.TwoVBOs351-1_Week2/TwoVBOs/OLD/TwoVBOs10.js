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
 	   --expand from 2D vertices to 4D; add 'a_Color' attribute to each vertex
 	   --modify HTML-5 buttons & the fcns they call; soon to toggle VBOs on/off
	02:--create global vars to eliminate function arguments 
 			(later: organize all these globals into a sensible object-oriented design, 
 			e.g. ShapeBuf, Cam, GUI objects... YOU decide!)
	03:--add a_Color attrib, v_colr varying to shaders for per-pixel colors;
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
			still using VBO2!
	06:--OK; then to switch VBOs, let's change the 'binding' AND change the data 
			source for each attribute:
		 --call bindBuffer() to select our desired VBO data source, and then
		 --call gl.vertexAttribPointer() to change the attrib's data source.
		 It works!  Now make the VBOs different sizes (but same attributes): 
		 					enlarge VBO1 by adding a 2nd triangle.  It still works!
		 					Now make the VBOs even MORE different; step-by-step, add another 
		 					attrib to VBO2 only (not VBO1):
		 --Draw VBO2 using gl.POINTS prims instead of gl.TRIANGLES used for VBO1
			 (CAUTION! points may look invisible until your Vertex Shader sets value 
			 for the built-in attribute gl_PointSize >=1).  Make it big: 10.0!
	07BAD:--Step-by-step, add a 'point-size' attribute ONLY in VBO2 (not VBO1!);
		 --Create u_VBOnum uniform:==1 for VBO1, ==2 for VBO2; used in Vertex Shader,
			to select how we render each different VBO. 
		 --For VBO2 ONLY, add 'point-size' attrib data (increases 'stride' for all
		 	attribs in VBO2; changes initVBO2() and draw() fcns). IT WORKS!
		 --Add attribute 'a_PtSize' to Vertex Shader fed ONLY from VBO2:   
	!! SURPRISE !!  WEIRD and SUBTLE ERROR !!
	Clues:
		--in draw(), VBO2 draws correctly (3 different-sized points), but each VBO1 
		drawing attempt causes 'Attribute out-of-range' error!!!
		--The error vanishes if I use the same number of vertices in VBO1 and VBO2:
		--The 'oddball' new a_PtSize attribute gets its data ONLY from VBO2; THUS
		when draw() renders VBO1, Vertex Shaders read from BOTH VBO1 and VBO2.
		-- You might THINK that the Vertex Shader's 'if/else' statement ensures we 
		don't use the VBO2 attribute a_PtSize' when rendering VBO1, but that's the 
		problem!  
		GLSL compiles to SIMD code--thus branching (if/else) is always awkward; it 
		must complete ALL vertex shader programs at exactly the same time for all 
		possible branches of all shaders.  THUS the GPU actually compute BOTH 
		branches of a conditional, and then discards the unwanted the result. Thus 
		when we render VBO1, the GPU will always access a_PtSize attributes even if 
		u_VBOnum==1!
		To render the 6-vertex VBO1 the GPU runs 6 instances of the vertex shader in 
		parallel.  However, the a_PtSize attribute data comes from the 3-vertex 
		VBO2, and thus vertex shaders TRY to read 6 values of a_PtSize from VBO2 
		that holds only 3 of them --> THUS VBO2 drawing fails by 'out-of-range 
		attribute' error. 
		
		HOW DO WE FIX THIS? Two ways:
		=============================
		08)--EASY HACK WAY:  When we switch from rendering one VBO to another, use 
			the new VBO to supply **ALL** the Shader program's attribute values -- 
			even the attribute values that don't exist in the new VBO.  Specifically: 
			when draw() function switches to VBO1, we need to re-assign the a_PtSize 
			attribute to get its data from VBO1 as well, and not VBO2.  While it's 
			true that VBO1 doesn't hold any valid a_PtSize values, it's also true that 
			the shader won't use any of the a_PtSize values taken from VBO1.  We only 
			need to ensure that a_PtSize will retrieve data from VBO1 without 
			accessing data outside VBO1.
		09)--BETTER, PROPER WAY:  If VBO1 and VBO2 hold different sets of vertices 
		with different attributes that look different on-screen, then why are you 
		trying to render them both with the same GLSL shader programs? Why are you 
		using slow, awkward conditionals to select between tow different kinds of 
		rendering?  Instead, write a separate GLSL shader program (vertex shader, 
		fragment shader) for each VBO, and switch between those shader programs!  
			--See textbook, Chapter 10, pg 386 "Switching Shaders".  The book also 
			gives you working example code "ProgramObject.js" that shows you how.

	08:--Let's try the 'EASY HACK WAY' first.
	==========================================
	  in initVBO1() and draw(), set the a_PtSize attribute to access VBO1 when
	  we're rendering VBO1.  This ensures ALL attributes come from the same VBO 
	  when we're drawing it. When drawing VBO1 (which doesn't hold any values for 
	  a_PtSize) change the data source for the a_PtSize attribute to VBO1 EVEN 
	  THOUGH VBO1 HAS NO a_PtSize data!  We will get invalid, 'junk' values for 
	  a_PtSize, but that's OK, because our shaders will not use those values 
	  (ensured by the u_VBOnum uniform). When we select VBO1, set the a_PtSize 
	  'stride' to match that used for all other VBO1 attribs (7*FSIZE1) and set 
	  offset to 0; then VBO1 supplies a_PtSize with the x-position values it 
	  stores. YES! It works!

	09:--BETTER, PROPER WAY:
	==================================================
	Let's create two different shader programs; each 'program' consists of a 
	vertex shader and fragment shader that work together.  We will create one ]
	'shader program' for  VBO1, and a different shader program for VBO2.  
	(see  "WebGL Programming Guide" textbook, Chap 10, pg. 386, and it's example 
	code: "ProgramObject.js".) 

	09a)--Rename shaders (VSHADER_1SRC, FSHADER_1SRC) and test; then copy and 
			test rename again to make GLSL shaders named (VSHADER_2SRC, FSHADER_2SRC).
		  --Modify the on-screen look for the 2nd shaders;blend colors w/50% purple.
	09b)--In main(), replace the 'initShaders()' call with createProgram() calls 
		(both found in textbook's 'cuon-utils.js' library) to build the two shaders.
			--First, use the g_ShaderID1 program ONLY: replace every instance of 
			gl.program (e.g. args to getAttribLocation(), getUniformLocation(), etc) 
			with  g_ShaderID1, and call 'useProgram(g_ShaderID1)' at the start of the 
			draw() function.  YAY!  It works!  
	However, we can't use the 2nd shader program so easily: before we can call 
	useProgram(g_ShaderID2)) to switch to our other shader program we must change 
	the stored 'location' our JavaScript function will use to access each of the 
	shader's attributes and uniforms variables.
			Why? 
		Because useProgram() selects an executable program stored on the GPU. The 
	GPU location for the 'a_Color' attribute in one executable (such as our  
	g_ShaderID1 program) is quite different from the GPU location where a 
	different executable (e.g. our g_ShaderID2 program) keeps its own, separately 
	stored  'a_Color' attribute.  
		--)More formally: the executable result of each successfully compiled and 
	linked shader program gets its own block of memory and its own separate 
	namespace.  As useProgram() directs the GPU to run a different executable, 
	then our JavaScript program must access different locations to set values for 
	the executable's uniform variables and attribute variables, even if their 
	names (e.g. 'a_Color' are identical to variables in other executables.)
	--tl;dr:
			--Create separate global 'location' vars for each uniform and attribute:
				(e.g. a_PositionLoc1, a_PositionLoc2; a_ColorLoc1, a_ColorLoc2; 
						  u_ModelMatrixLoc1, u_ModelMatrixLoc2; u_VBOnumLoc1, u_VBOnumLoc2)
			--Organize; set these different uniform and attribute locations in the
				 'initVBO1()' and 'initVBO2()' fcns. 
			--modify draw() to use only the Shader 1 locations -- test. YES!
			--modify the draw() function to draw VBO2 with the 2nd shader, using the
			2nd shader locations for all uniforms and attributes. test. YES!
	10:--SIMPLIFY & CLEANUP:		
	Now that Shader1 draws ONLY the VBO1 contents (triangles; no point-size) and 
						Shader2 draws ONLY thew VBO2 contents (points; uses point-size): 
		--In Shader 1, REMOVE the conditional code, the u_VBOnum uniform, and the
 				a_PtSize attributes we don't need, and their location1 vars. TEST: works!
		--In Shader 2, REMOVE the conditional code, the u_VBOnum uniform & its 
				location2 vars. TEST: Works!
		--Create more-obvious name differences for Shader 1:  	TEST: works!
				a_Color --> a_Colr1, a_Position to a_Pos1; u_ModelMatrix-->u_ModelMat1. 
 	!DONE!
 		Two different shader programs ('program'==vertex + fragment shader), each 
 		with a different set of uniforms, a different set of attributes, and each 
 		fed from a different VBO that holds differently-formatted data.
		
*/

//==============================================================================
// TABS set to 2.

//===============================================================================
// Vertex shader (a SIMD program in GLSL) :

var VSHADER_1SRC =							// VERTEX SHADER for VBO1 (Triangles)
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMat1;\n' +
//	'uniform  int u_VBOnum1;\n' + 
  'attribute vec4 a_Pos1;\n' +
  'attribute vec3 a_Colr1;\n'+
  'varying vec3 v_Colr1;\n' +
  //
  'void main() {\n' +
//  '  if(u_VBOnum1==2) {\n' +
//  '    gl_PointSize = a_PtSize;\n' +
//  '		 } \n' +
//  '		else {gl_PointSize = 1.0;}\n' +
  '  gl_Position = u_ModelMat1 * a_Pos1;\n' +
  '	 v_Colr1 = a_Colr1;\n' +
  ' }\n';
  
var VSHADER_2SRC =							// VERTEX SHADER for VBO2: (Points)
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform mat4 u_ModelMatrix;\n' +
//	'uniform  int u_VBOnum;\n' + 
  'attribute vec4 a_Position;\n' +
  'attribute vec3 a_Color;\n'+
  'attribute float a_PtSize; \n' +
  'varying vec3 v_Colr2;\n' +
  //
  'void main() {\n' +
//  '  if(u_VBOnum==2) {\n' +
  '    gl_PointSize = a_PtSize;\n' +
//  '		 } \n' +
//  '		else {gl_PointSize = 1.0;}\n' +
  '  gl_Position = u_ModelMatrix * a_Position;\n' +
  '	 v_Colr2 = a_Color*0.6 + vec3(0.4, 0.0, 0.0);\n' + // ALL 40% red color!
  ' }\n';

//==============================================================================
// Fragment shader (a SIMD program in GLSL):
// --Each instance computes all the on-screen attributes for just one PIXEL.
// -- built-in variables? http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

var FSHADER_1SRC =									// FRAGMENT SHADER for VBO1
  'precision mediump float;\n' +
  'varying vec3 v_Colr1;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr1,1.0);\n' + // vec4(1.0, 0.0, 0.0, 1.0);\n' +
  '}\n';

var FSHADER_2SRC =									// FRAGMENT SHADER for VBO2: bluish tinged
  'precision mediump float;\n' +
  'varying vec3 v_Colr2;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Colr2[0], v_Colr2[1], 1.0, 1.0);\n' +  
  																	// 2nd shader: PURPLE shades ONLY!
  '}\n';


// Global Variables  (BAD IDEA! later, put them inside well-organized objects!)
// =============================
// for WebGL usage:
var gl;													// WebGL rendering context -- the 'webGL' object
																// in JavaScript with all its member fcns & data
var g_canvasID;									// HTML-5 'canvas' element ID#

// For the first VBO:-----------------
var vbo1Array = new Float32Array ([		// Array of vertex attributes we will
  														// transfer to GPU's 1st vertex buffer object (VBO)
  	 0.0,	 0.5,	0.0, 1.0,		1.0, 0.0, 0.0,// 1 vertex: pos x,y,z,w; color: r,g,b 
    -0.5, -0.5, 0.0, 1.0,		0.0, 1.0, 0.0,
     0.5, -0.5, 0.0, 1.0,		0.0, 0.0, 1.0,
 //2nd triangle
		 0.0,  0.0, 0.0, 1.0,   1.0, 1.0, 1.0,		// (white)
		 0.3,  0.0, 0.0, 1.0,   0.0, 0.0, 1.0,		// (blue)
		 0.0,  0.3, 0.0, 1.0,   0.5, 0.5, 0.5,		// (gray)

  ]);
var FSIZE1 = vbo1Array.BYTES_PER_ELEMENT;// bytes req'd by just 1 array element;
																	// (why? helps us compute stride and offset 
																	// for getting attribute values from VBOs) 
var g_BufVerts1 = 6;							// # of vertices in our first VBO in the GPU.
var g_BufID1;											// 1st Vertex Buffer Object ID#, created by GPU
var g_ShaderID1;									// Shader-program ID# created in main() by GPU
//																// for V,F shaders that will draw VBO1 contents

// For the second VBO:-----------------
  var vbo2Array = new Float32Array ([		// Array of vertex attributes we will
  														// transfer to GPU's 1st vertex buffer object (VBO)
// 1 vertex: pos x,y,z,w;   color; r,g,b;   point-size; 
  	-0.3,  0.7,	0.0, 1.0,		0.0, 1.0, 1.0,   7.0,
    -0.3, -0.3, 0.0, 1.0,		1.0, 0.0, 1.0,  10.0,
     0.3, -0.3, 0.0, 1.0,		1.0, 1.0, 0.0,  13.0,
  ]);
var FSIZE2 = vbo2Array.BYTES_PER_ELEMENT;// bytes req'd by just 1 array element;
																	// (why? helps us compute stride and offset 
																	// for getting attribute values from VBOs)
var g_BufVerts2 = 3;							// # of vertices in our second VBO in the GPU.
var g_BufID2;											// ID# for 2nd VBO.
var g_ShaderID2;									// Shader-program ID# created in main() by GPU
//																// for V,F shaders that will draw VBO2 contents
//----attribute locations in GPU:
var a_Pos1Loc;								// GPU location for 'a_Pos1' attrib in Shader 1
var a_PositionLoc2;						//   				... in Shader 2 (e.g. g_ShaderID2)
var a_Colr1Loc;							// GPU location for 'a_Colr1' attrib in shader 1
var a_ColorLoc2;							//   			... in Shader 2)
//var a_PtSizeLoc1;							// GPU location for 'a_PtSize' attrib in shader 1
var a_PtSizeLoc2;							//	 						... in Shader 2)

//-----uniforms	in GPU:
var g_ModelMatrix = new Matrix4();// Transforms CVV drawing axes to 'model' axes.
var u_ModelMat1Loc;						// GPU location for u_ModelMat1 uniform, Shader 1
var u_ModelMatrixLoc2;				//  						... in Shader 2
//var u_VBOnumLoc1;							// GPU storage location for u_VBOnum uniform.
//var u_VBOnumLoc2;							//							... in Shader 2

// For animation:---------------------
var g_last = Date.now();				// Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.
var g_angleStep = 45.0;					// Rotation angle rate, in degrees/second.
var g_currentAngle = 0.0; 				// Current rotation angle
// For mouse/keyboard:------------------------
var g_show1 = 1;								// 0==Show, 1==Hide VBO1 contents on-screen.
var g_show2 = 1;								// 	"					"			VBO2		"				"				" 

function main() {
//=============================================================================
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

  // Initialized MULTIPLE shaders on GPU:  
  // First, upload vertex shader and fragment shader source code to GPU, compile
  // and link it, and return the ID# needed to run these shader programs. (uses
  // 'createProgram()' fcn in cuon-utils.js library supplied w/ our textbook).
  g_ShaderID1 = createProgram(gl, VSHADER_1SRC, FSHADER_1SRC);	// for VBO1,
  g_ShaderID2 = createProgram(gl, VSHADER_2SRC, FSHADER_2SRC);	// for VBO2.
  
  if (!g_ShaderID1 || !g_ShaderID2) {
    console.log('Failed to intialize multiple GLSL shaders. Bye!');
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
//=============================================================================
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
//=============================================================================

// Create a buffer object in the graphics hardware: save its ID# in global var: 
 g_vboID1 = gl.createBuffer();	
 
  if (!g_vboID1) {
    console.log('initVBO1() failed to create 1st vertex buffer object (VBO) in the GPU');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of this selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds actual attributes we 
  //			need to access for rendering (positions, colors, normals, etc), or 
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
 										  vbo1Array, 				// data source: JavaScript Float32Array
  							 gl.STATIC_DRAW);				// Usage hint.

// Get GPU storage location for each uniform var used in the shader program 
// found at g_ShaderID1: 
// Version 9b):  MOVE THIS to initVBO1() and initVBO2()
 u_ModelMat1Loc = gl.getUniformLocation(g_ShaderID1, 'u_ModelMat1');
  if (!u_ModelMat1Loc) { 
    console.log('Failed to get GPU storage location1 of u_ModelMat1 uniform');
    return;
  }
 /*  u_VBOnumLoc1 = gl.getUniformLocation(g_ShaderID1, 'u_VBOnum');
  if (!u_VBOnumLoc1) {
		console.log('Failed to get GPU storage location1 of u_VBOnum uniform');
		return;
  }
*/
	// -----------Tie shader's 'a_Pos1' attribute to bound buffer:-------------
  // a) Get the GPU location for the a_Pos1 var in the graphics hardware:
  a_Pos1Loc = gl.getAttribLocation(g_ShaderID1, 'a_Pos1');
  if(a_Pos1Loc < 0) {
    console.log('initVBO1() Failed to get GPU storage location of a_Pos1');
    return -1;
  }
  // b) Next, set GPU to fill 'a_Pos1' attribute variable for vertex with 
  // values stored in the buffer object chosen by 'gl.bindBuffer()' command.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		a_Pos1Loc,		//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		7*FSIZE1,			// stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute valuessequentially from the
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		0);						// Offset -- how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  // c) Enable this assignment of the a_Pos1 attribute to the bound buffer:
  gl.enableVertexAttribArray(a_Pos1Loc);
  //------------------------
  // Next attribute: a) get the GPU location...
 	a_Colr1Loc = gl.getAttribLocation(g_ShaderID1, 'a_Colr1');
  if(a_Colr1Loc < 0) {
    console.log('initVBO1() failed to get the GPU storage location of a_Colr1');
    return -1;
  }
  // b) tell GPU shader 1 how to retrieve attrib from the currently bound buffer:
  gl.vertexAttribPointer(a_Colr1Loc, 3, gl.FLOAT, false, 7*FSIZE1, 4*FSIZE1);
  // c) Enable this assignment of a_Colr1 attribute to the bound buffer:
  gl.enableVertexAttribArray(a_Colr1Loc);
/*
  //--------------------------------------------
  // Next attribute: a) get the GPU location...
  // !NEW! 'a_PtSize' attribute values are stored only in VBO2, not VBO1:
  a_PtSizeLoc1 = gl.getAttribLocation(g_ShaderID1, 'a_PtSize');
  if(!a_PtSizeLoc1) {
		console.log('initVBO1() failed to get GPU location of a_PtSize attribute');
  }
  // b) tell GPU how to retrieve attrib from currently bound buffer (VBO1):
  gl.vertexAttribPointer(a_PtSizeLoc1, 1, gl.FLOAT, false, 
							7*FSIZE2,		// stride for VBO 1 used by all other attribs
							0);				// get first float to use as our fictitious 'PtSize' 
*/
  return g_BufVerts1;
}

function initVBO2() {
//=============================================================================
 g_vboID2 = gl.createBuffer();	
 
  if (!g_vboID2) {
    console.log('initVBO2() failed to create 2nd vertex buffer object (VBO) in the GPU');
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
 										 vbo2Array, 				// data source: JavaScript Float32Array
  							gl.STATIC_DRAW);				// Usage hint.

// Get GPU storage location for each uniform var used in the shader program 
// found at g_ShaderID2: 
// Version 9b):  MOVE THIS to initVBO1() and initVBO2()
 u_ModelMatrixLoc2 = gl.getUniformLocation(g_ShaderID2, 'u_ModelMatrix');
  if (!u_ModelMatrixLoc2) { 
    console.log('Failed to get GPU storage location2 of u_ModelMatrix uniform');
    return;
  }
/*  u_VBOnumLoc2 = gl.getUniformLocation(g_ShaderID2, 'u_VBOnum');
  if (!u_VBOnumLoc2) {
		console.log('Failed to get GPU storage location2 of u_VBOnum uniform');
		return;
  }
*/
	// -----------Tie shader's 'a_Position' attribute to bound buffer:-----------
  // a) Get the GPU location for the a_Position var in the graphics hardware:
  a_PositionLoc2 = gl.getAttribLocation(g_ShaderID2, 'a_Position');
  if(a_PositionLoc2 < 0) {
    console.log('initVBO2() failed to get the GPU location2 of a_Position');
    return -1;
  }
  // b) Next, set GPU to fill 'a_Position' attribute variable for vertex with 
  // values stored in the buffer object chosen by 'gl.bindBuffer()' command.
	// (Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		a_PositionLoc2,//index == ID# for the attribute var in your GLSL shaders;
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		8*FSIZE2,			// stride == #bytes we must skip in the VBO to move from one 
									// of our stored attributes to the next.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute valuessequentially from the
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color //  +1 for point-size)
		0);						// Offset -- how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  // c) Enable this assignment of the a_Position attribute to the bound buffer:
  gl.enableVertexAttribArray(a_PositionLoc2);
  //------------------------
  // Next attribute: a) get the GPU location...
 	a_ColorLoc2 = gl.getAttribLocation(g_ShaderID2, 'a_Color');
  if(a_ColorLoc2 < 0) {
    console.log('initVBO2() failed to get the GPU storage location2 of a_Color');
    return -1;
  }
  // b) tell GPU how to retrieve attrib from the currently bound buffer:
  gl.vertexAttribPointer(a_ColorLoc2, 3, gl.FLOAT, false, 7*FSIZE2, 4*FSIZE2);
  // c) Enable this assignment of a_Color attribute to the bound buffer:
  gl.enableVertexAttribArray(a_ColorLoc2);
  //--------------------------------------------
  // Next attribute: a) get the GPU location...
  // !NEW! 'a_PtSize' attribute values are stored only in VBO2, not VBO1:
  a_PtSizeLoc2 = gl.getAttribLocation(g_ShaderID2, 'a_PtSize');
  if(!a_PtSizeLoc2) {
		console.log('initVBO2() failed to get GPU location2 of a_PtSize attribute');
  }
  // b) tell GPU how to retrieve attrib from currently bound buffer (VBO2):
  gl.vertexAttribPointer(a_PtSizeLoc2, 1, gl.FLOAT, false, 
							8*FSIZE2,		// stride for VBO2 (different from VBO1!) 
							7*FSIZE2);		// offset: skip the 1st 7 floats.
//--------------------------
  return g_BufVerts2;
}

function draw() {
//=============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT);

	if(g_show1 == 1) {	// IF user didn't press HTML button to 'hide' VBO1:
	  // DRAW FIRST VBO:--------------------------
	  gl.useProgram(g_ShaderID1);					// In the GPU, SELECT one of the vertex 
	  																		// and shader pgms created, compiled, 
	  																		// and linked in main().
//		gl.uniform1i(u_VBOnumLoc1, 1);										// set uniform value to 1
	  g_ModelMatrix.setRotate(g_currentAngle, 0, 0, 1);	// rotate drawing axes,
	  g_ModelMatrix.translate(0.35, 0, 0);						// then translate them.
	  //  Transfer 'g_ModelMatrix' values to the GPU's 'u_ModelMat1' uniform: 
	  gl.uniformMatrix4fv(u_ModelMat1Loc, 			// GPU location of the uniform
	  										false, 									// use matrix transpose instead?
	  										g_ModelMatrix.elements);// Javascript data to send to GPU
		// CHANGE BUFFER BINDING TO VBO1------------ (SURPRISE! Not enough!)
		gl.bindBuffer(gl.ARRAY_BUFFER,			// GLenum 'target' for this GPU buffer 
  											g_vboID1);			// the ID# the GPU uses for this buffer.
  	// **** SURPRISE!  changing the buffer binding DOESN'T change the data 
  	// source for the 'attributes' in our shaders! to do that, we must again call
  	// gl.vertex AttribPointer() to tie shader's 'a_Pos1' attribute to the 
  	// currently-bound buffer:
		// (Here's how to use the almost-identical OpenGL version of this function:
		//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
	  // ----------Tie shader's 'a_Pos1' attribute to bound buffer:------------
	  gl.vertexAttribPointer( a_Pos1Loc, 4, gl.FLOAT,false, 7*FSIZE1, 0);
	  // enable the newly-re-assigned a_Pos1 attribute:
	  gl.enableVertexAttribArray(a_Pos1Loc);
	  // ----------Tie shader's 'a_Colr1' attribute to bound buffer:--------------
	  gl.vertexAttribPointer(a_Colr1Loc, 3, gl.FLOAT, false, 7*FSIZE1, 4*FSIZE1);
	  // then enable this assignment of a_Colr1 attribute to the bound buffer:
	  gl.enableVertexAttribArray(a_Colr1Loc);

/*
	  //-----------Tie shader's 'a_PtSize' attribute to bound buffer:-------------
	  gl.vertexAttribPointer(a_PtSizeLoc1, 1, gl.FLOAT, false, 7*FSIZE2, 0);
	  // (VBO1 doesn't hold any a_PtSize values, so we just use the 1st float
	  // found in each vertex.  Shader will access this value, but not use it).
	  // Enable this assignment of a_PtSize attribute to the bound buffer:
	  gl.enableVertexAttribArray(a_PtSizeLoc1);
*/
	  // Draw the contents of the currently-bound VBO:
	  gl.drawArrays(gl.TRIANGLES, 				// select the drawing primitive to draw,
	  							0, 										// location of 1st vertex to draw;
	  							g_BufVerts1);					// number of vertices to draw on-screen.
  }
  if(g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
	  // DRAW SECOND VBO:--------------------------- 	
	  gl.useProgram(g_ShaderID2);					// In the GPU, SELECT one of the vertex 
	  																		// and shader pgms created, compiled, 
	  																		// and linked in main().
//		gl.uniform1i(u_VBOnumLoc2, 2);										// set uniform value to 2
	  g_ModelMatrix.setRotate(-g_currentAngle, 0, 0, 1);	// -spin drawing axes,
	  g_ModelMatrix.translate(0.55, 0, 0);				// then translate them further:
	  //  Transfer 'g_ModelMatrix' values to the GPU's 'u_ModelMatrix' uniform: 
	  gl.uniformMatrix4fv(u_ModelMatrixLoc2, 			// GPU location of the uniform
	  										false, 									// use matrix transpose instead?
	  										g_ModelMatrix.elements);// Javascript data to send to GPU
		// CHANGE BUFFER BINDING TO VBO2------------ (SURPRISE! change attribs too!)
		gl.bindBuffer(gl.ARRAY_BUFFER,		// GLenum 'target' for this GPU buffer 
	  											g_vboID2);		// the ID# the GPU uses for this buffer.
	  // ----------Tie shader's 'a_Position' attribute to bound buffer:------------
	  gl.vertexAttribPointer( a_PositionLoc2, 4,	gl.FLOAT,	false, 8*FSIZE2, 0);
	  // Enable this assignment of the a_Position attribute to the bound buffer:
	  gl.enableVertexAttribArray(a_PositionLoc2);
	  // ----------Tie shader's 'a_Color' attribute to bound buffer:--------------
	  gl.vertexAttribPointer(a_ColorLoc2, 3, gl.FLOAT, false, 8*FSIZE2, 4*FSIZE2);
	  // Enable this assignment of a_Color attribute to the bound buffer:
	  gl.enableVertexAttribArray(a_ColorLoc2);
	  //-----------Tie shader's 'a_PtSize' attribute to bound buffer:-------------
	  gl.vertexAttribPointer(a_PtSizeLoc2, 1, gl.FLOAT, false, 8*FSIZE2, 7*FSIZE2);
	  // Enable this assignment of a_PtSize attribute to the bound buffer:
	  gl.enableVertexAttribArray(a_PtSizeLoc2);
		// ****** END SURPRISE.
	  gl.drawArrays(gl.POINTS, 0, g_BufVerts2);	// draw 2nd VBO contents:
	  }
}

function VBO1toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show1 != 1) g_show1 = 1;				// show,
  else g_show1 = 0;										// hide.
  console.log('g_show1: '+g_show1);
}

function VBO2toggle() {
//=============================================================================
// Called when user presses HTML-5 button 'Show/Hide VBO1'.
  if(g_show2 != 1) g_show2 = 1;			// show,
  else g_show2 = 0;									// hide.
  console.log('g_show2: '+g_show2);
}
