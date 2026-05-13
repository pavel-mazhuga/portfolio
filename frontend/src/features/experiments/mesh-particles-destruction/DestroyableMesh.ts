import gsap from 'gsap';
import {
    Discard,
    Fn,
    hash,
    instanceIndex,
    instancedBufferAttribute,
    mix,
    not,
    positionLocal,
    range,
    shapeCircle,
    time,
    uniform,
    varying,
    vec3,
} from 'three/tsl';
import {
    BufferGeometry,
    Group,
    InstancedBufferAttribute,
    InstancedMesh,
    Mesh,
    type Node,
    NodeMaterial,
} from 'three/webgpu';
import { compose } from '../lib/nodes/compose';
import { rotationXYZ } from '../lib/nodes/rotation-xyz';

export class DestroyableMesh extends Group {
    mesh: Mesh<BufferGeometry, NodeMaterial>;
    particles: InstancedMesh;
    isDead = false;
    startTime = uniform(0);
    private opacityTween?: gsap.core.Tween;

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

        const lifeRange = mix(this.uniforms.lifeMin, this.uniforms.lifeMax, hash(instanceIndex));
        const speed = mix(this.uniforms.speedMin, this.uniforms.speedMax, hash(instanceIndex.add(7919)));
        const scaledTime = time.sub(this.startTime).mul(speed);
        const lifeTime = varying(scaledTime.mul(lifeRange), 'lifeTime');
        const life = varying(lifeTime.div(lifeRange), 'life');

        particlesMaterial.colorNode = Fn(() => {
            Discard(not(shapeCircle() as unknown as Node<'bool'>));

            return this.mesh.material.colorNode;
        })();

        particlesMaterial.positionNode = Fn(() => {
            const pos = positionLocal.add(instancedBufferAttribute(positions));

            pos.addAssign(range(vec3(-1, -5, -1), vec3(1, -1, 1)).mul(lifeTime.mul(life)));

            const iMat = compose(pos.xyz, rotationXYZ(vec3(0)), vec3(life.clamp(0, 1).negate()));

            return iMat.mul(positionLocal);
        })();

        return new InstancedMesh(geometry, particlesMaterial, positionAttribute.count);
    }

    destroy(startTime: number) {
        if (this.isDead) return;
        this.isDead = true;
        this.startTime.value = startTime;
        this.particles.visible = true;

        gsap.killTweensOf(this.mesh.material);
        this.opacityTween = gsap.to(this.mesh.material, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.inOut',
            onComplete: () => {
                this.mesh.visible = false;
            },
        });
    }

    reset() {
        this.isDead = false;
        this.startTime.value = 0;
        this.mesh.visible = true;
        this.mesh.material.opacity = 1;
        this.particles.visible = false;
        gsap.killTweensOf(this.mesh.material);
        this.opacityTween?.kill();
        this.opacityTween = undefined;
    }

    dispose() {
        gsap.killTweensOf(this.mesh.material);
        this.opacityTween?.kill();

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
