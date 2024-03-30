uniform vec3 uColor;

void main() {
    vec2 uv = gl_PointCoord;
    float dist = distance(uv, vec2(0.5));
    vec4 color = vec4(vec3(smoothstep(dist - 0.2, dist + 0.2, 0.3)), 1.);
    color.rgb *= uColor;

    gl_FragColor = vec4(uColor, 1.);
    gl_FragColor = color;

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
