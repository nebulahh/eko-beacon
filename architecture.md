# Architecture

## Shape

Eko Beacon is a static, client-only Three.js puzzle. Source lives in `src/`; Vite bundles source and Three.js into `dist/`. The publishable entry point is `dist/index.html`. No server or database is used.

## Runtime modules

- **Game shell:** HTML overlays for identity, level, moves, instructions, result panel, and touch controls.
- **Three.js scene:** renderer, camera, lighting, rooftop, skyline, puzzle grid, solar emitter, beacon, beams, and player avatar.
- **Puzzle engine:** grid ray tracing with `/` and `\\` mirror reflection, boundary and loop detection, level completion, move tracking, and restart.
- **start.ng adapter:** hidden `/connect` iframe with requests for `startng:whoami`, `startng:leaderboard`, and `startng:score`. Validate origin, source, response type, and request ID.
- **Avatar builder:** visible character geometry and materials generated from start.ng `style`: body, outfit colors, skin, hair, hat, and accessory.

## Data flow

1. On load and when the page regains focus, ask start.ng who is playing.
2. Show `user` when signed in, otherwise the supplied `guest`; build the avatar from that style.
3. A player selects and rotates mirrors. Recompute the beam immediately after each move.
4. Completing three puzzles ends the run. Save `{ levels, time }` for signed-in users and refresh the public board.
5. Guests can play all levels and are offered sign-in at completion.

## Publishable content

- `dist/index.html` and locally bundled assets.
- `dist/startng.json` declares `levels` (highest) and `time` (lowest).
- `dist/cover.png` is a 16:10 cover.
- Source, product docs, Vite config, and generator scripts remain in the repository.

## Resilience

The puzzle remains playable without start.ng, using a Guest fallback. Unknown style values use safe defaults. If leaderboard requests fail, level progression continues and the final panel explains that the run could not be saved.
