import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
    attribute,
    clamp,
    cos,
    dot,
    float,
    mix,
    mx_fractal_noise_vec3,
    mx_noise_float,
    normalLocal,
    normalize,
    positionLocal,
    pow,
    sin,
    time,
    uniform,
    vec3,
} from 'three/tsl';
import {
    Box3,
    Color,
    Group,
    IcosahedronGeometry,
    InstancedBufferAttribute,
    InstancedMesh,
    Matrix3,
    Mesh,
    MeshBasicNodeMaterial,
    type Node,
    Object3D,
    UniformNode,
    Vector3,
} from 'three/webgpu';
import { HOLOGRAM_DEFAULTS } from './hologramDefaults';

export type HologramGeometry = {
    positions: Float32Array;
    normals: Float32Array;
};

export type HologramParticleParams = {
    -readonly [Key in keyof typeof HOLOGRAM_DEFAULTS]: (typeof HOLOGRAM_DEFAULTS)[Key];
};

export class ShadowedParticles extends Group {
    readonly params: HologramParticleParams;
    readonly rotGroup: Group;
    readonly instancedMesh: InstancedMesh<IcosahedronGeometry, MeshBasicNodeMaterial>;

    readonly posAttr: InstancedBufferAttribute;
    readonly normAttr: InstancedBufferAttribute;
    readonly posAttrTarget: InstancedBufferAttribute;
    readonly normAttrTarget: InstancedBufferAttribute;

    uniforms: {
        color: UniformNode<'color', Color>;
        floatAmp: UniformNode<'float', number>;
        sphereSize: UniformNode<'float', number>;
        ambient: UniformNode<'float', number>;
        wrap: UniformNode<'float', number>;
        light1Pos: UniformNode<'vec3', Vector3>;
        light1Color: UniformNode<'color', Color>;
        light1Intensity: UniformNode<'float', number>;
        light2Pos: UniformNode<'vec3', Vector3>;
        light2Color: UniformNode<'color', Color>;
        light2Intensity: UniformNode<'float', number>;
        volumeStrength: UniformNode<'float', number>;
        noiseAmp: UniformNode<'float', number>;
        noiseScale: UniformNode<'float', number>;
        noiseSpeed: UniformNode<'float', number>;
        noiseGain: UniformNode<'float', number>;
        maskScale: UniformNode<'float', number>;
        maskSpeed: UniformNode<'float', number>;
        maskContrast: UniformNode<'float', number>;
        mousePos: UniformNode<'vec3', Vector3>;
        mouseVel: UniformNode<'vec3', Vector3>;
        mouseRadius: UniformNode<'float', number>;
        mouseStrength: UniformNode<'float', number>;
        mouseScatter: UniformNode<'float', number>;
        mouseGlowColor: UniformNode<'color', Color>;
        mouseGlowPassive: UniformNode<'float', number>;
        mouseGlowActive: UniformNode<'float', number>;
        mouseGlowPow: UniformNode<'float', number>;
        mouseGlowEnergy: UniformNode<'float', number>;
        transitionProgress: UniformNode<'float', number>;
        transitionGlowScale: UniformNode<'float', number>;
        entranceGlow: UniformNode<'float', number>;
    };

    static async sampleGLBGeometry(url: string, particleCount: number): Promise<HologramGeometry> {
        const gltf = await new GLTFLoader().loadAsync(url);

        const bbox = new Box3().setFromObject(gltf.scene);
        const centre = new Vector3();

        bbox.getCenter(centre);
        gltf.scene.position.sub(centre);
        gltf.scene.updateMatrixWorld(true);

        const bbox2 = new Box3().setFromObject(gltf.scene);
        const size = new Vector3();

        bbox2.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);

        gltf.scene.scale.setScalar(maxDim > 0 ? 3 / maxDim : 1);
        gltf.scene.updateMatrixWorld(true);

        const bbox3 = new Box3().setFromObject(gltf.scene);
        const center = new Vector3();

        bbox3.getCenter(center);
        gltf.scene.position.sub(center);
        gltf.scene.updateMatrixWorld(true);

        const meshes: Mesh[] = [];

        gltf.scene.traverse((child: Object3D) => {
            if ((child as Mesh).isMesh) {
                meshes.push(child as Mesh);
            }
        });

        const positions = new Float32Array(particleCount * 3);
        const normals = new Float32Array(particleCount * 3);
        const tempPos = new Vector3();
        const tempNorm = new Vector3();
        const normMatrix = new Matrix3();

        let filled = 0;
        const perMesh = Math.floor(particleCount / meshes.length);

        for (let m = 0; m < meshes.length; m++) {
            const mesh = meshes[m];
            const count = m < meshes.length - 1 ? perMesh : particleCount - filled;

            normMatrix.getNormalMatrix(mesh.matrixWorld);
            const sampler = new MeshSurfaceSampler(mesh).build();

            for (let i = 0; i < count; i++) {
                sampler.sample(tempPos, tempNorm);
                mesh.localToWorld(tempPos);
                tempNorm.applyMatrix3(normMatrix).normalize();

                const b = (filled + i) * 3;

                positions[b] = tempPos.x;
                positions[b + 1] = tempPos.y;
                positions[b + 2] = tempPos.z;
                normals[b] = tempNorm.x;
                normals[b + 1] = tempNorm.y;
                normals[b + 2] = tempNorm.z;
            }

            filled += count;
        }

        const centroid = new Vector3();

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            centroid.x += positions[i3];
            centroid.y += positions[i3 + 1];
            centroid.z += positions[i3 + 2];
        }

        centroid.multiplyScalar(1 / particleCount);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;

            positions[i3] -= centroid.x;
            positions[i3 + 1] -= centroid.y;
            positions[i3 + 2] -= centroid.z;
        }

        return { positions, normals };
    }

    constructor(geometry: HologramGeometry, params: HologramParticleParams = HOLOGRAM_DEFAULTS) {
        super();

        this.params = params;
        this.position.set(params.modelX, params.modelY, params.modelZ);

        const particleCount = params.particleCount;
        const seeds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            seeds[i] = Math.random();
        }

        const sphereGeo = new IcosahedronGeometry(1, 0);

        this.posAttr = new InstancedBufferAttribute(new Float32Array(geometry.positions.length), 3);
        this.normAttr = new InstancedBufferAttribute(new Float32Array(geometry.normals.length), 3);
        this.posAttrTarget = new InstancedBufferAttribute(geometry.positions.slice(), 3);
        this.normAttrTarget = new InstancedBufferAttribute(geometry.normals.slice(), 3);

        sphereGeo.setAttribute('instanceSeed', new InstancedBufferAttribute(seeds, 1));
        sphereGeo.setAttribute('instanceNormal', this.normAttr);
        sphereGeo.setAttribute('instancePos', this.posAttr);
        sphereGeo.setAttribute('instanceNormalTarget', this.normAttrTarget);
        sphereGeo.setAttribute('instancePosTarget', this.posAttrTarget);

        this.uniforms = {
            color: uniform(new Color(params.color)),
            floatAmp: uniform(params.floatAmp),
            sphereSize: uniform(params.sphereSize),
            ambient: uniform(params.ambient),
            wrap: uniform(params.wrap),
            light1Pos: uniform(new Vector3(params.light1X, params.light1Y, params.light1Z)),
            light1Color: uniform(new Color(params.light1Color)),
            light1Intensity: uniform(params.light1Intensity),
            light2Pos: uniform(new Vector3(params.light2X, params.light2Y, params.light2Z)),
            light2Color: uniform(new Color(params.light2Color)),
            light2Intensity: uniform(params.light2Intensity),
            volumeStrength: uniform(params.volumeStrength),
            noiseAmp: uniform(params.noiseAmp),
            noiseScale: uniform(params.noiseScale),
            noiseSpeed: uniform(params.noiseSpeed),
            noiseGain: uniform(params.noiseGain),
            maskScale: uniform(params.maskScale),
            maskSpeed: uniform(params.maskSpeed),
            maskContrast: uniform(params.maskContrast),
            mousePos: uniform(new Vector3()),
            mouseVel: uniform(new Vector3()),
            mouseRadius: uniform(params.mouseRadius),
            mouseStrength: uniform(params.mouseStrength),
            mouseScatter: uniform(params.mouseScatter),
            mouseGlowColor: uniform(new Color(params.mouseGlowColor)),
            mouseGlowPassive: uniform(params.mouseGlowPassive),
            mouseGlowActive: uniform(params.mouseGlowActive),
            mouseGlowPow: uniform(params.mouseGlowPow),
            mouseGlowEnergy: uniform(0),
            transitionProgress: uniform(0),
            transitionGlowScale: uniform(params.transitionGlowScale),
            entranceGlow: uniform(1),
        };

        const u = this.uniforms;
        const material = new MeshBasicNodeMaterial();

        const seedAttr = attribute('instanceSeed', 'float') as Node<'float'>;
        const instNorm = attribute('instanceNormal', 'vec3') as Node<'vec3'>;
        const instPos = attribute('instancePos', 'vec3') as Node<'vec3'>;
        const instNormTgt = attribute('instanceNormalTarget', 'vec3') as Node<'vec3'>;
        const instPosTgt = attribute('instancePosTarget', 'vec3') as Node<'vec3'>;

        const blendPos = mix(instPos, instPosTgt, u.transitionProgress);
        const blendNorm = normalize(mix(instNorm, instNormTgt, u.transitionProgress));

        const phase = seedAttr.mul(Math.PI * 2);

        const floatDisp = vec3(
            cos(time.mul(1.3).add(phase)).mul(u.floatAmp).mul(0.6),
            sin(time.mul(1.6).add(phase)).mul(u.floatAmp),
            sin(time.mul(1.1).add(phase.add(1.0)))
                .mul(u.floatAmp)
                .mul(0.6),
        );

        const maskCoord = blendPos
            .mul(u.maskScale)
            .add(
                vec3(
                    time.mul(u.maskSpeed),
                    time.mul(u.maskSpeed).mul(0.7),
                    time.mul(u.maskSpeed).mul(1.3),
                ),
            );

        const rawMask = mx_noise_float(maskCoord);
        const mask = pow(clamp(rawMask.mul(0.5).add(0.5), float(0), float(1)), u.maskContrast);

        const noiseCoord = blendPos
            .mul(u.noiseScale)
            .add(vec3(time.mul(u.noiseSpeed), float(0), time.mul(u.noiseSpeed).mul(0.7)));

        const noiseDisp = mx_fractal_noise_vec3(noiseCoord, float(2), float(2.0), u.noiseGain)
            .mul(u.noiseAmp)
            .mul(mask);

        const toMouse = u.mousePos.sub(blendPos);
        const dist = toMouse.length();
        const falloff = clamp(float(1.0).sub(dist.div(u.mouseRadius)), float(0), float(1));
        const impulseLen = u.mouseVel.length();
        const velDir = normalize(u.mouseVel.add(vec3(0.0001, 0.0001, 0.0001)));
        const rawRand = vec3(
            sin(seedAttr.mul(127.1)),
            cos(seedAttr.mul(311.7)),
            sin(seedAttr.mul(74.3).add(1.0)),
        );
        const randUnit = normalize(rawRand);
        const onAxis = velDir.mul(dot(randUnit, velDir));
        const perpToVel = normalize(randUnit.sub(onAxis).add(vec3(0, 0.0001, 0)));
        const mouseDisp = velDir
            .add(perpToVel.mul(u.mouseScatter))
            .mul(impulseLen)
            .mul(u.mouseStrength)
            .mul(falloff.mul(falloff));

        material.positionNode = positionLocal
            .mul(u.sphereSize)
            .add(blendPos)
            .add(floatDisp)
            .add(noiseDisp)
            .add(mouseDisp);

        const lightContrib = (
            lightPos: typeof u.light1Pos,
            lightCol: typeof u.light1Color,
            lightInt: typeof u.light1Intensity,
        ) => {
            const dir = normalize(lightPos.sub(blendPos));
            const figW = clamp(dot(blendNorm, dir).add(u.wrap).div(float(1.0).add(u.wrap)), float(0), float(1));
            const sphW = clamp(
                dot(normalize(normalLocal), dir)
                    .add(u.wrap)
                    .div(float(1.0).add(u.wrap)),
                float(0),
                float(1),
            );
            const diffuse = mix(figW, figW.mul(sphW), u.volumeStrength);

            return lightCol.mul(diffuse).mul(lightInt);
        };

        const litColor = lightContrib(u.light1Pos, u.light1Color, u.light1Intensity).add(
            lightContrib(u.light2Pos, u.light2Color, u.light2Intensity),
        );

        const lit = clamp(litColor.add(u.ambient), float(0), float(1));
        const shadedColor = lit.mul(u.color);

        const glowFalloff = pow(clamp(falloff, float(0), float(1)), u.mouseGlowPow);
        const passiveGlow = glowFalloff.mul(u.mouseGlowPassive);
        const activeGlow = glowFalloff.mul(u.mouseGlowEnergy).mul(u.mouseGlowActive);
        const mouseGlowFactor = clamp(passiveGlow.add(activeGlow), float(0), float(1));

        const morphActivity = u.transitionProgress.mul(float(1).sub(u.transitionProgress)).mul(float(4));
        const transDispMag = instPosTgt.sub(instPos).length();
        const transNorm = clamp(transDispMag.mul(float(0.35)), float(0), float(1));
        const transGlow = transNorm.mul(morphActivity).mul(u.transitionGlowScale);

        const glowFactor = clamp(mouseGlowFactor.add(transGlow), float(0), float(1)).mul(u.entranceGlow);

        material.colorNode = mix(shadedColor, u.mouseGlowColor, glowFactor);

        this.instancedMesh = new InstancedMesh(sphereGeo, material, particleCount);
        this.instancedMesh.instanceMatrix.needsUpdate = true;

        this.rotGroup = new Group();
        this.rotGroup.add(this.instancedMesh);
        this.add(this.rotGroup);
    }

    syncUniformsFromParams() {
        const p = this.params;
        const u = this.uniforms;

        u.color.value.set(p.color);
        u.floatAmp.value = p.floatAmp;
        u.sphereSize.value = p.sphereSize;
        u.ambient.value = p.ambient;
        u.wrap.value = p.wrap;
        u.light1Pos.value.set(p.light1X, p.light1Y, p.light1Z);
        u.light1Color.value.set(p.light1Color);
        u.light1Intensity.value = p.light1Intensity;
        u.light2Pos.value.set(p.light2X, p.light2Y, p.light2Z);
        u.light2Color.value.set(p.light2Color);
        u.light2Intensity.value = p.light2Intensity;
        u.volumeStrength.value = p.volumeStrength;
        u.noiseAmp.value = p.noiseAmp;
        u.noiseScale.value = p.noiseScale;
        u.noiseSpeed.value = p.noiseSpeed;
        u.noiseGain.value = p.noiseGain;
        u.maskScale.value = p.maskScale;
        u.maskSpeed.value = p.maskSpeed;
        u.maskContrast.value = p.maskContrast;
        u.mouseRadius.value = p.mouseRadius;
        u.mouseStrength.value = p.mouseStrength;
        u.mouseScatter.value = p.mouseScatter;
        u.mouseGlowColor.value.set(p.mouseGlowColor);
        u.mouseGlowPassive.value = p.mouseGlowPassive;
        u.mouseGlowActive.value = p.mouseGlowActive;
        u.mouseGlowPow.value = p.mouseGlowPow;
        u.transitionGlowScale.value = p.transitionGlowScale;
        this.position.set(p.modelX, p.modelY, p.modelZ);
    }

    dispose() {
        this.instancedMesh.geometry.dispose();
        this.instancedMesh.material.dispose();
    }
}
