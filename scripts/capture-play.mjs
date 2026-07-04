import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "scripts/screenshots";

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
await page.goto("http://localhost:3010", { waitUntil: "networkidle2" });

await page.evaluate(() => {
  localStorage.setItem("floof-auth-intro-done", "1");
  localStorage.setItem(
    "floof-sudoku-data",
    JSON.stringify({
      profile: { name: "Biscuit", dogId: "corgi" },
      solo: { played: 12, won: 9, bestScore: 4200, totalScore: 30000, totalSolveSeconds: 4000, fastestSolveSeconds: 198, perfectGames: 2, streak: 1, bestStreak: 5, lastPlayedDate: "2026-06-03", bestTimeByDifficulty: {}, playsByDifficulty: {} },
      multi: { coopPlayed: 3, coopSolved: 2, compPlayed: 5, compWon: 2, compTied: 0, totalSquares: 120, opponents: {} },
      history: [],
      bones: 0,
    }),
  );
});

await page.reload({ waitUntil: "networkidle2" });
await page.screenshot({ path: `${OUT}/play-fixed-top.png` });

await page.evaluate(() => {
  const el = document.querySelector("[class*='overflow-y-auto']");
  if (el) el.scrollTop = 180;
});
await new Promise((r) => setTimeout(r, 400));
await page.screenshot({ path: `${OUT}/play-scrolled.png` });

await browser.close();
console.log("Saved play-fixed-top.png and play-scrolled.png");
