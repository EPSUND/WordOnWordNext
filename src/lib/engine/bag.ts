import type { Lang } from "../types";
import {
  ALLOWANCE_FACTOR,
  FREQ,
  MAX_RUN,
  REPEAT_DECAY,
  TOTAL_BLOCKS,
  VOWELS,
  VOWEL_JITTER,
  VOWEL_TARGET,
} from "./constants";
import type { Rng } from "./rng";

/* Påsdragning. Målet är en språkligt rimlig men tillfredsställande fördelning:
   ovanliga bokstäver förblir ovanliga, men man får sällan väldigt många av
   samma bokstav och vokaler/konsonanter klustras inte (se §6/§7 i CLAUDE.md).
   Allt är deterministiskt givet rng – dagligt läge seedar den. */

/** Viktad bokstavstabell (bevarad insättningsordning – del av determinismen). */
type Weights = [string, number][];

/** Invers-CDF-dragning ur en viktad tabell. Vikterna behöver inte summera till 1. */
function sampleFrom(weights: Weights, rng: Rng): string {
  let total = 0;
  for (const [, w] of weights) total += w;
  let r = rng() * total;
  for (const [c, w] of weights) {
    r -= w;
    if (r < 0) return c;
  }
  return weights[weights.length - 1][0]; // numerisk rest
}

/** Enbokstavsdragning direkt ur FREQ. Byggsten och testbar primitiv. */
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

/** FREQ-posterna (i insättningsordning) för vokalerna eller konsonanterna. */
function groupTable(lang: Lang, wantVowel: boolean): Weights {
  const vowels = VOWELS[lang];
  return Object.entries(FREQ[lang]).filter(([c]) => vowels.includes(c) === wantVowel);
}

/** Blandar en lista (Fisher–Yates) deterministiskt ur rng. */
function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Drar `n` bokstäver ur en grupp med mjuk, frekvensmedveten dämpning: varje
   bokstav dras fritt upp till sin "rimliga andel" (ungefär förväntat antal),
   därefter avtar dess vikt geometriskt (REPEAT_DECAY) per extra kopia. Ingen
   hård gräns – bara allt osannolikare, och mer så ju ovanligare bokstaven är. */
function drawGroup(base: Weights, n: number, rng: Rng): string[] {
  const groupSum = base.reduce((s, [, w]) => s + w, 0);
  const allowance = new Map<string, number>();
  for (const [c, w] of base) {
    allowance.set(c, Math.max(1, Math.round((w / groupSum) * n * ALLOWANCE_FACTOR)));
  }
  const count = new Map<string, number>();
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const weighted: Weights = base.map(([c, w]) => {
      const over = Math.max(0, (count.get(c) ?? 0) - allowance.get(c)!);
      return [c, w * Math.pow(REPEAT_DECAY, over)];
    });
    const c = sampleFrom(weighted, rng);
    count.set(c, (count.get(c) ?? 0) + 1);
    out.push(c);
  }
  return out;
}

/** Väver samman vokaler och konsonanter så att grupperna inte klustras: väljer
   på varje plats den grupp som ligger under sin målandel, men aldrig fler än
   MAX_RUN av samma grupp i rad. Bryter även direkt bokstavsupprepning. */
function interleave(vowels: string[], cons: string[]): string[] {
  const V = vowels.slice();
  const C = cons.slice();
  const total = V.length + C.length;
  const target = total ? V.length / total : 0; // önskad vokalandel
  const out: string[] = [];
  let placedV = 0;
  let run = 0; // längd på pågående grupprun
  let runVowel = false;

  const take = (fromVowel: boolean): void => {
    const list = fromVowel ? V : C;
    // Bryt direkt upprepning: om första bokstaven == föregående, ta nästa i stället.
    const idx = out.length && list[0] === out[out.length - 1] && list.length > 1 ? 1 : 0;
    out.push(list.splice(idx, 1)[0]);
    if (fromVowel) placedV++;
    if (out.length > 1 && runVowel === fromVowel) run++;
    else ((run = 1), (runVowel = fromVowel));
  };

  for (let i = 0; i < total; i++) {
    if (V.length === 0) take(false);
    else if (C.length === 0) take(true);
    else if (run >= MAX_RUN) take(!runVowel); // tvinga byte
    else take(placedV / out.length < target); // annars: fyll på gruppen som ligger under mål
  }
  return out;
}

/** Skapar en påse på TOTAL_BLOCKS brickor (§6/§7 i CLAUDE.md). */
export function makeBag(lang: Lang, rng: Rng): string[] {
  // 1. Målantal vokaler med jitter (så antalet inte är exakt samma varje match).
  const jitter = Math.floor(rng() * (2 * VOWEL_JITTER + 1)) - VOWEL_JITTER;
  const nVowels = Math.round(VOWEL_TARGET * TOTAL_BLOCKS) + jitter;
  const nCons = TOTAL_BLOCKS - nVowels;

  // 2. Mjukt dämpad dragning per grupp, blandad så dämpningens ordningsbias försvinner.
  const vowels = shuffle(drawGroup(groupTable(lang, true), nVowels, rng), rng);
  const cons = shuffle(drawGroup(groupTable(lang, false), nCons, rng), rng);

  // 3. Interfoliera så vokaler och konsonanter inte klustras.
  return interleave(vowels, cons);
}
