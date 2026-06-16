# Dead Circuit

Dead Circuit is a Three.js/WebGL first-person survival game for the Interactive Graphics final project. The player explores a locked-down facility, earns points by fighting zombies and repairing barricades, buys access to later rooms, and wins by reaching the extraction objective.

## Run

```bash
npm install
npm run dev
```

Build:

```bash
npm run build
```

## Controls

- `W A S D`: move
- `Mouse`: look
- `Left mouse`: shoot
- `Shift`: sprint
- `R`: reload
- `E`: interact with doors, barricades, weapons, power-ups, and extraction
- `F`: flashlight
- `1 / 2`: switch weapons
- `Esc`: pause
- `O`: developer overview camera
- `Q`: add demonstration points while in developer view

## Developer Demonstration Mode

Press `O` during a run to open the developer overview camera. The game pauses and switches to an overhead view of the arena. While this view is active, press `Q` to add 500 points at a time.

This mode is included for marking and presentation: it lets the professor quickly unlock rooms, buy weapons, reach the extraction area, and see the ending without playing through the full survival loop.

## Main Implemented Features

- Procedural multi-room arena with textured floors, walls, props, fog, lights, shadows, doors, barricades, and collision boxes.
- Hierarchical procedural zombie model built from separate body-part groups.
- Manual zombie animations for idle, walking, running, attacking, hit reaction, and death.
- First-person player controller with pointer-lock camera, flashlight, collision, health, damage feedback, regeneration, and death state.
- Weapon system with pistol, shotgun, rifle, recoil, muzzle flash, reload animation, ammo reserves, automatic fire, raycast hits, shotgun pellet spread, and bullet impacts.
- Game economy with points, score, weapon purchases, ammo purchases, locked doors, barricade repairs, Double Points, Max Ammo, and final extraction.
- Zombie spawning, barricade entry behavior, local obstacle navigation, attack cooldowns, health scaling, and running difficulty after five minutes.
- HUD, menus, pause screen, game-over screen, victory screen, audio effects, and developer inspection mode.

## Technical Notes

- Runtime: Three.js on WebGL through Vite.
- Models are built procedurally in code; no external 3D model files are used.
- External assets are texture and audio files stored under `public/`.
- The project includes a short developer mode so the full map and ending can be demonstrated quickly.
