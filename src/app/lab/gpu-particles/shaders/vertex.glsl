uniform float uTime;
uniform float uPointSize;
uniform float uRadius;
uniform vec2 uPointer;
uniform float uPower;
uniform float uSpeed;

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
    float distanceFactor = pow(uRadius - distance(position, vec3(0.)), uPower);
    vDistance = distanceFactor;
    float size = 1.2 + distanceFactor * 0.5;
    vec3 particlePosition = position * rotation3dY(uTime * uSpeed * distanceFactor);

    vec4 modelPosition = modelMatrix * vec4(particlePosition, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;

    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = (1.0 / -viewPosition.z) * size * uPointSize;
}
