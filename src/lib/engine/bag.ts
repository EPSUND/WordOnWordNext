import type { Lang } from "../types";
import { FREQ, TOTAL_BLOCKS, VOWELS } from "./constants";
import type { Rng } from "./rng";

export function sampleLetter(lang: Lang, rng: Rng): string {
  const table = FREQ[lang];
  const r = rng();
  let acc = 0;
  for (const [c, p] of Object.entries(table)) {
    acc += p;
    if (r < acc) return c;
  }
  return "E";
}

/** Skapar en påse på TOTAL_BLOCKS brickor med en rimlig vokalandel (0.32–0.48). */
export function makeBag(lang: Lang, rng: Rng): string[] {
  for (let tries = 0; tries < 200; tries++) {
    const b: string[] = [];
    for (let i = 0; i < TOTAL_BLOCKS; i++) b.push(sampleLetter(lang, rng));
    const v = b.filter((c) => VOWELS[lang].includes(c)).length / b.length;
    if (v >= 0.32 && v <= 0.48) return b;
  }
  return Array.from({ length: TOTAL_BLOCKS }, () => sampleLetter(lang, rng));
}
