var lamp = function(num, type) {
  if(type == 'point' || type == 0) {
    this.tp = 0; 
  }
  else if(type == 'dir' || type == 1) {
    this.tp = 1;
  }
  else this.tp = -1;
  this.num = num;
  this.dif = new Float32Array([1.0, 1.0, 1.0]);
  this.amb = new Float32Array([1.0, 1.0, 1.0]);
  this.spec = new Float32Array([1.0, 1.0, 1.0]);
  this.pos = new Float32Array([0.0, 0.0, 0.0]);
  this.dr = new Float32Array([0.0, 0.0, -1.0]);
};

lamp.prototype.pass = function() {
  var n = this.num.toString();
  var uLoc_LampPos  = gl.getUniformLocation(gl.program,  'l['+n+'].u_lpos');
  var uLoc_LampAmbi  = gl.getUniformLocation(gl.program,   'l['+n+'].u_lamb');
  var uLoc_LampDiff = gl.getUniformLocation(gl.program,  'l['+n+'].u_ldif');
  var uLoc_LampSpec  = gl.getUniformLocation(gl.program,   'l['+n+'].u_lspec');
  var uLoc_ltype  = gl.getUniformLocation(gl.program,   'l['+n+'].u_type');
  var uLoc_dir  = gl.getUniformLocation(gl.program,   'l['+n+'].u_dir');
  if( !uLoc_LampPos || !uLoc_LampAmbi || !uLoc_LampDiff || !uLoc_LampSpec ) {
    console.log('Failed to get the Lamps storage locations');
    return;
  }


  gl.uniform3fv(uLoc_LampPos, this.pos.slice(0,3)); 
  gl.uniform3fv(uLoc_LampAmbi, this.amb.slice(0,3)); 
  gl.uniform3fv(uLoc_LampDiff, this.dif.slice(0,3)); 
  gl.uniform3fv(uLoc_LampSpec, this.spec.slice(0,3)); 
  gl.uniform1i(uLoc_ltype, this.tp);
  gl.uniform3fv(uLoc_dir, this.dr.slice(0,3)); 
};