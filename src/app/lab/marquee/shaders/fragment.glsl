varying vec2 vUv;
uniform float uTime;
uniform sampler2D uMap;

void main() {
    vec2 uv = vUv;
    uv.y += uTime * 0.1;
    uv.y = fract(uv.y);

    gl_FragColor = texture2D(uMap, uv);
    #include <colorspace_fragment>
}