import { chromium } from "playwright";
import { mkdir, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../screenshots");
const assetsDir = path.join(
  __dirname,
  "../../.cursor/projects/Users-brentsienko-Code/assets",
);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

async function shot(page, file) {
  const target = path.join(outDir, file);
  await page.screenshot({ path: target, fullPage: false });
  console.log(target);
  try {
    await copyFile(target, path.join(assetsDir, file));
  } catch {
    /* assets optional */
  }
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
  });
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.waitForTimeout(500);

  const signInGate = page.getByRole("button", {
    name: "Continue on this device",
  });
  if (await signInGate.isVisible().catch(() => false)) {
    await signInGate.click();
    await page.waitForTimeout(400);
  }

  await shot(page, "play-tab.png");
  await page.locator("header").screenshot({
    path: path.join(outDir, "play-header-crop.png"),
  });
  console.log(path.join(outDir, "play-header-crop.png"));

  await page.getByRole("button", { name: "Friends", exact: true }).click();
  await page.waitForTimeout(400);
  await shot(page, "friends-tab.png");
  await page.getByRole("heading", { name: "Friends", level: 1 }).screenshot({
    path: path.join(outDir, "friends-header-crop.png"),
  });
  console.log(path.join(outDir, "friends-header-crop.png"));

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
