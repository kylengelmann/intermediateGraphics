//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)
//
// ORIGINAL SOURCE: our textbook's example code ('WebGL Programming Guide')
// HelloPoint1.js (c) 2012 matsuda  
//
// HIGHLY MODIFIED to make:
// SwapTest.js  DEMONSTRATION/EXPLANATION of how to 'swap' large state-variable 
//							objects quickly and efficiently.
//
//for EECS 351-2, Intermed. Computer Graphics, Northwestern Univ. Jack Tumblin
//=============================
// DEMONSTRATE how to 'swap' the contents of two large 'state variables' s0,s1
// where each is stored as a Float32Array.
//
//Vertex shader program:--------------------------------------------------------
var VSHADER_SOURCE = 
  'void main() {\n' +
  '  gl_Position = vec4(0.0, 0.0, 0.0, 1.0);\n' + // Set the vertex coordinates of the one and only point
  '  gl_PointSize = 10.0;\n' +                    // Set the point size. CAREFUL! MUST be float, not integer value!!
  '}\n';

// Fragment shader program------------------------------------------------------
var FSHADER_SOURCE =
  'void main() {\n' +
  '  gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);\n' + // Set the point color
  '}\n';

function main() {
//==============================================================================
  // Retrieve HTML <canvas> element:
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL:
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders (initshaders() in textbook's webgl-utils.js library)
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }
//  console.log('Good! all shaders initialized correctly!');

  // Specify the color for clearing <canvas>
  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  // Clear <canvas>
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw a point.  (NO VBO exists; no uniforms, no attributes, no varyings.
  // the GPU will use only the built-in variables present in all shaders). 
  gl.drawArrays(gl.POINTS, 0, 1);
  //==============================TUTORIAL:=================================
  // How can we 'swap' large Float32Array 'state variables' in JavaScript?
  //========================================================================
  /* As you rearrange your particle system into state-variable form, you
   might be puzzled by the requirement to 'swap' the contents of state 
   variables s0 and s1.   (HINT: DON'T use a for() loop to copy values from
   the memory used for one array var to the memory used for the other. Instead,
   make s0 refer to the memory where we stored s1 and vice-versa).
   
   Remember, JavaScript variables are containers for values. You can assign a variable either one simple (un-named) value like this:  
			var car = "Fiat"; 
	or you can assign to a variable one or more name:value pairs 
	(called 'properties') like this: http://www.w3schools.com/js/js_properties.asp 
			var car = {brand:"Fiat", model:"450SL", color:"silver"};	 
	You can add properties to any existing object whenever you wish:
			car.engine = "V8";
  and you can delete properties whenever you wish:
			delete car.color;
	But we're using very simple Float32Array objects. Make a few: 
*/
var state0 = new Float32Array([1.0, 2.0, 3.0, 4.0]);	
var state1 = new Float32Array([5.0, 6.0, 7.0, 8.0]); 
var sTmp = {};		// an empty 'object'.
/*
Remember that JavaScript implemented the names of objects (e.g. state0, state1, 
sTmp)  as references to memory locations, rather than the memory locations 
themselves. For example, when we set state0 = state1, then state0 refers to the 
same memory location as state1:
*/
	console.log("Initial contents of our 3 Float32Array objects:");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	state0 = state1;
	console.log("After we execute: state0 = state1; we get:");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
  console.log("But we didn't COPY the array -- instead, we changed references.  The state0 object now refers to the same memory location as state1.");
	console.log("(and what happened to the old state0 memory? It's gone!");
	console.log("It's unreachable! It's (eventually) garbage-collected!"); 
/* Meanwhile, the memory that held the previous contents of state0 is now 
'unreachable', and thus gets discarded by JavaScript's automatic 'Garbage 
Collection' feature -- see: 
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_Management 
*/
	console.log("As state0 and state1 now refer to the same memory, then");
	state0[1] = 1234; 
	console.log("--after we execute:    state0[1] = 1234; we get:");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	state1[2] = 5678;
	console.log("--and after we execute: state1[2] = 5678; we get:");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	console.log("-------------------------------------------------------");
	console.log("OK, yeah, sure, fine.  How do I use all that to 'swap' s0, s1?");
	console.log(" a) Begin again: restore separate state0 and state1 objects:");
	state0 = new Float32Array([1.0, 2.0, 3.0, 4.0]);
	console.log("    After executing: state0 = new Float32Array([1.0, 2.0, 3.0, 4.0]);");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	state1[1] = 6.0;
	state1[2] = 7.0;
	console.log("    and after executing: state1[1]=6.0; state1[2]=7.0;");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	console.log("--------------------------------------------------------");
	console.log(" b) Assign sTmp object to refer to state0 contents:");
	sTmp = state0;
	console.log("    After executing sTmp = state0;");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	console.log(" c) Assign state0 to refer to state1 contents:");
	state0 = state1;
	console.log("    After executing state0 = state1;");
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	console.log(" d) Assign state1 obj to refer to sTmp contents (old state0)");
	state1 = sTmp;
	console.log("\tstate0: "+state0+"\n\tstate1: "+state1+"\n\tsTmp: "+sTmp);
	console.log("and now we're done.");
	console.log(" We 'swapped' the contents of state0 and state1");
	console.log(" without any tedious element-by-element copying.");
}
