export class MouseController {
    constructor() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.lerpFactor = 0.075; // Controla el suavizado del movimiento

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);

        window.addEventListener('mousemove', this.onMouseMove, { passive: true });
        window.addEventListener('touchmove', this.onTouchMove, { passive: true });
    }

    onMouseMove(event) {
        // Normalizar de -1 a 1 (0 es el centro)
        this.targetX = (event.clientX / window.innerWidth) * 2 - 1;
        this.targetY = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    onTouchMove(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.targetX = (touch.clientX / window.innerWidth) * 2 - 1;
            this.targetY = -(touch.clientY / window.innerHeight) * 2 + 1;
        }
    }

    update() {
        // Interpolación lineal suave en cada fotograma
        this.mouseX += (this.targetX - this.mouseX) * this.lerpFactor;
        this.mouseY += (this.targetY - this.mouseY) * this.lerpFactor;
    }

    dispose() {
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('touchmove', this.onTouchMove);
    }
}
