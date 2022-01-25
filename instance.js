var regl = require('regl')({ extensions: ['angle_instanced_arrays'] })
var mat4 = require('gl-mat4')
var vec2Dist = require('gl-vec2/distance')

var pixelRatio = window.devicePixelRatio

var testLine = [
  [0, -0.5],
  [1, -0.5],
  [1, 0.5],
  [0, -0.5],
  [1, 0.5],
  [0, 0.5]
];

var projection = mat4.ortho(
	mat4.create(),
	-regl._gl.canvas.width / 2,
	regl._gl.canvas.width / 2,
	-regl._gl.canvas.height / 2,
	regl._gl.canvas.height / 2,
	0,
	-1
);

var viewport = {
  x: 0,
  y: 0,
  width: regl._gl.canvas.width,
  height: regl._gl.canvas.height
}

function generateSamplePointsInterleaved(width, height) {
  const stepx = width / 9;
  const stepy = height / 3;
  const points = [];
  for (let x = 1; x < 9; x += 2) {
    points.push([(x + 0) * stepx - width / 2, 1 * stepy - height / 2]);
    points.push([(x + 1) * stepx - width / 2, 2 * stepy - height / 2]);
  }
  return points;
}

var pointData = generateSamplePointsInterleaved(
  regl._gl.canvas.width,
  regl._gl.canvas.height
);

function vec2dist (a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

var dist = Array((pointData.length-1)*2).fill(0)

function computeDist (dist, pos) {
  var prevPoint = pos[0]
  var cd = 0
  for (var i=0; i<pos.length-1; i++) {
    var point = pos[i+1]
    var d = vec2Dist(point, prevPoint)
    dist[2*i] = d
    dist[2*i+1] = cd
    cd += d
    prevPoint = point
  }
  return dist
}

computeDist(dist, pointData)

console.log(dist)

var line = {
  positions: testLine,
  color: [0, 0.8, 0, 1],
  dashColor: [0.8, 0, 0, 1],
  projection: projection,
  width: viewport.width / 18,
  viewport,
  points: pointData,
  dist,
  pixelRatio
}

var draw = regl({
  frag: `
    precision highp float;
    uniform vec4 color, dashColor;
    uniform float pixelRatio;
    varying vec2 vPosition, vDist;

    void main() {
      gl_FragColor = vec4(vec3(mod((vPosition.x*vDist.x+vDist.y)/30.0, 1.0)),1);
      //gl_FragColor = vec4(vPosition.x*vDist.x, 0, 0, 1.0);
    }`,
  vert: `
    precision highp float;
    attribute vec2 dist;
    attribute vec2 position;
    attribute vec2 pointA, pointB;
    uniform float width;
    uniform vec4 color;
    uniform mat4 projection;
    varying vec2 vPosition, vDist;

    void main() {
      vDist = dist;
      vPosition = position;
      vec2 xBasis = pointB - pointA;
      vec2 yBasis = normalize(vec2(-xBasis.y, xBasis.x));
      vec2 point = pointA + xBasis * position.x + yBasis * width * position.y;
      gl_Position = projection * vec4(point, 0, 1);
    }`,
  attributes: {
    position: {
      buffer: regl.buffer(line.positions),
      divisor: 0
    },
    dist: {
      buffer: regl.buffer(line.dist),
      divisor: 1
    },
    pointA: {
      buffer: regl.buffer(line.points),
      divisor: 1,
      offset: Float32Array.BYTES_PER_ELEMENT * 0
    },
    pointB: {
      buffer: regl.buffer(line.points),
      divisor: 1,
      offset: Float32Array.BYTES_PER_ELEMENT * 2
    },
  },
  uniforms: {
    width: line.width,
    color: line.color,
    dashColor: line.dashColor,
    projection: line.projection,
    pixelRatio: line.pixelRatio
  },
  cull: {
    enable: true,
    face: "back"
  },
  depth: {
    enable: false
  },
  count: line.positions.length,
  instances: line.points.length-1,
  viewport: line.viewport
});

regl.frame(function () {
  regl.clear({ color: [0,0,0,1] })
  draw()
})
