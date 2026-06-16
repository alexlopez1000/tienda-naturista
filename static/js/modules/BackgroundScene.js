import * as THREE from 'three';

export class BackgroundScene {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.dpr = Math.min(window.devicePixelRatio || 1, 2);

        // Inicialización del renderizador WebGL
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setPixelRatio(this.dpr);
        this.renderer.setSize(this.width, this.height);
        
        // Creación de la Escena
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x03050c, 0.012);

        // Creación de la Cámara de Perspectiva (Z apuntando al espectador)
        this.camera = new THREE.PerspectiveCamera(60, this.width / this.height, 0.1, 100);
        this.camera.position.z = 30;

        // Bindeo de eventos
        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize, { passive: true });
    }

    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Actualizar cámara
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        // Actualizar renderizador
        this.renderer.setSize(this.width, this.height);
    }

    dispose() {
        window.removeEventListener('resize', this.onResize);
        this.renderer.dispose();
        this.scene.clear();
    }
}
