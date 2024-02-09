uniform float uTime;
uniform float uPointSize;
uniform float uRadius;

varying float vDistance;

mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

void main() {
    float distanceFactor = pow(uRadius - distance(position, vec3(0.)), 2.0);
    vDistance = distanceFactor;
    float size = distanceFactor * 1.25;
    vec3 particlePosition = position * rotation3dY(uTime * 0.2 * distanceFactor);

    vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = (1.0 / -viewPosition.z) * size * uPointSize;
}
