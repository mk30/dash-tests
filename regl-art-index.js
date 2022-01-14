var regl = require('../../regl')({ extensions: ['angle_instanced_arrays'] })
var testLine = require('./linesimple.json')

var pixelRatio = window.devicePixelRatio

function getNormals (arr) {
  var normals = []
  for (var i=0; i<arr.length; i++) {
    var dx = pos[1][0]-pos[0][0]
    var dy = pos[1][1]-pos[0][1]
    normals.push([-dy, dx])
    normals.push([dy, -dx])
  }
  return normals
}

var pos = testLine.positions
var norms = getNormals(pos)

var dpos = []
for (var i=0; i<pos.length; i++) {
  dpos.push(pos[i])
  dpos.push(pos[i])
}

function vec2dist (a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function project (point) {
  return [
    (0.5 + 0.5*point[0]) * regl._gl.canvas.width,
    (0.5 + 0.5*point[1]) * regl._gl.canvas.height
  ]
}

var dist = Array(dpos.length).fill(0)

function computeCumulDist (dist, pos, project) {
  var prevPoint = project(pos[0])
  for (var i=1; i<pos.length; i++) {
    var point = project(pos[i])
    var d = dist[i-1] + vec2dist(point, prevPoint)
    dist[i] = d
    prevPoint = point
  }
  return dist
}

computeCumulDist(dist, dpos, project)

var line = {
  positions: dpos,
  normals: norms,
  pixelRatio: pixelRatio,
  width: 20,
  dashLength: 2,
  dist
}

console.log(dpos, norms)

var draw = regl({
  frag: `
    precision highp float;
    uniform float dashLength;
    varying float vdist;
    varying vec2 vnorm, vpos;

    float linearstep (float a, float b, float x) {
      return clamp((x-a)/(b-a), 0.0, 1.0);
    }

    void main() {
      float dashvar = fract(vdist/dashLength) * dashLength;
      float vx = linearstep(0.0, 1.0, 1.0+dashvar)
        * linearstep(dashLength*0.5 + 1.0, dashLength*0.5, dashvar);
      float vy = linearstep(0.0, 1.0, 1.0+dashvar)
        * linearstep(dashLength*0.5 + 1.0, dashLength*0.5, dashvar);
      float vz = linearstep(0.0, 1.0, 1.0+dashvar)
        * linearstep(dashLength*0.5 + 1.0, dashLength*0.5, dashvar);
      gl_FragColor = vec4(vx, vy, vz, 1);
      //gl_FragColor = vec4(0.8, 0.8, 0.7, 0.5*mod(gl_FragCoord.x,36.0));
      //gl_FragColor = vec4(0.3, 0.1, 0.7, step(mod(vpos.x*32.0,1.0), 0.5));
    }`,
  vert: `
    precision highp float;
    uniform float width;
    attribute float dist;
    varying float vdist;
    attribute vec2 position;
    attribute vec2 norm;
    varying vec2 vnorm, vpos;
    void main() {
      vnorm = norm;
      vdist = dist;
      vpos = vec2(position.x+norm.y*0.15, position.y+0.02);
      gl_Position = vec4(vpos+norm*width*0.01, 0, 1 );
    }`,
  uniforms: {
    width: line.pixelRatio * line.width,
    dashLength: line.pixelRatio * line.width * line.dashLength,
  },
  attributes: {
    position: line.positions,
    norm: line.normals,
    dist: dist
  },
  primitive: "triangle strip",
  count: dpos.length,
  depth: { enable: false },
  blend: {
    enable: true,
    func: {
      srcRGB: 'src alpha',
      srcAlpha: 1,
      dstRGB: 'one minus src alpha',
      dstAlpha: 1
    }
  }
})

regl.frame(function () {
  regl.clear({ color: [0, 0, 0, 1] })
  draw()
})
