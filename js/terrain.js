/**
 * Terrain class - Handles level geometry, collision detection, and rendering
 * Uses vector-based physics for precise 2D collisions
 */
class Terrain {
    constructor(levelIndex) {
        this.levelIndex = levelIndex;
        this.wallGroups = [];           // Array of wall arrays for collision detection
        this.hole = { x: 0, y: 0, radius: 12 };
        this.ballStart = { x: 0, y: 0 };
        this.surfaceType = 'normal';   // 'normal', 'sand', or 'ice'
        this.backgroundImage = null;

        this.loadLevel(levelIndex);
        this.loadBackgroundImage(levelIndex);
    }

    loadLevel(levelIndex) {
        const levelData = LEVELS[levelIndex];
        if (!levelData) {
            console.error('Level data not found for level', levelIndex);
            return;
        }

        this.parseTerrainData(levelData);
    }

    parseTerrainData(levelData) {
        const lines = levelData.terrainText.trim().split('\n');

        lines.forEach((line) => {
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            if (trimmedLine.includes(';T')) {
                this.parseHole(trimmedLine);
            } else if (trimmedLine.includes(';B')) {
                this.parseBallStart(trimmedLine);
            } else if (trimmedLine === 'S') {
                this.surfaceType = 'sand';
            } else if (trimmedLine === 'G') {
                this.surfaceType = 'ice';
            } else if (trimmedLine.includes(';')) {
                this.parseWallGroup(trimmedLine);
            }
        });
    }

    parseWallGroup(lineString) {
        const coords = lineString.split(';').filter(coord => coord.trim());
        const walls = [];

        for (let i = 0; i < coords.length - 1; i++) {
            const start = coords[i].split(',').map(Number);
            const end = coords[i + 1].split(',').map(Number);

            if (start.length === 2 && end.length === 2 && !isNaN(start[0]) && !isNaN(start[1])) {
                walls.push({
                    x1: start[0],
                    y1: start[1],
                    x2: end[0],
                    y2: end[1]
                });
            }
        }

        if (walls.length > 0) {
            this.wallGroups.push(walls);
        }
    }

    parseHole(holeString) {
        const parts = holeString.split(';');
        for (const part of parts) {
            if (part.includes('T')) continue;
            const coords = part.split(',').map(Number);
            if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
                this.hole.x = coords[0];
                this.hole.y = coords[1];
                break;
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
                break;
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
            case 'ice': return 0.995;
            default: return 0.98;
        }
    }

    render(ctx, scale = 1) {
        ctx.save();

        if (this.backgroundImage && this.backgroundImage.complete) {
            ctx.globalAlpha = 1;
            // Draw background at full game resolution (1280x720)
            ctx.drawImage(this.backgroundImage, 0, 0, 1280, 720);
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(0, 0, 1280, 720);
        }

        switch(this.surfaceType) {
            case 'sand':
                ctx.strokeStyle = '#F4A460';  // Sable (beige)
                break;
            case 'ice':
                ctx.strokeStyle = '#87CEEB';  // Glace (bleu clair)
                break;
            default: // 'normal'
                ctx.strokeStyle = '#8B4513';  // Normal (marron)
        }
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

    /**
     * PHYSICS ENGINE: Vector-based collision detection and resolution
     * Implements mathematical reflection formula: v' = v - 2(v·n)n
     *
     * @param {Ball} ball - The ball object to check collisions for
     * @param {number} bounceDamping - Energy loss factor (0.8 = 80% energy retained)
     * @returns {Object|null} Collision result or null
     */
    checkCollisions(ball, bounceDamping = 0.8) {
        // Boucler sur tous les wallGroups du terrain (optimisation demandée)
        for (const wallGroup of this.wallGroups) {
            for (const wall of wallGroup) {
                // 1. Find closest point P on wall segment to ball center
                const closestPoint = this.getClosestPointOnSegment(ball.x, ball.y, wall);

                // 2. Check collision condition: distance < ball radius
                const distance = this.getDistance(ball.x, ball.y, closestPoint.x, closestPoint.y);
                if (distance <= ball.radius) {
                    // COLLISION DETECTED - Resolve immediately

                    // // 3. Prevent ball from getting stuck in wall
                    // this.repositionBall(ball, closestPoint, wall);

                    // 4. Apply mathematical reflection: v' = v - 2(v·n)n
                    this.reflectBallVectorially(ball, wall, bounceDamping, closestPoint, distance);

                    // Feedback audio
                    if (window.AudioManager) {
                        AudioManager.playSound('ball');
                    }

                    // Une seule collision par frame pour optimisation
                    return { type: 'wall', point: closestPoint };
                }
            }
        }

        return null; // Aucune collision
    }

    /**
     * COLLISION DETECTION: Calculate closest point on line segment
     * Uses vector projection to find the nearest point on the wall segment
     *
     * @param {number} px - Ball center X coordinate
     * @param {number} py - Ball center Y coordinate
     * @param {Object} wall - Wall segment {x1, y1, x2, y2}
     * @returns {Object} Closest point {x, y} on the wall segment
     */
    getClosestPointOnSegment(px, py, wall) {
        const x1 = wall.x1, y1 = wall.y1;
        const x2 = wall.x2, y2 = wall.y2;

        // Vecteur du segment
        const dx = x2 - x1;
        const dy = y2 - y1;

        // Longueur carrée du segment
        const lengthSq = dx * dx + dy * dy;

        if (lengthSq === 0) {
            // Segment dégénéré (point unique)
            return { x: x1, y: y1 };
        }

        // Projection du point sur la ligne infinie
        const t = ((px - x1) * dx + (py - y1) * dy) / lengthSq;

        // Clamp t entre 0 et 1 pour rester sur le segment
        const clampedT = Math.max(0, Math.min(1, t));

        // Point le plus proche sur le segment
        return {
            x: x1 + clampedT * dx,
            y: y1 + clampedT * dy
        };
    }

    /**
     * Calcule la distance entre deux points
     */
    getDistance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }


    /**
     * VECTOR REFLECTION: Implement classical physics reflection formula
     * Formula: v' = v - 2(v·n)n where v is velocity, n is unit normal
     *
     * This ensures mathematically perfect specular reflection off any surface angle
     *
     * @param {Ball} ball - Ball whose velocity to reflect
     * @param {Object} wall - Wall segment for normal calculation
     * @param {number} bounceDamping - Energy loss factor (0.8 = 20% loss)
     */
    reflectBallVectorially(ball, wall, bounceDamping, closestPoint, distance) {
        // 1. Calculer le vecteur directionnel du mur
        const wallDx = wall.x2 - wall.x1;
        const wallDy = wall.y2 - wall.y1;
    
        // 2. Calculer la normale brute (-dy, dx)
        let nx = -wallDy;
        let ny = wallDx;
    
        // 3. Normaliser
        const mag = Math.sqrt(nx * nx + ny * ny);
        nx /= mag;
        ny /= mag;
    
        // ⚠️ IMPORTANT : S'assurer que la normale pointe VERS la balle
        // On compare la normale avec le vecteur (PointLePlusProche -> Balle)
        const dotNormalBalle = (ball.x - closestPoint.x) * nx + (ball.y - closestPoint.y) * ny;
        if (dotNormalBalle < 0) {
            nx = -nx;
            ny = -ny;
        }
    
        // 4. REPOSITIONNEMENT (Le fix pour ne plus être bloqué)
        const overlap = ball.radius - distance;
        if (overlap > 0) {
            ball.x += nx * (overlap + 0.1); // On repousse un chouïa plus loin
            ball.y += ny * (overlap + 0.1);
        }
    
        // 5. RÉFLEXION de la vitesse
        const dotProduct = ball.vx * nx + ball.vy * ny;
    
        // On ne rebondit que si la balle se dirige vers le mur
        if (dotProduct < 0) {
            ball.vx = (ball.vx - 2 * dotProduct * nx) * bounceDamping;
            ball.vy = (ball.vy - 2 * dotProduct * ny) * bounceDamping;
        }
    }



}