uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uProgress;

void main() {
    vec3 color = mix(uColorA, uColorB, uProgress);
    gl_FragColor = vec4(color, 1.0);

    #include <colorspace_fragment>
}
