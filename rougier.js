var regl = require('regl')( { extensions: ['angle_instanced_arrays'] })
var vec2 = require('gl-vec2')
var lineData = [-0.3,-0.1, -0.2,0.4, 0.3,-0.3, 0.35,0.4, 0.6,-0.2]
var v0 = [0, 0]
var v1 = [0, 0]
var nv = [0, 0]
var dv = [0, 0]

function getNorm (n, a, b) {
  n[0] = a[1] - b[1]
  n[1] = b[0] - a[0]
  vec2.normalize(n, n)
  return n
}

function getD (d, a, b) {
  vec2.subtract(d, a, b)
  vec2.normalize(d, d)
  return d
}

function addRect (rectCells, rectPos, a, b, width) {
  getNorm(nv, a, b)
  getD(dv, a, b)
  vec2.add(v0, dv, nv)
  vec2.scale(v0, v0, width)
  var a0x = a[0] + v0[0]
  var a0y = a[1] + v0[1]
  vec2.subtract(v0, dv, nv)
  vec2.scale(v0, v0, width)
  var a1x = a[0] + v0[0]
  var a1y = a[1] + v0[1]
  vec2.subtract(v0, dv, nv)
  vec2.scale(v0, v0, width)
  var b0x = b[0] - v0[0]
  var b0y = b[1] - v0[1]
  vec2.add(v0, dv, nv)
  vec2.scale(v0, v0, width)
  var b1x = b[0] - v0[0]
  var b1y = b[1] - v0[1]
  var n = rectPos.length/2
  rectCells.push(n+0, n+1, n+2, n+0, n+2, n+3)
  rectPos.push(a0x, a0y, a1x, a1y, b1x, b1y, b0x, b0y)
}

var line = {
  positions: [],
  cells: [],
  width: 0.1
}

var a = [0, 0]
var b = [0, 0]
for (var i=0; i<lineData.length/2-1; i++) {
  vec2.set(a, lineData[i*2], lineData[i*2+1])
  vec2.set(b, lineData[(i+1)*2], lineData[(i+1)*2+1])
  addRect(line.cells, line.positions, a, b, line.width)
}


var draw = regl({
  frag: `
    precision highp float;
    void main() {
      gl_FragColor = vec4(1, 1, 0, 1);
    }`,
  vert: `
    precision highp float;
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0, 1);
    }`,
  uniforms: {
    width: line.width,
  },
  attributes: {
    position: line.positions,
  },
  elements: line.cells,
  primitive: "triangles",
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
