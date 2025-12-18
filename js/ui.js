class UIManager {
    constructor(game) {
        this.game = game;
        this.currentScreen = 'title';
        this.previousState = null;
        this.setupEventListeners();
        this.updateScoreboard();
    }

    setupEventListeners() {
        document.getElementById('press-start-btn').addEventListener('click', () => {
            AudioManager.playSound('buttontitle');
            this.showMainMenu();
        });

        document.getElementById('play-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showLevelSelect();
        });

        document.getElementById('rules-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showRules();
        });

        document.getElementById('scores-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showScoreboard();
        });

        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showMainMenu();
        });

        document.getElementById('back-from-rules-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showMainMenu();
        });

        document.getElementById('back-from-scores-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showMainMenu();
        });

        document.getElementById('next-level-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.nextLevel();
        });

        document.getElementById('retry-level-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.retryLevel();
        });

        document.getElementById('back-to-levels-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showLevelSelect();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.pauseGame();
        });

        // Gestionnaires pour le menu pause
        document.getElementById('resume-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.resumeGame();
        });

        document.getElementById('restart-level-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.retryLevel();
        });

        document.getElementById('back-to-main-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showMainMenu();
        });

        this.createLevelButtons();

        this.setupKeyboardShortcuts();
    }

    hideAllScreens() {
        document.querySelectorAll('.screen-overlay').forEach(screen => {
            screen.classList.add('hidden');
        });
    }

    showTitleScreen() {
        this.hideAllScreens();
        document.getElementById('title-screen').classList.remove('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        this.currentScreen = 'title';
        AudioManager.playMusic('title');
    }

    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        this.currentScreen = 'main-menu';
        AudioManager.playMusic('selectLevel');
    }

    showPauseMenu() {
        this.hideAllScreens();
        document.getElementById('pause-menu').classList.remove('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        this.currentScreen = 'pause-menu';
    }

    showLevelSelect() {
        this.updateLevelButtons();
        this.hideAllScreens();
        document.getElementById('level-select').classList.remove('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        this.currentScreen = 'level-select';

        // Jouer la musique de sélection de niveau
        AudioManager.playMusic('selectLevel');
    }

    showRules() {
        this.hideAllScreens();
        document.getElementById('rules-screen').classList.remove('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        this.currentScreen = 'rules';

        // Jouer la musique de sélection de niveau
        AudioManager.playMusic('selectLevel');
    }

    showScoreboard() {
        this.updateScoreboard();
        this.hideAllScreens();
        document.getElementById('scoreboard').classList.remove('hidden');
        document.getElementById('game-ui').classList.add('hidden');
        this.currentScreen = 'scoreboard';

        // Jouer la musique de sélection de niveau
        AudioManager.playMusic('selectLevel');
    }

    createLevelButtons() {
        const levelButtonsContainer = document.getElementById('level-buttons');
        const levelNames = getLevelNames();

        levelNames.forEach((name, index) => {
            const button = document.createElement('button');
            button.className = 'level-btn';
            button.textContent = `${index + 1}. ${name}`;
            button.addEventListener('click', () => {
                this.startLevel(index);
            });
            levelButtonsContainer.appendChild(button);
        });
    }

    updateLevelButtons() {
        const buttons = document.querySelectorAll('.level-btn');
        buttons.forEach((button, index) => {
            const bestScore = this.game.scores[index];
            const levelData = getLevelData(index);
            if (bestScore < 999) {
                button.classList.add('completed');
                const scoreText = bestScore === levelData.par ? '⭐ PAR' : bestScore < levelData.par ? `⭐ ${bestScore}` : bestScore;
                button.textContent = `${index + 1}. ${getLevelNames()[index]} (${scoreText})`;
            } else {
                button.classList.remove('completed');
                button.textContent = `${index + 1}. ${getLevelNames()[index]}`;
            }
        });
    }

    startLevel(levelIndex) {
        document.getElementById('level-complete').classList.add('hidden');
        this.hideAllScreens();
        this.game.startLevel(levelIndex);
        this.currentScreen = 'playing';
    }

    nextLevel() {
        document.getElementById('level-complete').classList.add('hidden');
        const nextLevel = this.game.currentLevel + 1;
        if (nextLevel < getTotalLevels()) {
            this.startLevel(nextLevel);
        } else {
            this.showCongratulations();
        }
    }

    retryLevel() {
        document.getElementById('level-complete').classList.add('hidden');
        this.startLevel(this.game.currentLevel);
    }

    showCongratulations() {
        alert('🎉 Congratulations! You completed all levels!');
        this.showLevelSelect();
    }

    updateScoreboard() {
        const scoresList = document.getElementById('scores-list');
        scoresList.innerHTML = '';

        const levelNames = getLevelNames();
        levelNames.forEach((name, index) => {
            const levelData = getLevelData(index);
            const score = this.game.scores[index];
            const scoreEntry = document.createElement('div');
            scoreEntry.className = 'score-entry';

            const levelName = document.createElement('span');
            levelName.className = 'score-name';
            levelName.textContent = `${index + 1}. ${name}`;

            const levelScore = document.createElement('span');
            levelScore.className = 'score-value';
            if (score < 999) {
                if (score === levelData.par) {
                    levelScore.textContent = '⭐ PAR';
                    levelScore.classList.add('par-score');
                } else if (score < levelData.par) {
                    levelScore.textContent = `⭐ ${score}`;
                    levelScore.classList.add('under-par');
                } else {
                    levelScore.textContent = score.toString();
                }
            } else {
                levelScore.textContent = '-';
                levelScore.classList.add('no-score');
            }

            scoreEntry.appendChild(levelName);
            scoreEntry.appendChild(levelScore);
            scoresList.appendChild(scoreEntry);
        });
    }

    showGameUI() {
        document.getElementById('game-ui').classList.remove('hidden');
    }

    hideGameUI() {
        document.getElementById('game-ui').classList.add('hidden');
    }

    updateGameUI() {
        const levelData = getLevelData(this.game.currentLevel);
        document.getElementById('current-level').textContent = this.game.currentLevel + 1;
        document.getElementById('stroke-count').textContent = this.game.strokeCount;
        document.getElementById('par-count').textContent = levelData.par;
    }

    showLevelComplete(strokes, par) {
        const score = strokes - par;
        document.getElementById('level-complete').classList.remove('hidden');
        document.getElementById('final-strokes').textContent = strokes;
        document.getElementById('final-par').textContent = par;
        
        const scoreDisplay = document.getElementById('level-score');
        if (score === 0) {
            scoreDisplay.textContent = '⭐ PAR!';
            scoreDisplay.className = 'score-display par-score';
        } else if (score < 0) {
            scoreDisplay.textContent = `⭐ ${score}!`;
            scoreDisplay.className = 'score-display under-par';
        } else {
            scoreDisplay.textContent = `+${score}`;
            scoreDisplay.className = 'score-display over-par';
        }

        this.updateScoreboard();
    }

    pauseGame() {
        if (this.game.state === 'PLAYING' || this.game.state === 'AIMING' || this.game.state === 'SHOOTING') {
            this.previousState = this.game.state;
            this.game.state = 'PAUSED';
            this.showPauseMenu();
        }
    }

    resumeGame() {
        if (this.game.state === 'PAUSED') {
            this.game.state = this.previousState || 'AIMING';
            this.previousState = null;
            this.hideAllScreens();
            document.getElementById('game-ui').classList.remove('hidden');
            this.currentScreen = 'playing';
            this.updateUI();
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Escape':
                    if (this.currentScreen === 'playing') {
                        this.pauseGame();
                    } else if (this.currentScreen === 'pause-menu') {
                        this.resumeGame();
                    } else if (this.currentScreen !== 'title' && this.currentScreen !== 'main-menu') {
                        this.showMainMenu();
                    }
                    break;
                case ' ':
                    if (this.game.state === 'AIMING' && !this.game.ball.isMoving) {
                        e.preventDefault();
                        this.game.shoot();
                    }
                    break;
                case 'Enter':
                    if (this.currentScreen === 'title') {
                        document.getElementById('press-start-btn').click();
                    }
                    break;
            }
        });
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    setupMobileControls() {
        if (this.isMobile()) {
            const controls = document.getElementById('controls');
            if (controls) {
                controls.style.flexDirection = 'column';
                controls.style.gap = '15px';
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.game) {
            window.uiManager = new UIManager(window.game);
            // Afficher l'écran titre avec sa musique au démarrage
            window.uiManager.showTitleScreen();
        }
    }, 100);
});