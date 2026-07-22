import type { Grid, HandTile, Lang, LineWord, Phase, SingleWord, GameMode } from "../lib/types";
import { COLS, INITIAL_BLOCKS, ROWS, TOTAL_BLOCKS } from "../lib/engine/constants";
import { collapseColumn, emptyGrid, ensureColPlayable, landingRow } from "../lib/engine/grid";
import { computeSingles, scanLine, scoreAndCount } from "../lib/engine/words";

export interface WordItem {
  word: string;
  score: number;
  id: number;
  /** Stabil identitet (orientering + linje + ord + startposition) så att ett ord som
   *  ligger kvar mellan turer behåller sitt id och inte markeras som färskt på nytt. */
  key: string;
}
export interface FloatCue {
  r: number;
  c: number;
  pts: number;
  id: number;
}
export interface Falling {
  letter: string;
  col: number;
  row: number;
  joker: boolean;
}

export interface GameState {
  lang: Lang;
  mode: GameMode;
  dailyDate: string | null;
  phase: Phase;
  grid: Grid;
  rowWords: LineWord[][];
  colWords: LineWord[][];
  singleWords: SingleWord[];
  bag: string[];
  bagIndex: number;
  currentLetter: string | null;
  currentCol: number;
  nextLetter: string | null;
  isJokerTile: boolean;
  jokerUsed: boolean;
  jokerPos: [number, number] | null;
  lastLanded: [number, number] | null;
  startHand: HandTile[];
  selHand: number;
  score: number;
  numWords: number;
  listedWords: WordItem[];
  wordSeq: number;
  freshWordIds: Set<number>;
  bestWord: string;
  falling: Falling | null;
  newRingKeys: Set<string>;
  floatCue: FloatCue | null;
  soundThud: number;
  soundPling: number;
  soundPlingLen: number;
  shake: number;
}

export type Action =
  | { type: "setLang"; lang: Lang }
  | { type: "start"; mode: GameMode; bag: string[]; dailyDate: string | null }
  | { type: "selectHand"; i: number }
  | { type: "arrangeClick"; r: number; c: number }
  | { type: "finishArrange" }
  | { type: "setCol"; c: number }
  | { type: "drop" }
  | { type: "landed" }
  | { type: "useJoker" }
  | { type: "chooseJoker"; letter: string }
  | { type: "reset" };

const makeLines = (n: number): LineWord[][] => Array.from({ length: n }, () => []);
const cloneGrid = (g: Grid): Grid => g.map((row) => row.slice());

export const initialState: GameState = {
  lang: "sv",
  mode: "random",
  dailyDate: null,
  phase: "idle",
  grid: emptyGrid(),
  rowWords: makeLines(ROWS),
  colWords: makeLines(COLS),
  singleWords: [],
  bag: [],
  bagIndex: 0,
  currentLetter: null,
  currentCol: 3,
  nextLetter: null,
  isJokerTile: false,
  jokerUsed: false,
  jokerPos: null,
  lastLanded: null,
  startHand: [],
  selHand: -1,
  score: 0,
  numWords: 0,
  listedWords: [],
  wordSeq: 0,
  freshWordIds: new Set(),
  bestWord: "",
  falling: null,
  newRingKeys: new Set(),
  floatCue: null,
  soundThud: 0,
  soundPling: 0,
  soundPlingLen: 0,
  shake: 0,
};

let floatSeq = 0;

/** Full omräkning av alla rader/kolumner/enbokstavsord (används under arrangeringen). */
function fullRescan(lang: Lang, grid: Grid) {
  const rowWords = makeLines(ROWS).map((_, r) => scanLine(lang, grid, true, r));
  const colWords = makeLines(COLS).map((_, c) => scanLine(lang, grid, false, c));
  const singleWords = computeSingles(lang, grid, rowWords, colWords);
  const { score, numWords } = scoreAndCount(rowWords, colWords, singleWords);
  return { rowWords, colWords, singleWords, score, numWords };
}

/** Bygger om listan över de *aktiva* (just nu poänggivande) orden ur skanningen.
 *  Ord som fanns kvar sedan förra turen behåller sitt id via sin positionsnyckel;
 *  nya ord får nytt id och markeras som färska. Ord som byggts ut till ett längre
 *  ord (eller på annat sätt inte längre är aktiva) faller bort. */
function relist(
  prev: GameState,
  rowWords: LineWord[][],
  colWords: LineWord[][],
  singleWords: SingleWord[],
): Pick<GameState, "listedWords" | "wordSeq" | "freshWordIds"> {
  const entries: Omit<WordItem, "id">[] = [];
  rowWords.forEach((list, r) =>
    list.forEach((w) => entries.push({ word: w.word, score: w.score, key: `r${r}:${w.word}@${w.a}` })),
  );
  colWords.forEach((list, c) =>
    list.forEach((w) => entries.push({ word: w.word, score: w.score, key: `c${c}:${w.word}@${w.a}` })),
  );
  singleWords.forEach((w) =>
    entries.push({ word: w.word, score: w.score, key: `s:${w.r},${w.c}` }),
  );

  const prevIds = new Map(prev.listedWords.map((it) => [it.key, it.id]));
  let wordSeq = prev.wordSeq;
  const freshWordIds = new Set<number>();
  const listedWords: WordItem[] = entries.map((e) => {
    const existing = prevIds.get(e.key);
    if (existing !== undefined) return { ...e, id: existing };
    const id = wordSeq++;
    freshWordIds.add(id);
    return { ...e, id };
  });
  return { listedWords, wordSeq, freshWordIds };
}

function bestOverall(s: GameState): string {
  const all = [...s.listedWords, ...s.rowWords.flat(), ...s.colWords.flat()];
  const best = all.slice().sort((a, b) => b.score - a.score)[0];
  return best ? best.word : "";
}

/** Servera nästa bricka, eller tvinga slutjoker, eller avsluta. */
function nextTurn(s: GameState): GameState {
  if (s.bagIndex < TOTAL_BLOCKS) {
    const currentLetter = s.bag[s.bagIndex];
    const bagIndex = s.bagIndex + 1;
    const nextLetter = bagIndex < TOTAL_BLOCKS ? s.bag[bagIndex] : s.jokerUsed ? null : "🃏";
    return {
      ...s,
      currentLetter,
      bagIndex,
      isJokerTile: false,
      nextLetter,
      currentCol: ensureColPlayable(s.grid, s.currentCol),
      phase: "play",
    };
  }
  if (!s.jokerUsed) {
    return { ...s, phase: "joker" }; // sista brickan är jokern
  }
  return { ...s, phase: "over", bestWord: bestOverall(s) };
}

/** Efter att en bricka landat: räkna om ord/poäng, ta fram färska ord, kör nästa tur. */
function afterLand(prev: GameState, r: number, c: number, joker: boolean): GameState {
  const { lang, grid } = prev;
  const newRow = scanLine(lang, grid, true, r);
  const newCol = scanLine(lang, grid, false, c);
  const rowWords = prev.rowWords.map((l, i) => (i === r ? newRow : l));
  const colWords = prev.colWords.map((l, i) => (i === c ? newCol : l));
  const singleWords = computeSingles(lang, grid, rowWords, colWords);

  const prevRowKeys = new Set(prev.rowWords[r].map((w) => w.word + "@" + w.a));
  const freshRow = newRow.filter((w) => !prevRowKeys.has(w.word + "@" + w.a));
  const prevColKeys = new Set(prev.colWords[c].map((w) => w.word + "@" + w.a));
  const freshCol = newCol.filter((w) => !prevColKeys.has(w.word + "@" + w.a));
  const prevSingleKeys = new Set(prev.singleWords.map((s) => s.r + "," + s.c));
  const freshSingles = singleWords.filter((s) => !prevSingleKeys.has(s.r + "," + s.c));

  const fresh = [...freshRow, ...freshCol, ...freshSingles];
  const { score, numWords } = scoreAndCount(rowWords, colWords, singleWords);

  const newRingKeys = new Set<string>([
    ...freshRow.map((w) => "r" + r + ":" + w.word + "@" + w.a),
    ...freshCol.map((w) => "c" + c + ":" + w.word + "@" + w.a),
    ...freshSingles.map((w) => "s:" + w.r + "," + w.c),
  ]);

  const { listedWords, wordSeq, freshWordIds } = relist(prev, rowWords, colWords, singleWords);

  let { soundPling, soundPlingLen, floatCue } = prev;
  if (fresh.length) {
    const best = fresh.reduce((a, b) => (a.score > b.score ? a : b));
    soundPling = prev.soundPling + 1;
    soundPlingLen = best.word.length;
    floatCue = { r, c, pts: fresh.reduce((sum, w) => sum + w.score, 0), id: floatSeq++ };
  }

  const state: GameState = {
    ...prev,
    rowWords,
    colWords,
    singleWords,
    score,
    numWords,
    listedWords,
    wordSeq,
    freshWordIds,
    newRingKeys,
    isJokerTile: false,
    jokerUsed: joker ? true : prev.jokerUsed,
    soundPling,
    soundPlingLen,
    floatCue,
  };
  return nextTurn(state);
}

export function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "setLang":
      return s.phase === "idle" || s.phase === "over" ? { ...s, lang: a.lang } : s;

    case "start": {
      const grid = emptyGrid();
      const startHand: HandTile[] = a.bag
        .slice(0, INITIAL_BLOCKS)
        .map((letter) => ({ letter, r: null, c: null }));
      return {
        ...initialState,
        lang: s.lang,
        mode: a.mode,
        dailyDate: a.dailyDate,
        phase: "arrange",
        grid,
        bag: a.bag,
        bagIndex: INITIAL_BLOCKS,
        startHand,
        selHand: 0,
        soundThud: s.soundThud,
        soundPling: s.soundPling,
        shake: s.shake,
      };
    }

    case "selectHand":
      return s.phase === "arrange" ? { ...s, selHand: a.i } : s;

    case "arrangeClick": {
      if (s.phase !== "arrange") return s;
      const grid = cloneGrid(s.grid);
      const startHand = s.startHand.map((h) => ({ ...h }));
      const idx = startHand.findIndex((h) => h.r === a.r && h.c === a.c);
      let selHand = s.selHand;
      if (idx >= 0) {
        startHand[idx].r = null;
        startHand[idx].c = null;
        grid[a.r][a.c] = null;
        collapseColumn(grid, startHand, a.c);
        selHand = idx;
      } else if (selHand >= 0 && startHand[selHand] && startHand[selHand].r == null) {
        const row = landingRow(grid, a.c);
        if (row < 0) return s;
        startHand[selHand].r = row;
        startHand[selHand].c = a.c;
        grid[row][a.c] = startHand[selHand].letter;
        selHand = startHand.findIndex((x) => x.r == null);
      } else return s;
      const scan = fullRescan(s.lang, grid);
      return { ...s, grid, startHand, selHand, ...scan };
    }

    case "finishArrange": {
      if (s.phase !== "arrange" || s.startHand.some((h) => h.r == null)) return s;
      const scan = fullRescan(s.lang, s.grid);
      const { listedWords, wordSeq, freshWordIds } = relist(
        s,
        scan.rowWords,
        scan.colWords,
        scan.singleWords,
      );
      const base: GameState = {
        ...s,
        ...scan,
        listedWords,
        wordSeq,
        freshWordIds,
        soundPling: listedWords.length ? s.soundPling + 1 : s.soundPling,
        soundPlingLen: 3,
      };
      return nextTurn(base);
    }

    case "setCol":
      if (s.phase !== "play") return s;
      return { ...s, currentCol: Math.max(0, Math.min(COLS - 1, a.c)) };

    case "drop": {
      if (s.phase !== "play" || s.currentLetter == null) return s;
      const row = landingRow(s.grid, s.currentCol);
      if (row < 0) return { ...s, shake: s.shake + 1 };
      return {
        ...s,
        phase: "fall",
        falling: { letter: s.currentLetter, col: s.currentCol, row, joker: s.isJokerTile },
      };
    }

    case "landed": {
      if (!s.falling) return s;
      const { letter, col, row, joker } = s.falling;
      const grid = cloneGrid(s.grid);
      grid[row][col] = letter;
      const mid: GameState = {
        ...s,
        grid,
        jokerPos: joker ? [row, col] : s.jokerPos,
        lastLanded: [row, col],
        falling: null,
        soundThud: s.soundThud + 1,
      };
      return afterLand(mid, row, col, joker);
    }

    case "useJoker": {
      if (s.phase !== "play" || s.jokerUsed || s.currentLetter == null || s.isJokerTile) return s;
      return { ...s, bagIndex: s.bagIndex - 1, phase: "joker" };
    }

    case "chooseJoker": {
      const nextLetter = s.bagIndex < TOTAL_BLOCKS ? s.bag[s.bagIndex] : null;
      return {
        ...s,
        currentLetter: a.letter,
        isJokerTile: true,
        phase: "play",
        nextLetter,
        currentCol: ensureColPlayable(s.grid, s.currentCol),
      };
    }

    case "reset":
      return { ...initialState, lang: s.lang, mode: s.mode, soundThud: s.soundThud, soundPling: s.soundPling };

    default:
      return s;
  }
}
