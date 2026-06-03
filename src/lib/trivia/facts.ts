export type FactTopic = "dog" | "sudoku";

export type TriviaFact = {
  id: string;
  text: string;
  topic: FactTopic;
};

export const TRIVIA_FACTS: TriviaFact[] = [
  {
    id: "s1",
    topic: "sudoku",
    text: "Sudoku grids are always 9×9, but the puzzle was popularized in Japan — the name means “single number.”",
  },
  {
    id: "d1",
    topic: "dog",
    text: "A dog’s nose print is unique, similar to a human fingerprint.",
  },
  {
    id: "s2",
    topic: "sudoku",
    text: "There are 6,670,903,752,021,072,936,960 possible valid Sudoku grids.",
  },
  {
    id: "d2",
    topic: "dog",
    text: "Dalmatian puppies are born all white; their spots develop as they grow.",
  },
  {
    id: "s3",
    topic: "sudoku",
    text: "World Sudoku Championship competitors often finish expert puzzles in under 10 minutes.",
  },
  {
    id: "d3",
    topic: "dog",
    text: "Dogs can learn over 150 words and gestures — border collies are among the quickest learners.",
  },
  {
    id: "s4",
    topic: "sudoku",
    text: "Classic Sudoku has no arithmetic: you only place digits 1–9 with no repeats in rows, columns, or boxes.",
  },
  {
    id: "d4",
    topic: "dog",
    text: "A greyhound can sprint faster than 40 mph — quicker than most humans on a bike.",
  },
  {
    id: "s5",
    topic: "sudoku",
    text: "The minimum number of starting clues for a unique Sudoku solution is believed to be 17.",
  },
  {
    id: "d5",
    topic: "dog",
    text: "Dogs sweat mainly through their paw pads; they cool off by panting.",
  },
  {
    id: "s6",
    topic: "sudoku",
    text: "Sudoku variants include diagonal Sudoku, killer cages, and hyper Sudoku with extra regions.",
  },
  {
    id: "d6",
    topic: "dog",
    text: "The Basenji is known as the “barkless dog” — it yodels instead of barking.",
  },
  {
    id: "s7",
    topic: "sudoku",
    text: "Newspapers helped Sudoku go global in the 2000s after it left puzzle magazines in Japan.",
  },
  {
    id: "d7",
    topic: "dog",
    text: "Petting a dog can lower cortisol and blood pressure in humans — mutual calm for both species.",
  },
  {
    id: "s8",
    topic: "sudoku",
    text: "Logical techniques like “naked pairs” and “X-wing” solve hard puzzles without guessing.",
  },
  {
    id: "d8",
    topic: "dog",
    text: "A dog’s sense of smell is tens of thousands of times stronger than a human’s.",
  },
];

/** Local calendar date YYYY-MM-DD — one fact per day in the user's timezone. */
export function todayDateKey(now = Date.now()): string {
  return new Date(now).toLocaleDateString("en-CA");
}

function hashDateKey(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function factForDay(now = Date.now()): TriviaFact {
  const idx = hashDateKey(todayDateKey(now)) % TRIVIA_FACTS.length;
  return TRIVIA_FACTS[idx]!;
}
