uniform vec3 uColor;

void main() {
    vec3 color = uColor;
    gl_FragColor = vec4(color, 1.0);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
