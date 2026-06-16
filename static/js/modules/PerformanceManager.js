export class PerformanceManager {
    constructor() {
        this.fps = 60;
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.scaleFactor = 1.0;          // Factor de escala (1.0 = calidad máxima, 0.4 = mínima)
        this.lowFpsStrikes = 0;          // Veces consecutivas con bajo rendimiento
        this.isTabVisible = true;
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Bindeo de eventos
        this.onVisibilityChange = this.onVisibilityChange.bind(this);
        document.addEventListener('visibilitychange', this.onVisibilityChange);

        if (this.reducedMotion) {
            this.scaleFactor = 0.5; // Ajustar calidad inicial baja si prefiere movimiento reducido
        }
    }

    onVisibilityChange() {
        this.isTabVisible = document.visibilityState === 'visible';
    }

    tick(time, particleSystem) {
        this.frameCount++;
        
        // Calcular FPS cada 120 cuadros (~2 segundos a 60fps)
        if (this.frameCount >= 120) {
            const now = performance.now();
            const duration = (now - this.lastTime) / 1000; // En segundos
            this.fps = this.frameCount / duration;

            this.frameCount = 0;
            this.lastTime = now;

            this.checkAndAdapt(particleSystem);
        }
    }

    checkAndAdapt(particleSystem) {
        if (this.reducedMotion) return;

        // Si los FPS caen de 45, sumamos un strike
        if (this.fps < 45) {
            this.lowFpsStrikes++;
            
            // Si llevamos 2 strikes seguidos, reducimos la densidad de partículas
            if (this.lowFpsStrikes >= 2 && this.scaleFactor > 0.4) {
                this.scaleFactor = Math.max(0.4, this.scaleFactor - 0.2);
                
                // Aplicar ajuste de calidad al sistema de partículas en tiempo real
                if (particleSystem && typeof particleSystem.adjustQuality === 'function') {
                    particleSystem.adjustQuality(this.scaleFactor);
                }
                
                this.lowFpsStrikes = 0;
                console.warn(`Rendimiento WebGL bajo (${Math.round(this.fps)} FPS). Reduciendo densidad de partículas a factor: ${this.scaleFactor}`);
            }
        } else {
            // Si sube de 55, bajamos los strikes acumulados
            this.lowFpsStrikes = Math.max(0, this.lowFpsStrikes - 1);
        }
    }

    shouldRender() {
        // Solo renderizar si la pestaña está activa
        return this.isTabVisible;
    }

    dispose() {
        document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }
}
