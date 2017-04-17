//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE:
// RotatingTranslatedTriangle.js (c) 2012 matsuda
// HIGHLY MODIFIED to make:
//
// BouncyBall.js  for EECS 351-1, 
//									Northwestern Univ. Jack Tumblin

// FIRST WEEK'S GOAL:Just one 'bouncing ball' with gravity, drag, floors, walls. 
//==============================================================================
// TABS set to 2.
//
//  BouncyBall01:---------------
//		--converted 2D -> 4D; (x,y,z,w)
//		--3  verts changed to 'vCount' particles in one Vertex Buffer Object 
//			(VBO) in initVertexBuffers() function
//		--Fragment shader draw POINTS primitives as round and 'soft'
//
// BouncyBall02:----------------
//		--modified animation: removed rotation, added better animation comments, 
//				replaced 'currentAngle' with 'timeStep'.
//		--added keyboard & mouse controls:from EECS 351-1 Winter 2014 starter-code 
//				'5.04jt.ControlMulti.html'  (copied code almost verbatim)
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
// TABS set to 2.
//==============================================================================
//	2nd WEEK'S GOAL: CONVERT PARTICLE SYSTEM TO 'STATE-VARIABLE' FORMULATION
//
// 	BouncyBall04:----------------
//		a)-create a 'state' vector s0 whose 'position' (and other) members we can 
//			send to the GPU (the graphics hardware) for fast rendering.  As the
//			'initVertexBuffer()' fcn shows, we need a Float32Array for s0. 
//			Start simply: make s0 a global variable, at the top of our file, with
//			explicit values: e.g. var s0 = new Float32Array([0,0,0,0,-0.1,0,0,0,1]);
//
// 	BouncyBall05:----------------
//		b) One-by-one, use s0 array members to duplicate (and later: replace) all 
//			the old scattered particle-affecting vars throughout our program: 
//			xposNow, yposNow, zposNow, ==> s0[0], s0[1], s0[2] 
//			xvelNow, yvelNow, zvelNow, INIT_VEL ==> s0[3], s0[4], s0[5], ...
//		 **YUCK!** these individual indices s0[3], s0[1], etc. invite hard-to-find 
//		mistakes!, Instead, make easy-to-read names with JavaScript 'const' global
//		vars to hold these array indices. I borrowed this list from the C/C++ 
//		'header' files I posted on Canvas, but you can modify it in any way 
//		you wish to assign members to particles. Note that I put unused items near 
//		the end of the list, 'comment out' what I wish to disable, and always use 
//    the last one (PART_MAXVAR) to help me compute array sizes, etc.
// 
const PART_XPOS     = 0;  //  position    
const PART_YPOS     = 1;
const PART_ZPOS     = 2;
const PART_XVEL     = 3; //  velocity    
const PART_YVEL     = 4;
const PART_ZVEL     = 5;
const PART_X_FTOT   = 6;  // force accumulator:'ApplyForces()' fcn clears
const PART_Y_FTOT   = 7;  // to zero, then adds each force to each particle.
const PART_Z_FTOT   = 8;        
const PART_R        = 9;  // color : red,green,blue
const PART_G        =10;  
const PART_B        =11;
const PART_MASS     =12;  // mass   
const PART_DIAM 		=13;	// on-screen diameter (in pixels)
const PART_RENDMODE =14;	// on-screen appearance (square, round, or soft-round)
/* // Other useful particle values, currently unused
const PART_AGE      =15;  // # of frame-times since creation/initialization
const PART_CHARGE   =16;  // for electrostatic repulsion/attraction
const PART_MASS_VEL =17;  // time-rate-of-change of mass.
const PART_MASS_FTOT=18;  // force-accumulator for mass-change
const PART_R_VEL    =19;  // time-rate-of-change of color:red
const PART_G_VEL    =20;  // time-rate-of-change of color:grn
const PART_B_VEL    =21;  // time-rate-of-change of color:blu
const PART_R_FTOT   =22;  // force-accumulator for color-change: red
const PART_G_FTOT   =23;  // force-accumulator for color-change: grn
const PART_B_FTOT   =24;  // force-accumulator for color-change: blu
*/
const PART_MAXVAR   =15;  // Size of array in CPart uses to store its values.

//		c)-Make a 'PartSys_render()' function (called by 'draw()' function) that:
//			--given a state variable, copy position and size values to the VBO we
//				made in 'initVertexBuffers()'.
//			--make WebGL calls necessary to draw that VBO's contents on-screen.
//			--eliminate the uniform u_ballShift, as now our program directly
//				modifies each a_position attribute by revising the VBO's contents.
//				(as s0 stores initial particle position at 0,0,0 and the screen
//				shows the CVV contents, we need to either adjust s0 or create a
//				properly-positioned camera in our next version of the code).
//----------------------------END OF BouncyBall05 changes-----------------------

//		d) Generalize: make 'PartSys_init()' function to set up the entire 
//			particle system, including s0 and later the list of forcers and the list 
//			of constraints. Generalize; give it arguments that let you choose the
//			number of particles, and choose among several different scenarios;
//			different patterns of initial particle positions, velocities, (and 
//			later: forces, constraints, and user interactions). Call this in main() 
//			as the program starts, when users press the 'R' key too ('deep reset').  
//			Make a related function for the 'r' key that updates only the velocities 
//			for all particles in the current state.
//		e)- Absorb the contents of initVertexBuffer() into PartSys_init()', 
//			because our state vector s0 determines the GPU buffer object size.
//			Eliminate the 'vertices' array, and instead read a_position and a_size 
//			attribute values into the GPU from our newly created state-variable.
//		f)-Make an s1 state variable and a 'PartSys_swap()' function that switches 
//			the contents of the s0  and s1 state vars (BE SURE it swaps references 
//			only; NOT a 'deep copy'!!)
//		g)- Make a 'PartSys_solver()' function that computes new state vector s1
//			solely from values found in old state vector s0.  Move the particle-
//			adjusting code from draw() into 'solver()'.  In your 'draw()' function,
//			complete your first state-space particle system:
//			call PartSys_solver(), then PartSys_swap(), then PartSys_render().
//
//
//		 STUDENT TASKS: Week 1
//		--Convert to MKS units (meters-kilograms-seconds)
//		--Add 3D perspective camera; add user-controls to position & aim camera
//		--Add ground-plane (xy==ground; +z==up)
//		--extend particle system to 'bounce around' in a 3D box in world coords
//
// 		STUDENT TASKS: Week 2
//		--extend 3D MKS system with camera to state-space organization...
//==============================================================================
// Vertex shader program:
var VSHADER_SOURCE =
  'precision highp float;\n' +				// req'd in OpenGL ES if we use 'float'
  //
  'uniform   int u_runMode; \n' +	
  'uniform	 vec4 u_ballShift; \n' +			// single bouncy-ball's movement
  'attribute vec4 a_Position; \n' +				// initial vertex position
  'varying   vec4 v_Color; \n' +
  'void main() {\n' +
  '  gl_PointSize = 18.0;\n' +
  '	 gl_Position = a_Position + u_ballShift;  \n' +	
	// For now, let u_runMode determine particle color:
  '  if(u_runMode == 0) { \n' +
	'	   v_Color = vec4(1.0, 0.0, 0.0, 1.0);	\n' +		// red: 0==reset
	'  } \n' +
	'  else if(u_runMode == 1) {  \n' +
	'    v_Color = vec4(1.0, 1.0, 0.0, 1.0); \n' +	// yellow: 1==pause
	'  }  \n' +
	'  else if(u_runMode == 2) { \n' +    
	'    v_Color = vec4(1.0, 1.0, 1.0, 1.0); \n' +	// white: 2==step
  '  } \n' +
	'  else { \n' +
	'    v_Color = vec4(0.2, 1.0, 0.2, 1.0); \n' +	// green: >3==run
	'	} \n' +

  '} \n';
// Each instance computes all the on-screen attributes for just one VERTEX,
// supplied by 'attribute vec4' variable a_Position, filled from the 
// Vertex Buffer Object (VBO) we created inside the graphics hardware by calling 
// the 'initVertexBuffers()' function, and updated by 'PartSys_render() calls.

//==============================================================================
// Fragment shader program:
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
// thus our 'draw()' function can't draw a LINE_LOOP primitive until we turn off
// our round-point rendering.  
// -- All built-in variables: http://www.opengl.org/wiki/Built-in_Variable_(GLSL)

// Global Variables
// =========================
var timeStep = 1.0/30.0;				// initialize; current timestep in seconds
var g_last = Date.now();				//  Timestamp: set after each frame of animation,
																// used by 'animate()' function to find how much
																// time passed since we last updated our canvas.

// Define just one 'bouncy ball' particle
/* REPLACED by s0[PART_XPOS], s0[PART_YPOS], s0[PART_ZPOS]
var xposNow =  0.0;		var yposNow =  0.0;		var zposNow =  0.0;		
	 REPLACED by s0[PART_XVEL], s0[PART_YVEL], s0[PART_ZVEL]
var xvelNow =  0.0;		var yvelNow =  0.0;		var zvelNow =  0.0;
*/
var INIT_VEL = 0.15;		// adjusted by ++Start, --Start buttons.

// Create & initialize our first, simplest 'state variable' s0:
var s0 = new Float32Array([
//----------------------------first particle (15 float32 values)
			 0.0, 		 0.0, 0.0,		// x,y,z position 	== s0[ 0], s0[ 1], s0[ 2].
	INIT_VEL, INIT_VEL, 0.0,		// x,y,z velocity 	== s0[ 3], s0[ 4], s0[ 5].
	 		 0.0, 	 -0.01, 0.0,		// x,y,z force-total== s0[ 6], s0[ 7], s0[ 8].
	 		 1.0,			 0.2, 0.2,		// color (r,g,b)		== s0[ 9], s0[10], s0[11].
	 		 								1.0,		// mass  (acceleration = force-total/mass)== s0[12]
	 		 							 25.0,	 	// on-screen diameter (in pixels)					== s0[13]
	 		 							  2.1,		// render mode:  >0.1 fixed-color square
	 		 							  				//							 >1.1 fixed-color round
	 		 							  				//							 >2.1 soft-shaded round.
	 		 							  				// (why .1? ensures truncation gives desired int)
//----------------------------2nd particle
			 0.0, 		 0.1, 0.0,		// x,y,z position
	INIT_VEL, INIT_VEL, 0.0,		// x,y,z velocity
	 		 0.0, 	 -0.01, 0.0,		// x,y,z force-total
	 		 1.0,			 0.2, 0.2,		// color (r,g,b)
	 		 								1.0,		// mass  (acceleration = force-total/mass)
	 		 							 18.0,	 	// on-screen diameter (in pixels)
	 		 							  0.1,		// render mode:  0.1, 1.1, 2.1, 3.1, etc	== s0[14]
	 		 							  				//  (why .1? ensures truncation gives desired int)
//----------------------------2nd particle
			 0.0, 		 0.2, 0.0,		// x,y,z position
	INIT_VEL, INIT_VEL, 0.0,		// x,y,z velocity
	 		 0.0, 	 -0.01, 0.0,		// x,y,z force-total
	 		 1.0,			 0.2, 0.2,		// color (r,g,b)
	 		 								1.0,		// mass  (acceleration = force-total/mass)
	 		 							 12.0,	 	// on-screen diameter (in pixels)
	 		 							  1.1,		// render mode:  0.1, 1.1, 2.1, 3.1, etc
	 		 							  				// (why .1? ensures truncation gives desired int)
]);

var FSIZE = s0.BYTES_PER_ELEMENT	// memory needed to store an s0 array element.

// For keyboard, mouse-click-and-drag:		
var myRunMode = 0;	// particle system state: 0=reset; 1= pause; 2=step; 3=run

var isDrag=false;		// mouse-drag: true when user holds down mouse button
var xMclik=0.0;			// last mouse button-down position (in CVV coords)
var yMclik=0.0;   
var xMdragTot=0.0;	// total (accumulated) mouse-drag amounts (in CVV coords).
var yMdragTot=0.0;  

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
  					// NOTE! 'onClick' event is SAME as on 'mouseup' event
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
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>
  
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
//	gl.uniform4f(u_ballShiftID, xposNow, yposNow, 0.0, 0.0);	// send to gfx system
	gl.uniform4f(u_ballShiftID, 
			s0[PART_XPOS], s0[PART_YPOS], s0[PART_ZPOS], 0.0);	// send to gfx system
	
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simple-to-use
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
  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);
														// update particle system state?
  if(myRunMode>1) {										// 0=reset; 1= pause; 2=step; 3=run
		if(myRunMode==2) myRunMode=1;					// (if 2, do just one step and pause.)
		//=======================================================================
		// SOLVE FOR 'next' state of our particle system, 
		//=======================================================================
		// Make our 'bouncy-ball' move and bounce:
		// What happens when I rearrange the ordering of these steps? Why?
		// -- apply acceleration due to gravity to current velocity:
/* REPLACED BY state var s0[] members:
		yvelNow -= 0.01;
*/
		s0[PART_YVEL] -= 0.01;
		// -- apply drag: attenuate current velocity:
/* REPLACED BY state var s0[] members:
		xvelNow *= 0.985;
		yvelNow *= 0.985;
*/
		s0[PART_XVEL] *= 0.985;
		s0[PART_YVEL] *= 0.985;
		s0[PART_ZVEL] *= 0.985;
		
		// -- move our particle using current velocity:
/* REPLACED BY state var s0[] members:
		xposNow += xvelNow;
		yposNow += yvelNow; 
*/
		s0[PART_XPOS] += s0[PART_XVEL];
		s0[PART_YPOS] += s0[PART_YVEL]; 
		s0[PART_ZPOS] += s0[PART_ZVEL];
		
			// This looks OK, BUT*** 
				// do you see what's wrong with it? we applied acceleration
				// to current velocity ==>yields 'next' velocity (!).  Then
				// we applied 'drag' to this 'next' velocity.  Then we applied
				// 'next' velocity to 'current' position to find 'next' position.
				//  But that's not what physics says we should do!
				//	Recall that for timestep 'h',
				//		nextVel = currentVel + h*acc
				//		nextPos = currentPos + h*(currentVel + 0.5*h*acc)
				// How can we resolve this? you'd be tempted to modify the contents 
				// of the state vector, but don't do it!  The solution is better solvers, not 'spaghetti' code that abandons state-var rules.
		//===================================================================
		// APPLY CONSTRAINTS to the 'next' state of our particle system:
		//===================================================================
		// -- 'bounce' our ball off the walls at (0,0), (1.8, 1.8):
	/*
REPLACE with state-variable form (below):
	if(      xposNow < 0.0 && xvelNow < 0.0) {		// bounce on left wall.
			xvelNow = -xvelNow;
		}
		else if (xposNow > 1.8 && xvelNow > 0.0) {		// bounce on right wall
			xvelNow = -xvelNow;
		}
		if(      yposNow < 0.0 && yvelNow < 0.0) {		// bounce on floor
			yvelNow = -yvelNow;
		}
		else if( yposNow > 1.8 && yvelNow > 0.0) {		// bounce on ceiling
			yvelNow = -yvelNow;
		}
*/
		if(       s0[PART_XPOS] < 0.0 && s0[PART_XVEL]< 0.0) {	
			s0[PART_XVEL] = -s0[PART_XVEL];							// bounce on left wall.
		}
		else if (s0[PART_XPOS] > 1.8 && s0[PART_XVEL] > 0.0) {		
			s0[PART_XVEL] = -s0[PART_XVEL];							// bounce on right wall
		}
		if(      s0[PART_YPOS] < 0.0 && s0[PART_YVEL] < 0.0) {		
			s0[PART_YVEL] = -s0[PART_YVEL];							// bounce on floor
		}
		else if( s0[PART_YPOS] > 1.8 && s0[PART_YVEL] > 0.0) {		
			s0[PART_YVEL] = -s0[PART_YVEL];							// bounce on ceiling
		}
		//  -- hard limit on 'floor' keeps y position >= 0;
		if(s0[PART_YPOS] < 0.0) s0[PART_YPOS] = 0.0;
		//============================================
	}

	gl.uniform1i(u_runModeID, myRunMode);	// set run/step/pause the particle system
/* REPLACE with call to PartSys_render() to render current state s0:
	gl.uniform4f(u_ballShiftID, xposNow, yposNow, 0.0, 0.0);	// send to gfx system
  // Draw our VBO's contents:
  gl.drawArrays(gl.POINTS, 0, n);
*/
  // Draw current state on-screen:
  PartSys_render(gl,n,s0);
  
  // Report mouse-drag totals.
	document.getElementById('MouseResult0').innerHTML=
			'Mouse Drag totals (CVV coords):\t'+xMdragTot+', \t'+yMdragTot;	
}

function PartSys_render(gl, n, s) {
//===============================================================================
// draw on-screen the particle system described by state-vector 's'.

/* REPLACE with state-variable form:
	gl.uniform4f(u_ballShiftID, xposNow, yposNow, 0.0, 0.0);	// send to gfx system
*/
	gl.uniform4f(u_ballShiftID,s0[PART_XPOS],s0[PART_YPOS],s0[PART_ZPOS],0.0);
	// send to gfx system
	
  var FSIZE = s0.BYTES_PER_ELEMENT; 
	// MODIFY our VBO's contents using the current state of our particle system:
   // Tell GLSL to fill the 'a_Position' attribute variable for each shader 
  // with values from the buffer object chosen by 'gl.bindBuffer()' command.
	// websearch yields OpenGL version: 
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(
		a_PositionID,	//index == attribute var. name used in the shader pgm.
		3,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		15*FSIZE,			// stride == #bytes (of other, interleaved data) between 
									// separating OUR values?
		0*FSIZE);			// Offset -- how many bytes from START of buffer to the
  								// value we will actually use?  We start with position.

  gl.enableVertexAttribArray(a_PositionID);
  // Draw our VBO's contents:
  gl.drawArrays(gl.POINTS, 0, n);
}

function initVertexBuffers(gl) {
//==============================================================================
// Set up all buffer objects on our graphics hardware.
  var vertices = new Float32Array ([			// JUST ONE particle:
	//pos.xyzw,  forceTot.xyz, mass, pointSize. color.rgb
      -0.9, -0.9, 0.0, 1.0, 					// pos.xyzw,
      INIT_VEL, INIT_VEL, 0.0, 				// vel.xyz,
      	0.0, 0.0, 0.0,								// forceTot.xyz, 
      	1.0, 0.7, 0.3,								// color.xyz
      	1.0, 15.0, 0.9,								// mass, pointSize, vertNum+0.1
  ]);
  var vcount = 1;   // The number of vertices
/* REPPLACE with state-var form==make this a global var, declared right after you declare the 's0[0]' state vector, like this: FSIZE = s0.BYTES_PER_ELEMENT)
  var FSIZE = vertices.BYTES_PER_ELEMENT; // how many bytes per stored value?
*/
  
  // Create a buffer object in the graphics hardware: get its ID# 
//  var vertexBufferID = gl.createBuffer();		
 vertexBufferID = gl.createBuffer();				//(make it global: PartSys_render()
  																					// modifies this buffers' contents)
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

 // Our particle system will use this buffer in a new way: all previous pgms
 // have created the buffer, then never changed it--we used it to draw over and
 // over again.  From the OpenGL ES specification:
 //		--STATIC_DRAW is for vertex buffers that are rendered many times, 
 //				and whose contents are specified once and never change.
 //		--DYNAMIC_DRAW is for vertex buffers that are rendered many times, and 
 //				whose contents change during the rendering loop.
 //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
 // 			times and then discarded.
 //  Recall that gl.bufferData() allocates and fills a new hunk of graphics 
 //		memory.  We always use gl.bufferData() in the creation of a new buffer.
 //	 In comparison, gl.bufferSubData() modifies contents of an existing buffer;
 //		we will use that in our 'PartSys_render()' function.
 /* REPLACE with state-variable form:
 	gl.bufferData(gl.ARRAY_BUFFER, vcount, gl.STATIC_DRAW);
 */
  gl.bufferData(gl.ARRAY_BUFFER, 		// GLenum target,
  				 s0,					// ArrayBufferView data (or size)
  				gl.DYNAMIC_DRAW);		// Usage hint.


  // Get the ID# for the a_Position variable in the graphics hardware
  // (keep it as global var--we'll need it for PartSys_render())
  a_PositionID = gl.getAttribLocation(gl.program, 'a_Position');
  if(a_PositionID < 0) {
    console.log('Failed to get the storage location of a_Position');
    return -1;
  }
 
 /* REPLACE with state-variable form:
  // Tell GLSL to fill the 'a_Position' attribute variable for each shader 
  // with values from the buffer object chosen by 'gl.bindBuffer()' command.
	// websearch yields OpenGL version: 
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(
		a_PositionID,	//index == attribute var. name used in the shader pgm.
		4,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		15*FSIZE,			// stride == #bytes (of other, interleaved data) between 
									// separating OUR values?
		0*FSIZE);			// Offset -- how many bytes from START of buffer to the
  								// value we will actually use?  We start with position.

  // Enable this assignment of the bound buffer to the a_Position variable:
  gl.enableVertexAttribArray(a_PositionID);
  return vcount;
 */
   // Tell GLSL to fill the 'a_Position' attribute variable for each shader 
  // with values from the buffer object chosen by 'gl.bindBuffer()' command.
	// websearch yields OpenGL version: 
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml
  gl.vertexAttribPointer(
		a_PositionID,	//index == attribute var. name used in the shader pgm.
		3,						// size == how many dimensions for this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		15*FSIZE,			// stride == #bytes (of other, interleaved data) between 
									// separating OUR values?
		0*FSIZE);			// Offset -- how many bytes from START of buffer to the
  								// value we will actually use?  We start with position.

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
//	 The 'keypress' event captures the combined effects of alphanumeric keys and 
// the SHIFT, ALT, and CTRL modifiers.  It translates pressed keys into ordinary
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
  document.getElementById('KeyResult').innerHTML = 
   			'char= ' 		 	+ myChar 			+ ', keyCode= '+ ev.keyCode 	+ 
   			', charCode= '+ ev.charCode + ', shift= '	 + ev.shiftKey 	+ 
   			', ctrl= '		+ ev.shiftKey + ', altKey= ' + ev.altKey 		+ 
   			', metaKey= '	+ ev.metaKey 	+ '<br>' ;
  			
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
		case 'R':  // HARD reset: position AND velocity.
		  myRunMode = 0;			// RESET!
/* REPLACE with state-variable form:
			xposNow =  0.0;				yposNow =  0.0;				zposNow =  0.0;	
			xvelNow =  INIT_VEL;	yvelNow =  INIT_VEL;	zvelNow =  0.0;
*/
			s0[PART_XPOS] =     0.0;	s0[PART_YPOS] =     0.0;	s0[PART_ZPOS] =  0.0;	
			s0[PART_XVEL]= INIT_VEL;	s0[PART_YVEL]= INIT_VEL;	s0[PART_ZVEL] =  0.0;
			break;
		case 'r':		// 'SOFT' reset: boost velocity only.
			// don't change myRunMode
/* REPLACE with state-variable form:
			if(xvelNow > 0.0) xvelNow += INIT_VEL; else xvelNow -= INIT_VEL;
			if(yvelNow > 0.0) yvelNow += INIT_VEL; else yvelNow -= INIT_VEL;
*/
			if(s0[PART_XVEL] > 0.0) s0[PART_XVEL] += INIT_VEL; 
												 else s0[PART_XVEL] -= INIT_VEL;
			if(s0[PART_YVEL] > 0.0) s0[PART_YVEL] += INIT_VEL; 
												 else s0[PART_YVEL] -= INIT_VEL;

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
