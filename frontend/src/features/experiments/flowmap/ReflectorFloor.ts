import { reflector } from 'three/tsl';
import { Mesh, MeshStandardNodeMaterial, PlaneGeometry, TextureLoader } from 'three/webgpu';

export class ReflectorFloor extends Mesh<PlaneGeometry, MeshStandardNodeMaterial> {
    private readonly groundReflector = reflector({ resolutionScale: 1, generateMipmaps: true });

    constructor(roughnessMapUrl: string) {
        const geometry = new PlaneGeometry(20, 20, 100, 100);

        const material = new MeshStandardNodeMaterial({
            color: 0xf0f0f0,
            metalness: 0,
            roughness: 1,
        });

        super(geometry, material);

        this.rotation.x = -Math.PI / 2;
        this.rotation.z = Math.PI / 2;
        this.position.y = -0.5;

        const roughnessMap = new TextureLoader().load(roughnessMapUrl);

        material.roughnessMap = roughnessMap;
        material.roughness = 1;

        material.colorNode = this.groundReflector;

        this.add(this.groundReflector.target);
    }

    dispose() {
        this.geometry.dispose();
        this.material.roughnessMap?.dispose();
        this.material.dispose();
        this.groundReflector.dispose();
    }
}
