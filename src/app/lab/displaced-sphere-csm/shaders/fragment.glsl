varying float vPattern;

uniform float uGradientStrength;
uniform vec3 uColor;

void main() {
    vec3 color = pow(vPattern, uGradientStrength) * uColor;

    csm_DiffuseColor = vec4(color, 1.);
}
