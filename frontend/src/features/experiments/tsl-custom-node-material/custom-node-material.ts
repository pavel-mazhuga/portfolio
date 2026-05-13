import type { MeshPhysicalMaterialParameters } from 'three';
import {
    diffuseColor,
    normalLocal,
    positionLocal,
    pow,
    time,
    uniform,
    varyingProperty,
    vec4,
} from 'three/tsl';
import { MeshPhysicalNodeMaterial, NodeBuilder, type PropertyNode, type UniformNode } from 'three/webgpu';
import { simplexNoise4d } from '@/features/experiments/lib/nodes/noise/simplexNoise4d';
import { smoothMod } from '@/features/experiments/lib/nodes/smooth-mod';

export class CustomNodeMaterial extends MeshPhysicalNodeMaterial {
    displacementStrength: UniformNode<'float', number>;
    fractAmount: UniformNode<'float', number>;
    noiseStrength: UniformNode<'float', number>;
    gradientStrength: UniformNode<'float', number>;
    speed: UniformNode<'float', number>;
    #vPattern: PropertyNode<'float'>;

    constructor(params: MeshPhysicalMaterialParameters) {
        super(params);

        this.displacementStrength = uniform(1);
        this.fractAmount = uniform(3);
        this.noiseStrength = uniform(1);
        this.gradientStrength = uniform(1);
        this.speed = uniform(0);

        this.#vPattern = varyingProperty('float');
    }

    setupPosition(builder: NodeBuilder) {
        super.setupPosition(builder);

        const coords = normalLocal.toVar('coords');

        coords.y.subAssign(time.mul(this.speed));
        coords.addAssign(simplexNoise4d(vec4(coords, 1)).mul(this.noiseStrength));

        const pattern = smoothMod(coords.y.mul(this.fractAmount), 1, 3).smoothstep(0.4, 0.7).toVar('pattern');

        this.#vPattern.assign(pattern);

        positionLocal.addAssign(normalLocal.mul(pattern).mul(this.displacementStrength));

        return positionLocal;
    }

    setupDiffuseColor(builder: NodeBuilder) {
        super.setupDiffuseColor(builder);
        diffuseColor.mulAssign(pow(this.#vPattern, this.gradientStrength));
    }
}
