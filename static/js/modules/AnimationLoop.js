import * as THREE from 'three';

export class AnimationLoop {
    constructor(sceneObj, shaderObj, particlesObj, networkObj, mouseObj, performanceObj) {
        this.sceneObj = sceneObj;
        this.shaderObj = shaderObj;
        this.particlesObj = particlesObj;
        this.networkObj = networkObj;
        this.mouseObj = mouseObj;
        this.performanceObj = performanceObj;

        this.clock = new THREE.Clock();
        this.running = false;
        this.frameId = null;

        // Bindeo
        this.tick = this.tick.bind(this);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.clock.getDelta(); // Inicializar reloj
        this.frameId = requestAnimationFrame(this.tick);
    }

    stop() {
        this.running = false;
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
    }

    tick() {
        if (!this.running) return;

        // Solicitar el siguiente frame de inmediato para mantener continuidad
        this.frameId = requestAnimationFrame(this.tick);

        // Validar si es necesario renderizar (PerformanceManager)
        if (!this.performanceObj.shouldRender()) {
            return;
        }

        const elapsed = this.clock.getElapsedTime();

        // 1. Actualizar coordenadas del ratón (Lerp)
        this.mouseObj.update();
        const mx = this.mouseObj.mouseX;
        const my = this.mouseObj.mouseY;

        // 2. Actualizar Shader de Gradiente de fondo
        this.shaderObj.update(elapsed, mx, my);

        // 3. Actualizar campo de partículas (Parallax + Drift)
        this.particlesObj.update(elapsed, mx, my);

        // 4. Actualizar conexiones de la Red Neuronal
        this.networkObj.update(this.particlesObj);

        // 5. Registrar rendimiento (cálculo de FPS adaptativo)
        this.performanceObj.tick(elapsed, this.particlesObj);

        // 6. Renderizar escena tridimensional en el canvas
        this.sceneObj.renderer.render(this.sceneObj.scene, this.sceneObj.camera);
    }

    dispose() {
        this.stop();
    }
}
