import {
    Fn,
    ShaderNodeObject,
    mix,
    length,
    step,
    storage,
    instanceIndex,
    time,
    uniform,
    vec3,
    sin,
    cos,
    positionLocal,
} from 'three/tsl';
import { 
    Mesh, 
    DirectionalLight,
    Vector3,
    Color,
} from 'three/webgpu';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { MeshStandardNodeMaterial, StorageBufferNode, WebGPURenderer } from 'three/webgpu';
import { Pane } from 'tweakpane';
import { StorageBufferAttribute } from 'three/webgpu';
import BaseExperience from '../BaseExperience';

type Parameters = { renderer: WebGPURenderer; viewport: BaseExperience['viewport'] };

class Text extends Mesh {
    renderer: Parameters['renderer'];
    viewport: Parameters['viewport'];
    light!: DirectionalLight;
    computeUpdate: any;
    material: MeshStandardNodeMaterial;

    buffers!: { 
        positionStorage: ShaderNodeObject<StorageBufferNode>; 
        velocityStorage: ShaderNodeObject<StorageBufferNode>;
        initialPosition: ShaderNodeObject<StorageBufferNode>;
        normalAt: ShaderNodeObject<StorageBufferNode>;
    };

    params = { 
        spring: 0.05, 
        friction: 0.9, 
        noiseAmp: 0.1,
        text: 'TEXT',
        size: 1.0,
    };

    uniforms = { 
        inputPos: uniform(new Vector3(0, 0, 0)).label('inputPos'),
        inputPress: uniform(0.0).label('inputPress'),
        spring: uniform(this.params.spring).label('spring'),
        friction: uniform(this.params.friction).label('friction'),
        noiseAmp: uniform(this.params.noiseAmp).label('noiseAmp'),
    };

    static font: any = null;
    static fontLoader = new FontLoader();

    constructor({ renderer, viewport }: Parameters) {
        // Create temporary geometry and material for super call
        const tempGeometry = new TextGeometry('TEMP', { 
            font: undefined as any, // Temporary font for constructor
            size: 0.1 
        });
        const material = new MeshStandardNodeMaterial({ 
            color: new Color('#656565'),
            metalness: 0.4, 
            roughness: 0.3
        });

        super(tempGeometry, material);

        this.renderer = renderer;
        this.viewport = viewport;
        this.material = material;

        // Load font and initialize
        this.initialize();
    }

    async initialize() {
        try {
            const font = await Text.fontLoader.loadAsync('/fonts/Inter_18pt_Medium_Regular.json')
            
            // Create proper text geometry
            const textGeometry = new TextGeometry(this.params.text, {
                font: font,
                size: this.params.size,
                depth: 0.2,
                curveSegments: 12,
                bevelEnabled: true,
                bevelThickness: 0.1,
                bevelSize: 0.01,
                bevelOffset: 0,
                bevelSegments: 1
            });

            // Center text
            textGeometry.computeBoundingBox();
            if (textGeometry.boundingBox) {
                const centerOffsetX = -0.5 * (textGeometry.boundingBox.max.x - textGeometry.boundingBox.min.x);
                const centerOffsetY = -0.5 * (textGeometry.boundingBox.max.y - textGeometry.boundingBox.min.y);
                textGeometry.translate(centerOffsetX, centerOffsetY, 0);
            }

            // Replace geometry
            this.geometry.dispose();
            this.geometry = textGeometry;

            const count = textGeometry.attributes.position.count;

            // Create storage buffers 
            this.buffers = {
                positionStorage: storage(new StorageBufferAttribute(count, 3), 'vec3', count).label('positionStorage'),
                velocityStorage: storage(new StorageBufferAttribute(count, 3), 'vec3', count).label('velocityStorage'),
                initialPosition: storage(textGeometry.attributes.position as any, 'vec3', count).label('initialPosition'),
                normalAt: storage(textGeometry.attributes.normal as any, 'vec3', count).label('normalAt'),
            };

            // Initialize buffers
            this.initializeBuffers(count);

            // Setup vertex deformation
            this.setupVertexDeformation();

            // Add light
            this.light = new DirectionalLight(new Color('#e7e2ca'), 5);
            this.light.position.set(0, 1.2, 3.86);
            this.add(this.light);

            // Ensure material is visible
            this.material.transparent = false;
            this.material.opacity = 1.0;
            this.material.color = new Color('#ffffff');
            this.material.metalness = 0.0;
            this.material.roughness = 0.5;

            // Ensure text is visible and positioned correctly
            this.position.set(0, 0, 0);
            this.visible = true;

        } catch (error) {
            console.error('Failed to initialize text:', error);
        }
    }

    initializeBuffers(count: number) {
        const computeInit = Fn(() => {
            this.buffers.positionStorage.element(instanceIndex).assign(this.buffers.initialPosition.element(instanceIndex));
            this.buffers.velocityStorage.element(instanceIndex).assign(vec3(0.0, 0.0, 0.0));
        })().compute(count);

        this.renderer.computeAsync(computeInit);
    }

    setupVertexDeformation() {
        const count = this.geometry.attributes.position.count;
        
        const computeUpdate = Fn(() => {
            const basePosition = this.buffers.initialPosition.element(instanceIndex);
            const currentPosition = this.buffers.positionStorage.element(instanceIndex);
            const currentVelocity = this.buffers.velocityStorage.element(instanceIndex);
            const normal = this.buffers.normalAt.element(instanceIndex);

            // Calculate distance from input position to base position
            const distance = length(this.uniforms.inputPos.sub(basePosition));
            
            // Create influence area with step function
            const pointerInfluence = step(distance, 0.5).mul(1.5);
            
            // Add noise for more natural deformation
            const noise = vec3(
                sin(currentPosition.x.mul(0.5).add(time)).mul(0.1),
                cos(currentPosition.y.mul(0.5).add(time)).mul(0.1),
                sin(currentPosition.z.mul(0.5).add(time)).mul(0.1)
            ).mul(this.uniforms.noiseAmp);

            // Calculate displaced position
            const distortedPos = basePosition.add(
                normal.add(noise).mul(pointerInfluence)
            );

            // Mix based on input press
            const targetPos = mix(basePosition, distortedPos, this.uniforms.inputPress);

            // Spring physics
            const springForce = targetPos.sub(currentPosition).mul(this.uniforms.spring);
            currentVelocity.addAssign(springForce);
            currentVelocity.mulAssign(this.uniforms.friction);
            currentPosition.addAssign(currentVelocity);

            // Write back to buffers
            this.buffers.positionStorage.element(instanceIndex).assign(currentPosition);
            this.buffers.velocityStorage.element(instanceIndex).assign(currentVelocity);

        })().compute(count);

        // Apply deformation in material using positionLocal as base
        this.material.positionNode = Fn(() => {
            const basePos = positionLocal;
            const deformedPos = this.buffers.positionStorage.element(instanceIndex);
            // Use positionLocal as base and add deformation
            return basePos.add(deformedPos.sub(basePos).mul(0.1));
        })();

        // Add emissive effect based on velocity
        this.material.emissiveNode = Fn(() => {
            const velocity = this.buffers.velocityStorage.element(instanceIndex);
            const emissionFactor = length(velocity).mul(10.0);
            const baseColor = vec3(0.0, 0.0, 1.0); // Blue base
            return baseColor.mul(emissionFactor).mul(5.0);
        })();

        this.computeUpdate = computeUpdate;
    }

    updateMousePosition(x: number, y: number, pressed: boolean) {
        this.uniforms.inputPos.value.set(x, y, 0);
        this.uniforms.inputPress.value = pressed ? 1.0 : 0.0;
    }

    update() {
        if (this.computeUpdate) {
            this.renderer.computeAsync(this.computeUpdate);
        }
    }

    /**
     * Disposes of the mesh and its resources.
     */
    dispose() {
        if (this.buffers) {
            Object.values(this.buffers).forEach((buffer) => {
                if (Array.isArray(buffer)) {
                    buffer.forEach((buffer) => buffer.dispose());
                } else {
                    buffer.dispose();
                }
            });
        }

        if (this.uniforms) {
            Object.values(this.uniforms).forEach((uniform) => {
                uniform.dispose();
            });
        }

        if (this.geometry) {
            this.geometry.dispose();
        }
        
        if (this.material) {
            this.material.dispose();
        }
        
        if (this.light) {
            this.remove(this.light);
        }

        return this;
    }

    /**
     * Initializes the tweak pane for the text.
     * @param {Pane} tweakPane - The pane to add the folder to.
     */
    initTweakPane(tweakPane: Pane) {
        const folder = tweakPane.addFolder({ title: 'Text Distortion' });

        folder.addBinding(this.params, 'spring', { min: 0, max: 0.2, step: 0.001 }).on('change', () => {
            this.uniforms.spring.value = this.params.spring;
        });

        folder.addBinding(this.params, 'friction', { min: 0.8, max: 1.0, step: 0.001 }).on('change', () => {
            this.uniforms.friction.value = this.params.friction;
        });

        folder.addBinding(this.params, 'noiseAmp', { min: 0, max: 1, step: 0.001 }).on('change', () => {
            this.uniforms.noiseAmp.value = this.params.noiseAmp;
        });
    }
}

export default Text;
