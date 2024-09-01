void main() {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 data = texture(uPositions, uv);
    // data.y += 0.01;

    gl_FragColor = data;
}
