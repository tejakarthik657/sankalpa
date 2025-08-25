// SceneManager.ts
// ...existing code...
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

export class SceneManager {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls!: OrbitControls;
    public composer!: EffectComposer;
    public bloomPass!: UnrealBloomPass;

    private clock = new THREE.Clock();

    constructor(container: HTMLDivElement) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        
        this.setupRenderer(container);
        this.setupCamera();
        this.setupControls();
        this.setupPostProcessing();
        
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    private setupRenderer(container: HTMLDivElement) {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // @ts-ignore
    this.renderer.outputEncoding = (THREE as any).sRGBEncoding;
        container.appendChild(this.renderer.domElement);
    }
    
    private setupCamera() {
        this.camera.position.set(0, 20, 100);
    }
    
    private setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enabled = false;
    }

    private setupPostProcessing() {
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));
        this.bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.2, 0.1, 0.1);
        this.composer.addPass(this.bloomPass);
    }

    public startRenderLoop(updateCallback: (delta: number, elapsedTime: number) => void) {
        const animate = () => {
            requestAnimationFrame(animate);
            const delta = this.clock.getDelta();
            const elapsedTime = this.clock.getElapsedTime();
            
            this.controls.update();
            updateCallback(delta, elapsedTime);
            this.composer.render();
        };
        animate();
    }

    public setBackground(texture: THREE.DataTexture) {
        this.scene.environment = texture;
        this.scene.background = texture;
    }

    private onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.composer.setSize(window.innerWidth, window.innerHeight);
    }
}