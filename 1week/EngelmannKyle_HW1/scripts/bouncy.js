// RotatingTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program..
var VSHADER_SOURCE =
  'precision highp float;\n' +
  'attribute vec3 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute float a_size;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Col;\n' +
  'void main() {\n' +
  '  vec4 pos = vec4(a_Position.x, a_Position.y, a_Position.z, 1.0);\n' +
  '  vec4 Icoord = u_ViewMatrix * u_ModelMatrix * pos;\n' +
  '  gl_Position = u_ProjMatrix * Icoord;\n' +
  '  vec4 distScale = vec4(0.0, 1.0, Icoord.z, 0.0);\n' +
  '  distScale = u_ProjMatrix * distScale;\n' +
  '  if(distScale.w > 0.0) {\n' +
  '    gl_PointSize = a_size*distScale.y/distScale.w;\n' +
  '  }\n' +
  '  else {\n' +
  '    gl_PointSize = a_size;\n' +
  '  }\n' +
  '  v_Col = a_Color;\n' +
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  'precision mediump float;\n' +
  'varying vec4 v_Col;\n' +
  'void main() {\n' +
  '  precision mediump float;\n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '  if(dist < .5) { \n' + 
  '   float c = 1.0-4.0*dist*dist;\n' +
  '   gl_FragColor = vec4(v_Col.r*c, v_Col.g*c, v_Col.b*c, v_Col.a);\n' +
  '  } else { discard; }\n' +
  '}\n';

var gridVShader = 
  'attribute vec4 a_Position;\n' +
  'attribute vec3 a_Color;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec3 v_Col;\n' +
  'void main() {\n' +
  '  gl_PointSize = 10.0;\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;\n' +
  '  v_Col = a_Color;\n' +
  '}\n';

var gridFShader =
  'precision mediump float;\n' +
  'varying vec3 v_Col;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Col, 1.0);\n' + 
  '}\n';

// Rotation angle (degrees/second)

var startPosition = [0.0, 0.0, 1.0];

var gravity = -9.8;

var g_last = Date.now();

var addedF = [10, 20, 30];

var mainCam = new Camera(60, 1, .3, 100);

var gridObject;

var partObject;

var loss = .9;

var numP = 1000;

var velKick = 5.0;

var singleStep = true;
var takeStep = false;

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // window.addEventListener("keypress", keyPress, false);

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);

  Keys.init(gl, canvas);

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Write the positions of vertices to a vertex shader
  // var n = initVertexBuffers(gl);
  // if (n < 0) {
  //   console.log('Failed to set the positions of the vertices');
  //   return;
  // }

  var gridAttr = ["a_Position", "a_Color"];
  var gridAttrSizes = [4, 3];
  var gridUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];

  makeGroundGrid();

  gridObject = new renderObject(gndVerts, gridVShader, gridFShader, 
                gridAttr, gridAttrSizes, gridUnifs, gl.ARRAY_BUFFER, 
                gl.STATIC_DRAW, gl.LINES);

  gridObject.init(gl);

  var partAttr = ["a_Position", "a_Color", "a_size"];
  var partAttrSizes = [3, 4, 1];
  var partUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];




  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  // Get storage location of u_ModelMatrix
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ModelMatrix');
    return;
  }

  var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ViewMatrix');
    return;
  }

  var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  if (!u_ModelMatrix) { 
    console.log('Failed to get the storage location of u_ProjMatrix');
    return;
  }

  // Model matrix
  var modelMatrix = new Matrix4();

  mainCam.setPosition([0, -5, 1]);

  // mainCam.setRotation(-30, 1, 0, 0);

  var partSys = new particleSystem(numP);

  for(var i = 0; i < numP; i++) {
    partSys.setParticlePosition(i, startPosition);
    var vec = roundRand3D();
    partSys.setParticleVelocity(i, [vec[0]*velKick, vec[1]*velKick, vec[2]*velKick]);
    // partSys.setParticleMass(0, 1);
    partSys.setParticleColor(i, [(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
    partSys.setParticleSize(i, 12);
    partSys.setParticleForce(i, [0, 0, gravity*partSys.getParticleMass(0)]);
  }
  var floor = new planeConstraint();
  var ceiling = new planeConstraint([0, 0, 2], [0, 0, -1], loss);
  var fwall = new planeConstraint([0, -1, 0], [0, 1, 0], loss);
  var bwall = new planeConstraint([0, 1, 0], [0, -1, 0], loss);
  var rwall = new planeConstraint([1, 0, 0], [-1, 0, 0], loss);
  var lwall = new planeConstraint([-1, 0, 0], [1, 0, 0], loss);
  partSys.constraints.push(floor);
  partSys.constraints.push(ceiling);
  partSys.constraints.push(fwall);
  partSys.constraints.push(bwall);
  partSys.constraints.push(rwall);
  partSys.constraints.push(lwall);

  var partAttr = ["a_Position", "a_Color", "a_size"];
  var partAttrSizes = [3, 4, 1];
  var partUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];

  partObject = new renderObject(partSys.vbo, VSHADER_SOURCE, FSHADER_SOURCE,
              partAttr, partAttrSizes, partUnifs, gl.ARRAY_BUFFER,
              gl.DYNAMIC_DRAW, gl.POINTS);

  partObject.init(gl);



  // ball = new physicsObject(1.0, startPosition, [0,0,0]);

  // Start drawing

  gridObject.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);
  partObject.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);

  var tick = function() {

    if(Keys.keyboard['r'].down) {
        for(var i = 0; i < numP; i++) {
          var vec = roundRand3D();
          if(Keys.keyboard["shift_l"].pressed) {
            partSys.setParticlePosition(i, startPosition);
            partSys.setParticleVelocity(i, [vec[0]*velKick, vec[1]*velKick, vec[2]*velKick]);
            // partSys.setParticleMass(0, 1);
            partSys.setParticleColor(i, [(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
          }
          else {
            var vel = partSys.getParticleVelocity(i);
            partSys.setParticleVelocity(i, [vel[0] + vec[0]*velKick, vel[0] + vec[1]*velKick, vel[0] + vec[2]*velKick]);
          }
        }
    }
    if(Keys.keyboard["space"].down) {
      if(singleStep == false) {
        singleStep = !singleStep;
      }
      takeStep = true;
    }
    if(Keys.keyboard["p"].down) {
      singleStep = false;
    }



    var now = Date.now();
    var elapsed = (now - g_last)*.001;
    g_last = now;

    // ball.addForce([0, -gravity, 0]);
    // ball.update(elapsed);
    // partSys.setParticleForce(0, [0, 0, gravity*partSys.getParticleMass(0)]);
    if(!singleStep || takeStep) {
      
      partSys.update(elapsed);
      takeStep = false;
    }

    Controls.updateCamera(mainCam, Keys, elapsed);

    gridObject.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    partObject.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    gridObject.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
    partObject.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);

    partObject.updateVBO(gl, partSys.vbo);

    draw(gl);   // Draw the triangle

    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick

    Keys.updateAtEnd();
  };
  tick();
}

function draw(gl) {
  // Set the rotation matrix
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw the rectangle
  gridObject.draw(gl);
  partObject.draw(gl);


}

// function keyPress(ev){
//   var c = String.fromCharCode(ev.keyCode);
//   switch(c) {
//     case 'r': {
//       ball.setVelocity([ball.Velocity[0] + addedV[0], 
//         ball.Velocity[1] + addedV[1], 
//         ball.Velocity[2] + addedV[2]]);
//       break;
//     }
//   }
// }


function makeGroundGrid() {

  var xcount = 100;     // # of lines to draw in x,y to make the grid.
  var ycount = 100;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([1.0, 0.3, 0.8]);  // bright yellow
  var yColr = new Float32Array([0.8, 0.3, 1.0]);  // bright green.
  
  // Create an (global) array to hold this ground-plane's vertices:
  gndVerts = new Float32Array(7*2*(xcount+ycount));
            // draw a grid made of xcount+ycount lines; 2 vertices per line.
            
  var xgap = xymax/(xcount-1);    // HALF-spacing between lines in x,y;
  var ygap = xymax/(ycount-1);    // (why half? because v==(0line number/2))
  
  // First, step thru x values as we make vertical lines of constant-x:
  for(v=0, j=0; v<2*xcount; v++, j+= 7) {
    if(v%2==0) {  // put even-numbered vertices at (xnow, -xymax, 0)
      gndVerts[j  ] = -xymax + (v  )*xgap;  // x
      gndVerts[j+1] = -xymax;               // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {        // put odd-numbered vertices at (xnow, +xymax, 0).
      gndVerts[j  ] = -xymax + (v-1)*xgap;  // x
      gndVerts[j+1] = xymax;                // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = 1.0;
    gndVerts[j+4] = xColr[0];     // red
    gndVerts[j+5] = xColr[1];     // grn
    gndVerts[j+6] = xColr[2];     // blu
  }
  // Second, step thru y values as wqe make horizontal lines of constant-y:
  // (don't re-initialize j--we're adding more vertices to the array)
  for(v=0; v<2*ycount; v++, j+= 7) {
    if(v%2==0) {    // put even-numbered vertices at (-xymax, ynow, 0)
      gndVerts[j  ] = -xymax;               // x
      gndVerts[j+1] = -xymax + (v  )*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    else {          // put odd-numbered vertices at (+xymax, ynow, 0).
      gndVerts[j  ] = xymax;                // x
      gndVerts[j+1] = -xymax + (v-1)*ygap;  // y
      gndVerts[j+2] = 0.0;                  // z
    }
    gndVerts[j+3] = 1.0;
    gndVerts[j+4] = yColr[0];     // red
    gndVerts[j+5] = yColr[1];     // grn
    gndVerts[j+6] = yColr[2];     // blu
  }
}


function roundRand3D() {
//==============================================================================
// On each call, find a different 3D point (xball, yball, zball) chosen 
// 'randomly' and 'uniformly' inside a sphere of radius 1.0 centered at origin.  
// More formally: 
//    --xball*xball + yball*yball + zball*zball < 1.0, and 
//    --uniform probability density function inside this radius=1 circle.
//    (within this sphere, all regions of equal volume are equally likely to
//    contain the the point (xball,yball,zball)).
  do {      // 0.0 <= Math.random() < 1.0 with uniform PDF.
    xball = 2.0*Math.random() -1.0;     // choose an equally-likely 2D point
    yball = 2.0*Math.random() -1.0;     // within the +/-1, +/-1 square.
    zball = 2.0*Math.random() -1.0;
    }
  while(xball*xball + yball*yball + zball*zball >= 1.0);    // keep 1st point inside sphere.
  ret = new Array(xball,yball,zball);
  return ret;
}






