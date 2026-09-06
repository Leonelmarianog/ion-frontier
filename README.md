# Ion Frontier

An original browser shooter inspired by classic Thunder Force games. Built with Phaser, strict TypeScript, and Vite. All game graphics are generated locally from geometric shapes; no game assets are required.

## Development

Requires Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Press Enter or click the game to launch. Move with WASD or arrow keys, hold Space to fire, and press P to pause/resume. Switching away from the window pauses the game. You have three hull points, with brief invulnerability after a hit. Destroy enemies for 100 points each. Waves grow in size and speed. Press Enter or click after losing to restart.

## Checks and release

```sh
npm run lint
npm run format:check
npm test
npm run build
npx playwright install chromium
npm run test:browser
npm run preview
```

Deploy the generated `dist/` directory to a static host. No server or accounts are required. The page uses an optional Google Font with a system fallback.

## Docker deployment

Requires Docker Engine and the Docker Compose plugin.

```sh
docker compose up -d --build --wait
```

Open `http://localhost:8080`. To change the host port, run `PORT=3000 docker compose up -d --build --wait`. The container always listens on port **8080**. Configure your deployment platform to route traffic to that port and terminate HTTPS at its reverse proxy/load balancer. Serve the game at the domain root.

```sh
docker compose ps
docker compose logs -f game
curl --fail http://localhost:8080/healthz
docker compose down
```

Without Compose:

```sh
docker build -t ion-frontier:latest .
docker run -d --name ion-frontier --restart unless-stopped \
  --read-only --tmpfs /tmp:rw,noexec,nosuid,size=16m \
  --cap-drop ALL --security-opt no-new-privileges:true \
  -p 8080:8080 ion-frontier:latest
docker inspect --format '{{.State.Health.Status}}' ion-frontier
```

The multi-stage image builds with Node.js and serves only the production output with Nginx as a non-root user. Dependencies are installed from the lockfile; host `node_modules`, local build output, and secrets are excluded from the build context. Base images track Node 24 Alpine and Nginx stable Alpine; rebuild with `docker compose build --pull` to pick up base-image updates.

**Healthcheck:** `GET /healthz` returns HTTP 200 with the built HTML when Nginx can serve it, or HTTP 503 if the entry file is missing. The Docker healthcheck runs every 30 seconds with a 3-second timeout, a 5-second startup grace period, and three retries. For platforms that configure probes separately, use HTTP on port 8080, path `/healthz`. This checks static-site availability; browser gameplay is covered by the browser smoke test. Docker reports an unhealthy status but does not automatically restart a container solely because its healthcheck fails.

Hashed assets receive long-lived immutable caching; HTML is revalidated on each request so new deployments are picked up. No runtime environment variables or backend are required by the game.

## Structure

- `src/main.ts`: engine configuration and responsive canvas.
- `src/scenes/FlightScene.ts`: initial playable scene, input, collisions, pooled entities, and run states.
- `src/game/rules.ts`: engine-independent movement and wave rules.
- `tests/`: unit tests for gameplay invariants and a browser smoke test for launch/pause/resume.
- `.github/workflows/ci.yml`: automated formatting, lint, test, and build checks.

The prototype targets desktop keyboard play. It includes movement, firing, scrolling star layers, enemy waves, scoring, damage, pause, and retry. Next milestones: separate enemy and weapon systems as behavior grows, add authored enemy formations and enemy bullets, weapon pickups, then a finite stage and boss. Audio, gamepad/touch input, persistent scores, are not implemented yet.
