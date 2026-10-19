# Visual style

## Product

**Eko Beacon** is a low-poly 3D optical puzzle on Lagos rooftops. Players rotate mirrors to guide sunlight from a solar receiver to a distant beacon. It should feel calm, clever, and sunny.

## Art direction

- Use cream concrete, terracotta walls, teal water tanks, palms, and a hazy Lagos skyline.
- Build scenes from simple geometric forms with soft shadows and readable silhouettes.
- Keep the player's start.ng character visible beside the puzzle board. Outfit colors, skin, hair, hat, and accessory follow their supplied style.
- Render the light beam with an amber core and clear path feedback for success, boundary misses, and loops.
- Use Three.js primitives; no external 3D models or in-game imagery are required.

## Interface

- Show identity, current roof/level, move count, and a compact leaderboard.
- Make mirror selection and rotation obvious. Clicking a mirror or pressing Space rotates it.
- Explain the goal in one short sentence on the opening panel.
- Include a plain-language guide with a visual legend and a specific first-move hint.
- Use high-contrast system fonts and large touch targets.

## Motion and accessibility

- Animate light and rooftop details gently; avoid camera shake.
- Support mouse, touch, and keyboard input in portrait and landscape.
- Use shape and path cues as well as color; keep labels readable and honor reduced motion for decoration.
