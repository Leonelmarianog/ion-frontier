export const WORLD = { width: 960, height: 540 };
export const FLIGHT = {
  speed: 310,
  fireInterval: 130,
  bulletSpeed: 680,
  lives: 3,
};
export function movement(x: number, y: number, speed: number) {
  const length = Math.hypot(x, y);
  return length === 0
    ? { x: 0, y: 0 }
    : { x: (x / length) * speed, y: (y / length) * speed };
}
