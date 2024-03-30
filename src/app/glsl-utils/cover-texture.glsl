#pragma glslify: coverTextureUv = require('./cover-texture-uv.glsl')

vec4 coverTexture(sampler2D tex, vec2 imgSize, vec2 planeSize, vec2 ouv) {
    return texture(tex, coverTextureUv(imgSize, planeSize, ouv));
}

#pragma glslify: export(coverTexture)
