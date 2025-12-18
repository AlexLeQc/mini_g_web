class Terrain {
    constructor(levelIndex) {
        this.levelIndex = levelIndex;
        this.wallGroups = [];
        this.hole = { x: 0, y: 0, radius: 12 };
        this.ballStart = { x: 0, y: 0 };
        this.surfaceType = 'normal';
        this.backgroundImage = null;

        this.loadLevel(levelIndex);
        this.loadBackgroundImage(levelIndex);
    }

    loadLevel(levelIndex) {
        const levelData = LEVELS[levelIndex];
        if (!levelData) return;
        this.parseTerrainData(levelData);
    }

    parseTerrainData(levelData) {
        const lines = levelData.terrainText.trim().split('\n');

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.includes(';T')) this.parseHole(trimmedLine);
            else if (trimmedLine.includes(';B')) this.parseBallStart(trimmedLine);
            else if (trimmedLine === 'S') this.surfaceType = 'sand';
            else if (trimmedLine === 'G') this.surfaceType = 'ice';
            else if (trimmedLine.includes(';')) this.parseWallGroup(trimmedLine);
        }
    }

    parseWallGroup(lineString) {
        const coords = lineString.split(';').filter(coord => coord.trim());
        const walls = [];

        for (let i = 0; i < coords.length - 1; i++) {
            const start = coords[i].split(',').map(Number);
            const end = coords[i + 1].split(',').map(Number);

            if (start.length === 2 && end.length === 2 && !isNaN(start[0]) && !isNaN(start[1])) {
                walls.push({ x1: start[0], y1: start[1], x2: end[0], y2: end[1] });
            }
        }

        if (walls.length > 0) this.wallGroups.push(walls);
    }

    parseHole(holeString) {
        const parts = holeString.split(';');
        for (const part of parts) {
            if (part.includes('T')) continue;
            const coords = part.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                this.hole.x = coords[0];
                this.hole.y = coords[1];
                return;
            }
        }
    }

    parseBallStart(ballString) {
        const parts = ballString.split(';');
        for (const part of parts) {
            if (part.includes('B')) continue;
            const coords = part.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                this.ballStart.x = coords[0];
                this.ballStart.y = coords[1];
                return;
            }
        }
    }

    loadBackgroundImage(levelIndex) {
        const img = new Image();
        img.src = `assets/images/terrain/Terrain${levelIndex + 1}.png`;
        img.onload = () => {
            this.backgroundImage = img;
        };
        img.onerror = () => {
            console.warn(`Background image not found for level ${levelIndex + 1}`);
        };
    }

    getFriction() {
        switch(this.surfaceType) {
            case 'sand': return 0.95;
            case 'ice': return 0.99;
            default: return 0.98;
        }
    }

    render(ctx, scale = 1) {
        ctx.save();

        if (this.backgroundImage && this.backgroundImage.complete) {
            ctx.drawImage(this.backgroundImage, 0, 0, 1280, 720);
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(0, 0, 1280, 720);
        }

        ctx.strokeStyle = this.surfaceType === 'sand' ? '#F4A460' :
                         this.surfaceType === 'ice' ? '#87CEEB' : '#8B4513';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        this.wallGroups.forEach(wallGroup => {
            wallGroup.forEach(wall => {
                ctx.beginPath();
                ctx.moveTo(wall.x1, wall.y1);
                ctx.lineTo(wall.x2, wall.y2);
                ctx.stroke();
            });
        });

        ctx.fillStyle = '#1B5E20';
        ctx.beginPath();
        ctx.arc(this.hole.x, this.hole.y, this.hole.radius + 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(this.hole.x, this.hole.y, this.hole.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.hole.x, this.hole.y - this.hole.radius);
        ctx.lineTo(this.hole.x, this.hole.y - this.hole.radius - 20);
        ctx.moveTo(this.hole.x, this.hole.y - this.hole.radius - 20);
        ctx.lineTo(this.hole.x + 10, this.hole.y - this.hole.radius - 15);
        ctx.stroke();

        ctx.restore();
    }

    checkCollisions(ball, bounceDamping = 0.8) {
        for (const wallGroup of this.wallGroups) {
            for (const wall of wallGroup) {
                const closestPoint = this.getClosestPointOnSegment(ball.x, ball.y, wall);
                const distance = this.getDistance(ball.x, ball.y, closestPoint.x, closestPoint.y);

                if (distance <= ball.radius) {
                    this.reflectBallVectorially(ball, wall, bounceDamping, closestPoint, distance);
                    if (window.AudioManager) AudioManager.playSound('ball');
                    return { type: 'wall', point: closestPoint };
                }
            }
        }
        return null;
    }

    getClosestPointOnSegment(px, py, wall) {
        const { x1, y1, x2, y2 } = wall;
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) return { x: x1, y: y1 };

        const t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;
        const clampedT = Math.max(0, Math.min(1, t));

        return {
            x: x1 + clampedT * dx,
            y: y1 + clampedT * dy
        };
    }

    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }


    /**
     * Vector reflection using specular reflection formula: v' = v - 2(v·n)n
     * Ensures mathematically perfect reflection off any surface angle
     */
    reflectBallVectorially(ball, wall, bounceDamping, closestPoint, distance) {
        const wallDx = wall.x2 - wall.x1;
        const wallDy = wall.y2 - wall.y1;

        let nx = -wallDy;
        let ny = wallDx;

        const mag = Math.sqrt(nx * nx + ny * ny);
        nx /= mag;
        ny /= mag;

        // Ensure normal points toward ball
        const dotNormalBall = (ball.x - closestPoint.x) * nx + (ball.y - closestPoint.y) * ny;
        if (dotNormalBall < 0) {
            nx = -nx;
            ny = -ny;
        }

        // Reposition to prevent sticking
        const overlap = ball.radius - distance;
        if (overlap > 0) {
            ball.x += nx * (overlap + 0.1);
            ball.y += ny * (overlap + 0.1);
        }

        // Apply reflection if ball is moving toward wall
        const dotProduct = ball.vx * nx + ball.vy * ny;
        if (dotProduct < 0) {
            ball.vx = (ball.vx - 2 * dotProduct * nx) * bounceDamping;
            ball.vy = (ball.vy - 2 * dotProduct * ny) * bounceDamping;
        }
    }



}