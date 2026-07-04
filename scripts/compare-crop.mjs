import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "../screenshots");
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

/** Wider crop (previous) vs tight crop (current) for comparison. */
const CROPS = [
  { name: "crop-wide", width: "5.25rem", translate: "-translate-x-11" },
  { name: "crop-tight", width: "4rem", translate: "-translate-x-14" },
];

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
  });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  const gate = page.getByRole("button", { name: "Continue on this device" });
  if (await gate.isVisible().catch(() => false)) await gate.click();
  await page.waitForTimeout(500);

  for (const crop of CROPS) {
    await page.evaluate(
      ({ width, translate }) => {
        const box = document.querySelector("header [aria-hidden]");
        const img = document.querySelector("header img");
        if (box) box.style.width = width;
        if (img) {
          img.className = `block shrink-0 object-contain max-w-none ${translate}`;
        }
      },
      { width: crop.width, translate: crop.translate },
    );
    await page.waitForTimeout(200);
    await page.locator("header").screenshot({
      path: path.join(outDir, `play-header-${crop.name}.png`),
    });
    console.log(path.join(outDir, `play-header-${crop.name}.png`));
  }

  await page.screenshot({
    path: path.join(outDir, "play-tab-latest.png"),
  });
  console.log(path.join(outDir, "play-tab-latest.png"));

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
