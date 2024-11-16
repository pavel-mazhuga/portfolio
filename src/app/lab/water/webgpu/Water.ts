import {
    Discard,
    Fn,
    Mesh,
    MeshBasicNodeMaterial,
    PlaneGeometry,
    distance,
    mix,
    positionLocal,
    positionWorld,
    sin,
    smoothstep,
    timerLocal,
    vec2,
    vec3,
    vec4,
} from 'three/webgpu';
import { simplexNoise4d } from '@/utils/webgpu/nodes/noise/simplexNoise4d';

class Water extends Mesh {
    material: MeshBasicNodeMaterial;

    static get geometry() {
        const geometry = new PlaneGeometry(20, 20, 200, 200);
        geometry.rotateX(-Math.PI / 2);
        geometry.translate(0, 0, -5);
        return geometry;
    }

    constructor() {
        super();

        this.geometry = Water.geometry;
        this.material = new MeshBasicNodeMaterial();

        this.material.positionNode = Fn(() => {
            const position = positionLocal;
            const displacement = simplexNoise4d(
                vec4(positionWorld.x.mul(0.7), positionLocal.y.mul(positionWorld.z), positionWorld.z, timerLocal(0.5)),
            ).mul(0.2);
            position.y.addAssign(sin(displacement));

            return position;
        })();

        this.material.colorNode = Fn(() => {
            const color = vec4(vec3(mix(0, 0.4, positionLocal.y.add(0.2))), 1);
            color.assign(mix(vec3(0), color, smoothstep(-15, 0, positionLocal.z)));

            // Discard(distance(positionWorld.xz, vec2(0)).lessThan(2));

            return color;
        })();
    }
}

export default Water;
