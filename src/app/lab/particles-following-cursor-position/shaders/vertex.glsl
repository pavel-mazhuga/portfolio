attribute vec3 aColor;
attribute float aSize;
uniform sampler2D uPositions;
uniform float uTime;
varying float vDistance;
varying vec3 vColor;

void main() {
    vColor = aColor;
    vec4 data = texture(uPositions, position.xy);
    vDistance = data.a;
    vec3 pos = data.xyz;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    gl_PointSize = 100.0;
    gl_PointSize *= aSize;
    gl_PointSize *= (1.0 / -viewPosition.z);
}
