import BloomNode, { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { ShaderNodeObject, pass, vec3, uv, time, mx_noise_float } from 'three/tsl';
import {  PostProcessing, TimestampQuery, Fog, Color, Vector2 } from 'three/webgpu';
import BaseExperience from '../BaseExperience';
import Text from './Text';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class Demo extends BaseExperience {
    text: Text;
    postProcessing: PostProcessing;
    bloomPass: ShaderNodeObject<BloomNode>;
    mouse: Vector2;
    isPressed: boolean;
    controls: OrbitControls | undefined;

    params = { 
        usePostprocessing: true, 
        bloomStrength: 0.3, 
        bloomThreshold: 0.2, 
        bloomRadius: 0.1 
    };

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.camera.position.set(0, 0, 5);

        this.mouse = new Vector2(0, 0);
        this.isPressed = false;

        // OrbitControls
        // this.controls = new OrbitControls(this.camera, canvas);
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.1;
        // this.controls.enablePan = false;
        // this.controls.minDistance = 2;
        // this.controls.maxDistance = 20;

        // Create text
        this.text = new Text({ renderer: this.renderer, viewport: this.viewport });
        this.scene.add(this.text);

        // Wait for text to initialize
        this.text.initialize();

        // Setup scene environment
        this.scene.fog = new Fog(new Color('#41444c'), 0.0, 8.5);
        this.scene.background = this.scene.fog.color;

        // Mouse events
        this.setupMouseEvents();

        this.initTweakPane();

        /**
         * Post processing
         */
        this.postProcessing = new PostProcessing(this.renderer);

        // Color
        const scenePass = pass(this.scene, this.camera);
        
        // Bloom
        this.bloomPass = bloom(
            scenePass,
            this.params.bloomStrength,
            this.params.bloomThreshold,
            this.params.bloomRadius,
        );

        // Add noise
        const postNoise = mx_noise_float(vec3(uv(), time.mul(0.1)).mul(1920), 0.03).mul(1.0);

        // Output
        this.postProcessing.outputNode = scenePass.add(this.bloomPass).add(postNoise);
    }

    setupMouseEvents() {
        const canvas = this.renderer.domElement;

        const updateMousePosition = (event: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            // Normalize mouse coordinates to NDC (-1 to 1)
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            // Convert to world space
            const worldX = this.mouse.x * 3; // Adjust scale as needed
            const worldY = this.mouse.y * 3;
            
            this.text.updateMousePosition(worldX, worldY, this.isPressed);
        };

        canvas.addEventListener('mousemove', updateMousePosition);
        
        canvas.addEventListener('mousedown', (event) => {
            this.isPressed = true;
            updateMousePosition(event);
        });
        
        canvas.addEventListener('mouseup', () => {
            this.isPressed = false;
            this.text.updateMousePosition(this.mouse.x * 3, this.mouse.y * 3, false);
        });

        canvas.addEventListener('mouseleave', () => {
            this.isPressed = false;
            this.text.updateMousePosition(0, 0, false);
        });
    }

    async render() {
        // Update text deformation
        this.text.update();

        // OrbitControls update
        if (this.controls) this.controls.update();

        if (this.stats) {
            this.renderer.resolveTimestampsAsync(TimestampQuery.COMPUTE);
        }

        super.render(this.params.usePostprocessing ? this.postProcessing : undefined);
    }

    destroy() {
        if (this.controls) this.controls.dispose();
        this.text.dispose();
        super.destroy();
    }

    initTweakPane() {
        super.initTweakPane();

        if (this.tweakPane) {
            this.text.initTweakPane(this.tweakPane);

            const postProcessingFolder = this.tweakPane.addFolder({ title: 'Postprocessing' });
            postProcessingFolder.addBinding(this.params, 'usePostprocessing');
            postProcessingFolder
                .addBinding(this.params, 'bloomStrength', { min: 0, max: 1, step: 0.001 })
                .on('change', () => {
                    this.bloomPass.strength.value = this.params.bloomStrength;
                });
            postProcessingFolder
                .addBinding(this.params, 'bloomThreshold', { min: 0, max: 1, step: 0.001 })
                .on('change', () => {
                    this.bloomPass.threshold.value = this.params.bloomThreshold;
                });
            postProcessingFolder
                .addBinding(this.params, 'bloomRadius', { min: 0, max: 1, step: 0.001 })
                .on('change', () => {
                    this.bloomPass.radius.value = this.params.bloomRadius;
                });
        }
    }
}

export default Demo;
