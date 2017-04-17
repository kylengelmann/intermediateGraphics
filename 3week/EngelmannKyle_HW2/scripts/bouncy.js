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
  '  if(Icoord.z < 0.0) {\n' +
  '    gl_PointSize = a_size/(-Icoord.z);\n' +
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

  var sv =
  'precision highp float;\n' +
  'attribute vec3 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  vec4 pos = vec4(a_Position.x, a_Position.y, a_Position.z, 1.0);\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * pos;\n' +
  '  v_Color = a_Color;\n' +
  '}\n';

// Fragment shader program
var sf =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  precision mediump float;\n' +
  '  gl_FragColor = vec4(v_Color.r, v_Color.g, v_Color.b, v_Color.a);\n' +
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

var fov = 60;
var near = .3;
var far = 100;
var mainCam = new Camera(60, 1, .3, 100);

var gridObject;

var partSys;

var loss = .9;

var numP = 6;

var velKick = 3.0;

var singleStep = true;
var takeStep = false;

var forces = [];
var constraints = [];

function main() {




  // Retrieve <canvas> element

  canvas = document.getElementById('webgl');

  // window.addEventListener("keypress", keyPress, false);

  // Get the rendering context for WebGL
  gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
  // gl.disable(gl.DEPTH_TEST);
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.ONE, gl.ONE);

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
  var gridAttrOffsets = [0, 4];
  var gridStride = 7;
  var gridUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];

  makeGroundGrid();

  gridObject = new renderObject(gndVerts, gridVShader, gridFShader)


  gridObject.init(gl, gridAttr, gridAttrOffsets, gridAttrSizes, gridStride, 
                gridUnifs, gl.ARRAY_BUFFER, gl.STATIC_DRAW, gl.LINES);




  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);

  // Get storage location of u_ModelMatrix
  // var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  // if (!u_ModelMatrix) { 
  //   console.log('Failed to get the storage location of u_ModelMatrix');
  //   return;
  // }

  // var u_ViewMatrix = gl.getUniformLocation(gl.program, 'u_ViewMatrix');
  // if (!u_ModelMatrix) { 
  //   console.log('Failed to get the storage location of u_ViewMatrix');
  //   return;
  // }

  // var u_ProjMatrix = gl.getUniformLocation(gl.program, 'u_ProjMatrix');
  // if (!u_ModelMatrix) { 
  //   console.log('Failed to get the storage location of u_ProjMatrix');
  //   return;
  // }

  // Model matrix
  var modelMatrix = new Matrix4();

  mainCam.setPosition([0, -3, 1]);

  // mainCam.setRotation(-30, 1, 0, 0);


  var drag = new dragForce(10/numP);
  var gravity = new constantAcceleration([0, 0, -9.8]);

  forces.push(drag);
  forces.push(gravity);

  var floor = new planeConstraint([0, 0, 0], [0, 0, 1], loss);

  constraints.push(floor);


  var springs = [];

  var particles = [0];
  var poses = [[0, 0, 1.6]];

  for(var j = 1; j < numP; j++) {
    var spring = new springForce(1/((numP-1)), 12.5*numP, [j-1, j]);
    springs.push(spring);
    forces.push(spring);
    particles.push(j)
    poses.push([j/(numP-1), 0, 1.6]);
  }

  var fixed = new fixedConstraint(particles, poses);
  // var fixed = new fixedConstraint([0, numP-1], [[0, 0, 1.6], [1, 0, 1.6]]);
  constraints.push(fixed);


  for(var j = 1; j < numP; j++) {
    var spring = new springForce(1/((numP-1)), 12.5*numP, [(j-1)*numP, j*numP]);
    springs.push(spring);
    forces.push(spring);
  }

  var hvlen = 1/((numP-1));
  var dlen = Math.sqrt(2)*hvlen;

  for(var i = 1; i < numP; i++) {
    for(var j = 1; j < numP; j++) {
      var spring = new springForce(1/((numP-1)), 12.5*numP, [i*numP + j-1, i*numP + j]);
      springs.push(spring);
      forces.push(spring);
      spring = new springForce(1/((numP-1)), 12.5*numP, [(i-1)*numP + j, i*numP + j]);
      springs.push(spring);
      forces.push(spring);
      spring = new springForce(dlen, 2*numP, [(i-1)*numP + j, i*numP + j-1]);
      springs.push(spring);
      forces.push(spring);
      spring = new springForce(dlen, 2*numP, [(i-1)*numP + j - 1, i*numP + j]);
      springs.push(spring);
      forces.push(spring);
    }
  }


  partSys = new springSystem(springs, VSHADER_SOURCE, FSHADER_SOURCE, sv, sf);

  for(var i = 0; i < numP; i++) {
    for(var j = 0; j < numP; j++) {
      partSys.Particles[i*numP + j].setPosition([j/(numP-1), 0, 1.6 - i/(numP-1)]);
      var vec = roundRand3D();
      partSys.Particles[i*numP + j].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
      partSys.Particles[i*numP + j].setSize(50);
      partSys.Particles[i*numP + j].setMass(1/numP);
    }
  }

  var partAttr = ["a_Position", "a_Color", "a_size"];
  var partAttrSizes = [3, 4, 1];
  var partAttrOffsets = [PARTICLE_POS, PARTICLE_COL, PARTICLE_SIZE];
  var partUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];
  var sAttr = ["a_Position", "a_Color"];
  var sAttrSizes = [3, 4];
  var sAttrOffsets = [PARTICLE_POS, PARTICLE_COL];
  var sUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];

  partSys.init(gl, partAttr, partAttrOffsets, partAttrSizes, partUnifs, 
                sAttr, sAttrOffsets, sAttrSizes, sUnifs);



  // ball = new physicsObject(1.0, startPosition, [0,0,0]);

  // Start drawing

  gridObject.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);
  partSys.renderer.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);
  partSys.springRenderer.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);

  winResize()

  var tick = function() {

    if(Keys.keyboard['r'].pressed) {
      for(var i = 0; i < numP; i++) {
        for(var j = 0; j < numP; j++) {
          partSys.Particles[i*numP + j].setPosition([j/(numP-1), 0, 1.6 - i/(numP-1)]);
          var vec = roundRand3D();
          partSys.Particles[i*numP + j].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
          partSys.Particles[i*numP + j].setVelocity([0, 0, 0]);
        }
      }
    }
    if(Keys.keyboard['up_arrow'].pressed) {
      var vel = partSys.Particles[numP*numP-1].getVelocity();
      var f = function(partSys) {partSys.Particles[numP*numP-1].setVelocity([vel[0] + mainCam.up[0]*velKick, vel[1] + mainCam.up[1]*velKick, vel[2] + mainCam.up[2]*velKick]);}
      partSys.fixedUpdate.push(f);
    }
    if(Keys.keyboard['down_arrow'].pressed) {
      var vel = partSys.Particles[numP*numP-1].getVelocity();
      var f = function(partSys) {partSys.Particles[numP*numP-1].setVelocity([vel[0] - mainCam.up[0]*velKick, vel[1] - mainCam.up[1]*velKick, vel[2] - mainCam.up[2]*velKick]);}
      partSys.fixedUpdate.push(f);
    }
    if(Keys.keyboard['right_arrow'].pressed) {
      var vel = partSys.Particles[numP*numP-1].getVelocity();
      var f = function(partSys) {partSys.Particles[numP*numP-1].setVelocity([vel[0] + mainCam.right[0]*velKick, vel[1] + mainCam.right[1]*velKick, vel[2]]);}
      partSys.fixedUpdate.push(f);
    }
    if(Keys.keyboard['left_arrow'].pressed) {
      var vel = partSys.Particles[numP*numP-1].getVelocity();
      var f = function(partSys) {partSys.Particles[numP*numP-1].setVelocity([vel[0] - mainCam.right[0]*velKick, vel[1] - mainCam.right[1]*velKick, vel[2]]);}
      partSys.fixedUpdate.push(f);
    }

    if(Keys.keyboard['1'].down) {
      partSys.solver = SOLVER_EULER;
    }
    if(Keys.keyboard['2'].down) {
      partSys.solver = SOLVER_IMPROVED_EULER;
    }
    if(Keys.keyboard['3'].down) {
      partSys.solver = SOLVER_IMPLICIT;
    }

    if(Keys.keyboard["space"].down) {
      if(singleStep == false) {
        singleStep = !singleStep;
      }
      takeStep = true;
    }
    if(Keys.keyboard["p"].down) {
      singleStep = !singleStep;
    }



    var now = Date.now();
    var elapsed = (now - g_last)*.001;
    g_last = now;

    // ball.addForce([0, -gravity, 0]);
    // ball.update(elapsed);
    // partSys.setParticleForce(0, [0, 0, gravity*partSys.getParticleMass(0)]);

    Controls.updateCamera(mainCam, Keys, elapsed);

    gridObject.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    partSys.renderer.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    partSys.springRenderer.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);

    if(!singleStep || takeStep) {
      partSys.update(elapsed, forces, constraints);
      takeStep = false;
    }

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
  partSys.render(gl);


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

function winResize() {
  canvas.width = innerWidth;
  canvas.height = innerHeight*3/4;
  gl.viewport(0, 0, canvas.width, canvas.height);
  mainCam.projMat.setPerspective(fov, canvas.width/canvas.height, near, far);
  gridObject.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  partSys.renderer.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  partSys.springRenderer.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
}






