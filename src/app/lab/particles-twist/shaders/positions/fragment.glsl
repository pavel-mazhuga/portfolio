#include "../../../../../../lygia/generative/snoise.glsl"

uniform float uTime;
uniform float uDeltaTime;
uniform sampler2D uInitialPositions;

mat3 rotation3dY(float angle) {
    float s = sin(angle);
    float c = cos(angle);
    return mat3(
        c, 0.0, -s,
        0.0, 1.0, 0.0,
        s, 0.0, c
    );
}

void main() {
    float time = uTime * 0.05;
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 data = texture(uPositions, uv);
    // data.xyz = mix(vec3(0.), data.xyz, min(1., uTime));
    vec4 initialData = texture(uInitialPositions, uv);

    if (data.a >= 1.) {
        // Particle is dead

        data.a = 0.;
        data = initialData;
    } else {
        // Particle is alive

        data.a += uDeltaTime;
        data.xyz *= rotation3dY(uDeltaTime * 2.);

        vec3 flowField = normalize(vec3(
                    snoise(vec4(data.xyz, time)) * 0.5,
                    abs(snoise(vec4(data.xyz + 1., time * 3.))),
                    snoise(vec4(data.xyz + 2., time))
                ));

        data.xyz += flowField * uDeltaTime;
        // data.xyz = mix(vec3(0.), data.xyz, data.y - 1.);
    }

    gl_FragColor = data;
}
