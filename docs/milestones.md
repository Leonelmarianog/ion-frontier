# Ion Frontier milestones

Updated 2026-09-10. This document tracks completed milestones and remaining work.

## Completed: first playable

The original first playable milestone is complete. Its implementation included the following steps:

- [x] Project foundation: Phaser, strict TypeScript, Vite, linting, formatting, automated tests, and CI.
- [x] Core flight: ship movement, shooting, screen boundaries, scrolling star layers, collisions, lives, scoring, start, pause, game-over, and retry flows.
- [x] Enemy combat: scouts, gunners, guardians, formations, and hostile projectiles. [PR #1](https://github.com/Leonelmarianog/ion-frontier/pull/1).
- [x] Weapon progression: collectible spread upgrades, weapon switching, and pickup feedback. [PR #2](https://github.com/Leonelmarianog/ion-frontier/pull/2).
- [x] Finite stage: ten authored encounters, the Rim Warden boss, victory scoring, and replay. [PR #3](https://github.com/Leonelmarianog/ion-frontier/pull/3).
- [x] Release foundation: static production build, Docker/Coolify deployment, and app/container CI checks.

The user tested and merged all three feature PRs. The [original game-plan transcription](original-game-plan.md) remains the unchanged historical source for this milestone's scope.

## Completed: audio and feedback

- [x] Original synthesized firing, impact, explosion, damage, and pickup sounds.
- [x] Boss warning and looping boss theme, plus victory and defeat cues.
- [x] Accessible mute and volume controls, with optional browser-storage persistence.
- [x] Audio unlock on interaction, silence on pause, and reset on replay.
- [x] Automated validation and successful user playtesting.

Delivered in [PR #4](https://github.com/Leonelmarianog/ion-frontier/pull/4), tested and merged by the user.

## To do next: polish the existing stage

- [ ] A cohesive stage background with layered scrolling, using the existing procedural graphics approach.
- [ ] Better explosions, engine trails, and weapon impact effects using existing graphics.
- [ ] A playtesting pass to tune difficulty, enemy pacing, and boss readability.

Keep this milestone focused on the current stage and current game graphics. Preserve the geometric player, enemies, and boss; improve presentation through backgrounds, motion, effects, and readability.

The user ended sprite generation. New sprites, replacement artwork, and the barrel-roll spritesheet are out of scope. Do not resume sprite generation or integrate experimental generated frames. The concept-sheet and sprite-approval workflow is retired, and the PixelLab MCP configuration has been removed.

## To do later: additional stages

- [ ] Define the scope of additional stages after the existing stage is polished.
- [ ] Build additional stages on the established gameplay and visual approach.

Stage count, environments, encounters, and bosses have not been specified. This work remains deferred until the current-stage polish is complete.

## Unscheduled possibilities

Gamepad input, touch input, and persistent scores are not implemented. They have not been agreed as milestones; scope and priority remain undecided.

## Continuity

Use this file as the milestone tracker across handoffs. Record future scope changes and completion here. Preserve the decision to use existing graphics, and keep `docs/original-game-plan.md` unchanged as a historical transcription.
