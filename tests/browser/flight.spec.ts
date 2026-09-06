import { test, expect } from "@playwright/test";

test("launches, animates, pauses, and resumes without browser errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  const canvas = page.locator("canvas");
  await expect(canvas).toBeVisible();
  await page.waitForTimeout(600);
  expect(errors).toEqual([]);
  const title = await canvas.screenshot({ path: "test-results/title.png" });
  await page.keyboard.press("Enter", { delay: 100 });
  await page.keyboard.down("Space");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowDown");
  await page.keyboard.up("Space");
  expect((await canvas.screenshot()).equals(title)).toBe(false);
  await page.keyboard.press("p", { delay: 100 });
  await page.waitForTimeout(400);
  const paused = await canvas.screenshot();
  await page.waitForTimeout(300);
  expect((await canvas.screenshot()).equals(paused)).toBe(true);
  await page.keyboard.press("p", { delay: 100 });
  await page.waitForTimeout(300);
  expect((await canvas.screenshot()).equals(paused)).toBe(false);
  expect(errors).toEqual([]);
});
