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

        // Scores
        this.scores = JSON.parse(localStorage.getItem('miniGolfScores')) || Array(8).fill(999);

        this.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    init() {
        // Set canvas size
        this.resizeCanvas();

        // Initialize UI
        this.updateUI();

        // Load audio
        AudioManager.init();
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
    }

    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));

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

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        // Touch coordinates are already in screen space, same as mouse
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        // Touch coordinates are already in screen space, same as mouse
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    handleTouchEnd(e) {
        e.preventDefault();
        const mouseEvent = new MouseEvent('mouseup');
        this.canvas.dispatchEvent(mouseEvent);
    }

    startAiming() {
        if (!this.ball || this.ball.isMoving) return;

        this.isAiming = true;
        this.aimLine.startX = this.ball.x;
        this.aimLine.startY = this.ball.y;
        this.updateAimLine();
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

        if (distance > 0) {
            // Normaliser la direction et appliquer la puissance effective
            const normalizedDx = dx / distance;
            const normalizedDy = dy / distance;

            this.ball.vx = normalizedDx * this.effectivePower * 0.5;
            this.ball.vy = normalizedDy * this.effectivePower * 0.5;
        }

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

        return distance < (this.terrain.hole.radius - this.ball.radius);
    }

    levelComplete() {
        this.state = 'LEVEL_COMPLETE';

        // Save score if better
        if (this.strokeCount < this.scores[this.currentLevel]) {
            this.scores[this.currentLevel] = this.strokeCount;
            localStorage.setItem('miniGolfScores', JSON.stringify(this.scores));
        }

        AudioManager.playSound('hole');

        // Show level complete overlay via UIManager
        if (window.uiManager) {
            window.uiManager.showLevelComplete(this.strokeCount, this.parCount);
        }
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        // Ne rien faire si le jeu est en pause
        if (this.state === 'PAUSED') {
            return;
        }

        if (this.state === 'SHOOTING' && this.ball) {
            // Physique simple en temps réel
            const friction = this.terrain ? this.terrain.getFriction() : this.friction;
            this.ball.update(friction);

            // Vérifier les collisions avec les murs
            if (this.terrain) {
                this.terrain.checkCollisions(this.ball, this.bounceDamping);
            }

            // Vérifier si la balle est dans le trou
            if (this.checkWinCondition()) {
                this.levelComplete();
                return;
            }

            // Vérifier si la balle s'est arrêtée
            if (Math.abs(this.ball.vx) < 0.1 && Math.abs(this.ball.vy) < 0.1) {
                this.ball.vx = 0;
                this.ball.vy = 0;
                this.ball.isMoving = false;

                if (this.state === 'SHOOTING') {
                    this.state = 'AIMING';
                }
            }

            // COLLISION STUCK PREVENTION: If ball has very low velocity but is still moving,
            // it might be stuck - force it to stop
            const speed = Math.sqrt(this.ball.vx * this.ball.vx + this.ball.vy * this.ball.vy);
            if (speed > 0 && speed < 0.3 && this.ball.isMoving) {
                // Ball is barely moving but still considered moving - force stop
                this.ball.vx = 0;
                this.ball.vy = 0;
                this.ball.isMoving = false;

                if (this.state === 'SHOOTING') {
                    this.state = 'AIMING';
                }
            }
        }
    }

    render() {
        // Clear canvas with game background
        this.ctx.fillStyle = '#2E7D32';
        this.ctx.fillRect(0, 0, 1280, 720);

        // Render terrain at native resolution
        if (this.terrain) {
            this.terrain.render(this.ctx, 1);
        }

        // Render ball at native resolution
        if (this.ball) {
            this.ball.render(this.ctx, 1);
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
