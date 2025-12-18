// Ball class - Physics based on the Qt C++ version

class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 8;
        this.isMoving = false;

        // Physics constants (top-down view - no gravity)
        this.friction = 0.98;
        this.minVelocity = 0.1; // Stop when velocity is very low
    }

    update(friction = this.friction) {
        if (Math.abs(this.vx) < this.minVelocity && Math.abs(this.vy) < this.minVelocity) {
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
            return;
        }

        this.isMoving = true;

        // Apply friction (top-down view - no gravity)
        this.vx *= friction;
        this.vy *= friction;

        // Update position
        this.x += this.vx;
        this.y += this.vy;
    }

    render(ctx, scale = 1) {
        ctx.save();

        // No scaling needed - canvas is at native game resolution

        // Ball shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Ball
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Ball highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // Check if point is inside ball (for collision detection)
    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

    // Get bounds for collision optimization
    getBounds() {
        return {
            left: this.x - this.radius,
            right: this.x + this.radius,
            top: this.y - this.radius,
            bottom: this.y + this.radius
        };
    }

    // Reset ball to starting position
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;
    }

    // Apply impulse (for shooting)
    applyImpulse(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.isMoving = true;
    }
}
