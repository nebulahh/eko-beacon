# Product requirements: Eko Beacon

## Summary

Eko Beacon is a short-session 3D optical puzzle for start.ng. Players use their own start.ng character as a rooftop signal keeper, rotating mirrors to guide a beam across Lagos rooftops and light the beacon.

## Audience and need

Players browsing start.ng want an immediately understandable game that feels different from the existing Lagos traffic, market, and runner games while using their shared identity and character.

## Directory uniqueness check

Checked the live start.ng games API on 2026-10-19 (172 entries). Close existing titles include Lagos Market Run, Lagos Run, Lagos Crossing, Go Slow Danfo, Lagos Bike Rush, and Market Dash. Those games occupy the Lagos runner, traffic, and market-collection space, so this product pivots to a rooftop mirror-routing puzzle. The directory has no exact `eko-beacon` name; nearby signal/light entries (`dead-signal`, `nepa-light-up-lagos`) have different names and are not the mirror puzzle loop.

## Goals

- Deliver a polished Three.js puzzle that works as static files on start.ng.
- Use start.ng's signed-in user and guest identities.
- Make centrally configured character styling visible on the rooftop avatar.
- Provide three increasingly involved mirror-routing puzzles.
- Save completed runs to the shared start.ng leaderboard.

## Core loop

1. Meet the rooftop signal keeper and inspect the current puzzle.
2. Select a mirror and rotate it.
3. Follow the beam as it updates; adjust mirrors until it reaches the beacon.
4. Continue through three rooftops, then see levels completed and elapsed time.
5. Restart or sign in to save the run.

## Functional requirements

### Puzzle

- Render a 3D rooftop scene and 5×5 grid with source, target, and rotatable mirrors.
- Trace the beam through the grid using mirror reflection rules. Detect success, boundary misses, and loops.
- Support selecting mirrors with pointer/touch or keyboard and rotating with click/tap or Space/Enter.
- Show a first-play guide that explains the source, beam, mirrors, beacon, controls, and first move in plain language; keep a short contextual hint visible while playing.
- Provide three valid layouts with increasing routing complexity.
- Track mirror turns and elapsed seconds; provide next-level, finish, and restart states.

### start.ng identity and avatar

- Use the documented `https://start.ng/connect` iframe and `startng:whoami` message.
- Validate reply origin, source, request ID, and response type.
- Show character name and `@account` for signed-in users; label guests and offer start.ng sign-in.
- Build a visible avatar using `body`, `primaryColor`, `secondaryColor`, `skinColor`, `hairColor`, `hair`, `hat`, and `accessory`.
- Refresh identity when the page regains focus or visibility.

### Scores

- Declare leaderboard stats in `startng.json`: `levels` (highest), `time` (lowest).
- Save completed runs through the connect bridge for signed-in players.
- Show a public top-five board; guests can see it but cannot save.
- If start.ng is unavailable, preserve play and show a clear save error.

### Responsive and accessible UI

- Fit phone portrait through desktop landscape.
- Make mirrors selectable with pointer/touch and keyboard.
- Use clear labels, strong contrast, visible focus, and touch-sized controls.
- Honor reduced motion for decorative animation.

## Non-goals

- No endless runner, traffic dodging, market collection, custom login, password collection, multiplayer, or server backend.
- No external 3D model or image requirement for the character.

## Acceptance criteria

- The static site runs from `dist/index.html` with no development-server paths.
- Guest fallback is playable if the start.ng bridge is unavailable.
- Signed-in style values change the in-scene character; guest style is used for guests.
- Three puzzles can be solved and completed; a run save is attempted for signed-in players.
- The board displays start.ng data or a clear empty/error state.
- `dist/` contains the built entry point, local assets, `startng.json`, and cover.
- The public directory has no exact `eko-beacon` entry at the time of the check.

## Success measures

- Players understand the goal within five seconds.
- New players can identify the source, beam, mirrors, and target from the opening guide and make the first move without guessing.
- A first run can be completed in a few minutes.
- Character styling is clearly visible during play.
- Completing a signed-in run produces clear save feedback.
