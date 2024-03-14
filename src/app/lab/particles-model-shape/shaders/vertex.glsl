uniform sampler2D uPositions;
uniform float uTime;
uniform float uParticleSize;

void main() {
    vec3 pos = texture2D(uPositions, position.xy).xyz;

    vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;

    gl_Position = projectedPosition;

    // Size attenuation;
    gl_PointSize = (1.0 / -viewPosition.z) * uParticleSize;
}
