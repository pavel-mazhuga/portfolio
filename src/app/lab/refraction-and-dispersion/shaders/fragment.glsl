varying vec3 vNormal;
varying vec3 vEyeVector;

uniform vec2 winResolution;
uniform sampler2D uTexture;
uniform float uIorR; // red
uniform float uIorY; // yellow
uniform float uIorG; // green
uniform float uIorC; // cyan
uniform float uIorB; // blue
uniform float uIorV; // violet
uniform float uChromaticAberration;
uniform float uRefractPower;
uniform float uSaturation;
uniform float uShininess;
uniform float uDiffuseness;
uniform vec3 uLight;
uniform float uFresnelPower;

vec3 sat(vec3 rgb, float intensity) {
    vec3 luminance = vec3(0.2125, 0.7154, 0.721);
    vec3 grayscale = vec3(dot(rgb, luminance));

    return mix(grayscale, rgb, intensity);
}

float specular(vec3 light, float shininess, float diffuseness) {
    vec3 normal = vNormal;
    vec3 eyeVector = vEyeVector;
    vec3 lightVector = normalize(-light);
    vec3 halfVector = normalize(eyeVector + lightVector);

    float NdotL = dot(normal, lightVector);
    float NdotH = dot(normal, halfVector);
    float NdotH2 = NdotH * NdotH;

    float kDiffuse = max(0.0, NdotL);
    float kSpecular = pow(NdotH2, shininess);

    return kSpecular + kDiffuse * diffuseness;
}

float fresnel(vec3 eyeVector, vec3 worldNormal, float power) {
    float fresnelFactor = abs(dot(eyeVector, worldNormal));
    float inversefresnelFactor = 1.0 - fresnelFactor;
    
    return pow(inversefresnelFactor, power);
}

const int LOOP = 8;

void main() {
    vec2 uv = gl_FragCoord.xy / winResolution.xy;
    vec3 normal = vNormal;
    vec3 eyeVector = vEyeVector;

    vec3 color = vec3(0.);

    for ( int i = 0; i < LOOP; i ++ ) {
        float slide = float(i) / float(LOOP) * 0.1;

        vec3 refractVecR = refract(eyeVector, normal, 1. / uIorR);
        vec3 refractVecY = refract(eyeVector, normal, 1. / uIorY);
        vec3 refractVecG = refract(eyeVector, normal, 1. / uIorG);
        vec3 refractVecC = refract(eyeVector, normal, 1. / uIorC);
        vec3 refractVecB = refract(eyeVector, normal, 1. / uIorB);
        vec3 refractVecV = refract(eyeVector, normal, 1. / uIorV);
        
        float r = texture2D(uTexture, uv + refractVecR.xy * (uRefractPower + slide * 1.) * uChromaticAberration).x * 0.5;

        float y = (texture2D(uTexture, uv + refractVecY.xy * (uRefractPower + slide * 1.) * uChromaticAberration).x * 2. +
                texture2D(uTexture, uv + refractVecY.xy * (uRefractPower + slide * 1.) * uChromaticAberration).y * 2. -
                texture2D(uTexture, uv + refractVecY.xy * (uRefractPower + slide * 1.) * uChromaticAberration).z) / 6.;

        float g = texture2D(uTexture, uv + refractVecG.xy * (uRefractPower + slide * 2.) * uChromaticAberration).y * 0.5;

        float c = (texture2D(uTexture, uv + refractVecC.xy * (uRefractPower + slide * 2.5) * uChromaticAberration).y * 2. +
                texture2D(uTexture, uv + refractVecC.xy * (uRefractPower + slide * 2.5) * uChromaticAberration).z * 2. -
                texture2D(uTexture, uv + refractVecC.xy * (uRefractPower + slide * 2.5) * uChromaticAberration).x) / 6.;
          
        float b = texture2D(uTexture, uv + refractVecB.xy * (uRefractPower + slide * 3.) * uChromaticAberration).z * 0.5;

        float v = (texture2D(uTexture, uv + refractVecV.xy * (uRefractPower + slide * 1.) * uChromaticAberration).z * 2. +
                    texture2D(uTexture, uv + refractVecV.xy * (uRefractPower + slide * 1.) * uChromaticAberration).x * 2. -
                    texture2D(uTexture, uv + refractVecV.xy * (uRefractPower + slide * 1.) * uChromaticAberration).y) / 6.;

        float R = r + (2. * v + 2. * y - c) / 3.;
        float G = g + (2. * y + 2. * c - v) / 3.;
        float B = b + (2. * c + 2. * v - y) / 3.;

        color.r += R;
        color.g += G;
        color.b += B;

        color = sat(color, uSaturation);
    }

    // Normalizing color
    color /= float(LOOP);

    // float ior = 1.06;
    // vec3 refractVec = refract(eyeVector, normal, 1. / ior);
    // color = texture2D(uTexture, uv + refractVec.xy * uRefractPower).rgb;

    // Specular
    float specularLight = specular(uLight, uShininess, uDiffuseness);
    color += specularLight;

    // Fresnel
    float f = fresnel(eyeVector, normal, uFresnelPower);
    color.rgb += f * vec3(0.85);

    gl_FragColor = vec4(color, 1.);
}
