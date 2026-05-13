import { Fn, dot, float, max, normalize, pow, reflect } from 'three/tsl';
import type { Node } from 'three/webgpu';

export const directionalLightNode = Fn(
    ([lightColor, lightIntensity, normal, lightPosition, viewDirection, specularPower]: [
        Node<'vec3'>,
        Node<'float'>,
        Node<'vec3'>,
        Node<'vec3'>,
        Node<'vec3'>,
        Node<'float'>,
    ]) => {
        const lightDirection = normalize(lightPosition);
        const lightReflection = reflect(lightDirection.negate(), normal);

        // Shading
        const shading = dot(normal, lightDirection).toVar();

        shading.assign(max(float(0), shading));

        // Specular
        const specular = dot(lightReflection, viewDirection).negate().toVar();

        specular.assign(max(float(0), specular));
        specular.assign(pow(specular, specularPower));

        return lightColor.mul(lightIntensity).mul(shading.add(specular));
    },
);
