class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = 'MENU';
        this.currentLevel = 0;
        this.strokeCount = 0;
        this.parCount = 3;
        this.friction = 0.98;
        this.bounceDamping = 0.8;
        this.ball = null;
        this.terrain = null;
        this.aimLine = { startX: 0, startY: 0, endX: 0, endY: 0, visible: false };

        // Controls
        this.power = 50;
        this.effectivePower = 10; // Puissance effective par défaut
        this.isAiming = false;
        this.mousePos = { x: 0, y: 0 };
        this.lastShotPos = { x: 0, y: 0 };
        this.accumulator = 0;

        // Scores
        this.scores = this.loadScores();

        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    loadScores() {
        const empty = Array(getTotalLevels()).fill(999);
        try {
            const saved = JSON.parse(localStorage.getItem('miniGolfScores'));
            if (Array.isArray(saved)) {
                return empty.map((v, i) => (typeof saved[i] === 'number' ? saved[i] : v));
            }
        } catch (e) {
            // Corrupted or blocked storage: start with empty scores
        }
        return empty;
    }

    init() {
        // Set canvas size
        this.resizeCanvas();

        // Initialize UI
        this.updateUI();

        // Start downloading every level picture now so levels open instantly
        Terrain.preloadAll(getTotalLevels());
    }

    resizeCanvas() {
        // Fixed resolution like original Qt game: 1280x720
        const GAME_WIDTH = 1280;
        const GAME_HEIGHT = 720;

        // Set canvas to fixed game resolution
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;

        // Scale to fit screen while maintaining aspect ratio
        const container = document.getElementById('game-container');
        const containerRect = container.getBoundingClientRect();
        const scaleX = containerRect.width / GAME_WIDTH;
        const scaleY = containerRect.height / GAME_HEIGHT;
        this.scale = Math.min(scaleX, scaleY);

        // Apply CSS transform to scale the canvas
        this.canvas.style.transform = `scale(${this.scale})`;
        this.canvas.style.transformOrigin = 'top left';

        // Center the canvas
        const scaledWidth = GAME_WIDTH * this.scale;
        const scaledHeight = GAME_HEIGHT * this.scale;
        const offsetX = (containerRect.width - scaledWidth) / 2;
        const offsetY = (containerRect.height - scaledHeight) / 2;

        this.canvas.style.position = 'absolute';
        this.canvas.style.left = `${offsetX}px`;
        this.canvas.style.top = `${offsetY}px`;

        // Keep the HUD centered at the top of the board (not over the course)
        const hud = document.getElementById('game-ui');
        hud.style.left = `${offsetX + scaledWidth / 2}px`;
        hud.style.top = `${offsetY + 8}px`;
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        // Listen on window so dragging outside the canvas keeps aiming,
        // and releasing the button outside the canvas still shoots.
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        this.canvas.addEventListener('touchcancel', () => this.cancelAiming());

        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    handleMouseDown(e) {
        if (this.state !== 'AIMING') return;

        const rect = this.canvas.getBoundingClientRect();
        // Convert screen coordinates to game coordinates (1280x720)
        this.mousePos.x = (e.clientX - rect.left) / this.scale;
        this.mousePos.y = (e.clientY - rect.top) / this.scale;

        this.startAiming();
    }

    handleMouseMove(e) {
        if (!this.isAiming) return;

        const rect = this.canvas.getBoundingClientRect();
        // Convert screen coordinates to game coordinates (1280x720)
        this.mousePos.x = (e.clientX - rect.left) / this.scale;
        this.mousePos.y = (e.clientY - rect.top) / this.scale;

        this.updateAimLine();
    }

    handleMouseUp(e) {
        if (!this.isAiming) return;

        this.shoot();
    }

    // Touch coordinates are in screen space, same as mouse: reuse the mouse handlers
    handleTouchStart(e) {
        e.preventDefault();
        this.handleMouseDown(e.touches[0]);
    }

    handleTouchMove(e) {
        e.preventDefault();
        this.handleMouseMove(e.touches[0]);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp();
    }

    startAiming() {
        if (!this.ball || this.ball.isMoving) return;

        this.isAiming = true;
        // Reset the aim so a click without dragging never reuses the previous shot
        this.aimLine.startX = this.ball.x;
        this.aimLine.startY = this.ball.y;
        this.aimLine.endX = this.ball.x;
        this.aimLine.endY = this.ball.y;
        this.aimLine.visible = false;
        this.effectivePower = 0;
        this.updateAimLine();
    }

    cancelAiming() {
        this.isAiming = false;
        this.aimLine.visible = false;
    }

    updateAimLine() {
        const dx = this.mousePos.x - this.ball.x;
        const dy = this.mousePos.y - this.ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // Puissance effective réduite (pour le tir)
            const maxAimLength = 100;
            const effectivePower = Math.min(distance, maxAimLength) / 5;

            // Affichage de la ligne de visée (distance complète pour une meilleure visibilité)
            const displayLength = Math.min(distance, maxAimLength);

            this.aimLine.endX = this.ball.x + (dx / distance) * displayLength;
            this.aimLine.endY = this.ball.y + (dy / distance) * displayLength;

            // Stocker la puissance effective pour le tir (sera utilisée dans shoot())
            this.effectivePower = effectivePower;

            this.aimLine.visible = true;
        }
    }

    shoot() {
        if (!this.isAiming || !this.ball || this.ball.isMoving) return;

        this.isAiming = false;
        this.aimLine.visible = false;

        // Utiliser la direction de la ligne de visée mais la puissance effective
        const dx = this.aimLine.endX - this.ball.x;
        const dy = this.aimLine.endY - this.ball.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // A simple click or a tiny accidental drag cancels the shot instead of
        // wasting a stroke (MIN_AIM_DISTANCE px of drag = minimum shot)
        const MIN_AIM_DISTANCE = 10;
        if (distance < MIN_AIM_DISTANCE) return;

        // Normaliser la direction et appliquer la puissance effective
        this.ball.vx = (dx / distance) * this.effectivePower * 0.5;
        this.ball.vy = (dy / distance) * this.effectivePower * 0.5;
        this.ball.isMoving = true;
        this.lastShotPos = { x: this.ball.x, y: this.ball.y };

        this.strokeCount++;
        this.updateUI();

        AudioManager.playSound('ball');

        this.state = 'SHOOTING';
    }

    startLevel(levelIndex) {
        this.currentLevel = levelIndex;
        this.strokeCount = 0;
        
        const levelData = getLevelData(levelIndex);
        this.parCount = levelData.par;

        // Load terrain
        this.terrain = new Terrain(levelIndex);
        this.ball = new Ball(this.terrain.ballStart.x, this.terrain.ballStart.y);
        this.lastShotPos = { x: this.ball.x, y: this.ball.y };
        this.cancelAiming();

        // Hide menus, show game
        this.hideMenus();
        document.getElementById('game-ui').classList.remove('hidden');

        this.state = 'AIMING';
        this.updateUI();

        // Play music based on level theme
        AudioManager.playMusic(levelData.theme);
    }

    checkWinCondition() {
        if (!this.ball || !this.terrain) return false;

        const dx = this.ball.x - this.terrain.hole.x;
        const dy = this.ball.y - this.terrain.hole.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        return distance < (this.terrain.hole.radius - this.ball.radius/2);
    }

    levelComplete() {
        this.state = 'LEVEL_COMPLETE';

        // Save score if better
        if (this.strokeCount >= 1 && this.strokeCount < this.scores[this.currentLevel]) {
            this.scores[this.currentLevel] = this.strokeCount;
            try {
                localStorage.setItem('miniGolfScores', JSON.stringify(this.scores));
            } catch (e) {
                // Storage unavailable (private mode...): keep score for this session only
            }
        }

        AudioManager.playSound('hole');

        // Show level complete overlay via UIManager
        if (window.uiManager) {
            window.uiManager.showLevelComplete(this.strokeCount, this.parCount);
        }
    }

    // Fixed 120 physics updates/second, whatever the monitor refresh rate
    // (before, physics ran once per screen frame, so the game speed depended
    // on the monitor). The ball is drawn interpolated between the last two
    // physics positions, so motion stays smooth on 60, 120 or 144 Hz screens.
    gameLoop(timestamp) {
        const STEP = 1000 / 120;
        let alpha = 1;
        if (timestamp !== undefined) {
            if (this.lastFrameTime === undefined) this.lastFrameTime = timestamp;
            // Clamp so a background tab doesn't simulate minutes of physics at once
            this.accumulator += Math.min(timestamp - this.lastFrameTime, 250);
            this.lastFrameTime = timestamp;

            while (this.accumulator >= STEP) {
                if (this.ball) this.ball.savePrevious();
                this.update();
                this.accumulator -= STEP;
            }
            alpha = this.accumulator / STEP;
        }
        this.render(alpha);
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update() {
        // Ne rien faire si le jeu est en pause
        if (this.state !== 'SHOOTING' || !this.ball) {
            return;
        }

        const ball = this.ball;
        const friction = this.terrain ? this.terrain.getFriction() : this.friction;
        ball.vx *= friction;
        ball.vy *= friction;
        ball.isMoving = true;

        // Sub-stepping: never move the ball more than half its radius at once.
        // Before, at full power the ball moved 10px per frame with an 8px radius,
        // so it could jump over a wall line in a single frame and escape the map.
        const speed = Math.hypot(ball.vx, ball.vy);
        const steps = Math.max(1, Math.ceil(speed / (ball.radius * 0.5)));
        let impact = 0;

        for (let i = 0; i < steps; i++) {
            const fromX = ball.x, fromY = ball.y;
            ball.x += ball.vx / steps;
            ball.y += ball.vy / steps;

            if (this.terrain) {
                impact = Math.max(impact, this.terrain.checkCollisions(ball, this.bounceDamping));

                // Hard guarantee: the ball's center may never cross a wall line
                // (e.g. squeezed in a corner between two walls). If it would,
                // cancel the move and bounce off that wall instead.
                const crossed = this.terrain.findCrossedWall(fromX, fromY, ball.x, ball.y);
                if (crossed) {
                    ball.x = fromX;
                    ball.y = fromY;
                    impact = Math.max(impact, this.terrain.bounceOffWall(ball, crossed, this.bounceDamping));
                }
            }

            // Checked every sub-step so a fast ball can't "skip" over the hole
            if (this.checkWinCondition()) {
                this.levelComplete();
                return;
            }
        }

        // Only play the bounce sound on a real hit (not when grazing along a wall)
        if (impact > 0.5) {
            AudioManager.playSound('ball');
        }

        // Safety net: if the ball somehow still ends up off the course,
        // put it back where the last shot was taken from.
        if (this.terrain && !this.terrain.isInsideCourse(ball.x, ball.y)) {
            ball.reset(this.lastShotPos.x, this.lastShotPos.y);
            this.onBallStopped();
            return;
        }

        // Low threshold so the ball eases to a stop instead of halting abruptly
        if (Math.hypot(ball.vx, ball.vy) < 0.12) {
            ball.vx = 0;
            ball.vy = 0;
            ball.isMoving = false;
            this.onBallStopped();
        }
    }

    onBallStopped() {
        this.state = 'AIMING';

        // Son moqueur: le par est atteint et la balle n'est toujours pas dans le trou
        if (this.strokeCount === this.parCount) {
            const mockSounds = ['pourris', 'tunconnard'];
            AudioManager.playSound(mockSounds[Math.floor(Math.random() * mockSounds.length)]);
        }
    }

    render(alpha = 1) {
        // Clear canvas with game background
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.fillRect(0, 0, 1280, 720);

        // Render terrain at native resolution
        if (this.terrain) {
            this.terrain.render(this.ctx, 1);
        }

        // Render ball at native resolution
        if (this.ball) {
            this.ball.render(this.ctx, alpha);
        }

        // Render aim line at native resolution
        if (this.aimLine.visible) {
            this.ctx.strokeStyle = '#FF0000';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(this.aimLine.startX, this.aimLine.startY);
            this.ctx.lineTo(this.aimLine.endX, this.aimLine.endY);
            this.ctx.stroke();
        }
    }

    updateUI() {
        if (window.uiManager) {
            window.uiManager.updateGameUI();
        }
    }

    hideMenus() {
        document.querySelectorAll('.screen-overlay').forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    showMenu(menuId) {
        if (window.uiManager) {
            window.uiManager.showMainMenu();
        }
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
