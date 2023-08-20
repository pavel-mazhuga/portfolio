float fresnel(vec3 eyeVector, vec3 worldNormal, float power) {
    float fresnelFactor = abs(dot(eyeVector, worldNormal));
    float inversefresnelFactor = 1.0 - fresnelFactor;
    
    return pow(inversefresnelFactor, power);
}

#pragma glslify: export(fresnel)
