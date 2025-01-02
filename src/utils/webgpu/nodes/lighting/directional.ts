import { Fn, ShaderNodeObject, dot, max, normalize, pow, reflect } from 'three/tsl';
import { Node } from 'three/webgpu';

export const directionalLightNode = Fn<ShaderNodeObject<Node>[]>(
    ([lightColor, lightIntensity, normal, lightPosition, viewDirection, specularPower]) => {
        const lightDirection = normalize(lightPosition);
        const lightReflection = reflect(lightDirection.negate(), normal);

        // Shading
        const shading = dot(normal, lightDirection).toVar();
        shading.assign(max(0, shading));

        // Specular
        const specular = dot(lightReflection, viewDirection).negate().toVar();
        specular.assign(max(0, specular));
        specular.assign(pow(specular, specularPower));

        return lightColor.mul(lightIntensity).mul(shading.add(specular));
    },
);
