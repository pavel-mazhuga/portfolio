uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor;

varying vec3 vPosition;

void main() {
    vec2 uv = gl_PointCoord;
    float dist = distance(uv, vec2(0.5));
    vec3 color = vec3(step(dist, 0.3)) * uColor;
    float alpha = 1. - abs(vPosition.y) * 2.;

    gl_FragColor = vec4(color, alpha);
    #include <colorspace_fragment>
}
