var regl = require('regl')( { extensions: ['angle_instanced_arrays'] })
var vec2 = require('gl-vec2')
var lineData = [-0.3,-0.1, -0.2,0.4, 0.3,-0.9, 0.35,0.5, 0.6,-0.2]
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

function addRect (rect, a, b, width) {
  getNorm(nv, a, b)
  getD(dv, a, b)
  vec2.add(v0, dv, nv)
  vec2.scale(v0, v0, width*0.5)
  var a0x = a[0] + v0[0]
  var a0y = a[1] + v0[1]
  vec2.subtract(v0, dv, nv)
  vec2.scale(v0, v0, width*0.5)
  var a1x = a[0] + v0[0]
  var a1y = a[1] + v0[1]
  vec2.subtract(v0, dv, nv)
  vec2.scale(v0, v0, width*0.5)
  var b0x = b[0] - v0[0]
  var b0y = b[1] - v0[1]
  vec2.add(v0, dv, nv)
  vec2.scale(v0, v0, width*0.5)
  var b1x = b[0] - v0[0]
  var b1y = b[1] - v0[1]
  var n = rect.positions.length/2
  rect.cells.push(n+0, n+1, n+2, n+0, n+2, n+3)
  rect.positions.push(a0x, a0y, a1x, a1y, b1x, b1y, b0x, b0y)
  var lab = vec2.distance(a, b)
  rect.lengths.push(lab, lab, lab, lab)
  rect.uvs.push(-width, width, -width, -width, lab+width, -width, lab+width, width)
  var ph = width
  if (rect.phases.length > 0) {
    var l = rect.lengths[rect.lengths.length-1]
    var p = rect.phases[rect.phases.length-1]
    ph = l + p - width*3
    rect.prevPhases.push(p, p, p, p)
  } else {
    rect.prevPhases.push(0, 0, 0, 0)
  }
  rect.phases.push(ph, ph, ph, ph)
}

var line = {
  positions: [],
  cells: [],
  uvs: [],
  lengths: [],
  phases: [],
  prevPhases: [],
  period: 7,
  width: 0.005
}

var a = [0, 0]
var b = [0, 0]
for (var i=0; i<lineData.length/2-1; i++) {
  vec2.set(a, lineData[i*2], lineData[i*2+1])
  vec2.set(b, lineData[(i+1)*2], lineData[(i+1)*2+1])
  addRect(line, a, b, line.width)
}


var draw = regl({
  frag: `
    precision highp float;
    varying float vlab, vphase, vPrevPhase;
    varying vec2 vuv;
    uniform float width, period;
    void main() {
      float freq = width * period;
      float scap = step(vuv.x, 0.0);
      float ecap = step(vlab, vuv.x);
      float bcap = (1.0-scap)*(1.0-ecap);
      if (scap > 0.5 && length(vuv) > width) discard;
      vec2 buv = vec2(vlab,0);
      if (ecap > 0.5 && distance(vuv,buv) > width) discard;
      float uu = mod((clamp(0.0, vlab, vuv.x) + vphase)/freq, 1.0);
      /*
      float uu = 0.0;
      if (vuv.x < 0.0) {
        uu = mod((vphase+width)/freq, 1.0);
      } else {
        uu = mod((clamp(0.0, vlab, vuv.x) + vphase)/freq, 1.0);
      }
      */
      float x = step(0.5, uu);
      if (x > 0.5) discard;
      gl_FragColor = vec4(x, 0.0, 1.0, 1.0);
      //gl_FragColor = vec4(scap, ecap, uu, 1);
    }`,
  vert: `
    precision highp float;
    attribute float lab, phase, prevPhase;
    attribute vec2 position, uv;
    varying float vlab, vphase, vPrevPhase;
    varying vec2 vuv;
    void main() {
      vlab = lab;
      vuv = uv;
      vphase = phase;
      vPrevPhase = prevPhase;
      gl_Position = vec4(position, 0, 1);
    }`,
  uniforms: {
    width: line.width,
    period: line.period,
  },
  attributes: {
    position: line.positions,
    uv: line.uvs,
    lab: line.lengths,
    phase: line.phases,
    prevPhase: line.prevPhases,
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
