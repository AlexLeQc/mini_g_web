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

        document.getElementById('audio-gate').addEventListener('click', () => this.dismissAudioGate());

        document.getElementById('course-levels-btn').addEventListener('click', () => {
            AudioManager.playSound('button');
            this.showLevelSelect();
        });

        document.getElementById('course-menu-btn').addEventListener('click', () => {
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
        AudioManager.playMusic('title').then((played) => {
            // Browsers block music until the player interacts with the page.
            // Ask for one click so the title music can actually be heard.
            if (!played && this.currentScreen === 'title') {
                document.getElementById('audio-gate').classList.remove('hidden');
            }
        });
    }

    dismissAudioGate() {
        const gate = document.getElementById('audio-gate');
        if (gate.classList.contains('hidden')) return false;
        gate.classList.add('hidden');
        AudioManager.resumeMusic();
        return true;
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
        const table = document.getElementById('course-scorecard');
        table.innerHTML = '';

        const addRow = (cells, className, tag = 'td') => {
            const row = document.createElement('tr');
            if (className) row.className = className;
            cells.forEach(text => {
                const cell = document.createElement(tag);
                cell.textContent = text;
                row.appendChild(cell);
            });
            table.appendChild(row);
        };

        addRow(['Hole', 'Par', 'Best'], null, 'th');
        let totalPar = 0, totalBest = 0, allPlayed = true;
        getLevelNames().forEach((name, i) => {
            const par = getLevelData(i).par;
            const best = this.game.scores[i];
            totalPar += par;
            if (best < 999) totalBest += best; else allPlayed = false;
            const cls = best >= 999 ? null : best < par ? 'under-par' : best === par ? 'par-score' : null;
            addRow([`${i + 1}. ${name}`, par, best < 999 ? best : '-'], cls);
        });
        addRow(['Total', totalPar, allPlayed ? totalBest : '-'], 'total-row');

        this.hideAllScreens();
        document.getElementById('game-ui').classList.add('hidden');
        document.getElementById('course-complete').classList.remove('hidden');
        this.currentScreen = 'course-complete';
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
        
        const isLastLevel = this.game.currentLevel >= getTotalLevels() - 1;
        document.getElementById('next-level-btn').textContent = isLastLevel ? 'Finish Course' : 'Next Level';

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
            // Drop any shot being aimed, otherwise it fires on the next mouse release
            this.game.cancelAiming();
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
            this.updateGameUI();
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
                    if (this.dismissAudioGate()) break;
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