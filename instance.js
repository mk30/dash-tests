var regl = require('regl')({ extensions: ['angle_instanced_arrays'] })
var mat4 = require('gl-mat4')

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

var line = {
  positions: testLine,
  color: [0, 0.8, 0, 1],
  projection: projection,
  width: viewport.width / 18,
  viewport: viewport,
  points: pointData
}

var draw = regl({
  frag: `
    precision highp float;
    uniform vec4 color;
    void main() {
      gl_FragColor = color;
    }`,
  vert: `
    precision highp float;
    attribute vec2 position;
    attribute vec2 pointA, pointB;
    uniform float width;
    uniform mat4 projection;

    void main() {
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
    pointA: {
      buffer: regl.buffer(line.points),
      divisor: 1,
      offset: Float32Array.BYTES_PER_ELEMENT * 0
    },
    pointB: {
      buffer: regl.buffer(line.points),
      divisor: 1,
      offset: Float32Array.BYTES_PER_ELEMENT * 2
    }
  },
  uniforms: {
    width: line.width,
    color: line.color,
    projection: line.projection
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

/*
const demo = require("./demo");

demo.diagonalDemo(
  function(params) {
    return {
      interleavedStrip: commands.interleavedStrip(params.regl)
    };
  },
  function(params) {
    params.context.interleavedStrip({
      //points: params.buffer,
      //width: params.canvas.width / 18,
      //projection: params.projection,
      //viewport: params.viewport,
      //segments: params.pointData.length - 1
    });
  }
);
*/
