export type Lang = "sv" | "en";
export type GameMode = "random" | "daily";
export type Phase = "idle" | "arrange" | "play" | "fall" | "joker" | "over";

/** Ord som ligger vågrätt/lodrätt i en linje (a..b är index längs linjen). */
export interface LineWord {
  word: string;
  score: number;
  a: number;
  b: number;
}

/** Enbokstavsord (Å/Ö resp. A/I) på en specifik ruta. */
export interface SingleWord {
  word: string;
  score: number;
  r: number;
  c: number;
}

/** Rutnätet: null = tom ruta, annars versal bokstav. */
export type Grid = (string | null)[][];

/** En av de 5 startbrickorna under arrangeringsfasen. r/c = null tills placerad. */
export interface HandTile {
  letter: string;
  r: number | null;
  c: number | null;
}

/** En rad i topplistan (som den kommer från Supabase, med alias). */
export interface ScoreEntry {
  name: string;
  score: number;
  words: number;
  lang: Lang;
  bestWord: string | null;
  daily: string | null;
}
