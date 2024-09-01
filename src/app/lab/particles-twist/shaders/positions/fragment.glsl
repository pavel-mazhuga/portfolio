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
    vec4 initialData = texture(uInitialPositions, uv);

    if (data.a >= 1.) {
        // Particle is dead

        data.a = 0.;
        data = initialData;
    } else {
        // Particle is alive

        data.a += uDeltaTime;
        data.xyz *= rotation3dY(max(0.03, distance(initialData.xyz, vec3(0.)) * 0.03));

        vec3 flowField = normalize(vec3(
                    snoise(vec4(data.xyz, time * 0.5)) * 0.5,
                    abs(snoise(vec4(data.xyz + 1., time))),
                    snoise(vec4(data.xyz + 2., time * 0.5)) * 0.5
                ));

        data.xyz += flowField * uDeltaTime;
    }

    gl_FragColor = data;
}
