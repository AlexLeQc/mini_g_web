# Mini Golf HTML5 - Web Version

A complete HTML5 Canvas recreation of the original Qt Mini-Golf game, optimized for web browsers with the same physics, levels, and assets.

## 🎮 Features

- **Faithful Recreation**: Same physics engine, levels, and gameplay as the Qt version
- **8 Challenging Levels**: From beginner courses to complex mazes
- **Realistic Physics**: Ball movement with friction, gravity, and collision detection
- **Original Assets**: All sounds and visual elements from the original game
- **Cross-Platform**: Works on desktop and mobile browsers
- **Score Tracking**: Local storage for best scores
- **Responsive Design**: Adapts to different screen sizes

## 🎯 How to Play

1. **Aim**: Click and drag or use mouse to aim your shot
2. **Power**: Adjust power with the slider (0-100)
3. **Shoot**: Click the SHOOT button or press spacebar
4. **Goal**: Get the ball in the hole with fewest strokes possible

## 📐 Game Resolution

**Fixed Resolution**: 1280×720 pixels (matches original Qt game)
- Canvas scales to fit your screen while maintaining aspect ratio
- Terrain coordinates perfectly match the background PNG images
- All gameplay elements positioned relative to the fixed resolution
- UI elements stay at screen resolution for optimal usability

## 🛠️ Technical Details

### Architecture
- **Pure HTML5/CSS/JavaScript** - No external libraries
- **Canvas 2D Rendering** - Hardware-accelerated graphics
- **Web Audio API** - Sound effects and background music
- **Local Storage** - Score persistence
- **Responsive Design** - Mobile and desktop support

### Physics Engine
- **Ball Movement**: Top-down velocity-based with realistic friction (K = 0.98)
- **No Gravity**: Ball rolls on flat surface (overhead perspective)
- **Collisions**: Accurate wall reflection with incident angle damping
- **Hole Detection**: Circular collision detection
- **Surface Types**: Sand (high friction), Ice (low friction), Normal
- **Wall Physics**: Proper reflection angles matching original Qt implementation

### File Structure
```
mini-golf-web/
├── index.html          # Main HTML page
├── css/
│   └── styles.css      # Game styling and responsive design
├── js/
│   ├── game.js         # Main game loop and state management
│   ├── ball.js         # Ball physics and rendering
│   ├── terrain.js      # Level loading and collision detection
│   ├── levels.js       # Terrain data from original game
│   ├── ui.js           # Menu system and user interactions
│   └── audio.js        # Sound and music management
└── assets/
    ├── audio/          # Original sound files (WAV/MP3)
    └── images/         # UI graphics (to be added)
```

## 🚀 Getting Started

### Option 1: Run Locally
1. Clone or download this project
2. Open `index.html` in any modern web browser
3. Start playing!

### Option 2: Web Hosting
Upload all files to any web server:
- **GitHub Pages** (free)
- **Netlify** (free)
- **Vercel** (free)
- Any traditional web hosting

## 🎵 Audio Assets

The game includes the original sound files:
- **Background Music**: TitleScreen.mp3, Green.mp3, Desert.mp3, Snow.mp3
- **Sound Effects**: balle.wav (ball hit), BIRDIE.wav (hole in one), etc.
- **UI Sounds**: Button clicks and selections

## 🏆 Scoring System

- **Strokes**: Count per hole (like golf)
- **Par**: Target strokes per level
- **Score**: Strokes relative to par
- **Best Scores**: Saved locally in browser

## 📱 Mobile Support

- **Touch Controls**: Tap to aim, drag to adjust power
- **Responsive UI**: Adapts to screen size
- **Touch-Optimized**: Large buttons and touch targets

## 🔧 Development

### Adding New Levels
1. Create terrain coordinates in the same format as existing levels
2. Add to `LEVELS` array in `levels.js`
3. Test collision detection and ball physics

### Modifying Physics
Key constants in `game.js`:
```javascript
this.friction = 0.98;      // Ball slowdown factor (top-down view)
this.bounceDamping = 0.8;  // Wall bounce energy loss
```

**Note**: No gravity in top-down mini-golf - ball only slows due to friction!

### Physics Engine
The game uses a custom vector-based 2D physics engine with:
- **Mathematical collision detection** using closest-point-on-line-segment algorithm
- **Vector reflection** implementing the formula: `v' = v - 2(v·n)n`
- **Surface-based friction** (normal: 0.98, sand: 0.85, ice: 0.995)
- **Anti-sticking repositioning** to prevent ball-wall penetration
- **Real-time physics** at 60 FPS with proper energy conservation

### Customizing Audio
Edit `audio.js` to change volume levels or add new sound effects.

## 🌐 Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (including iOS)
- **Mobile Browsers**: Touch controls optimized

## 📊 Performance

- **60 FPS** target on modern devices
- **Canvas optimization** for smooth rendering
- **Efficient collision detection** using bounding boxes
- **Audio preloading** for instant sound effects

## 🎨 Visual Design

- **Canvas-based rendering** with crisp graphics
- **Gradient backgrounds** for terrain themes
- **Particle effects** for ball trails (optional enhancement)
- **Smooth animations** for UI transitions

## 🐛 Known Issues & Future Enhancements

### Planned Features
- [ ] Online leaderboard system
- [ ] Power-ups and special balls
- [ ] Time trial modes
- [ ] Custom level editor
- [ ] Multiplayer support

### Performance Optimizations
- [ ] WebGL renderer for better performance
- [ ] Asset compression
- [ ] Progressive loading

## 📄 License

This is a web port of the original Mini-Golf game. All original assets and game design belong to the original creators.

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the web version!

---

**Enjoy playing Mini Golf on the web! ⛳🎮**
