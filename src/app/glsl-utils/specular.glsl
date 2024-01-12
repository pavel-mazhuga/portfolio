float specular(vec3 light, vec3 normal, vec3 eyeVector, float shininess, float diffuseness) {
    vec3 lightVector = normalize(-light);
    vec3 halfVector = normalize(eyeVector + lightVector);
    // vec3 halfVector = normalize(eyeVector - lightVector); ???

    float NdotL = dot(normal, lightVector);
    float NdotH = dot(normal, halfVector);
    float NdotH2 = NdotH * NdotH;

    float kDiffuse = max(0.0, NdotL);
    float kSpecular = pow(NdotH2, shininess);

    return kSpecular + kDiffuse * diffuseness;
}

#pragma glslify: export(specular)
