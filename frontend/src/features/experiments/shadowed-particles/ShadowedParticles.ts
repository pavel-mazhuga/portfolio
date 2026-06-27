import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import {
    Fn,
    attribute,
    clamp,
    cos,
    dot,
    float,
    mix,
    mx_fractal_noise_vec3,
    mx_noise_float,
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

export type ShadowedParticlesGeometry = {
    positions: Float32Array;
    normals: Float32Array;
};

export type ShadowedParticlesParams = {
    color: string;
    floatAmp: number;
    sphereSize: number;
    ambient: number;
    wrap: number;
    light1X: number;
    light1Y: number;
    light1Z: number;
    light1Color: string;
    light1Intensity: number;
    light2X: number;
    light2Y: number;
    light2Z: number;
    light2Color: string;
    light2Intensity: number;
    volumeStrength: number;
    noiseAmp: number;
    noiseScale: number;
    noiseSpeed: number;
    noiseGain: number;
    maskScale: number;
    maskSpeed: number;
    maskContrast: number;
    mouseRadius: number;
    mouseStrength: number;
    mouseScatter: number;
    mouseGlowColor: string;
    mouseGlowPassive: number;
    mouseGlowActive: number;
    mouseGlowPow: number;
};

const DEFAULT_PARAMS: ShadowedParticlesParams = {
    color: '#8aa0b8',
    floatAmp: 0.01,
    sphereSize: 0.01,
    ambient: 0.31,
    wrap: 0.87,
    light1X: 0,
    light1Y: 4,
    light1Z: 0,
    light1Color: '#ffffff',
    light1Intensity: 1.0,
    light2X: 0,
    light2Y: -4,
    light2Z: 0,
    light2Color: '#4488ff',
    light2Intensity: 0.5,
    volumeStrength: 0.79,
    noiseAmp: 0.08,
    noiseScale: 0.6,
    noiseSpeed: 0.15,
    noiseGain: 0.5,
    maskScale: 0.4,
    maskSpeed: 0.04,
    maskContrast: 1.5,
    mouseRadius: 1.5,
    mouseStrength: 0.6,
    mouseScatter: 0.6,
    mouseGlowColor: '#ffffff',
    mouseGlowPassive: 0,
    mouseGlowActive: 1.5,
    mouseGlowPow: 2.0,
};

export class ShadowedParticles extends Group {
    params: ShadowedParticlesParams;
    readonly rotGroup: Group;
    readonly instancedMesh: InstancedMesh<IcosahedronGeometry, MeshBasicNodeMaterial>;

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
    };

    static async sampleGLBGeometry(url: string, particleCount: number): Promise<ShadowedParticlesGeometry> {
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

        gltf.scene.position.y -= bbox3.min.y;
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
        const perMesh = Math.max(1, Math.floor(particleCount / meshes.length));

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

        return { positions, normals };
    }

    constructor(geometry: ShadowedParticlesGeometry, particleCount: number, params: Partial<ShadowedParticlesParams> = {}) {
        super();

        this.params = { ...DEFAULT_PARAMS, ...params };

        const seeds = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            seeds[i] = Math.random();
        }

        const sphereGeo = new IcosahedronGeometry(1, 0);

        sphereGeo.setAttribute('instanceSeed', new InstancedBufferAttribute(seeds, 1));
        sphereGeo.setAttribute('instanceNormal', new InstancedBufferAttribute(geometry.normals.slice(), 3));
        sphereGeo.setAttribute('instancePos', new InstancedBufferAttribute(geometry.positions.slice(), 3));

        this.uniforms = {
            color: uniform(new Color(this.params.color)),
            floatAmp: uniform(this.params.floatAmp),
            sphereSize: uniform(this.params.sphereSize),
            ambient: uniform(this.params.ambient),
            wrap: uniform(this.params.wrap),
            light1Pos: uniform(new Vector3(this.params.light1X, this.params.light1Y, this.params.light1Z)),
            light1Color: uniform(new Color(this.params.light1Color)),
            light1Intensity: uniform(this.params.light1Intensity),
            light2Pos: uniform(new Vector3(this.params.light2X, this.params.light2Y, this.params.light2Z)),
            light2Color: uniform(new Color(this.params.light2Color)),
            light2Intensity: uniform(this.params.light2Intensity),
            volumeStrength: uniform(this.params.volumeStrength),
            noiseAmp: uniform(this.params.noiseAmp),
            noiseScale: uniform(this.params.noiseScale),
            noiseSpeed: uniform(this.params.noiseSpeed),
            noiseGain: uniform(this.params.noiseGain),
            maskScale: uniform(this.params.maskScale),
            maskSpeed: uniform(this.params.maskSpeed),
            maskContrast: uniform(this.params.maskContrast),
            mousePos: uniform(new Vector3()),
            mouseVel: uniform(new Vector3()),
            mouseRadius: uniform(this.params.mouseRadius),
            mouseStrength: uniform(this.params.mouseStrength),
            mouseScatter: uniform(this.params.mouseScatter),
            mouseGlowColor: uniform(new Color(this.params.mouseGlowColor)),
            mouseGlowPassive: uniform(this.params.mouseGlowPassive),
            mouseGlowActive: uniform(this.params.mouseGlowActive),
            mouseGlowPow: uniform(this.params.mouseGlowPow),
            mouseGlowEnergy: uniform(0),
        };

        const u = this.uniforms;
        const material = new MeshBasicNodeMaterial();

        material.positionNode = Fn(() => {
            const seedAttr = attribute('instanceSeed', 'float') as Node<'float'>;
            const instPos = attribute('instancePos', 'vec3') as Node<'vec3'>;

            const phase = seedAttr.mul(Math.PI * 2);

            const floatDisp = vec3(
                cos(time.mul(1.3).add(phase)).mul(u.floatAmp).mul(0.6),
                sin(time.mul(1.6).add(phase)).mul(u.floatAmp),
                sin(time.mul(1.1).add(phase.add(1.0)))
                    .mul(u.floatAmp)
                    .mul(0.6),
            );

            const maskCoord = instPos
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

            const noiseCoord = instPos
                .mul(u.noiseScale)
                .add(vec3(time.mul(u.noiseSpeed), float(0), time.mul(u.noiseSpeed).mul(0.7)));

            const noiseDisp = mx_fractal_noise_vec3(noiseCoord, float(2), float(2.0), u.noiseGain)
                .mul(u.noiseAmp)
                .mul(mask);

            const toMouse = u.mousePos.sub(instPos);
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

            return positionLocal
                .mul(u.sphereSize)
                .add(instPos)
                .add(floatDisp)
                .add(noiseDisp)
                .add(mouseDisp);
        })();

        material.colorNode = Fn(() => {
            const instNorm = attribute('instanceNormal', 'vec3') as Node<'vec3'>;
            const instPos = attribute('instancePos', 'vec3') as Node<'vec3'>;

            const toMouse = u.mousePos.sub(instPos);
            const dist = toMouse.length();
            const falloff = clamp(float(1.0).sub(dist.div(u.mouseRadius)), float(0), float(1));

            const lightContrib = (
                lightPos: typeof u.light1Pos,
                lightCol: typeof u.light1Color,
                lightInt: typeof u.light1Intensity,
            ) => {
                const dir = normalize(lightPos.sub(instPos));
                const figW = clamp(dot(instNorm, dir).add(u.wrap).div(float(1.0).add(u.wrap)), float(0), float(1));
                const sphW = clamp(
                    dot(normalize(positionLocal), dir)
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

            return mix(shadedColor, u.mouseGlowColor, mouseGlowFactor);
        })();

        this.instancedMesh = new InstancedMesh(sphereGeo, material, particleCount);
        this.instancedMesh.instanceMatrix.needsUpdate = true;

        this.rotGroup = new Group();
        this.rotGroup.add(this.instancedMesh);
        this.add(this.rotGroup);
    }

    dispose() {
        this.instancedMesh.geometry.dispose();
        this.instancedMesh.material.dispose();
    }
}
