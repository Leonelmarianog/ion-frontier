› I want to create a Thunder Force Game clone that can be played on the browser using best programming practices. I already created the main directory (this directory), what do we need?.

• I’ll check the directory first, then outline a practical browser game stack and the first playable milestone.

• Ran pwd && rg --files -g '!node_modules' -g '!package-lock.json' -g '!*lock*' -g 'AGENTS.md' -g 'package.json' -g 'README*' -g 'tsconfig*' -g 'vite.config.*' -g 'src/**' -g 'public/**' -g '.gitignore'
  └ /home/leonel/developer/games/thunder-force-clone

• Searching the web

• Searched the web for site.phaser.io Phaser TypeScript Vite getting started arcade physics

• I recommend TypeScript + Phaser + Vite, starting with one complete, short level. Phaser provides the game systems we need and has an official TypeScript/Vite template. Its Arcade Physics system fits a retro shooter well. Official template (https://phaser.io/news/2024/01/phaser-vite-typescript-template), physics documentation (https://docs.phaser.io/phaser/concepts/physics/arcade).

  The directory has no matching project files, so we can establish the structure from the start.

  We need five things:

  1. A focused game design. My suggested starting point is a single-player, horizontal scrolling shooter inspired by Thunder Force III/IV: responsive movement, selectable weapons, enemy formations, environmental hazards, and bosses. Target desktop browsers and keyboard controls first.

  2. A development toolchain. Node.js LTS and npm, TypeScript in strict mode, Vite for development/builds, ESLint and Prettier for consistency, and Git for version control. A static website is sufficient for the initial game; no backend is needed.

  3. A maintainable game structure. Separate scenes for loading, menus, gameplay, and results. Keep player, enemy, weapon, and wave logic in small modules. Store weapon settings and level schedules as data so balancing doesn’t require rewriting behavior.

  4. Art and audio. Start with placeholder graphics while developing the controls and combat. Later, add original ship sprites, backgrounds, explosions, sound effects, and music with a consistent pixel-art style.

  5. Useful verification. Test damage, scoring, weapon upgrades, and wave scheduling independently. Add browser smoke tests for starting, playing, losing, and restarting. Automate type checking, linting, test, and production builds.

  For performance and reliability, we should use frame-rate-independent movement, reuse frequently spawned bullets and enemies, clean up scene timers/listeners, and pause when the browser loses focus.

  Our first playable milestone should include:

  - A ship with movement, shooting, and screen boundaries.
  - A scrolling background and three enemy patterns.
  - Collisions, lives, score, and one weapon upgrade.
  - One short stage ending in a boss.
  - Start, pause, game-over, and restart flows.
  - A production build that can be hosted as a static site.

  That gives us a complete game loop to refine before investing in more stages and finished artwork. The first implementation step is scaffolding the project and building ship movement, shooting, and one enemy wave.
