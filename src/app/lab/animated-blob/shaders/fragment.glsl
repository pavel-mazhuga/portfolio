uniform sampler2D u_matCapMap;

in vec3 vPos;
in vec3 vNormal;

void main() {
    // calculate matcap coordinates.
    vec3 n = normalize(vNormal);
    vec3 eye = normalize(vPos);
    vec3 r = reflect(eye, vNormal);
    float m = 2.0 * sqrt(pow(r.x, 2.0) + pow(r.y, 2.0) + pow(r.z + 1.2, 2.0));
    vec2 vN = r.xy / m + 0.5;
    // lookup matcap
    vec3 mat = texture(u_matCapMap, vN).rgb;

    gl_FragColor = vec4(mat, 1.0);
}
