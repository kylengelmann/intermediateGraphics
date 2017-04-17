
var gl;							
								
var g_canvasID;					

preView = new VBObox1();		
rayView = new VBObox2();	

var g_last = Date.now();		
								
								
var g_angleStep = 45.0;			
var g_currentAngle = 0.0; 		

var g_show1 = 1;				
var g_show2 = 1;				

function main() {
  g_canvasID = document.getElementById('webgl');

  gl = getWebGLContext(g_canvasID);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }
  // Initialize each of our 'vboBox' objects: 
  preView.init(gl);		// VBO + shaders + uniforms + attribs for WebGL preview
  rayView.init(gl);		//  "		"		" for ray-traced on-screen result.
	
  gl.clearColor(0.2, 0.2, 0.2, 1);	  // RGBA color for clearing <canvas>
  
  // ==============ANIMATION=============
  // Quick tutorial on synchronous, real-time animation in JavaScript/HTML-5: 
  //  	http://creativejs.com/resources/requestanimationframe/
  //		--------------------------------------------------------
  // Why use 'requestAnimationFrame()' instead of the simpler-to-use
  //	fixed-time setInterval() or setTimeout() functions?  Because:
  //		1) it draws the next animation frame 'at the next opportunity' instead 
  //			of a fixed time interval. It allows your browser and operating system
  //			to manage its own processes, power, & computing loads, and to respond 
  //			to on-screen window placement (to skip battery-draining animation in 
  //			any window that was hidden behind others, or was scrolled off-screen)
  //		2) it helps your program avoid 'stuttering' or 'jittery' animation
  //			due to delayed or 'missed' frames.  Your program can read and respond 
  //			to the ACTUAL time interval between displayed frames instead of fixed
  //		 	fixed-time 'setInterval()' calls that may take longer than expected.
  var tick = function() {			// define our self-calling animation function:
    g_currentAngle = makeSpin(g_currentAngle);  // Update the rotation angle
    draw(); // Draw the triangle
    requestAnimationFrame(tick, g_canvasID); // browser request: ?call tick fcn
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

function draw() {
//=============================================================================
  // Clear on-screen HTML-5 <canvas> object:
  gl.clear(gl.COLOR_BUFFER_BIT);

	if(g_show1 == 1) {	// IF user didn't press HTML button to 'hide' VBO1:
		preView.adjust(gl);		// Send new values for uniforms to the GPU, and
		preView.draw(gl);			// draw our VBO's contents using our shaders.
  }
  if(g_show2 == 1) { // IF user didn't press HTML button to 'hide' VBO2:
  	rayView.adjust(gl);		// Send new values for uniforms to the GPU, and
  	rayView.draw(gl);			// draw our VBO's contents using our shaders.
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

