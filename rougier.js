var regl = require('regl')( { extensions: ['angle_instanced_arrays'] })
var vec2 = require('gl-vec2')
var lineData = [[-0.2,-0.2], [0.6,0.6]]

function getNorm (n, a, b) {
  var dx = b[0] - a[0]
  var dy = b[1] - a[1]
  vec2.normalize(n, [dx,dy])
  return n
}

function getD (d, a, b) {
  var subtracted = []
  vec2.subtract(subtracted, a, b)
  vec2.normalize(d, subtracted)
  return d
}

var rectPos = []
var getRect = function (a, b, width) {
  var norm = []
  var d = []
  getNorm(norm, a, b)
  getD(d, a, b)
  var aa = []
  vec2.add(aa, a, [-norm[0], norm[1]])
  vec2.add(aa, aa, d)
  vec2.scale(aa, aa, width)
  var ab = []
  vec2.subtract(ab, a, [-norm[0], norm[1]])
  vec2.add(ab, ab, d)
  vec2.scale(ab, ab, width)
  var ba = []
  vec2.add(ba, b, [-norm[0], norm[1]])
  vec2.subtract(ba, ba, d)
  vec2.scale(ba, ba, width)
  var bb = []
  vec2.subtract(bb, b, [-norm[0], norm[1]])
  vec2.subtract(bb, bb, d)
  vec2.scale(bb, bb, width)
  rectPos.push(aa[0], aa[1], ab[0], ab[1], ba[0], ba[1], bb[0], bb[1])
  return rectPos
}

console.log(getRect(lineData[0], lineData[1], 0.3))

var line = {
  positions: rectPos,
  cells: [0,2,3,1,0,3],
  width: 0.1
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
