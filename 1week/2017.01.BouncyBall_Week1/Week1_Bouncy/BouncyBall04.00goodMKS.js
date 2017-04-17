//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// BouncyBall.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin
//  BouncyBall01:---------------
//		--converted to 2D->4D; 
//		--3  verts changed to 'vCount' particles in one Vertex Buffer Object 
//			(VBO) in initVertexBuffers() function
//		--Fragment shader draw POINTS primitives as round and 'soft'
//			by using the built-in variable 'gl_PointCoord' that exists ONLY for
//			drawing WebGL's 'gl.POINTS' primitives, and no others.
//
// BouncyBall02:----------------
//		--modified animation: removed rotation, added better animation comments, 
//				replaced 'currentAngle' with 'timeStep'.
//		--added keyboard & mouse controls:from EECS 351-1 Winter 2014 starter-code //				'5.04jt.ControlMulti.html'  (copied code almost verbatim)
//				(for now, 1,2,3 keys just controls the color of our 3 particles) 
//		--Added 'u_runMode' uniform to control particle-system animation.
//
//	BouncyBall03:---------------
//		--Eliminated 'obsolete' junk commented out in BouncyBall02
//		--initVertexBuffer() reduced to just one round particle; 
//		--added 'uniform' vec4 'u_ballOffset' for that particle's position
//		--in draw(), computed that offset as described in class in Week 1.
//		--implement user controls: 
//				--r or R key to 'restart' the bouncy ball;
//				--p or P key to pause/unpause the bouncy ball;
//				--SPACE BAR to single-step the bouncy ball.
//
//		04.goodMKS:-------------------
//		--Convert bouncyBall03.js to MKS units (meters-kilograms-seconds): 
//			On-screen position within the CVV (+/-1) now measured in meters; 
//			particle mass now measured in Kg; timestep measured in seconds;
//		--add on-screen displayMe() to show current parameters, incl. ball velocity
//		--add 'c' or 'C' key to toggle WebGL screen-clearing in draw() fcn. 
//				(NOTE: modifies creation of drawing-context 'gl' in main() too!)
//		--add 'D/d' key to adjust drag up or down;
//		--add 'G/g' key to adjust gravity up or down.
//		NOTE THAT yVel NEVER reaches zero, even when ball is 'at rest';
//			See Chapter 7 of book: resolving collisions, & resting contacts.
//		
//		NEXT TASKS:
//		--Add 3D perspective camera; add user-controls to position & aim camera
//		--Add ground-plane (xy==ground; +z==up)
//		--extend particle system to 'bounce around' in a 3D box in world coords
//		--THE BIG TASK for Week 2: 'state-variable' formulation!
//			explore, experiment: how can we construct a 'state variable' that we
//			store and calculate and update on the graphics hardware?  How can we 
//			avoid transferring state vars from JavaScript to the graphics system
//			on each and every timestep?
//			-True, vertex shaders CAN'T modify attributes or uniforms (input only),
//			-But we CAN make a global array of floats, of structs ...
//				how could you use them?
//				can you use Vertex Buffer objects to initialize those arrays, then
//				use those arrays as your state variables?
//				HINT: create an attribute that holds an integer 'particle number';
//				use that as your array index for that particle... 
//
//==============================================================================
// Vertex shader program:
var VSHADER_SOURCE =
  'precision mediump float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform   int u_runMode; \n' +					// particle system state: 
  																				// 0=reset; 1= pause; 2=step; 3=run
  'uniform	 vec4 u_ballShift; \n' +			// single bouncy-ball's movement
  'attribute vec4 a_Position;\n' +
  'varying   vec4 v_Color; \n' +
  'void main() {\n' +
  '  gl_PointSize = 10.0;\n' +
  '	 gl_Position = a_Position + u_ballShift; \n' +	
	// Let u_runMode determine particle color:
  '  if(u_runMode == 0) { \n' +
	'	   v_Color = vec4(1.0, 0.0, 0.0, 1.0);	\n' +		// red: 0==reset
	'  	 } \n' +
	'  else if(u_runMode == 1) {  \n' +
	'    v_Color = vec4(1.0, 1.0, 0.0, 1.0); \n' +	// yellow: 1==pause
	'    }  \n' +
	'  else if(u_runMode == 2) { \n' +    
	'    v_Color = vec4(1.0, 1.0, 1.0, 1.0); \n' +	// white: 2==step
  '    } \n' +
	'  else { \n' +
	'    v_Color = vec4(0.2, 1.0, 0.2, 1.0); \n' +	// green: >3==run
	'		 } \n' +
  '} \n';
// Each instance computes all the on-screen attributes for just one VERTEX,
// supplied by 'attribute vec4' variable a_Position, filled from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function. 

//==============================================================================// Fragment shader program:
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Color; \n' +
  'void main() {\n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '  if(dist < 0.5) { \n' +	
	'  	gl_FragColor = vec4((1.0-2.0*dist)*v_Color.rgb, 1.0);\n' +
	'  } else { discard; }\n' +
  '}\n';
// --Each instance computes all the on-screen attributes for just one PIXEL.
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
// -- All built-in variables: http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

// Global Variables
// =========================
var timeStep = 1000.0/60.0;			// current timestep (1/60th sec) in milliseconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.

// Define all the adjustable ball-movement parameters, and
var INIT_VEL =  0.15 * 60.0;					// initial velocity in meters/sec.
												// adjust by ++Start, --Start buttons. Original value 
												// was 0.15 meters per timestep; multiply by 60 to get
												// meters per second.
												// timesteps per second.
var g_drag = 0.985;			// air-drag (scales velocity); adjust by d/D keys
var g_grav = 9.832;			// gravity's acceleration; adjust by g/G keys
												// on Earth surface: 9.832 meters/sec^2.
												
// Define just one 'bouncy ball' particle
var xposNow = 0.0;			var yposNow = 0.0;		var zposNow =  0.0;		
var xvelNow = INIT_VEL;	var yvelNow = INIT_VEL;		var zvelNow =  0.0;

// For keyboard, mouse-click-and-drag:		
var myRunMode = 3;	// particle system state: 0=reset; 1= pause; 2=step; 3=run

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

var isClear = 1;		// 0 or 1 to enable or disable screen-clearing in the
//									// draw() function. 'C' or 'c' key toggles in myKeyPress().

function main() {
//==============================================================================
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
	// You can do it this way:
	//	(textbooks' method found in cuon-utils.js; sets up debugging by default)
	//
	//	  var gl = getWebGLContext(canvas);		
	//
	// Or this way (bypasses debugging help; may be a little faster)
	//
	//		gl = canvas.getContext("webgl");
	//
	// Or this way:
	//
	var gl = canvas.getContext("webgl", { preserveDrawingBuffer: true});
	//
	// NOTE: this disables HTML-5's default screen-clearing, so that our draw() 
	// function will over-write previous on-screen results until we call the 
	// gl.clear(COLOR_BUFFER_BIT); function. )
	
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  
	// Register the Mouse & Keyboard Event-handlers-------------------------------
	// If users move, click or drag the mouse, or they press any keys on the 
	// the operating system will sense them immediately as 'events'.  
	// If you would like your program to respond to any of these events, you must // tell JavaScript exactly how to do it: you must write your own 'event 
	// handler' functions, and then 'register' them; tell JavaScript WHICH 
	// events should cause it to call WHICH of your event-handler functions.
	//
	// First, register all mouse events found within our HTML-5 canvas:
	// when user's mouse button goes down call mouseDown() function,etc
  canvas.onmousedown	=	function(ev){myMouseDown( ev, gl, canvas) }; 
  canvas.onmousemove = 	function(ev){myMouseMove( ev, gl, canvas) };				
  canvas.onmouseup = 		function(ev){myMouseUp(   ev, gl, canvas)};
  					// NOTE! 'onclick' event is SAME as on 'mouseup' event
  					// in Chrome Brower on MS Windows 7, and possibly other 
  					// operating systems; use 'mouseup' instead.

  // Next, register all keyboard events found within our HTML webpage window:
	window.addEventListener("keydown", myKeyDown, false);
	window.addEventListener("keyup", myKeyUp, false);
	window.addEventListener("keypress", myKeyPress, false);
  // The 'keyDown' and 'keyUp' events respond to ALL keys on the keyboard,
  // 			including shift,alt,ctrl,arrow, pgUp, pgDn,f1,f2...f12 etc. 
  //			I find these most useful for arrow keys; insert/delete; home/end, etc.
  // The 'keyPress' events respond only to alpha-numeric keys, and sense any 
  //  		modifiers such as shift, alt, or ctrl.  I find these most useful for
  //			single-number and single-letter inputs that include SHIFT,CTRL,ALT.
	// END Mouse & Keyboard Event-Handlers-----------------------------------
	
  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices into an array, transfer array contents to a 
  // Vertex Buffer Object created in the graphics hardware.
  var myVerts = initVertexBuffers(gl);
  if (myVerts < 0) {
    console.log('Failed to set the positions of the vertices');
    return;
  }
  gl.clearColor(0, 0, 0, 1);	  // RGBA color for clearing <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);		// clear it once to set that color as bkgnd.
  
  // Get graphics system storage location of uniforms our shaders use:
  // (why? see  http://www.opengl.org/wiki/Uniform_(GLSL) )
  u_runModeID = gl.getUniformLocation(gl.program, 'u_runMode');
  if(!u_runModeID) {
  	console.log('Failed to get u_runMode variable location');
  	return;
  }
	gl.uniform1i(u_runModeID, myRunMode);		// keyboard callbacks set 'myRunMode'

	u_ballShiftID = gl.getUniformLocation(gl.program, 'u_ballShift');
	if(!u_ballShiftID) {
		console.log('Failed to get u_ballPos variable location');
		return;
	}
	gl.uniform4f(u_ballShiftID, xposNow, yposNow, 0.0, 0.0);	// send to gfx system
	
	// Display (initial) particle system values on webpage
	displayMe();
	
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simple-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, and computing loads and respond to //			on-screen window placement (skip battery-draining animation in any 
  //			window hidden behind others, or scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  var tick = function() {
    timeStep = animate(timeStep);  // get time passed since last screen redraw.
//    draw(gl, myVerts, currentAngle, modelMatrix, u_ModelMatrix);  
  	draw(gl, myVerts, timeStep);	// compute new particle state at current time
    requestAnimationFrame(tick, canvas);  // Call us again 'at next opportunity',
    																			// within the 'canvas' HTML-5 element.
  };
  tick();
}

function animate(timeStep) {
//==============================================================================  
// How much time passed since we last updated the 'canvas' screen elements?
  var now = Date.now();	
  var elapsed = now - g_last;	
  g_last = now;
  // Return the amount of time passed.
  return elapsed;
}

function draw(gl, n, timeStep) {
//==============================================================================  
 
  // Clear <canvas>? (Press the 'c' or 'C' key to toggle isClear between 0 & 1).
  if(isClear == 1) gl.clear(gl.COLOR_BUFFER_BIT);
// *** SURPRISE! ***
//  What happens when you forget (or comment-out) this gl.clear() call?
// In OpenGL (but not WebGL), you'd see 'trails' of particles caused by drawing 
// without clearing any previous drawing. But not in WebGL; by default, HTML-5 
// clears the canvas to white (your browser's default webpage color).  To see 
// 'trails' in WebGL you must disable the canvas' own screen clearing.  HOW?
// -- in main() where we create our WebGL drawing context, 
// replace this (default):
// -- with this:
// -- To learn more, see: 
// https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext

																					// update particle system state?
  if(myRunMode>1) {									// 0=reset; 1= pause; 2=step; 3=run
		if(myRunMode==2) myRunMode=1;				// (if 2, do just one step and pause.)
		//=YES!=========================================
		// Make our 'bouncy-ball' move and bounce:
		// What happens when I rearrange the ordering of these steps a bit? 
		//	IT WORKS BEAUTIFULLY!
		// -- apply acceleration due to gravity to current velocity:
		// OLD WAY, before MKS units:  yvelNow -= 0.01;
		// NEW WAY: yvelNow -= (accel. due to gravity)*(timestep in seconds) 
		//                  -= (9.832 meters/sec^2) * (timeStep/1000.0);
		yvelNow -= g_grav*(timeStep*0.001);
		// -- apply drag: attenuate current velocity:
		xvelNow *= g_drag;
		yvelNow *= g_drag;
		// -- move our particle using current velocity:
		// CAREFUL! must convert timeStep from milliseconds to seconds!
		xposNow += xvelNow * (timeStep * 0.001);
		yposNow += yvelNow * (timeStep * 0.001); 
		
			// This looks OK, BUT*** 
				// do you see what's wrong with it? we applied acceleration
				// to current velocity ==>yields 'next' velocity (!).  Then
				// we applied 'drag' to this 'next' velocity.  Then we applied
				// 'next' velocity to 'current' position to find 'next' position.
				//  But that's not what physics says we should do!
				//	Recall that for timestep 'h',
				//		nextVel = currentVel + h*acc
				//		nextPos = currentPos + h*(currentVel + 0.5*h*acc)
				// What happens if we do that instead?
				// Uh Oh.  The ball never stops bouncing! WHY?!?!
				//	SEE bouncyBall03.01BAD....
		// -- 'bounce' our ball off the walls at (0,0), (1.8, 1.8):
		if(      xposNow < 0.0 && xvelNow < 0.0
		) {		// bounce on left wall.
			xvelNow = -xvelNow;
		}
		else if (xposNow > 1.8 && xvelNow > 0.0
		) {		// bounce on right wall
			xvelNow = -xvelNow;
		}
		if(      yposNow < 0.0 && yvelNow < 0.0
		) {		// bounce on floor
			yvelNow = -yvelNow;
		}
		else if( yposNow > 1.8 && yvelNow > 0.0
		) {		// bounce on ceiling
			yvelNow = -yvelNow;
		}
		//  -- hard limit on 'floor' keeps y position >= 0;
		if(yposNow < 0.0) yposNow = 0.0;
		displayMe();				// print status on-screen.
		//============================================
	}

	
	gl.uniform1i(u_runModeID, myRunMode);		// run/step/pause the particle system
	gl.uniform4f(u_ballShiftID, xposNow, yposNow, 0.0, 0.0);	// send to gfx system
    
  // Draw our VBO's contents:
  gl.drawArrays(gl.POINTS, 0, n);
  
  // Report mouse-drag totals.
	document.getElementById('MouseResult0').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	
}

function initVertexBuffers(gl) {
//==============================================================================
// Set up all buffer objects on our graphics hardware.
  var vertices = new Float32Array ([			// JUST ONE particle:
 //    0.0,  0.5, 0.0, 1.0,   				// x,y,z,w position
      -0.9, -0.9, 0.0, 1.0,   
 //    0.5, -0.5, 0.0, 1.0,
  ]);
  var vcount = 1;   // The number of vertices

  // Create a buffer object in the graphics hardware: get its ID# 
  var vertexBufferID = gl.createBuffer();
  if (!vertexBufferID) {
    console.log('Failed to create the buffer object');
    return -1;
  }
  // "Bind the new buffer object (memory in the graphics system) to target"
  // In other words, specify the usage of one selected buffer object.
  // What's a "Target"? it's the poorly-chosen OpenGL/WebGL name for the 
  // intended use of this buffer's memory; so far, we have just two choices:
  //	== "gl.ARRAY_BUFFER" meaning the buffer object holds actual values we need 
  //			for rendering (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" meaning the buffer object holds indices 
  // 			into a list of values we need; indices such as object #s, face #s, 
  //			edge vertex #s.
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferID);

 // Write data from our JavaScript array to graphics systems' buffer object:
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // Get the ID# for the a_Position variable in the graphics hardware
  var a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
  gl.vertexAttribPointer(a_PositionID, 4, gl.FLOAT, false, 0, 0);
  // Tell GLSL to fill the 'a_Position' attribute variable for each shader 
  // with values from the buffer object chosen by 'gl.bindBuffer()' command.
	// websearch yields OpenGL version: 
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
				//	glVertexAttributePointer (
				//			index == name of attribute variable used in the shader pgm.
				//			size == how many dimensions for this attribute: 1,2,3 or 4?
				//			type == what data type did we use for those numbers?
				//			isNormalized == are these fixed-point values that we need
				//						normalize before use? true or false
				//			stride == #bytes (of other, interleaved data) between OUR values?
				//			pointer == offset; how many (interleaved) values to skip to reach
				//					our first value?
				//				)
  // Enable this assignment of the bound buffer to the a_Position variable:
  gl.enableVertexAttribArray(a_PositionID);
  return vcount;
}

//===================Mouse and Keyboard event-handling Callbacks================
//==============================================================================
function myMouseDown(ev, gl, canvas) {
//==============================================================================
// Called when user PRESSES down any mouse button;
// 									(Which button?    console.log('ev.button='+ev.button);   )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
  var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseDown(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseDown(CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = true;											// set our mouse-dragging flag
	xMclik = x;													// record where mouse-dragging began
	yMclik = y;
		document.getElementById('MouseResult1').innerHTML = 
	'myMouseDown() at CVV coords x,y = '+x+', '+y+'<br>';
};


function myMouseMove(ev,gl,canvas) {
//==============================================================================
// Called when user MOVES the mouse with a button already pressed down.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

	if(isDrag==false) return;				// IGNORE all mouse-moves except 'dragging'

	// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseMove(pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
//	console.log('myMouseMove(CVV coords  ):  x, y=\t',x,',\t',y);

	// find how far we dragged the mouse:
	xMdragTot += (x - xMclik);					// Accumulate change-in-mouse-position,&
	yMdragTot += (y - yMclik);
	xMclik = x;													// Make next drag-measurement from here.
	yMclik = y;
// (? why no 'document.getElementById() call here, as we did for myMouseDown()
// and myMouseUp()? Because the webpage doesn't get updated when we move the 
// mouse. Put the web-page updating command in the 'draw()' function instead)
};

function myMouseUp(ev,gl,canvas) {
//==============================================================================
// Called when user RELEASES mouse button pressed previously.
// 									(Which button?   console.log('ev.button='+ev.button);    )
// 		ev.clientX, ev.clientY == mouse pointer location, but measured in webpage 
//		pixels: left-handed coords; UPPER left origin; Y increases DOWNWARDS (!)  

// Create right-handed 'pixel' coords with origin at WebGL canvas LOWER left;
  var rect = ev.target.getBoundingClientRect();	// get canvas corners in pixels
  var xp = ev.clientX - rect.left;									// x==0 at canvas left edge
	var yp = canvas.height - (ev.clientY - rect.top);	// y==0 at canvas bottom edge
//  console.log('myMouseUp  (pixel coords): xp,yp=\t',xp,',\t',yp);
  
	// Convert to Canonical View Volume (CVV) coordinates too:
  var x = (xp - canvas.width/2)  / 		// move origin to center of canvas and
  						 (canvas.width/2);			// normalize canvas to -1 <= x < +1,
	var y = (yp - canvas.height/2) /		//										 -1 <= y < +1.
							 (canvas.height/2);
	console.log('myMouseUp  (CVV coords  ):  x, y=\t',x,',\t',y);
	
	isDrag = false;											// CLEAR our mouse-dragging flag, and
	// accumulate any final bit of mouse-dragging we did:
	xMdragTot += (x - xMclik);
	yMdragTot += (y - yMclik);
	console.log('myMouseUp: xMdragTot,yMdragTot =',xMdragTot,',\t',yMdragTot);
	// Put it on our webpage too...
	document.getElementById('MouseResult1').innerHTML = 
	'myMouseUp(       ) at CVV coords x,y = '+x+', '+y+'<br>';
};


function myKeyDown(ev) {
//===============================================================================
// Called when user presses down ANY key on the keyboard, and captures the 
// keyboard's scancode or keycode (varies for different countries and alphabets).
//  CAUTION: You may wish to avoid 'keydown' and 'keyup' events: if you DON'T 
// need to sense non-ASCII keys (arrow keys, function keys, pgUp, pgDn, Ins, 
// Del, etc), then just use the 'keypress' event instead.
//	 The 'keypress' event captures the combined effects of alphanumeric keys and // the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
// ASCII codes; you'll get uppercase 'S' if you hold shift and press the 's' key.
//
// For a light, easy explanation of keyboard events in JavaScript,
// see:    http://www.kirupa.com/html5/keyboard_events_in_javascript.htm
// For a thorough explanation of the messy way JavaScript handles keyboard events
// see:    http://javascript.info/tutorial/keyboard-events
//

/*
	switch(ev.keyCode) {			// keycodes !=ASCII, but are very consistent for 
	//	nearly all non-alphanumeric keys for nearly all keyboards in all countries.
		case 37:		// left-arrow key
			// print in console:
			console.log(' left-arrow.');
			// and print on webpage in the <div> element with id='Result':
  		document.getElementById('KeyResult').innerHTML =
  			' Left Arrow:keyCode='+ev.keyCode;
			break;
		case 38:		// up-arrow key
			console.log('   up-arrow.');
  		document.getElementById('KeyResult').innerHTML =
  			'   Up Arrow:keyCode='+ev.keyCode;
			break;
		case 39:		// right-arrow key
			console.log('right-arrow.');
  		document.getElementById('KeyResult').innerHTML =
  			'Right Arrow:keyCode='+ev.keyCode;
  		break;
		case 40:		// down-arrow key
			console.log(' down-arrow.');
  		document.getElementById('KeyResult').innerHTML =
  			' Down Arrow:keyCode='+ev.keyCode;
  		break;
		default:
			console.log('myKeyDown()--keycode=', ev.keyCode, ', charCode=', ev.charCode);
  		document.getElementById('KeyResult').innerHTML =
  			'myKeyDown()--keyCode='+ev.keyCode;
			break;
	}
*/
}

function myKeyUp(ev) {
//===============================================================================
// Called when user releases ANY key on the keyboard; captures scancodes well
// You probably don't want to use this ('myKeyDown()' explains why); you'll find
// myKeyPress() can handle nearly all your keyboard-interface needs.
/*
	console.log('myKeyUp()--keyCode='+ev.keyCode+' released.');
*/
}

function myKeyPress(ev) {
//===============================================================================
// Best for capturing alphanumeric keys and key-combinations such as 
// CTRL-C, alt-F, SHIFT-4, etc.  Use this instead of myKeyDown(), myKeyUp() if
// you don't need to respond separately to key-down and key-up events.

/*
	// Report EVERYTHING about this pressed key in the console:
	console.log('myKeyPress():keyCode='+ev.keyCode  +', charCode=' +ev.charCode+
												', shift='    +ev.shiftKey + ', ctrl='    +ev.ctrlKey +
												', altKey='   +ev.altKey   +
												', metaKey(Command key or Windows key)='+ev.metaKey);
*/
	myChar = String.fromCharCode(ev.keyCode);	//	convert code to character-string
	// Report EVERYTHING about this pressed key in the webpage 
	// in the <div> element with id='Result':r 
/*  document.getElementById('KeyResult').innerHTML = 
   			'char= ' 		 	+ myChar 			+ ', keyCode= '+ ev.keyCode 	+ 
   			', charCode= '+ ev.charCode + ', shift= '	 + ev.shiftKey 	+ 
   			', ctrl= '		+ ev.shiftKey + ', altKey= ' + ev.altKey 		+ 
   			', metaKey= '	+ ev.metaKey 	+ '<br>' ;
*/  			
  // update particle system state? myRunMode 0=reset; 1= pause; 2=step; 3=run
	switch(myChar) {
		case '0':	
			myRunMode = 0;			// RESET!
			break;
		case '1':
			myRunMode = 1;			// PAUSE!
			break;
		case '2':
			myRunMode = 2;			// STEP!
			break;
		case '3':							// RUN!
			myRunMode = 3;
			break;
		case 'c':					// 'c' or 'C' key:  toggle screen clearing
		case 'C':					// to demonstrate 'trails'.
			if(isClear == 0) isClear = 1;
			else isClear = 0;
			break;
		case 'd':			// REDUCE drag;  make velocity scale factor rise towards 1.0
			g_drag *= 1.0 / 0.99;
			if(g_drag > 1.0) g_drag = 1.0;	// don't allow drag to ADD energy!
			break;
		case 'D':			// INCREASE drag: make velocity scale factor a smaller fraction
			g_drag *= 0.99;				
			break;
		case 'g':			// REDUCE gravity
			g_grav *= 0.99;		// shrink 1%
			break;
		case 'G':
			g_grav *= 1.0/0.99;	// grow by 1%
			break;
		case 'm':
			g_mass *= 0.99;		// reduce mass by 1%
			break;
		case 'M':
			g_mass *= 1.0/0.99;	// increase mass by 1%
			break;
		case 'R':  // HARD reset: position AND velocity.
		  myRunMode = 0;			// RESET!
			xposNow =  0.0;				yposNow =  0.0;				zposNow =  0.0;	
			xvelNow =  INIT_VEL;	yvelNow =  INIT_VEL;	zvelNow =  0.0;
			break;
		case 'r':		// 'SOFT' reset: boost velocity only.
			// don't change myRunMode
			if(xvelNow > 0.0) xvelNow += INIT_VEL; else xvelNow -= INIT_VEL;
			if(yvelNow > 0.0) yvelNow += INIT_VEL; else yvelNow -= INIT_VEL;
			break;	
		case 'p':
		case 'P':			// toggle pause/run:
			if(myRunMode==3) myRunMode = 1;		// if running, pause
									else myRunMode = 3;		// if paused, run.
			break;
		case ' ':			// space-bar: single-step
			myRunMode = 2;
			break;
		default:
			console.log('myKeyPress(): Ignored key: '+myChar);
			break;
	}
}

function displayMe() {
//==============================================================================
// Print current state of the particle system on the webpage:
	var recip = 1000.0 / timeStep;
  document.getElementById('KeyResult').innerHTML = 
   			'<b>drag = </b>' + g_drag.toFixed(5) + 
   			', <b>grav = </b>' + g_grav.toFixed(5) +
   			' m/s^2; <b>yVel = </b>' + yvelNow.toFixed(5) + 
   			' m/s; <br><b>timeStep = </b> 1/' + recip.toFixed(5) +' sec<br>' ;
}

function onPlusButton() {
//==============================================================================
	INIT_VEL *= 1.2;		// increase
	console.log('Initial velocity: '+INIT_VEL);
}

function onMinusButton() {
//==============================================================================
	INIT_VEL /= 1.2;		// shrink
	console.log('Initial velocity: '+INIT_VEL);
}
