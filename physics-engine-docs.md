# 🔧 Physics Engine Documentation

## Vector-Based Collision System

### Overview
This 2D physics engine implements precise vector mathematics for realistic ball-wall collisions in the mini-golf game. The system uses mathematical formulas from classical mechanics to ensure accurate and predictable ball behavior.

## 📐 Mathematical Foundation

### 1. Collision Detection

**Algorithm:** Closest Point on Line Segment
```
Given: Ball center (px, py) and line segment (x1,y1) to (x2,y2)

1. Project point onto infinite line:
   t = ((px - x1)·(x2 - x1) + (py - y1)·(y2 - y1)) / |(x2 - x1)|²

2. Clamp t to [0, 1] to stay on segment:
   t_clamped = max(0, min(1, t))

3. Calculate closest point:
   Px = x1 + t_clamped × (x2 - x1)
   Py = y1 + t_clamped × (y2 - y1)

4. Check collision condition:
   distance = √((px - Px)² + (py - Py)²)
   collision = (distance ≤ ball_radius)
```

### 2. Ball Repositioning

**Purpose:** Prevent ball from getting stuck in walls

```
1. Calculate wall normal vector:
   wall_vector = (x2 - x1, y2 - y1)
   normal = (-wall_vector.y, wall_vector.x)  // 90° rotation
   normal_unit = normal / |normal|

2. Determine ball position relative to wall:
   ball_to_point = (Px - px, Py - py)
   side = ball_to_point · normal_unit

3. If ball is on wrong side (side < 0):
   push_distance = ball_radius - distance + ε
   ball_position -= normal_unit × push_distance
```

### 3. Vector Reflection

**Formula:** `v' = v - 2(v·n)n`

**Detailed Implementation:**
```
Given: Incident velocity v = (vx, vy)
       Wall normal n = (nx, ny) [unit vector]

1. Calculate dot product: d = v·n = vx×nx + vy×ny

2. Apply reflection formula:
   v'x = vx - 2 × d × nx
   v'y = vy - 2 × d × ny

3. Apply energy damping:
   v'x_final = v'x × damping_factor
   v'y_final = v'y × damping_factor
```

**Why this formula works:**
- It preserves the component of velocity parallel to the wall
- It reverses the component of velocity perpendicular to the wall
- Result: Perfect specular reflection

## 🏗️ Code Architecture

### Class Structure
```
Terrain
├── checkCollisions(ball, damping)
│   ├── getClosestPointOnSegment(px, py, wall)
│   ├── getDistance(x1, y1, x2, y2)
│   ├── repositionBall(ball, closestPoint, wall)
│   └── reflectBallVectorially(ball, wall, damping)
└── wallGroups[][]
```

### Optimization Strategy
- **Wall Group Iteration:** Loop through all `wallGroups` as requested
- **Single Collision per Frame:** Only resolve one collision per physics update
- **Early Exit:** Stop checking walls after first collision found
- **Vector Math:** Pure mathematical operations, no approximations

## 🧪 Testing & Validation

### Test Scenarios
1. **Horizontal Wall:** Ball approaching from above/below
2. **Vertical Wall:** Ball approaching from left/right
3. **Diagonal Wall:** Ball approaching at angle
4. **Multiple Walls:** Complex level with many obstacles
5. **Edge Cases:** Ball hitting wall endpoints, near-zero velocities

### Validation Metrics
- **Energy Conservation:** Verify reflection preserves momentum direction
- **Normal Accuracy:** Check that reflection normal is perpendicular to wall
- **Position Stability:** Ensure ball never gets stuck in walls
- **Performance:** Maintain 60 FPS with complex levels

## 📊 Performance Characteristics

### Computational Complexity
- **Collision Detection:** O(W) where W = number of walls
- **Closest Point:** O(1) per wall (vector math only)
- **Reflection:** O(1) (fixed mathematical operations)
- **Total:** O(W) per frame, suitable for real-time physics

### Memory Usage
- **Minimal:** Only stores wall coordinates and ball state
- **No Dynamic Allocation:** Pure mathematical computations
- **Cache Friendly:** Sequential wall processing

## 🎯 Physics Accuracy

### Real-World Correspondence
- **Specular Reflection:** Mirrors real billiard ball physics
- **Energy Loss:** Realistic damping on collision (80% energy retention)
- **No Penetration:** Mathematically guaranteed separation
- **Deterministic:** Same input always produces same output

### Game Balance
- **Predictable:** Players can learn wall bounce patterns
- **Fun Factor:** Satisfying collision feedback
- **Challenge:** Requires skill to predict ball paths
- **Fairness:** Physics consistent across all devices

## 🔧 Technical Specifications

### Coordinate System
- **Origin:** Top-left corner (0,0)
- **X-axis:** Increases rightward
- **Y-axis:** Increases downward
- **Units:** Pixels (matches canvas resolution)

### Numerical Precision
- **Floating Point:** JavaScript Number (64-bit IEEE 754)
- **Epsilon Values:** 0.01 for distance comparisons
- **Normalization:** Prevents division by zero
- **Clamping:** t ∈ [0,1] for segment projections

### Browser Compatibility
- **Math Functions:** All modern browsers support required operations
- **Performance:** Hardware-accelerated canvas rendering
- **Precision:** Consistent across different JavaScript engines

## 🚀 Future Enhancements

### Advanced Physics
- **Friction Models:** Different surface types (grass, ice, sand)
- **Spin Effects:** Ball rotation and english
- **Multiple Balls:** Multi-ball physics interactions
- **Air Resistance:** Velocity-dependent drag forces

### Optimization
- **Spatial Partitioning:** Quadtree or grid-based collision culling
- **Broad Phase:** Quick elimination of distant walls
- **SIMD Operations:** Vectorized math for multiple balls
- **WebAssembly:** Compiled physics for better performance

### Debugging Tools
- **Collision Visualization:** Draw collision points and normals
- **Physics Playback:** Slow-motion collision analysis
- **Telemetry:** Frame-by-frame physics data logging
- **Profiling:** Performance monitoring and bottlenecks

---

**This vector-based physics engine provides mathematically accurate and performant 2D collision resolution for the mini-golf game, implementing classical mechanics principles in a game-ready package.**
