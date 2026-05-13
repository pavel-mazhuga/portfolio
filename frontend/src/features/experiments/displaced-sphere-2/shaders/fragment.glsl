vec3 ambientLight(vec3 lightColor, float lightIntensity) {
    return lightColor * lightIntensity;
}

vec3 directionalLight(vec3 lightColor, float lightIntensity, vec3 normal, vec3 lightPosition, vec3 viewDirection, float specularPower) {
    vec3 lightDirection = normalize(lightPosition);
    vec3 lightReflection = reflect(-lightDirection, normal);

    float shading = dot(normal, lightDirection);
    shading = max(0.0, shading);

    float specular = -dot(lightReflection, viewDirection);
    specular = max(0.0, specular);
    specular = pow(specular, specularPower);

    return lightColor * lightIntensity * (shading + specular);
}

varying vec3 vNormal;
varying vec3 vViewDirection;
varying float vPattern;

uniform float uGradientStrength;
uniform vec3 uColor;
uniform vec3 uAmbientLightColor;
uniform float uAmbientLightIntensity;
uniform vec3 uDirectionalLightColor;
uniform float uDirectionalLightIntensity;
uniform vec3 uDirectionalLightPosition;

void main() {
    vec3 color = pow(vPattern, uGradientStrength) * uColor;

    vec3 light = vec3(0.);
    light += ambientLight(uAmbientLightColor, uAmbientLightIntensity);
    light += directionalLight(uDirectionalLightColor, uDirectionalLightIntensity, vNormal, uDirectionalLightPosition, vViewDirection, 20.);

    color *= light;

    gl_FragColor = vec4(color, 1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
