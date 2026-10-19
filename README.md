# Eko Beacon

A Three.js mirror-routing puzzle for start.ng. Play as your start.ng character, route sunlight across the rooftops, and light the beacon.

## Develop

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
```

The publishable static site is generated in `dist/`. It contains the built game, leaderboard configuration, and cover image. Include `dist/` in the public GitHub repository because start.ng serves static files and does not run the build.

## start.ng integration

The game uses the documented connect iframe and validates messages from `https://start.ng`. Signed-in players bring their name, account, and avatar style. Guests can solve all puzzles and sign in to save completed runs. The leaderboard stores levels completed and time.

## Publish

Push the repository (including `dist/`) to a public GitHub repository, then follow the start.ng publish workflow in `AGENT.md`. The game name is `eko-beacon`.
