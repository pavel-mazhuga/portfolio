varying vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
