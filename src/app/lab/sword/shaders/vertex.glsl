uniform sampler2D uPositions;
uniform float uSize;

void main() {
    vec3 pos = texture(uPositions, position.xy).rgb;
    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;
    gl_PointSize = (1.0 / -viewPosition.z) * 10. * uSize;
}
