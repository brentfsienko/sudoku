import puppeteer from "puppeteer-core";
import { mkdir } from "fs/promises";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = "scripts/screenshots";
const BASE = "http://127.0.0.1:3010";

await mkdir(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

async function checkViewport(label, width, height) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(BASE, { waitUntil: "load" });
  await page.evaluate(() => {
    localStorage.setItem("floof-auth-intro-done", "1");
    localStorage.setItem(
      "floof-sudoku-data",
      JSON.stringify({
        profile: { name: "Biscuit", dogId: "corgi" },
        solo: {
          played: 12,
          won: 9,
          bestScore: 4200,
          totalScore: 30000,
          totalSolveSeconds: 4000,
          fastestSolveSeconds: 198,
          perfectGames: 2,
          streak: 1,
          bestStreak: 5,
          lastPlayedDate: "2026-06-03",
          bestTimeByDifficulty: {},
          playsByDifficulty: {},
        },
        multi: {
          coopPlayed: 3,
          coopSolved: 2,
          compPlayed: 5,
          compWon: 2,
          compTied: 0,
          totalSquares: 120,
          opponents: {},
        },
        history: [],
        bones: 8,
      }),
    );
  });
  await page.goto(`${BASE}/play?difficulty=easy`, { waitUntil: "load" });
  await page.waitForSelector(".game-viewport", { timeout: 15000 });
  await page.waitForSelector("[data-number-pad]", { timeout: 15000 });
  await new Promise((r) => setTimeout(r, 300));

  // Hide Next.js dev indicator so it doesn't skew layout checks
  await page.addStyleTag({
    content:
      "nextjs-portal, [data-nextjs-toast], [data-next-badge-root] { display: none !important; }",
  });

  const metrics = await page.evaluate(() => {
    const vh = window.innerHeight;
    const padRow = document.querySelector("[data-number-pad]");
    const shell = document.querySelector(".game-viewport .aspect-square");
    const padRect = padRow?.getBoundingClientRect();
    const shellRect = shell?.getBoundingClientRect();
    const viewport = document.querySelector(".game-viewport");
    return {
      vh,
      viewportH: viewport
        ? Math.round(viewport.getBoundingClientRect().height)
        : null,
      padBottom: padRect ? Math.round(padRect.bottom) : null,
      padTop: padRect ? Math.round(padRect.top) : null,
      padHeight: padRect ? Math.round(padRect.height) : null,
      padVisible:
        padRect != null &&
        padRect.height > 8 &&
        padRect.top >= 0 &&
        padRect.bottom <= vh + 1,
      boardSize: shellRect
        ? {
            w: Math.round(shellRect.width),
            h: Math.round(shellRect.height),
          }
        : null,
    };
  });

  await page.screenshot({
    path: `${OUT}/se-verify-${label}.png`,
    fullPage: false,
  });
  await page.close();
  return metrics;
}

const se = await checkViewport("320x568", 320, 568);
const tall = await checkViewport("390x844", 390, 844);

await browser.close();

console.log(JSON.stringify({ se, tall }, null, 2));

const seSquare =
  se.boardSize && Math.abs(se.boardSize.w - se.boardSize.h) <= 2;
const tallSquare =
  tall.boardSize && Math.abs(tall.boardSize.w - tall.boardSize.h) <= 2;
const ok =
  se.padVisible === true &&
  tall.padVisible === true &&
  seSquare &&
  tallSquare;

if (!ok) {
  console.error("FAIL: number pad not fully visible or board not square");
  process.exit(1);
}
console.log("PASS: number pad visible on SE and tall phone; board square");
