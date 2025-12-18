class AudioManager {
    static init() {
        this.bgMusic = document.getElementById('bg-music');
        this.ballSound = document.getElementById('ball-sound');
        this.holeSound = document.getElementById('hole-sound');
        this.buttonSound = document.getElementById('button-sound');

        this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.currentMusic = null;
        this.setupAudioSources();

        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.soundVolume = 0.8;
    }

    static setupAudioSources() {
        this.audioFiles = {
            title: 'assets/audio/TitleScreen.mp3',
            selectLevel: 'assets/audio/Select.mp3',
            green: 'assets/audio/Green.mp3',
            desert: 'assets/audio/Desert.mp3',
            snow: 'assets/audio/Snow.mp3',
            ball: 'assets/audio/balle.wav',
            hole: 'assets/audio/BIRDIE.wav',
            button: 'assets/audio/BoutonNormal.mp3',
            buttontitle: 'assets/audio/ButtonTitreEffect.mp3',
        };
    }

    static playMusic(trackName) {
        if (!this.musicEnabled || !this.audioFiles[trackName]) return;

        if (this.currentMusic && this.currentMusic !== trackName) {
            this.stopMusic();
        }

        if (this.currentMusic !== trackName) {
            this.bgMusic.src = this.audioFiles[trackName];
            this.bgMusic.volume = this.musicVolume * this.masterVolume;
            this.bgMusic.play().catch(e => console.log('Music play failed:', e));
            this.currentMusic = trackName;
        }
    }

    static stopMusic() {
        if (this.bgMusic) {
            this.bgMusic.pause();
            this.bgMusic.currentTime = 0;
            this.currentMusic = null;
        }
    }

    static playSound(soundName) {
        if (!this.soundEnabled || !this.audioFiles[soundName]) return;

        const audio = new Audio(this.audioFiles[soundName]);
        audio.volume = this.soundVolume * this.masterVolume;
        audio.play().catch(e => console.log('Sound play failed:', e));
    }

    static setMusicEnabled(enabled) {
        this.musicEnabled = enabled;
        localStorage.setItem('musicEnabled', enabled.toString());

        if (!enabled) {
            this.stopMusic();
        } else if (this.currentMusic) {
            // Resume current music
            this.playMusic(this.currentMusic);
        }
    }

    static setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
        localStorage.setItem('soundEnabled', enabled.toString());
    }

    static setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.bgMusic.volume = this.musicVolume * this.masterVolume;
        }
    }

    static setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.bgMusic.volume = this.musicVolume * this.masterVolume;
        }
    }

    static setSoundVolume(volume) {
        this.soundVolume = Math.max(0, Math.min(1, volume));
    }

    static preloadAudio() {
        ['ball', 'hole', 'button'].forEach(soundName => {
            if (this.audioFiles[soundName]) {
                const audio = new Audio();
                audio.preload = 'auto';
                audio.src = this.audioFiles[soundName];
            }
        });
    }

    // Handle audio context suspension (required for some browsers)
    static resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Cross-browser audio compatibility
    static setupAudioCompatibility() {
        // Handle iOS audio requirements
        const unlockAudio = () => {
            if (this.bgMusic) {
                this.bgMusic.play().then(() => {
                    this.bgMusic.pause();
                    this.bgMusic.currentTime = 0;
                }).catch(() => {
                    // Ignore errors
                });
            }
            document.removeEventListener('touchstart', unlockAudio);
            document.removeEventListener('touchend', unlockAudio);
        };

        document.addEventListener('touchstart', unlockAudio);
        document.addEventListener('touchend', unlockAudio);
    }
}

// Initialize audio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    AudioManager.init();
    AudioManager.setupAudioCompatibility();
    AudioManager.preloadAudio();
});

// Export for use in other modules
window.AudioManager = AudioManager;
