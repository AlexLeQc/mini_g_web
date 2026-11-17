# Mini-G — Bug fixes & UX / gameplay review

## Part 1 — Bugs fixed

| # | Bug | Cause | Fix |
|---|-----|-------|-----|
| 1 | **Ball escapes the map** (reported by a friend) | At full power the ball moved 10 px per frame but its radius is 8 px. Walls are thin lines, so the ball could jump past a wall in a single frame. The code then flipped the wall's normal to "face the ball", which was now on the **outside**, and pushed it further out. In testing, max-power shots escaped on levels 4, 7 and 8. | Movement is now split into small steps of at most 4 px (half the radius), with a collision check after each step. As a safety net, if the ball ever ends up off the course it goes back to where the last shot was taken. Re-tested with 3,200 random max-power shots: **0 escapes**. |
| 2 | Weird bounces off wall ends and sharp corners | The bounce direction always used the wall's perpendicular, even when the ball hit the **tip** of a wall. | The bounce direction now goes from the contact point to the ball's center, so it's correct for both flat sides and tips. |
| 3 | Corners only handled one wall per frame | `checkCollisions` returned after the first wall it touched. | All walls are resolved in each step. |
| 4 | **Game speed depends on the monitor** | Physics ran once per `requestAnimationFrame`, so on a 120/144 Hz screen the ball rolled 2–2.4× faster. | A fixed timestep runs physics 60 times per second on every screen. |
| 5 | **A click without dragging costs a stroke** | The shot reused the previous aim line, so a plain click (or a 2 px accidental drag) fired a tiny shot and counted a stroke. | Drags under 10 px now cancel the shot without counting a stroke. |
| 6 | Ball could skip over the hole at high speed | The hole was only checked once per frame (10 px jumps). | The hole is checked at every sub-step. |
| 7 | The "taunt" sound played on the shot that **made** par | It played as soon as you took your par-th stroke, before knowing if the ball went in. | It now plays when the ball **stops** after the par-th stroke without going in. |
| 8 | **Resume crashed** (`this.updateUI is not a function`) | `UIManager` has no `updateUI` method. | It now calls `updateGameUI()`. |
| 9 | Aiming + pause = surprise shot | Pausing while aiming left the aim active, so the next mouse release fired a shot. | Pausing cancels the current aim. |
| 10 | Releasing the mouse outside the canvas did nothing | `mouseup` was only listened for on the canvas. | `mousemove`/`mouseup` are now on `window`. |
| 11 | Touch release could be lost | The fake `mouseup` sent from touch events didn't bubble. | Touch now calls the mouse handlers directly. |
| 12 | Board stretched and aim offset on phones (< 480 px) | A CSS rule forced the canvas to `100vw × 70vh` on top of the JS scaling. | Removed that rule. |
| 13 | Crash if saved scores are corrupted or storage is blocked | `JSON.parse` / `localStorage` weren't protected. | Wrapped in `try/catch`, with a fallback to empty scores. |
| 15 | Shots felt slow / stuttery after fix #4 | Physics at 60 updates/s felt half as fast as before on 120 Hz screens, and a fixed step without interpolation stutters. | Physics now runs at 120 updates/s and the ball is drawn interpolated between steps. It also eases to a stop instead of halting abruptly. |
| 16 | Extra guard for corners | — | If the ball's center would ever cross a wall line, that move is cancelled and the ball bounces instead. |
| 14 | Wrong favicon type, wrong README controls | `type="image/svg+xml"` for a PNG; the README said Space shoots. | Fixed both. |

## Part 2 — UX / UI problems found (not changed yet)

**High impact**
1. **No power feedback.** The aim line is a thin red line with no power indicator. Add a gauge or a line that changes color from green to red, and show the max length.
2. **"Drag toward where you want to go" feels backwards.** Most golf games (and slingshot games) use **pull back to shoot**. Consider switching, or adding an option.
3. **No shot preview / no ghost of the last shot.** A dotted line showing the first bounce would help beginners. You could limit it to the easy levels.
4. ✅ DONE — **The HUD covers the course.** The black box in the top-left sits on top of the canvas. Move it into the letterbox area, or make it a slim top bar.
5. ✅ DONE — **`alert()` when you finish all levels.** This looks broken in a game. Replace it with a real "Course complete" screen showing total strokes against total par.
6. ✅ DONE — **Background images pop in late.** You see a plain green board for a moment before each level's art loads. Preload all 8 terrain images at startup.
7. ✅ DONE — **Title music never plays on first load.** Browsers block autoplay until the player clicks, and the first click switches straight to the menu music. Start the title music on the first click, or show a "click to start" step.

**Medium**
8. **No way to restart quickly.** Add an `R` key to restart and show keyboard hints (Esc = pause, R = restart).
9. **The Level Complete screen hides the board.** Let the ball visibly drop into the hole first (shrink/fade animation, ~0.5 s), then show the panel.
10. **No visual feedback for a wall hit.** Add a small particle burst or screen shake proportional to the impact.
11. **Level Select doesn't show the par.** It also doesn't show a lock or progress, and the "⭐ PAR" label is confusing. Show `Par 3 · Best 2` on each card.
12. **No volume or mute button.** `AudioManager` already has `setMusicEnabled` and `setSoundEnabled`, but nothing in the UI uses them. Add a 🔊 toggle on the HUD and the pause menu.
13. **Esc behavior is inconsistent.** On Rules and Scoreboard it goes to the main menu. On the Level Complete screen it does nothing.
14. **Text is mixed French and English.** Comments, the README, and the sounds' words are in French, while the UI is in English. Pick one, or add a language toggle.
15. **The mouse cursor gives no hint.** Show `cursor: crosshair` while aiming, and a "grab" cursor over the ball.

**Mobile**
16. On phones the HUD becomes `position: static`, which pushes the layout. There's also no landscape prompt, and the canvas is tiny in portrait. Add a "rotate your device" overlay.
17. On touch screens your finger hides the ball. Pull-back aiming (see 2) also fixes this.

## Part 3 — Gameplay upgrade ideas

- **Full "course" mode:** play all 8 holes in a row with a scorecard (strokes per hole, total, against par), and save the best full-round score.
- **Stroke limit:** for example, after par + 4 the hole ends automatically, so nobody gets stuck forever.
- **Out-of-bounds penalty:** the safety net already resets the ball. You could make it a real rule (+1 stroke, as in real mini golf) and add water or out-of-bounds zones to the levels.
- **Realistic hole capture:** make a ball that's too fast "lip out" (roll over the hole) instead of always dropping in. This rewards controlling your power.
- **Surface zones inside a level:** sand traps or ice patches inside a green level, instead of one friction value for the whole map. The level format already has `S`/`G` flags, so this could extend it per polygon.
- **Moving obstacles** (windmill, sliding block) and **slopes** (a constant force inside a zone). These are the classic mini golf features.
- **Ghost of your best run** and **star ratings** (3★ = under par, 2★ = par, 1★ = finished).
- **Level editor:** the levels are plain text (`x,y;x,y;...`), so a simple in-browser click-to-place editor would be quite easy to build.

## Note
Level 1's background art closely resembles a well-known Nintendo game (brick blocks, "?" blocks, pipes, hills). That's fine for a school project. If you share the game publicly on GitHub Pages, consider replacing it with original art to avoid copyright problems.
