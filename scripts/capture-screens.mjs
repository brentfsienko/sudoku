import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3010";
const OUT = "scripts/screenshots";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox"],
});

await mkdir(OUT, { recursive: true });

const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

await page.goto(BASE, { waitUntil: "networkidle2" });

await page.evaluate(() => {
  const data = {
    profile: { name: "Biscuit", dogId: "corgi" },
    solo: {
      played: 52,
      won: 41,
      bestScore: 9240,
      totalScore: 250100,
      totalSolveSeconds: 13940,
      fastestSolveSeconds: 198,
      perfectGames: 13,
      streak: 5,
      bestStreak: 11,
      lastPlayedDate: new Date().toISOString().slice(0, 10),
      bestTimeByDifficulty: { easy: 121, medium: 198, hard: 305, expert: 512, master: 744 },
      playsByDifficulty: { easy: 8, medium: 19, hard: 14, expert: 7, master: 4 },
    },
    multi: {
      coopPlayed: 12,
      coopSolved: 9,
      compPlayed: 15,
      compWon: 8,
      compTied: 1,
      totalSquares: 437,
      opponents: {
        rex: { name: "Rex", dogId: "husky", games: 18, wins: 7 },
      },
    },
    history: Array.from({ length: 40 }, (_, i) => ({
      t: Date.now() - i * 86400000 * 2,
      mode: i % 3 === 0 ? "solo" : i % 2 ? "coop" : "competitive",
      won: true,
      seconds: 200 + i * 10,
      mistakes: i % 4,
      difficulty: ["easy", "medium", "hard"][i % 3],
      score: 5000 + i * 100,
    })),
  };
  localStorage.setItem("floof-sudoku-data", JSON.stringify(data));
});

await page.reload({ waitUntil: "networkidle2" });
await page.screenshot({ path: `${OUT}/01-play.png` });

async function tapTab(label) {
  await page.evaluate((text) => {
    const btns = [...document.querySelectorAll("button")];
    const btn = btns.find((b) => b.textContent?.trim() === text);
    if (btn) btn.click();
  }, label);
  await new Promise((r) => setTimeout(r, 600));
}

await tapTab("Friends");
await page.screenshot({ path: `${OUT}/02-friends.png` });

await tapTab("Me");
await page.screenshot({ path: `${OUT}/03-me.png`, fullPage: true });

await browser.close();
console.log(`Screenshots saved to ${OUT}/`);
