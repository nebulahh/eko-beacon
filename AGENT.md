# Agent build instructions

These instructions apply to all product work in this repository. The product is **Eko Beacon**, a 3D optical puzzle. Do not revert to a Lagos runner concept; the start.ng directory already has several closely related runners.

## Required reading

Before changing product code, read `style.md`, `taste.md`, `architecture.md`, and `prd.md`. Keep implementation aligned with them. If a requirement changes, update the relevant product document in the same change.

## Technical constraints

- Build a frontend-only Three.js game that can be served as static files.
- The published output must include a ready-to-play `dist/index.html` and locally bundled assets; start.ng does not install packages or run a build command. Keep the unbuilt Vite entry point under `src/` so start.ng selects `dist/index.html`.
- Use relative URLs. Do not add secrets, backend code, or password collection.
- Use start.ng's documented connect iframe and `postMessage` bridge for identity, leaderboard reads, and score saves. Validate message origin, source, type, and request ID.
- Render the rooftop avatar from the player's start.ng `style`; unknown values must fall back safely. Guests use the supplied guest identity and can sign in through start.ng.
- Avoid unnecessary dependencies and keep mobile input usable.

## Verification and delivery

- When implementation is complete, build the static output and inspect the generated files.
- Follow start.ng's publish workflow: call `/games/check` before `/games/publish` once a public GitHub repository URL is available. Surface any `approve_url` for the account owner to approve.
- Do not claim publishing succeeded unless start.ng confirms it.

## Directory uniqueness

- Before settling the game name or core genre, inspect the current start.ng games directory. Avoid names and core loops that duplicate active entries; record close matches and the chosen differentiation in `prd.md`.
