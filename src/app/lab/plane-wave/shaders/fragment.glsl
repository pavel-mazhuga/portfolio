uniform vec2 planeSize;
uniform vec2 sizeImage;
uniform sampler2D image;

varying vec2 vUv;
varying float vPosZ;

vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 ouv) {
    vec2 s = planeSize;
    vec2 i = imgSize;
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = ouv * s / new + offset;

    return texture2D(tex, uv);
}    

void main() {
    vec2 uv = vUv;

    gl_FragColor = coverTexture(image, sizeImage, uv);
    gl_FragColor.rgb *= 1.0 - smoothstep(1.0, -4.0, vPosZ);
}