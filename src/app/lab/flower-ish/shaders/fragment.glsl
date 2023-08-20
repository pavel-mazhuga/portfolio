varying float vPattern;

void main() {
    vec3 color = vec3(vPattern) * vec3(253. / 255., 206. / 255., 223. / 255.);

    gl_FragColor = vec4(color, 1.);
}
