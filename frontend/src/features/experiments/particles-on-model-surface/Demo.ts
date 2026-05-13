import {
    BufferAttribute,
    BufferGeometry,
    Clock,
    InstancedMesh,
    MathUtils,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    SphereGeometry,
    Vector2,
    Vector3,
    WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';

/** Порядок и количества частиц совпадают с прежним `SampledGeometry` в R3F. */
const PARTICLE_COUNTS = [3000, 4000, 1200, 3000, 3000, 3000, 1200, 1200];

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform vec2 uMouse;
varying vec2 vUv;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1. + 3.0 * C.xxx;

  i = mod(i, 289.0 );
  vec4 p = permute( permute( permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}

float rand(vec2 co){
  return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main() {
    vUv = uv;

    vec3 newPosition = position;

    newPosition.x += rand(instanceMatrix[3].yz) * 0.03 * sin(uTime * instanceMatrix[3].z);
    newPosition.y += rand(instanceMatrix[3].xz) * 0.02 * sin(uTime * 1.02 * instanceMatrix[3].x);
    newPosition.z += rand(instanceMatrix[3].xy) * 0.05 * sin(uTime * instanceMatrix[3].y);

    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(newPosition, 1.0);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec2 vUv;

void main() {
    vec3 color = vec3(1., 0., 0.);
    gl_FragColor = vec4(color, 1.);
}
`;

function remap(x: number, [low1, high1]: number[], [low2, high2]: number[]) {
    return low2 + ((x - low1) * (high2 - low2)) / (high1 - low1);
}

function computeUpness(geometry: BufferGeometry) {
    const normalAttr = geometry.attributes.normal;

    if (!normalAttr) {
        geometry.computeVertexNormals();
    }
    const { array, count } = geometry.attributes.normal;
    const arr = new Float32Array(count);

    const normalVector = new Vector3();
    const up = new Vector3(0, 1, 0);

    for (let i = 0; i < count; i++) {
        const n = array.slice(i * 3, i * 3 + 3);

        normalVector.set(n[0], n[1], n[2]);

        const dot = normalVector.dot(up);
        const value = dot > 0.4 ? remap(dot, [0.4, 1], [0, 1]) : 0;

        arr[i] = Number(value);
    }

    return new BufferAttribute(arr, 1);
}

function collectShoeMeshes(root: Object3D): Mesh[] {
    const meshes: Mesh[] = [];

    root.traverse((child) => {
        if (child instanceof Mesh && child.geometry) {
            meshes.push(child);
        }
    });
    meshes.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    return meshes;
}

class Demo {
    private readonly canvas: HTMLCanvasElement;
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly clock = new Clock();
    private readonly material: ShaderMaterial;
    private readonly boundResize: () => void;
    private readonly boundPointerMove: (e: PointerEvent) => void;

    private dracoLoader: DRACOLoader | null = null;
    private disposed = false;
    private instancedMeshes: InstancedMesh[] = [];
    private sphereGeometries: SphereGeometry[] = [];

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        this.renderer = new WebGLRenderer({
            canvas,
            alpha: false,
            antialias: true,
            powerPreference: 'high-performance',
        });

        this.scene = new Scene();

        const width = canvas.parentElement?.offsetWidth || 1;
        const height = canvas.parentElement?.offsetHeight || 1;

        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);

        this.camera = new PerspectiveCamera(35, width / height, 0.1, 1000);
        this.camera.position.set(0, 0, 5);

        this.controls = new OrbitControls(this.camera, canvas);
        this.controls.enableDamping = true;

        this.material = new ShaderMaterial({
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new Vector2() },
            },
            vertexShader: VERTEX_SHADER,
            fragmentShader: FRAGMENT_SHADER,
        });

        this.boundResize = () => this.onWindowResize();
        this.boundPointerMove = (e: PointerEvent) => this.onPointerMove(e);
        window.addEventListener('resize', this.boundResize);
        canvas.addEventListener('pointermove', this.boundPointerMove);

        const loader = new GLTFLoader();
        const dracoLoader = new DRACOLoader();

        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
        loader.setDRACOLoader(dracoLoader);
        this.dracoLoader = dracoLoader;

        loader.load(
            '/static/gltf/shoe.gltf',
            (gltf) => {
                if (this.disposed) return;

                const meshes = collectShoeMeshes(gltf.scene);
                const dummy = new Object3D();
                const position = new Vector3();
                const dpr = this.renderer.getPixelRatio();

                for (let i = 0; i < meshes.length; i++) {
                    const count = PARTICLE_COUNTS[i] ?? 3000;
                    const sourceGeom = meshes[i].geometry;
                    const geometry = sourceGeom.clone();

                    geometry.setAttribute('upness', computeUpness(geometry));

                    const surfaceMesh = new Mesh(geometry, new MeshBasicMaterial({ visible: false }));
                    const sampler = new MeshSurfaceSampler(surfaceMesh).setWeightAttribute('upness').build();

                    const sphereRadius = MathUtils.randFloat(0.003, 0.005) / dpr;
                    const sphereGeometry = new SphereGeometry(sphereRadius, 8, 8);

                    this.sphereGeometries.push(sphereGeometry);

                    const instancedMesh = new InstancedMesh(sphereGeometry, this.material, count);

                    for (let j = 0; j < count; j++) {
                        sampler.sample(position);
                        dummy.position.copy(position);
                        dummy.scale.setScalar(Math.random() * 0.75);
                        dummy.updateMatrix();
                        instancedMesh.setMatrixAt(j, dummy.matrix);
                    }
                    instancedMesh.instanceMatrix.needsUpdate = true;

                    this.scene.add(instancedMesh);
                    this.instancedMeshes.push(instancedMesh);

                    surfaceMesh.geometry.dispose();
                }

                this.renderer.setAnimationLoop(() => this.renderFrame());
            },
            undefined,
            (err) => {
                // eslint-disable-next-line no-console
                console.error('particles-on-model-surface: GLTF load failed', err);
            },
        );
    }

    private onPointerMove(event: PointerEvent) {
        const rect = this.canvas.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

        this.material.uniforms.uMouse.value.set(x, y);
    }

    private renderFrame() {
        this.controls.update();
        this.material.uniforms.uTime.value = this.clock.getElapsedTime();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const width = this.canvas.parentElement?.offsetWidth || 1;
        const height = this.canvas.parentElement?.offsetHeight || 1;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(width, height);
    }

    destroy() {
        this.disposed = true;
        window.removeEventListener('resize', this.boundResize);
        this.canvas.removeEventListener('pointermove', this.boundPointerMove);
        this.renderer.setAnimationLoop(null);
        this.controls.dispose();

        for (const mesh of this.instancedMeshes) {
            this.scene.remove(mesh);
        }
        this.instancedMeshes = [];

        for (const g of this.sphereGeometries) {
            g.dispose();
        }
        this.sphereGeometries = [];

        this.material.dispose();

        this.dracoLoader?.dispose();
        this.dracoLoader = null;

        this.renderer.dispose();
    }
}

export default Demo;
