import type { Grid, Lang, LineWord, SingleWord } from "../types";
import { COLS, ROWS, SINGLES, VALUES } from "./constants";
import { dictFor } from "../dict";

/** Bokstavspoäng + ordpoäng (längd²−1, 0 för enbokstavsord). */
export function wordScore(lang: Lang, w: string): number {
  let s = 0;
  for (const c of w) s += VALUES[lang][c] || 0;
  s += w.length * w.length - 1;
  return s;
}

export function isValidWord(lang: Lang, w: string): boolean {
  return w.length >= 2 && dictFor(lang).has(w);
}

/** Poängmässigt bästa uppsättning icke-överlappande ord i en linje (DP). */
export function bestWordsInLine(lang: Lang, letters: (string | null)[]): LineWord[] {
  const found: LineWord[] = [];
  let start = 0;
  while (start < letters.length) {
    if (!letters[start]) {
      start++;
      continue;
    }
    let end = start;
    while (end < letters.length && letters[end]) end++;
    const seg = letters.slice(start, end);
    const n = seg.length;
    const dp = new Array<number>(n + 1).fill(0);
    const pick = new Array<{ j: number; w: string; sc: number } | null>(n + 1).fill(null);
    for (let i = 1; i <= n; i++) {
      dp[i] = dp[i - 1];
      for (let j = Math.max(0, i - 7); j < i; j++) {
        const w = seg.slice(j, i).join("");
        if (isValidWord(lang, w)) {
          const sc = wordScore(lang, w);
          if (dp[j] + sc > dp[i]) {
            dp[i] = dp[j] + sc;
            pick[i] = { j, w, sc };
          }
        }
      }
    }
    let i = n;
    while (i > 0) {
      const p = pick[i];
      if (p) {
        found.push({ word: p.w, score: p.sc, a: start + p.j, b: start + i - 1 });
        i = p.j;
      } else i--;
    }
    start = end;
  }
  return found;
}

/** Beräknar orden i en rad (isRow=true) eller kolumn för aktuellt rutnät. */
export function scanLine(lang: Lang, grid: Grid, isRow: boolean, idx: number): LineWord[] {
  const letters: (string | null)[] = [];
  for (let k = 0; k < 7; k++) letters.push(isRow ? grid[idx][k] : grid[k][idx]);
  return bestWordsInLine(lang, letters);
}

/** Enbokstavsord (Å/Ö resp. A/I) som EN gång, bara om bokstaven inte täcks av annat ord. */
export function computeSingles(
  lang: Lang,
  grid: Grid,
  rowWords: LineWord[][],
  colWords: LineWord[][],
): SingleWord[] {
  const covered = new Set<string>();
  rowWords.forEach((list, r) =>
    list.forEach((w) => {
      for (let c = w.a; c <= w.b; c++) covered.add(r + "," + c);
    }),
  );
  colWords.forEach((list, c) =>
    list.forEach((w) => {
      for (let r = w.a; r <= w.b; r++) covered.add(r + "," + c);
    }),
  );
  const singles: SingleWord[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const L = grid[r][c];
      if (L && SINGLES[lang].has(L) && !covered.has(r + "," + c)) {
        singles.push({ word: L, score: wordScore(lang, L), r, c });
      }
    }
  return singles;
}

export function scoreAndCount(
  rowWords: LineWord[][],
  colWords: LineWord[][],
  singles: SingleWord[],
): { score: number; numWords: number } {
  let s = 0;
  let n = 0;
  for (const list of [...rowWords, ...colWords])
    for (const w of list) {
      s += w.score;
      n++;
    }
  for (const w of singles) {
    s += w.score;
    n++;
  }
  return { score: s, numWords: n };
}
