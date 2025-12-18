class Ball {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = 8;
        this.isMoving = false;
        this.friction = 0.98;
        this.minVelocity = 0.1;
    }

    update(friction = this.friction) {
        if (Math.abs(this.vx) < this.minVelocity && Math.abs(this.vy) < this.minVelocity) {
            this.vx = 0;
            this.vy = 0;
            this.isMoving = false;
            return;
        }

        this.isMoving = true;
        this.vx *= friction;
        this.vy *= friction;
        this.x += this.vx;
        this.y += this.vy;
    }

    render(ctx, scale = 1) {
        ctx.save();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + 2, this.y + 2, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#CCCCCC';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    containsPoint(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) <= this.radius;
    }

    getBounds() {
        return {
            left: this.x - this.radius,
            right: this.x + this.radius,
            top: this.y - this.radius,
            bottom: this.y + this.radius
        };
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.isMoving = false;
    }

    applyImpulse(vx, vy) {
        this.vx = vx;
        this.vy = vy;
        this.isMoving = true;
    }
}
