// Audio Manager - Handles sound effects and background music
// Uses the original game's audio files

class AudioManager {
    static init() {
        // Audio elements
        this.bgMusic = document.getElementById('bg-music');
        this.ballSound = document.getElementById('ball-sound');
        this.holeSound = document.getElementById('hole-sound');
        this.buttonSound = document.getElementById('button-sound');

        // Audio settings
        this.musicEnabled = localStorage.getItem('musicEnabled') !== 'false';
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
        this.currentMusic = null;

        // Set up audio sources
        this.setupAudioSources();

        // Create volume controls (could be added to UI later)
        this.masterVolume = 0.7;
        this.musicVolume = 0.5;
        this.soundVolume = 0.8;
    }

    static setupAudioSources() {
        // Map audio files to their purposes
        this.audioFiles = {
            // Background music
            'title': 'assets/audio/TitleScreen.mp3',
            'selectLevel': 'assets/audio/Select.mp3',
            'green': 'assets/audio/Green.mp3',
            'desert': 'assets/audio/Desert.mp3',
            'snow': 'assets/audio/Snow.mp3',

            // Sound effects
            'ball': 'assets/audio/balle.wav',
            'hole': 'assets/audio/BIRDIE.wav',
            'button': 'assets/audio/boutonNormal.mp3',
            'buttonTitle': 'assets/audio/buttontitreEffect.mp3',
        };
    }

    static playMusic(trackName) {
        if (!this.musicEnabled || !this.audioFiles[trackName]) return;

        // Stop current music
        if (this.currentMusic && this.currentMusic !== trackName) {
            this.stopMusic();
        }

        // Play new music if different
        if (this.currentMusic !== trackName) {
            this.bgMusic.src = this.audioFiles[trackName];
            this.bgMusic.volume = this.musicVolume * this.masterVolume;
            this.bgMusic.play().catch(e => {
                console.log('Music play failed:', e);
            });
            this.currentMusic = trackName;
        }
    }

    static stopMusic() {
        this.bgMusic.pause();
        this.bgMusic.currentTime = 0;
        this.currentMusic = null;
    }

    static playSound(soundName) {
        if (!this.soundEnabled || !this.audioFiles[soundName]) return;

        // Create a new audio instance for overlapping sounds
        const audio = new Audio(this.audioFiles[soundName]);
        audio.volume = this.soundVolume * this.masterVolume;
        audio.play().catch(e => {
            console.log('Sound play failed:', e);
        });
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

    // Preload critical audio files
    static preloadAudio() {
        const criticalFiles = ['ball', 'hole', 'button'];

        criticalFiles.forEach(soundName => {
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
