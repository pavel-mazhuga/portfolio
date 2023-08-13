varying vec3 vNormal;
varying vec3 vEyeVector;

void main() {
    vNormal = normalize(modelMatrix * vec4(normal, 0.)).xyz;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vEyeVector = normalize(worldPos.xyz - cameraPosition);
    vec4 mvPosition = viewMatrix * worldPos;

    gl_Position = projectionMatrix * mvPosition;
}
