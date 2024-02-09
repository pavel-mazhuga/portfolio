uniform float uTime;

varying float vDistance;

void main() {
    vec3 color = vec3(0.12, 0.72, 0.87);
    float strength = distance(gl_PointCoord, vec2(0.5));
    strength = 1.0 - strength;
    strength = pow(strength, 3.);
    color = mix(color, vec3(0.97, 0.7, 0.45), vDistance * 0.5);
    color = mix(vec3(0.), color, strength);

    gl_FragColor = vec4(color, 1.);
    #include <colorspace_fragment>
}
