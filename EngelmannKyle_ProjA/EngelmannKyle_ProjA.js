// RotatingTranslatedTriangle.js (c) 2012 matsuda
// Vertex shader program..

// var content = loadPlainTextFile("./test.shd");

// console.log(content);

var specVert = 
  'precision highp float;\n' +
  'attribute vec3 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec3 a_Normal;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'uniform mat4 u_InvTrans;\n' +
  'varying vec4 v_Col;\n' +
  'varying vec3 v_Norm;\n' +
  'varying vec3 v_Pos;\n' +
  'void main() {\n' +
  '  vec4 pos = u_ModelMatrix * vec4(a_Position.x, a_Position.y, a_Position.z, 1.0);\n' +
  '  v_Pos = pos.xyz;\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * pos;\n' +
  '  v_Col = a_Color;\n' +
  '  v_Norm = (u_InvTrans * vec4(a_Normal.x, a_Normal.y,a_Normal.z, 0.0)).xyz;\n' +
  '}\n';

  var specFrag = 
  'precision mediump float;\n' +
  'varying vec4 v_Col;\n' +
  'varying vec3 v_Norm;\n' +
  'varying vec3 v_Pos;\n' +
  'uniform vec3 u_lightDir;\n' +
  'uniform vec3 u_camPos;\n' +
  'uniform float u_specular;\n' +
  'uniform float u_ambient;\n' +
  'uniform float u_k;\n' +
  'void main() {\n' +
  '  float nDotl = dot(normalize(v_Norm), normalize(u_lightDir));\n' +
  '  vec3 lightRefl = normalize(normalize(u_lightDir) - 2.0*nDotl*normalize(v_Norm));\n' +
  '  nDotl = max(-nDotl, 0.0);\n' +
  '  vec3 dir2Cam = normalize(u_camPos - v_Pos);\n' +
  '  float lDotCam = max(dot(lightRefl, dir2Cam), 0.0);\n' +
  '  vec3 col = v_Col.rgb*(u_ambient + nDotl + u_specular*pow(lDotCam, u_k));\n' +
  '  gl_FragColor = vec4(col.r, col.g, col.b, v_Col.a);\n' +
  '}\n';

  var specFragDouble = 
  'precision mediump float;\n' +
  'varying vec4 v_Col;\n' +
  'varying vec3 v_Norm;\n' +
  'varying vec3 v_Pos;\n' +
  'uniform vec3 u_lightDir;\n' +
  'uniform vec3 u_camPos;\n' +
  'uniform float u_specular;\n' +
  'uniform float u_ambient;\n' +
  'uniform float u_k;\n' +
  'void main() {\n' +
  '  float nDotl = dot(normalize(v_Norm), normalize(u_lightDir));\n' +
  '  nDotl = max(-nDotl, nDotl);\n' +
  '  vec3 lightRefl = normalize(normalize(u_lightDir) - 2.0*nDotl*normalize(v_Norm));\n' +
  '  vec3 dir2Cam = normalize(u_camPos - v_Pos);\n' +
  '  float rDotCam = max(dot(lightRefl, dir2Cam), 0.0);\n' +
  '  vec3 col = v_Col.rgb*(u_ambient + nDotl + u_specular*pow(rDotCam, u_k));\n' +
  '  gl_FragColor = vec4(col.r, col.g, col.b, v_Col.a + u_specular*pow(rDotCam, u_k));\n' +
  '}\n';

var cV = 
  'precision highp float;\n' +
  'attribute vec3 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Col;\n' +
  'void main() {\n' +
  '  vec4 pos = vec4(a_Position.x, a_Position.y, a_Position.z, 1.0);\n' +
  '  gl_Position = u_ProjMatrix * u_ViewMatrix * u_ModelMatrix * pos;\n' +
  '  v_Col = a_Color;\n' +
  '}\n';

var cF =
  'precision mediump float;\n' +
  'varying vec4 v_Col;\n' +
  'void main() {\n' +
  '  gl_FragColor = vec4(v_Col.r, v_Col.g, v_Col.b, v_Col.a);\n' +
  '}\n';

var particleVert =
  'precision highp float;\n' +
  'attribute vec3 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute float a_Size;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Col;\n' +
  'void main() {\n' +
  '  vec4 pos = vec4(a_Position.x, a_Position.y, a_Position.z, 1.0);\n' +
  '  vec4 Icoord = u_ViewMatrix * u_ModelMatrix * pos;\n' +
  '  gl_Position = u_ProjMatrix * Icoord;\n' +
  '  if(Icoord.z < 0.0) {\n' +
  '    gl_PointSize = a_Size/(-Icoord.z);\n' +
  '  }\n' +
  '  else {\n' +
  '    gl_PointSize = a_Size;\n' +
  '  }\n' +
  '  v_Col = a_Color;\n' +
  '}\n';

// Fragment shader program
var particleFrag =
  'precision mediump float;\n' +
  'varying vec4 v_Col;\n' +
  'void main() {\n' +
  '  float dist = distance(gl_PointCoord, vec2(0.5, 0.5)); \n' +
  '  if(dist < .5) { \n' + 
  '   float c = 1.0-4.0*dist*dist;\n' +
  '   gl_FragColor = vec4(v_Col.r*c, v_Col.g*c, v_Col.b*c, v_Col.a);\n' +
  '  } else { discard; }\n' +
  '}\n';

  var springVert =
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

  var springFrag =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  precision mediump float;\n' +
  '  gl_FragColor = vec4(v_Color.r, v_Color.g, v_Color.b, v_Color.a);\n' +
  '}\n';


  var fireVert =
  'precision highp float;\n' +
  'attribute vec3 a_Position;\n' +
  // 'attribute vec4 a_Color;\n' +
  // 'attribute float a_size;\n' +
  'attribute float a_time;\n' +
  'attribute float a_rotation;\n' +
  'uniform vec4 u_startColor;\n' +
  'uniform vec4 u_endColor;\n' +
  'uniform float u_maxSize;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_ViewMatrix;\n' +
  'uniform mat4 u_ProjMatrix;\n' +
  'varying vec4 v_Color;\n' +
  'varying float v_sin;\n' +
  'varying float v_cos;\n' +
  'void main() {\n' +
  '  float size = u_maxSize;\n' +
  '  vec4 Color = mix(u_startColor, u_endColor, vec4(a_time, a_time, a_time, a_time));\n' +
  '  if(a_time < 0.4) {\n' +
  '    size = mix(0.0, u_maxSize, a_time/.4);\n' +
  '    Color.a = mix(0.0, Color.a, a_time/.4);\n' +
  '  }\n' +
  '  else {\n' +
  '    size = mix(u_maxSize, 0.0, (a_time-.4)/.6);\n' +
  '    Color.a = mix(Color.a, 0.0, (a_time-.4)/.6);\n' +
  '  }\n' +
  '  vec4 pos = vec4(a_Position.x, a_Position.y, a_Position.z, 1.0);\n' +
  '  vec4 Icoord = u_ViewMatrix * u_ModelMatrix * pos;\n' +
  '  gl_Position = u_ProjMatrix * Icoord;\n' +
  '  if(Icoord.z < 0.0) {\n' +
  '    gl_PointSize = size/(-Icoord.z);\n' +
  '  }\n' +
  '  else {\n' +
  '    gl_PointSize = 0.0;\n' +
  '  }\n' +
  '  v_Color = Color;\n' +
  '  v_sin = sin(a_rotation);\n' +
  '  v_cos = cos(a_rotation);\n' +
  '}\n';

// Fragment shader program
var fireFrag =
  'precision mediump float;\n' +
  'varying vec4 v_Color;\n' +
  'varying float v_sin;\n' +
  'varying float v_cos;\n' +
  'uniform sampler2D u_tex;\n' +
  'void main() {\n' +
  '  vec2 tex_uv = gl_PointCoord;\n' +
  '  tex_uv.y = (0.5 - tex_uv.y)*1.414214;\n' +
  '  tex_uv.x = (tex_uv.x - 0.5)*1.414214;\n' +
  '  mat2 rotation = mat2(v_cos, -v_sin, v_sin, v_cos);\n' +
  '  tex_uv = rotation*tex_uv;\n' +
  '  if(tex_uv.x*tex_uv.x > 0.25 || tex_uv.y*tex_uv.y > 0.25) {\n' +
  '    discard;\n' +
  '  }\n' +
  '  else {\n' +
  '    tex_uv.x += .5;\n' +
  '    tex_uv.y += .5;\n' +
  '    vec4 col = texture2D(u_tex, tex_uv);\n' +
  '    if(col.a == 0.0) {\n' +
  '      discard;\n' +
  '    }\n' +
  '    else {\n' +
  '      gl_FragColor = vec4(v_Color.r*col.r, v_Color.g*col.g, v_Color.b*col.b, v_Color.a*col.a);\n' +
  '    }\n' +
  '  }\n' +
  '}\n';

var gridVert = 
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

var gridFrag =
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
var far = 1000;
var mainCam = new Camera(60, 1, .3, 100);

var gridObject;

var cubeObject;

var partSys;

var loss = .9;

var clothNum = 7;

var springK = 10/4;
var springDrag = 2/clothNum;

var rodDrag = .1/clothNum;

var velKick = 25.0;

var singleStep = false;
var takeStep = false;



var fireNum = 200;



var startColor = [1, 150/255, 50/255, .3];
var endColor = [1, 0, 0, .3];

var maxMass = .7;
var maxSize = 200*4;


var boidsNum = 90;

var boidsVel = [3, 4, 0];


var ringNum = 500;
var planetMass = 3/G_CONST;
var spinForce = 2;
var ringMinMass = .6;
var ringMaxMass = 1;
var ringAxis = [-1, -.4, 2];
var ringDrag = .6;


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
  gl.enable(gl.BLEND);

  Keys.init(gl, canvas);

  // // Initialize shaders
  // if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
  //   console.log('Failed to intialize shaders.');
  //   return;
  // }

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

  gridObject = new renderObject(gndVerts, gridVert, gridFrag);


  gridObject.init(gl, gridAttr, gridAttrOffsets, gridAttrSizes, gridStride, 
                gridUnifs, gl.ARRAY_BUFFER, gl.STATIC_DRAW, gl.LINES);
  var modelMatrix = new Matrix4();

  gridObject.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);




  makeCube([.5, .5, .5, .1]);


  cubeObject = new renderObject(cubeVerts, specVert, specFragDouble);

  var specAttr = ["a_Position", "a_Normal", "a_Color"];
  var specAttrSizes = [3, 3, 4];
  var specAttrOffsets = [0, 3, 6];
  var specStride = 10;
  var specUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix", "u_InvTrans",
   "u_lightDir", "u_camPos", "u_specular", "u_k", "u_ambient"];

  cubeObject.init(gl, specAttr, specAttrOffsets, specAttrSizes, specStride, 
                specUnifs, gl.ARRAY_BUFFER, gl.STATIC_DRAW, gl.TRIANGLES);

  cubeObject.bindIndexBuffer(gl, cubeInd);

  cubeObject.setVec3(gl, "u_lightDir", [-ringAxis[0], -ringAxis[1], -ringAxis[2]]);

  cubeObject.setFloat(gl, "u_specular", .7);
  cubeObject.setFloat(gl, "u_k", 5000);
  cubeObject.setFloat(gl, "u_ambient", .4);

  cylObject = new renderObject(cubeVerts, specVert, specFrag);


  cylObject.init(gl, specAttr, specAttrOffsets, specAttrSizes, specStride, 
                specUnifs, gl.ARRAY_BUFFER, gl.STATIC_DRAW, gl.TRIANGLES)

  cylObject.bindIndexBuffer(gl, cubeInd);

  cylObject.setVec3(gl, "u_lightDir", [-ringAxis[0], -ringAxis[1], -ringAxis[2]]);

  cylObject.setFloat(gl, "u_specular", .1);
  cylObject.setFloat(gl, "u_k", 2);
  cylObject.setFloat(gl, "u_ambient", 0);


  lineCube =  new renderObject(cubeVerts, gridVert, gridFrag);


  lineCube.init(gl, gridAttr, [0, 6], [3, 4], specStride, 
                gridUnifs, gl.ARRAY_BUFFER, gl.STATIC_DRAW, gl.LINES);

  lineCube.bindIndexBuffer(gl, lineInd);



  makeSphere([.51, .65, .89, 1]);

  sphereObject = new renderObject(Float32Array.from(sphereVerts), specVert, specFrag);


  sphereObject.init(gl, specAttr, specAttrOffsets, specAttrSizes, specStride, 
                specUnifs, gl.ARRAY_BUFFER, gl.STATIC_DRAW, gl.TRIANGLES)

  sphereObject.bindIndexBuffer(gl, Float32Array.from(sphereIndices));

  sphereObject.setVec3(gl, "u_lightDir", [-ringAxis[0], -ringAxis[1], -ringAxis[2]]);

  sphereObject.setFloat(gl, "u_specular", .1);
  sphereObject.setFloat(gl, "u_k", 2);
  sphereObject.setFloat(gl, "u_ambient", 0);










  // Specify the color for clearing <canvas>
  gl.clearColor(0, 0, 0, 1);


  mainCam.setPosition([0, -22, 8]);

  mainCam.setRotation(-16, 1, 0, 0);


  var springs = [];

  var particles = [0];
  var poses = [[0, 0, 1.6*4]];

  var rods = [];

  for(var j = 1; j < clothNum; j++) {
    var spring = new springForce(4/((clothNum-1)), springK*clothNum, [j-1, j]);
    springs.push(spring);
    var rod = new rodConstraint(4/((clothNum-1)), 0, [j-1, j]);
    rods.push(rod);
    // clothForces.push(spring);
    particles.push(j)
    poses.push([j*4/(clothNum-1), 0, 1.6*4]);
  }

  // var fixed = new fixedConstraint([0, numP-1], [[0, 0, 1.6], [1, 0, 1.6]]);


  for(var j = 1; j < clothNum; j++) {
    var spring = new springForce(4/((clothNum-1)), springK*clothNum, [(j-1)*clothNum, j*clothNum]);
    springs.push(spring);
    var rod = new rodConstraint(4/((clothNum-1)), 0, [(j-1)*clothNum, j*clothNum]);
    rods.push(rod);
    // clothForces.push(spring);
  }

  var hvlen = 1/((clothNum-1));
  var dlen = Math.sqrt(2)*hvlen;

  var clothIndices = [];

  for(var i = 1; i < clothNum; i++) {
    for(var j = 1; j < clothNum; j++) {
      var spring = new springForce(4/((clothNum-1)), springK*clothNum, [i*clothNum + j-1, i*clothNum + j]);
      springs.push(spring);
      var rod = new rodConstraint(4/((clothNum-1)), 0, [i*clothNum + j-1, i*clothNum + j]);
      rods.push(rod);
      // clothForces.push(spring);
      spring = new springForce(4/((clothNum-1)), springK*clothNum, [(i-1)*clothNum + j, i*clothNum + j]);
      springs.push(spring);
      rod = new rodConstraint(4/((clothNum-1)), 0, [(i-1)*clothNum + j, i*clothNum + j]);
      rods.push(rod);

      clothIndices.push(i*clothNum + j-1);
      clothIndices.push(i*clothNum + j);
      clothIndices.push((i-1)*clothNum + j);
      clothIndices.push((i-1)*clothNum + j-1);
      clothIndices.push((i-1)*clothNum + j);
      clothIndices.push(i*clothNum + j-1);


      // spring = new springForce(dlen, 1*clothNum, .4, [(i-1)*clothNum + j, i*clothNum + j-1]);
      // springs.push(spring);
      // forces.push(spring);
      // spring = new springForce(dlen, .5*clothNum, .4, [(i-1)*clothNum + j - 1, i*clothNum + j]);
      // springs.push(spring);
      // forces.push(spring);
    }
  }



  clothSys = new Cloth(springs, rods, clothIndices, cV, cF);

  var clothDrag = new dragForce(springDrag);
  var gravity = new constantAcceleration([0, 0, -9.8]);

  clothSys.forces.push(clothDrag);
  clothSys.forces.push(gravity);

  var floor = new planeConstraint([0, 0, 0], [0, 0, 1], loss);
  var fixed = new fixedConstraint(particles, poses);

  clothSys.constraints.push(floor);
  clothSys.constraints.push(fixed);


  for(var i = 0; i < clothNum; i++) {
    for(var j = 0; j < clothNum; j++) {
      clothSys.Particles[i*clothNum + j].setPosition([j*4/(clothNum-1), 0, 1.6*4 - i*4/(clothNum-1)]);
      var vec = roundRand3D();
      clothSys.Particles[i*clothNum + j].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
      clothSys.Particles[i*clothNum + j].setSize(50);
      clothSys.Particles[i*clothNum + j].setMass(4/(clothNum*clothNum));
    }
  }


  var clothAttr = ["a_Position", "a_Color"];
  var clothAttrSizes = [3, 4];
  var clothAttrOffsets = [PARTICLE_VBO_POS, PARTICLE_VBO_COL];
  var clothUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];
  // var sAttr = ["a_Position", "a_Color"];
  // var sAttrSizes = [3, 4];
  // var sAttrOffsets = [PARTICLE_VBO_POS, PARTICLE_VBO_COL];
  // var sUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];

  clothSys.init(gl, clothAttr, clothAttrOffsets, clothAttrSizes, clothUnifs);


  modelMatrix.setTranslate(8, -10, 0);


  clothSys.renderer.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);
  // clothSys.springRenderer.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);



  var f = function(State, i) {
    var pos = roundRand2D();
    State.setParticlePosition(i, [pos[0]*.3, pos[1]*.3, 0]);
    State.setParticleVelocity(i, [0, 0, 0]);
    State.setParticleRotation(i, Math.random()*Math.PI*2.0);
  };

  texLoader = initTexture("./firen2.png", 0);

  fireSys = new particleSystem(fireNum, fireVert, fireFrag);

  var constForce = new constantForce([0, 0, 1]);

  fireSys.forces.push(constForce);

  var time = new timeAliveConstraint(1, f);

  fireSys.constraints.push(time);



  for(var i = 0; i < fireNum; i++) {
    fireSys.Particles[i].setPosition([NaN, NaN, NaN]);
    var vec = roundRand3D();
    fireSys.Particles[i].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
    fireSys.Particles[i].setTimeAlive((i+1)/fireNum);
  }

  var fireAttr = ["a_Position", "a_rotation", "a_time"];
  var fireAttrSizes = [3, 1, 1];
  var fireAttrOffsets = [PARTICLE_VBO_POS, PARTICLE_VBO_ROT, PARTICLE_VBO_TIME_ALIVE];
  var fireUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix", "u_tex",
   "u_startColor", "u_endColor", "u_maxSize"];

  fireSys.init(gl, fireAttr, fireAttrOffsets, fireAttrSizes, fireUnifs)

  modelMatrix.setTranslate(-10, -10, 0);
  modelMatrix.scale(4, 4, 4);

  fireSys.renderer.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);
  fireSys.renderer.setInt(gl, "u_tex", 0);
  fireSys.renderer.setVec4(gl, "u_startColor", startColor);
  fireSys.renderer.setVec4(gl, "u_endColor", endColor);
  fireSys.renderer.setFloat(gl, "u_maxSize", maxSize);



  flock = new particleSystem(boidsNum, particleVert, particleFrag);

  for(var i = 0; i < flock.numParticles; i++) {
    var vec = roundRand3D();
    // var mag = 0;
    // var vec;
    // while(mag <= .3) {
    //   vec = roundRand3D();
    //   mag = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1]);
    // }
    flock.Particles[i].setPosition(vec);
    flock.Particles[i].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
    flock.Particles[i].setSize(50);
    flock.Particles[i].setMass(1);
  }

  var boidF = new boidsForce(3.0, 1, 0.3, 0.7, 4.0);

  var front = new boidsWall([0, -4, 0], [0, 1, 0]);
  var back = new boidsWall([0, 4, 0], [0, -1, 0]);
  var left = new boidsWall([-4, 0, 0], [1, 0, 0]);
  var right = new boidsWall([4, 0, 0], [-1, 0, 0]);
  var bottom = new boidsWall([0, 0, -4], [0, 0, 1]);
  var top = new boidsWall([0, 0, 4], [0, 0, -1]);

  var cyl = new boidsCylinder([1.5, -1.5, 0], [0, 0, 1], .25);

  boidF.obstacles.push(front);
  boidF.obstacles.push(back);
  boidF.obstacles.push(left);
  boidF.obstacles.push(right);
  boidF.obstacles.push(bottom);
  boidF.obstacles.push(top);

  boidF.obstacles.push(cyl);

  flock.forces.push(boidF)

  flock.forces.push(new ringForce([-ringAxis[0], ringAxis[1], ringAxis[2]], [0, 0, 0], .6*spinForce, 1))
  // flock.forces.push(gravity);

  var partAttr = ["a_Position", "a_Color", "a_Size"];
  var partAttrSizes = [3, 4, 1];
  var partAttrOffsets = [PARTICLE_VBO_POS, PARTICLE_VBO_COL, PARTICLE_VBO_SIZE];
  var partUnifs = ["u_ModelMatrix", "u_ViewMatrix", "u_ProjMatrix"];

  flock.init(gl, partAttr, partAttrOffsets, partAttrSizes, partUnifs);

  modelMatrix.setTranslate(-10, 10, 4);

  flock.renderer.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);

  pushMatrix(modelMatrix);

  modelMatrix.translate(-4, -4, -4);

  modelMatrix.scale(8, 8, 8);


  cubeObject.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);

  var normMat = new Matrix4();
  normMat.setInverseOf(modelMatrix);
  normMat.transpose();
  cubeObject.setMat4(gl, "u_InvTrans", normMat.elements);

  modelMatrix = popMatrix();

  modelMatrix.translate(1.2, -1.7, -4);

  modelMatrix.scale(.6, .6, 8);

  cylObject.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);

  var normMat = new Matrix4();
  normMat.setInverseOf(modelMatrix);
  normMat.transpose();
  cylObject.setMat4(gl, "u_InvTrans", normMat.elements);





  ringSys = new particleSystem(ringNum, particleVert, particleFrag);

  ringSys.init(gl, partAttr, partAttrOffsets, partAttrSizes, partUnifs);

  modelMatrix.setTranslate(10, 10, 4);

  ringSys.renderer.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);
  sphereObject.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);
  normMat.setInverseOf(modelMatrix);
  normMat.transpose();
  sphereObject.setMat4(gl, "u_InvTrans", normMat.elements);

  modelMatrix.translate(-4, -4, -4);
  modelMatrix.scale(8, 8, 8);

  lineCube.setMat4(gl, "u_ModelMatrix", modelMatrix.elements);

  var gField = new gravitationalField([0, 0, 0], planetMass);
  var gForce = new gravitationalForce(gField);

  var rForce = new ringForce(ringAxis, [0, 0, 0], spinForce, 1);

  var dForce = new dragForce(ringDrag);

  var downForce = new constantAcceleration([0, 0, -9.8]);
  downForce.active = false;

  ringSys.forces.push(gForce);
  ringSys.forces.push(rForce);
  ringSys.forces.push(dForce);
  ringSys.forces.push(downForce);

  ringSys.constraints.push(new planeConstraint([0, 0, -4], [0, 0, 1], .1));
  ringSys.constraints.push(new planeConstraint([0, 0, 4], [0, 0, -1], .1));
  ringSys.constraints.push(new planeConstraint([0, -4, 0], [0, 1, 0], .1));
  ringSys.constraints.push(new planeConstraint([0, 4, 0], [0, -1, 0], .1));
  ringSys.constraints.push(new planeConstraint([-4, 0, 0], [1, 0, 0], .1));
  ringSys.constraints.push(new planeConstraint([4, 0, 0], [-1, 0, 0], .1));

  var sphere = new sphereConstraint([0, 0, 0], 1, 1);

  ringSys.constraints.push(sphere);


  for(var i = 0; i < ringNum; i++) {
    var mag = 0;
    var vec;
    while(mag == 0) {
      vec = roundRand3D();
      mag = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
    }
    for(var j = 0; j < 3; j++) {
      vec[j] *= 2/mag;
    }
    ringSys.Particles[i].setPosition(vec);
    ringSys.Particles[i].setColor([.51, .65, .89, 1]);
    var mass = lerp(ringMinMass, ringMaxMass, Math.sqrt(Math.random()));
    ringSys.Particles[i].setMass(mass);
    ringSys.Particles[i].setSize(50*Math.sqrt(mass));
  }







  winResize();

  var movingForce = new constantForce([0, 0, 0], [clothNum*clothNum-1]);
  clothSys.forces.push(movingForce);

  var avgFR = 0;
  var numFrames = 0;

  fireSys.fixedUpdate.push(fixedUpdate);



  var tick = function() {

    if(Keys.keyboard['r'].down) {
      for(var i = 0; i < clothNum; i++) {
        for(var j = 0; j < clothNum; j++) {
          clothSys.Particles[i*clothNum + j].setPosition([j/(clothNum-1), 0, 1.6 - i/(clothNum-1)]);
          var vec = roundRand3D();
          clothSys.Particles[i*clothNum + j].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
          clothSys.Particles[i*clothNum + j].setVelocity([0, 0, 0]);
        }
      }
      for(var i = 0; i < fireNum; i++) {
        fireSys.Particles[i].setPosition([NaN, NaN, NaN]);
        var vec = roundRand3D();
        fireSys.Particles[i].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
        fireSys.Particles[i].setTimeAlive((i+1)/fireNum);
      }
      for(var i = 0; i < flock.numParticles; i++) {
        var vec = roundRand3D();
        flock.Particles[i].setPosition(vec);
        flock.Particles[i].setColor([(vec[0]+1)*.5, (vec[1]+1)*.5, (vec[2]+1)*.5, 1]);
        vec = roundRand3D();
        for(var j = 0; j<3; j++) {
          vec[j] = vec[j]*.1 + boidsVel[j];
        }
        flock.Particles[i].setVelocity(vec);
        flock.Particles[i].setSize(50);
        flock.Particles[i].setMass(1);
      }
      for(var i = 0; i < ringNum; i++) {
        var mag = 0;
        var vec;
        while(mag == 0) {
          vec = roundRand3D();
          mag = Math.sqrt(vec[0]*vec[0] + vec[1]*vec[1] + vec[2]*vec[2]);
        }
        for(var j = 0; j < 3; j++) {
          vec[j] *= 2/mag;
        }
        ringSys.Particles[i].setPosition(vec);
        ringSys.Particles[i].setVelocity([0, 0, 0]);
      }
    }

    movingForce.force = Float32Array.from([0, 0, 0]);
    if(Keys.keyboard['up_arrow'].pressed) {
      movingForce.force = Float32Array.from([mainCam.up[0]*velKick + movingForce.force[0], 
        mainCam.up[1]*velKick + movingForce.force[1], 
        mainCam.up[2]*velKick + movingForce.force[2]]);
      
    }
    if(Keys.keyboard['down_arrow'].pressed) {
      movingForce.force = Float32Array.from([-mainCam.up[0]*velKick + movingForce.force[0], 
        -mainCam.up[1]*velKick + movingForce.force[1],
         -mainCam.up[2]*velKick + movingForce.force[2]]);
    }
    if(Keys.keyboard['right_arrow'].pressed) {
      movingForce.force = Float32Array.from([mainCam.right[0]*velKick + movingForce.force[0],
       mainCam.right[1]*velKick + movingForce.force[1],  movingForce.force[2]]);
    }
    if(Keys.keyboard['left_arrow'].pressed) {
      movingForce.force = Float32Array.from([-mainCam.right[0]*velKick + movingForce.force[0], 
        -mainCam.right[1]*velKick + movingForce.force[1], movingForce.force[2]]);
    }

    if(Keys.keyboard['1'].down) {
      partSysSolver = SOLVER_EULER;
    }
    if(Keys.keyboard['2'].down) {
      partSysSolver = SOLVER_IMPROVED_EULER;
    }
    if(Keys.keyboard['3'].down) {
      partSysSolver = SOLVER_IMPLICIT;
    }
    if(Keys.keyboard['4'].down) {
      partSysSolver = SOLVER_VEL_VERLET;
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
    if(Keys.keyboard["f"].down) {
      clothSys.withConstraints = !clothSys.withConstraints;
      if(clothSys.withConstraints) {
        clothDrag.drag = rodDrag;
      }
      else {
        clothDrag.drag = springDrag;
      }
    }

    if(Keys.keyboard["z"].down) {
      gForce.active = !gForce.active;
    }
    if(Keys.keyboard["x"].down) {
      rForce.active = !rForce.active;
    }
    if(Keys.keyboard["c"].down) {
      downForce.active = !downForce.active;
    }



    var now = Date.now();
    var elapsed = (now - g_last)*.001;
    g_last = now;

    Controls.updateCamera(mainCam, Keys, elapsed);

    gridObject.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    cubeObject.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    cylObject.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    sphereObject.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    lineCube.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    clothSys.renderer.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    // clothSys.springRenderer.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    fireSys.renderer.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    flock.renderer.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    ringSys.renderer.setMat4(gl, "u_ViewMatrix", mainCam.viewMat.elements);
    sphereObject.setVec3(gl, "u_camPos", mainCam.position);
    cubeObject.setVec3(gl, "u_camPos", mainCam.position);
    cylObject.setVec3(gl, "u_camPos", mainCam.position);

    if(!singleStep || takeStep) {

      ringSys.update(elapsed);
      flock.update(elapsed);
      fireSys.update(elapsed);
      clothSys.update(elapsed);
      takeStep = false;
    }

    draw(gl);   // Draw the triangle

    requestAnimationFrame(tick, canvas);   // Request that the browser ?calls tick

    // forces.pop();

    Keys.updateAtEnd();
  };
  tick();



}



function draw(gl) {
  // Set the rotation matrix
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.blendFunc(gl.ONE, gl.ZERO);
  // gl.depthFunc(gl.LESS);
  gl.depthMask(true);
  // Draw the rectangle
  gridObject.draw(gl);
  clothSys.render(gl);
  flock.render(gl);
  ringSys.render(gl);
  sphereObject.drawIndices(gl);
  lineCube.drawIndices(gl);

  gl.depthMask(false);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  cubeObject.drawIndices(gl);
  cylObject.drawIndices(gl);

  gl.blendFunc(gl.SRC_ALPHA, gl.ONE);

  if(texLoader.done) {
    fireSys.render(gl);
  }
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

function makeCube(col) {
  cubeVerts = new Float32Array([
    0, 0, 0, 0, -1, 0, col[0], col[1], col[2], col[3], 
    1, 0, 0, 0, -1, 0, col[0], col[1], col[2], col[3], 
    0, 0, 1, 0, -1, 0, col[0], col[1], col[2], col[3], 
    1, 0, 1, 0, -1, 0, col[0], col[1], col[2], col[3], 

    0, 0, 1, 0, 0, 1, col[0], col[1], col[2], col[3], 
    1, 0, 1, 0, 0, 1, col[0], col[1], col[2], col[3], 
    0, 1, 1, 0, 0, 1, col[0], col[1], col[2], col[3], 
    1, 1, 1, 0, 0, 1, col[0], col[1], col[2], col[3], 

    0, 1, 1, 0, 1, 0, col[0], col[1], col[2], col[3], 
    1, 1, 1, 0, 1, 0, col[0], col[1], col[2], col[3], 
    0, 1, 0, 0, 1, 0, col[0], col[1], col[2], col[3], 
    1, 1, 0, 0, 1, 0, col[0], col[1], col[2], col[3], 

    0, 1, 0, 0, 0, -1, col[0], col[1], col[2], col[3], 
    1, 1, 0, 0, 0, -1, col[0], col[1], col[2], col[3],
    0, 0, 0, 0, 0, -1, col[0], col[1], col[2], col[3], 
    1, 0, 0, 0, 0, -1, col[0], col[1], col[2], col[3],  

    0, 0, 0, -1, 0, 0, col[0], col[1], col[2], col[3],
    0, 1, 0, -1, 0, 0, col[0], col[1], col[2], col[3],
    0, 0, 1, -1, 0, 0, col[0], col[1], col[2], col[3], 
    0, 1, 1, -1, 0, 0, col[0], col[1], col[2], col[3], 

    1, 0, 0, 1, 0, 0, col[0], col[1], col[2], col[3], 
    1, 1, 0, 1, 0, 0, col[0], col[1], col[2], col[3],
    1, 0, 1, 1, 0, 0, col[0], col[1], col[2], col[3], 
    1, 1, 1, 1, 0, 0, col[0], col[1], col[2], col[3],
    ]);
  cubeInd = new Float32Array([
    0, 1, 2, 2, 3, 1,
    4, 5, 6, 6, 7, 5,
    8, 9, 10, 10, 11, 9,
    12, 13, 14, 14, 15, 13,
    16, 17, 18, 18, 19, 17,
    20, 21, 22, 22, 23, 21
    ]);
  lineInd = new Float32Array([
    0, 1, 1, 3, 2, 3, 2, 0,
    5, 7, 6, 4, 
    8, 9, 9, 11, 10, 11, 10, 8,
    13, 15, 14, 12
    ]);
}


function makeSphere(col) {
  var SPHERE_DIV = 17;

  var i, ai, si, ci;
  var j, aj, sj, cj;
  var p1, p2;

  sphereVerts = [];
  sphereIndices = [];

  for (j = 0.0; j <= SPHERE_DIV; j++) {
    aj = j * Math.PI / SPHERE_DIV;
    sj = Math.sin(aj);
    cj = Math.cos(aj);
    for (i = 0.0; i <= SPHERE_DIV; i++) {
      ai = i * 2 * Math.PI / SPHERE_DIV;
      si = Math.sin(ai);
      ci = Math.cos(ai);

      sphereVerts.push(si * sj);
      sphereVerts.push(cj);
      sphereVerts.push(ci * sj);

      sphereVerts.push(si * sj);
      sphereVerts.push(cj);
      sphereVerts.push(ci * sj);

      sphereVerts.push(col[0]);
      sphereVerts.push(col[1]);
      sphereVerts.push(col[2]);
      sphereVerts.push(col[3]);
    }
  }

  for (j = 0; j < SPHERE_DIV; j++) {
    for (i = 0; i < SPHERE_DIV; i++) {
      p1 = j * (SPHERE_DIV+1) + i;
      p2 = p1 + (SPHERE_DIV+1);

      sphereIndices.push(p1);
      sphereIndices.push(p2);
      sphereIndices.push(p1 + 1);

      sphereIndices.push(p1 + 1);
      sphereIndices.push(p2);
      sphereIndices.push(p2 + 1);
    }
  }

}


function makeGroundGrid() {

  var xcount = 25;     // # of lines to draw in x,y to make the grid.
  var ycount = 25;   
  var xymax = 50.0;     // grid size; extends to cover +/-xymax in x and y.
  var xColr = new Float32Array([.5, .5, 0.8]);  // bright yellow
  var yColr = new Float32Array([.5, .5, 1.0]);  // bright green.
  
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
  cubeObject.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  cylObject.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  sphereObject.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  lineCube.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  clothSys.renderer.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  fireSys.renderer.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  flock.renderer.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
  ringSys.renderer.setMat4(gl, "u_ProjMatrix", mainCam.projMat.elements);
}


function roundRand2D() {
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
    }
  while(xball*xball + yball*yball > 1.0);    // keep 1st point inside sphere.
  ret = new Array(xball,yball);
  return ret;
}


function lerp(a, b, t) {
  return (a*(1-t) + b*t);
}

function fixedUpdate(sys) {
  for(var i = 0; i < sys.Particles.length; i++) {
    var p = sys.Particles[i];
    var t = p.getTimeAlive();
    if(t < .4) {
      p.setMass(lerp(.6, 1, t/.4)*maxMass);
    }
    else {
      p.setMass(lerp(1, 0, (t-.4)/.6)*maxMass);
    }
  }
}

