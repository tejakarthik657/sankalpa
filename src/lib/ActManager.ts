import * as THREE from 'three';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin.js';
import { SceneManager } from './SceneManager';
import type { Assets } from './AssetLoader';

// Import shaders as raw strings
import genesisVertexShader from './shaders/genesis.vertex.glsl';
import genesisFragmentShader from './shaders/genesis.fragment.glsl';
import auraVertexShader from './shaders/aura.vertex.glsl';
import auraFragmentShader from './shaders/aura.fragment.glsl';

gsap.registerPlugin(TextPlugin);

export class ActManager {
    private sceneManager: SceneManager;
    private assets: Assets;
    private planets: { mesh: THREE.Mesh; pivot: THREE.Object3D; speed: number; }[] = [];
    private pujaItems: { [key: string]: THREE.Mesh } = {};
    private ganeshaAura!: THREE.Group;
    private genesisParticles!: THREE.Points;
    private offeringsMade = 0;
    private totalOfferings = 4;
    private raycaster = new THREE.Raycaster();
    private mouse = new THREE.Vector2();

    // UI Elements
    private uiOverlay: HTMLElement;
    private uiTitle: HTMLElement;
    private uiSubtitle: HTMLElement;
    private blessingContainer: HTMLElement;
    private blessingText: HTMLElement;
    
    // Audio Elements
    private bgMusic: HTMLAudioElement;
    private chimeSfx: HTMLAudioElement;

    constructor(sceneManager: SceneManager, assets: Assets) {
        this.sceneManager = sceneManager;
        this.assets = assets;
        
        this.uiOverlay = document.getElementById('ui-overlay')!;
        this.uiTitle = document.getElementById('ui-title')!;
        this.uiSubtitle = document.getElementById('ui-subtitle')!;
        this.blessingContainer = document.getElementById('blessing-container')!;
        this.blessingText = document.getElementById('blessing-text')!;

        this.bgMusic = new Audio('/audio/bg-music.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.5;
        this.chimeSfx = new Audio('/audio/chime.mp3');

        this.setupScene();
    }

    private setupScene() {
        const { scene } = this.sceneManager;
        this.sceneManager.setBackground(this.assets.environmentMap);

        scene.add(new THREE.AmbientLight(0xffffff, 0.1));
        scene.add(new THREE.PointLight(0xFFD700, 2, 500));
        
        this.createPlanets();
        this.setupGanesha();
    }
    
    // --- ACT I ---
    public startAct1() {
        this.uiTitle.innerText = "Act I: The Genesis of Form";
        this.uiSubtitle.innerText = "Click and hold to sculpt the divine from starlight.";
        this.uiOverlay.classList.remove('hidden');
        gsap.to(this.sceneManager.camera.position, { duration: 10, z: 40, y: 10, ease: 'power2.inOut' });
        window.addEventListener('mousedown', this.handleGenesisHold);
        window.addEventListener('mouseup', this.handleGenesisRelease);
        const playBtn = document.getElementById('play-music-btn');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.bgMusic.play().then(() => {
                    playBtn.style.display = 'none';
                }).catch(e => {
                    console.error("Audio playback failed.", e);
                    alert("Unable to play background music. Please check your browser settings.");
                });
            });
        }
    }

    private genesisTimeline?: gsap.core.Tween;
    private handleGenesisHold = () => {
        if(this.genesisTimeline && this.genesisTimeline.isActive()) {
            this.genesisTimeline.resume();
        } else {
            this.genesisTimeline = gsap.to((this.genesisParticles.material as THREE.ShaderMaterial).uniforms.u_progress, {
                value: 1.0, duration: 8, ease: 'power2.inOut', onComplete: () => this.startAct2()
            });
        }
    };
    private handleGenesisRelease = () => {
        if (this.genesisTimeline) this.genesisTimeline.pause();
    };
    
    // --- ACT II ---
    private startAct2() {
        window.removeEventListener('mousedown', this.handleGenesisHold);
        window.removeEventListener('mouseup', this.handleGenesisRelease);
        this.uiOverlay.classList.add('hidden');
        const { camera, controls } = this.sceneManager;

        // ### START OF THE FIX ###
        gsap.timeline()
          .to((this.genesisParticles.material as THREE.ShaderMaterial).uniforms.u_progress, { 
              value: 1.1, 
              duration: 2, 
              // Added curly braces to ensure a void return type
              onComplete: () => { this.genesisParticles.visible = false; } 
            })
          .to(this.assets.ganeshaModel.scale, { duration: 4, x: 1, y: 1, z: 1, ease: 'elastic.out(1, 0.5)' }, "-=1.5")
          .to(this.assets.ganeshaModel.position, { duration: 4, y: 0, ease: 'power2.out' }, "<")
          .to(camera.position, { 
              duration: 3, 
              x: 0, 
              y: 2, 
              z: 15, 
              ease: 'power2.inOut', 
              // Added curly braces to ensure a void return type
              onUpdate: () => { controls.target.set(0,2,0); }
            }, "<")
        // ### END OF THE FIX ###
          .add(() => {
              this.uiTitle.innerText = "Act II: The Offering of Light";
              this.uiSubtitle.innerText = "Present your celestial offerings.";
              this.uiOverlay.classList.remove('hidden');
              controls.enabled = true; controls.autoRotate = true; controls.autoRotateSpeed = 0.5;
              controls.minDistance = 10; controls.maxDistance = 25;
              this.createPujaItems();
              window.addEventListener('click', this.handlePujaClick);
          });
    }

    private createPujaItems() {
        const itemsData = [
            { name: 'diya', color: 0x8B4513, geometry: new THREE.CylinderGeometry(0.2, 0.1, 0.2, 16) },
            { name: 'flower', color: 0xDC143C, geometry: new THREE.TorusGeometry(0.3, 0.1, 8, 32) },
            { name: 'modak', color: 0xFFFFE0, geometry: new THREE.ConeGeometry(0.2, 0.4, 32) },
            { name: 'kumkum', color: 0xFF0000, geometry: new THREE.SphereGeometry(0.25, 32, 32) },
        ];
        itemsData.forEach((data, i) => {
            const material = new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.6 });
            const mesh = new THREE.Mesh(data.geometry, material);
            mesh.name = data.name;
            const angle = (i / this.totalOfferings) * Math.PI * 2;
            mesh.position.set(Math.cos(angle) * 5, 1, Math.sin(angle) * 5);
            this.pujaItems[data.name] = mesh;
            this.sceneManager.scene.add(mesh);
        });
    }

    private handlePujaClick = (event: MouseEvent) => {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.sceneManager.camera);
        const intersects = this.raycaster.intersectObjects(Object.values(this.pujaItems));
        if (intersects.length > 0) {
            const selectedObject = intersects[0].object as THREE.Mesh;
            if (selectedObject.userData.offered) return;
            selectedObject.userData.offered = true; 
            this.chimeSfx.play(); 
            this.offeringsMade++;
            gsap.to(selectedObject.scale, { duration: 0.5, x: 0, y: 0, z: 0 });
            this.createOfferingEffect(selectedObject.name, selectedObject.position);
            if (this.offeringsMade >= this.totalOfferings) this.startAct3();
        }
    };

    private createOfferingEffect(name: string, position: THREE.Vector3) {
        let targetPosition: THREE.Vector3, color: number, texture: THREE.Texture;
        const scene = this.sceneManager.scene;
    
        switch(name) {
            case 'diya': targetPosition = new THREE.Vector3(0, 3, 3); color = 0xFF4500; texture = this.assets.particleTextures.spark; break;
            case 'modak': targetPosition = new THREE.Vector3(1, 2.5, 1.5); color = 0xFFFFE0; texture = this.assets.particleTextures.spark; break;
            case 'kumkum': targetPosition = new THREE.Vector3(0, 4.5, 1.2); color = 0xFF0000; texture = this.assets.particleTextures.spark; break;
            case 'flower': 
                const petalCount = 100;
                const geometry = new THREE.BufferGeometry();
                const posArray = new Float32Array(petalCount * 3);
                geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
                const material = new THREE.PointsMaterial({ size: 0.3, map: this.assets.particleTextures.petal, blending: THREE.NormalBlending, transparent: true, depthWrite: false });
                const petals = new THREE.Points(geometry, material);
                petals.position.copy(new THREE.Vector3(0, -1, 2));
                scene.add(petals);
                for(let i=0; i < petalCount; i++) {
                    const i3 = i * 3;
                    gsap.to(posArray, { duration: 3 + Math.random() * 2, [i3]: posArray[i3] + (Math.random()-0.5)*4, [i3+1]: posArray[i3+1] + Math.random()*3, [i3+2]: posArray[i3+2] + (Math.random()-0.5)*4, ease: 'power2.out', onUpdate: () => { geometry.attributes.position.needsUpdate = true; } });
                }
                gsap.to(material, { duration: 4, opacity: 0, ease: 'power1.in', onComplete: () => { scene.remove(petals); }});
                return;
            default:
                return;
        }

        const points = new THREE.CatmullRomCurve3([position, targetPosition.clone().lerp(position, 0.5).add(new THREE.Vector3(2, 2, 2)), targetPosition]).getPoints(100);
        const streamGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const streamMaterial = new THREE.PointsMaterial({ color, map: texture, blending: THREE.AdditiveBlending, transparent: true, size: 0.5, opacity: 0 });
        const stream = new THREE.Points(streamGeometry, streamMaterial);
        scene.add(stream);
        gsap.to(streamMaterial, { duration: 1.5, opacity: 1, size: 0.2, ease: 'power2.out', onComplete: () => { gsap.to(streamMaterial, { duration: 1, opacity: 0, onComplete: () => { scene.remove(stream); } }); } });
    }
    
    // --- ACT III ---
    private startAct3() {
        window.removeEventListener('click', this.handlePujaClick);
        this.uiOverlay.classList.add('hidden');
        this.sceneManager.controls.enabled = false;
        this.ganeshaAura.visible = true;
        gsap.to(this.sceneManager.bloomPass, { duration: 4, strength: 2.5, ease: 'power2.inOut' });
        gsap.to(this.sceneManager.camera.position, { duration: 10, z: 25, y: 5, ease: 'power2.inOut' });
        this.planets.forEach(p => gsap.to(p, { speed: p.speed * 5, duration: 5 }));
        this.showBlessing(1);
        setTimeout(() => this.showBlessing(2), 5000);
        setTimeout(() => this.showBlessing(3), 10000);
    }
    
    private showBlessing(index: number) {
        const blessings = [ "", "Vakratunda Mahakaya, Suryakoti Samaprabha.", "Nirvighnam Kuru Me Deva, Sarva-Kaaryeshu Sarvada.", "May wisdom and prosperity illuminate your path." ];
        this.blessingContainer.classList.remove('hidden');
        this.blessingText.textContent = ''; // Clear previous text
        gsap.to(this.blessingText, { duration: 2, text: blessings[index], ease: 'none' });
    }

    // This method is called from the main render loop
    public update(delta: number, elapsedTime: number) {
        this.planets.forEach(p => {
            p.pivot.rotation.y += p.speed * delta;
            p.mesh.rotation.y += 0.1 * delta;
        });

        if (this.ganeshaAura && this.ganeshaAura.visible) {
            this.ganeshaAura.traverse(child => {
                if (child.isMesh && (child.material as THREE.ShaderMaterial).isShaderMaterial) {
                    (child.material as THREE.ShaderMaterial).uniforms.u_time.value = elapsedTime;
                }
            });
        }
    }

    // --- These are the full methods that need to be part of the class ---
    private createPlanets() {
        const planetData = [
            { name: 'sun', size: 8, radius: 0, speed: 0 },
            { name: 'mercury', size: 1, radius: 15, speed: 0.8 },
            { name: 'venus', size: 1.5, radius: 25, speed: 0.6 },
            { name: 'earth', size: 1.6, radius: 35, speed: 0.4 },
            { name: 'mars', size: 1.2, radius: 50, speed: 0.3 },
            { name: 'jupiter', size: 4, radius: 70, speed: 0.15 },
        ];
        planetData.forEach(data => {
            const texture = this.assets.planetTextures[data.name];
            const material = data.name === 'sun' 
                ? new THREE.MeshBasicMaterial({ map: texture })
                : new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 });
            const mesh = new THREE.Mesh(new THREE.SphereGeometry(data.size, 32, 32), material);
            const pivot = new THREE.Object3D();
            this.sceneManager.scene.add(pivot);
            pivot.add(mesh);
            mesh.position.x = data.radius;
            this.planets.push({ mesh, pivot, speed: data.speed });
        });
    }

    private setupGanesha() {
        const model = this.assets.ganeshaModel;
        model.scale.setScalar(0);
        model.position.set(0, -5, 0);
        this.sceneManager.scene.add(model);

        const auraMaterial = new THREE.ShaderMaterial({
            uniforms: { u_time: { value: 0 }, u_color: { value: new THREE.Color(0xFFD700) }},
            vertexShader: auraVertexShader,
            fragmentShader: auraFragmentShader,
            transparent: true, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false
        });
        this.ganeshaAura = model.clone();
        this.ganeshaAura.traverse(child => { if (child instanceof THREE.Mesh) child.material = auraMaterial; });
        this.ganeshaAura.visible = false;
        this.sceneManager.scene.add(this.ganeshaAura);

        const vertices: number[] = [];
        model.traverse(child => { if (child instanceof THREE.Mesh) vertices.push(...child.geometry.attributes.position.array); });
        const particleCount = 50000;
        const startPositions = new Float32Array(particleCount * 3);
        const endPositions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            const radius = 30 + Math.random() * 30;
            const phi = Math.acos(2 * Math.random() - 1);
            const theta = Math.random() * Math.PI * 2;
            startPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            startPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            startPositions[i3 + 2] = radius * Math.cos(phi);
            const randomIndex = Math.floor(Math.random() * (vertices.length / 3)) * 3;
            endPositions[i3] = vertices[randomIndex];
            endPositions[i3 + 1] = vertices[randomIndex + 1] - 5;
            endPositions[i3 + 2] = vertices[randomIndex + 2];
        }
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(startPositions, 3));
        geometry.setAttribute('a_endPosition', new THREE.BufferAttribute(endPositions, 3));
        const material = new THREE.ShaderMaterial({
            uniforms: { u_progress: { value: 0.0 }, u_pointSize: { value: 1.5 }, u_color: { value: new THREE.Color(0xFFD700) }},
            vertexShader: genesisVertexShader, fragmentShader: genesisFragmentShader,
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false
        });
        this.genesisParticles = new THREE.Points(geometry, material);
        this.sceneManager.scene.add(this.genesisParticles);
    }
}