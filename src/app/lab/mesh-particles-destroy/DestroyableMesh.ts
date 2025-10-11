import { AnimationPlaybackControls, animate } from 'framer-motion';
import {
    Fn,
    instancedBufferAttribute,
    positionLocal,
    range,
    shapeCircle,
    time,
    uniform,
    varying,
    vec3,
    vec4,
} from 'three/tsl';
import { BufferGeometry, Group, InstancedBufferAttribute, InstancedMesh, Mesh, NodeMaterial } from 'three/webgpu';
import { rotationXYZ } from '@/app/tsl-utils/rotation/rotation-xyz';
import { compose } from '@/utils/webgpu/nodes/compose';

export class DestroyableMesh extends Group {
    mesh: Mesh<BufferGeometry, NodeMaterial>;
    particles: InstancedMesh;
    isDead = false;
    startTime = uniform(0);
    #animationControls: AnimationPlaybackControls | null = null;

    uniforms = {
        speedMin: uniform(1),
        speedMax: uniform(2),
        lifeMin: uniform(0.1),
        lifeMax: uniform(0.3),
    };

    constructor(geometry: BufferGeometry, material: NodeMaterial, particlesGeometry = geometry) {
        super();

        this.mesh = new Mesh(geometry, material);
        material.transparent = true;
        this.add(this.mesh);

        this.particles = this.#createParticles(particlesGeometry);
        this.particles.visible = false;
        this.add(this.particles);
    }

    #createParticles(geometry: BufferGeometry) {
        const positionAttribute = this.mesh.geometry.getAttribute('position');
        const positions = new InstancedBufferAttribute(new Float32Array(positionAttribute.array), 3);

        const particlesMaterial = this.mesh.material.clone();

        const lifeRange = range(this.uniforms.lifeMin, this.uniforms.lifeMax);
        const speed = range(this.uniforms.speedMin, this.uniforms.speedMax);
        const scaledTime = time.sub(this.startTime).mul(speed);
        const lifeTime = varying(scaledTime.mul(lifeRange), 'lifeTime');
        const life = varying(lifeTime.div(lifeRange), 'life');

        particlesMaterial.colorNode = Fn(() => {
            shapeCircle().not().discard();

            return vec4(this.mesh.material.colorNode);
        })();

        particlesMaterial.positionNode = Fn(() => {
            const pos = positionLocal.add(instancedBufferAttribute(positions));
            pos.addAssign(range(vec3(-1, -5, -1), vec3(1, -1, 1)).mul(lifeTime.mul(life)));

            const iMat = compose(pos.xyz, rotationXYZ(vec3(0)), vec3(life.clamp(0, 1).negate()));
            return iMat.mul(positionLocal);
        })();

        const particles = new InstancedMesh(geometry, particlesMaterial, positionAttribute.count);

        return particles;
    }

    destroy(startTime: number) {
        if (this.isDead) return;
        this.isDead = true;
        this.startTime.value = startTime;
        this.particles.visible = true;

        this.#animationControls = animate(
            this.mesh.material,
            { opacity: 0 },
            {
                duration: 0.4,
                ease: 'easeInOut',
                onComplete: () => {
                    this.mesh.visible = false;
                },
            },
        );
    }

    reset() {
        this.isDead = false;
        this.startTime.value = 0;
        this.mesh.visible = true;
        this.mesh.material.opacity = 1;
        this.particles.visible = false;
        this.#animationControls?.cancel();
    }

    dispose() {
        this.mesh.geometry.dispose();

        if (Array.isArray(this.mesh.material)) {
            this.mesh.material.forEach((material) => material.dispose());
        } else {
            this.mesh.material.dispose();
        }

        if (this.particles) {
            if (Array.isArray(this.particles.material)) {
                this.particles.material.forEach((material) => material.dispose());
            } else {
                this.particles.material.dispose();
            }
        }
    }
}
