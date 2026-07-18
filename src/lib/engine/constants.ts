import type { Lang } from "../types";

export const COLS = 7;
export const ROWS = 7;
export const TOTAL_BLOCKS = COLS * ROWS - 1; // 48 – jokern är den 49:e
export const INITIAL_BLOCKS = 5; // som i originalet

/* VIKTIGT: nyckelordningen i FREQ måste bevaras exakt – sampleLetter itererar
   Object.entries() i insättningsordning, vilket är en del av determinismen. */
export const FREQ: Record<Lang, Record<string, number>> = {
  sv: { A: 0.10492, S: 0.099, R: 0.08137, T: 0.07831, E: 0.0673, N: 0.0647, L: 0.05641, K: 0.04429, I: 0.04371, O: 0.04, D: 0.03969, G: 0.03691, M: 0.02814, U: 0.02591, P: 0.02506, V: 0.02258, B: 0.02243, Ä: 0.02069, Ö: 0.01816, F: 0.01803, Å: 0.01478, Y: 0.01284, H: 0.01269, J: 0.0105, C: 0.00695, X: 0.00328, Z: 0.0008, W: 0.00046, Q: 9e-5 },
  en: { E: 0.11746, S: 0.09304, A: 0.08216, R: 0.07132, I: 0.07025, O: 0.06071, L: 0.05508, N: 0.05484, T: 0.05482, D: 0.04228, U: 0.03801, C: 0.03448, P: 0.03026, G: 0.02967, M: 0.02904, H: 0.02494, B: 0.02355, Y: 0.02045, F: 0.01596, K: 0.01568, W: 0.01305, V: 0.00953, Z: 0.0048, X: 0.00361, J: 0.00323, Q: 0.00177 },
};

export const VALUES: Record<Lang, Record<string, number>> = {
  sv: { A: 1, D: 1, E: 1, I: 1, L: 1, N: 1, R: 1, S: 1, T: 1, G: 2, O: 2, H: 3, K: 3, M: 3, P: 3, U: 3, B: 4, F: 4, V: 4, Å: 4, Ä: 4, Ö: 4, C: 8, J: 8, Y: 8, Q: 10, W: 10, X: 10, Z: 10 },
  en: { A: 1, E: 1, I: 1, L: 1, N: 1, O: 1, R: 1, S: 1, T: 1, U: 1, D: 2, G: 2, B: 3, C: 3, M: 3, P: 3, F: 4, H: 4, V: 4, W: 4, Y: 4, K: 5, J: 8, X: 8, Q: 10, Z: 10 },
};

export const SINGLES: Record<Lang, Set<string>> = {
  sv: new Set(["Å", "Ö"]),
  en: new Set(["A", "I"]),
};

export const VOWELS: Record<Lang, string> = { sv: "AEIOUYÅÄÖ", en: "AEIOUY" };
export const ALPHABET: Record<Lang, string> = {
  sv: "ABCDEFGHIJKLMNOPQRSTUVWXYZÅÄÖ",
  en: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
};
