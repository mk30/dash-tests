var regl = require('regl')( { extensions: ['angle_instanced_arrays'] })
var vec2 = require('gl-vec2')
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

var line = {
  points: [-0.3,-0.1, -0.2,0.4, 0.3,-0.9, 0.35,0.5, 0.6,-0.2, 0.4,-0.1, -0.3,-0.1],
  cdist: [],
  period: 0.1,
  width: 0.01,
  duty: 0.3,
}

var cd = 0
for (var i=0; i<line.points.length/2-1; i++) {
  vec2.set(v0, line.points[2*i], line.points[2*i+1])
  vec2.set(v1, line.points[2*(i+1)], line.points[2*(i+1)+1])
  line.cdist.push(cd)
  cd+=vec2.dist(v0, v1)
}

var draw = regl({
  frag: `
    precision highp float;
    varying float vdist, vcdist;
    varying vec2 vuv;
    uniform float width, period, duty;
    void main() {
      float freq = period;
      float scap = step(vuv.x, 0.0);
      float ecap = step(vdist, vuv.x);
      float bcap = (1.0-scap)*(1.0-ecap);
      if (scap > 0.5 && length(vuv) > width) discard;
      vec2 buv = vec2(vdist,0);
      if (ecap > 0.5 && distance(vuv,buv) > width) discard;
      float uu = mod((clamp(0.0, vdist, vuv.x) + vcdist)/freq, 1.0);
      float x = step(duty, uu);
      if (x > 0.5) discard;
      gl_FragColor = vec4(x, 0.0, 1.0, 1.0);
    }`,
  vert: `
    precision highp float;
    uniform float width;
    attribute float cdist;
    attribute vec2 position, pointA, pointB;
    varying float vdist, vcdist;
    varying vec2 vuv;
    void main() {
      vec2 n = normalize(vec2(pointA.y-pointB.y, pointB.x-pointA.x));
      vec2 d = normalize(pointA-pointB);
      vdist = distance(pointA,pointB);
      vuv = vec2(
        mix(-width, vdist+width, position.x*0.5+0.5),
        mix(-width, width, position.y*0.5+0.5)
      );
      vec2 na = mix(-n,n,position.y*0.5+0.5);
      vec2 nb = mix(n,-n,position.y*0.5+0.5);
      vec2 p = mix(
        pointA+(d+na)*width,
        pointB-(d+nb)*width,
        position.x*0.5+0.5 
      );
      vcdist = cdist;
      gl_Position = vec4(p, 0, 1);
    }`,
  uniforms: {
    width: line.width,
    period: line.period,
    duty: line.duty,
  },
  attributes: {
    position: [-1,-1, -1,1, 1,1, 1,-1],
    pointA: {
      buffer: regl.buffer(line.points),
      divisor: 1,
      offset: 0
    },
    pointB: {
      buffer: regl.buffer(line.points),
      divisor: 1,
      offset: 8
    },
    cdist: {
      buffer: regl.buffer(line.cdist),
      divisor: 1,
      offset: 0
    },
  },
  elements: [0,1,2, 2,3,0],
  primitive: "triangles",
  depth: { enable: false },
  instances: line.points.length/2-1,
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

frame()

window.addEventListener('resize', frame)

function frame () {
  regl.poll()
  regl.clear({ color: [0, 0, 0, 1] })
  draw()
}
