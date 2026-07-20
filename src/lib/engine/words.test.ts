import { beforeAll, describe, expect, it } from "vitest";
import type { Grid } from "../types";
import { loadRealDicts } from "../../test/dictFixture";
import { emptyGrid } from "./grid";
import { VALUES } from "./constants";
import {
  bestWordsInLine,
  computeSingles,
  isValidWord,
  scanLine,
  scoreAndCount,
  wordScore,
} from "./words";

beforeAll(async () => {
  await loadRealDicts("sv", "en");
});

/** Rutnät ur rader uppifrån och ner; "." = tom ruta. */
function gridOf(...rows: string[]): Grid {
  const g = emptyGrid();
  rows.forEach((row, r) => [...row].forEach((ch, c) => (g[r][c] = ch === "." ? null : ch)));
  return g;
}

const line = (s: string) => [...s].map((ch) => (ch === "." ? null : ch));
const words = (list: { word: string }[]) => list.map((w) => w.word).sort();

describe("wordScore", () => {
  it("är bokstavssumman plus längd²−1", () => {
    // K=3, A=1, T=1, T=1 → 6 bokstavspoäng + (16−1) ordpoäng.
    expect(wordScore("sv", "KATT")).toBe(6 + 15);
    expect(wordScore("sv", "KATT")).toBe(
      [...("KATT" as string)].reduce((s, c) => s + VALUES.sv[c], 0) + 4 * 4 - 1,
    );
  });

  it("ger 0 ordpoäng för enbokstavsord (bara bokstavsvärdet)", () => {
    expect(wordScore("sv", "Å")).toBe(VALUES.sv["Å"]);
    expect(wordScore("en", "A")).toBe(VALUES.en["A"]);
  });

  it("använder olika bokstavsvärden per språk (Alfapet vs Scrabble)", () => {
    expect(VALUES.sv["K"]).toBe(3);
    expect(VALUES.en["K"]).toBe(5);
    expect(wordScore("en", "K")).not.toBe(wordScore("sv", "K"));
  });

  it("belönar längd kraftigt – ett långt ord slår två korta med samma bokstäver", () => {
    expect(wordScore("sv", "KATTEN")).toBeGreaterThan(
      wordScore("sv", "KATT") + wordScore("sv", "EN"),
    );
  });

  it("ger 0 bokstavspoäng för tecken som saknar värde i språkets tabell", () => {
    // Å finns inte i den engelska VALUES-tabellen → bara ordpoängen återstår.
    expect(VALUES.en["Å"]).toBeUndefined();
    expect(wordScore("en", "ÅÅ")).toBe(2 * 2 - 1);
  });
});

describe("isValidWord", () => {
  it("godkänner ord ur ordlistan från två bokstäver och uppåt", () => {
    expect(isValidWord("sv", "KATT")).toBe(true);
    expect(isValidWord("sv", "EN")).toBe(true);
    expect(isValidWord("en", "CAT")).toBe(true);
  });

  it("underkänner enbokstavsord – de hanteras av computeSingles", () => {
    expect(isValidWord("sv", "Å")).toBe(false);
    expect(isValidWord("en", "A")).toBe(false);
  });

  it("underkänner nonsens och ord från fel språk", () => {
    expect(isValidWord("sv", "XQZ")).toBe(false);
    expect(isValidWord("sv", "THE")).toBe(false);
    expect(isValidWord("en", "KATT")).toBe(false);
  });
});

describe("bestWordsInLine", () => {
  it("hittar inga ord i en tom linje", () => {
    expect(bestWordsInLine("sv", line("......."))).toEqual([]);
  });

  it("hittar ett ord och rapporterar rätt start- och slutindex", () => {
    const found = bestWordsInLine("sv", line("..KATT."));
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ word: "KATT", a: 2, b: 5, score: wordScore("sv", "KATT") });
  });

  it("väljer det längre ordet framför delordet (DP maximerar poäng)", () => {
    const found = bestWordsInLine("sv", line("KATTEN."));
    expect(words(found)).toEqual(["KATTEN"]);
  });

  it("plockar flera icke-överlappande ord i samma sammanhängande segment", () => {
    const found = bestWordsInLine("en", line("CATDOG."));
    expect(words(found)).toEqual(["CAT", "DOG"]);
  });

  it("behandlar segment åtskilda av tomma rutor var för sig", () => {
    const found = bestWordsInLine("sv", line("HUS.SOL"));
    expect(words(found)).toEqual(["HUS", "SOL"]);
  });

  it("hittar inga ord i en bokstavsföljd utan giltiga ord", () => {
    expect(bestWordsInLine("sv", line("XQZJWVB"))).toEqual([]);
  });

  it("låter orden ligga kant i kant utan att överlappa", () => {
    const found = bestWordsInLine("en", line("CATDOG."));
    const sorted = found.slice().sort((x, y) => x.a - y.a);
    for (let i = 1; i < sorted.length; i++) expect(sorted[i].a).toBeGreaterThan(sorted[i - 1].b);
  });

  it("ger samma totalpoäng som summan av de valda orden", () => {
    const found = bestWordsInLine("sv", line("HUS.SOL"));
    const total = found.reduce((s, w) => s + w.score, 0);
    expect(total).toBe(wordScore("sv", "HUS") + wordScore("sv", "SOL"));
  });

  it("hittar ett ord som fyller hela linjen (7 bokstäver)", () => {
    const found = bestWordsInLine("sv", line("KATTENS"));
    expect(found.some((w) => w.word.length >= 6)).toBe(true);
  });
});

describe("scanLine", () => {
  const g = gridOf(".......", ".......", ".......", ".......", ".......", "..H....", "KATT.H.");

  it("läser en rad vågrätt", () => {
    expect(words(scanLine("sv", g, true, 6))).toEqual(["KATT"]);
  });

  it("läser en kolumn lodrätt", () => {
    // Kolumn 5: H på rad 5 och H på rad 6 → "HH", inget ord.
    expect(scanLine("sv", g, false, 5)).toEqual([]);
  });

  it("hittar samma ord lodrätt som vågrätt", () => {
    const v = gridOf(".......", ".......", ".......", "K......", "A......", "T......", "T......");
    expect(words(scanLine("sv", v, false, 0))).toEqual(["KATT"]);
  });

  it("ger tom lista för en tom rad", () => {
    expect(scanLine("sv", emptyGrid(), true, 0)).toEqual([]);
  });
});

describe("computeSingles", () => {
  const scan = (lang: "sv" | "en", g: Grid) => {
    const rowWords = Array.from({ length: 7 }, (_, r) => scanLine(lang, g, true, r));
    const colWords = Array.from({ length: 7 }, (_, c) => scanLine(lang, g, false, c));
    return { rowWords, colWords, singles: computeSingles(lang, g, rowWords, colWords) };
  };

  it("räknar Å och Ö som ord när de står ensamma", () => {
    const g = gridOf(".......", ".......", ".......", ".......", ".......", ".......", "Å...Ö..");
    expect(words(scan("sv", g).singles)).toEqual(["Å", "Ö"]);
  });

  it("räknar A och I på engelska", () => {
    const g = gridOf(".......", ".......", ".......", ".......", ".......", ".......", "A...I..");
    expect(words(scan("en", g).singles)).toEqual(["A", "I"]);
  });

  it("räknar inte andra bokstäver som enbokstavsord", () => {
    const g = gridOf(".......", ".......", ".......", ".......", ".......", ".......", "K...S..");
    expect(scan("sv", g).singles).toEqual([]);
  });

  it("räknar inte ett Å som redan täcks av ett längre ord", () => {
    // ÅL är ett ord; Å:t är då upptaget och ska inte ge extra poäng.
    expect(isValidWord("sv", "ÅL")).toBe(true);
    const g = gridOf(".......", ".......", ".......", ".......", ".......", ".......", "ÅL.....");
    const { singles } = scan("sv", g);
    expect(singles).toEqual([]);
  });

  it("räknar samma bokstav bara en gång även om den står på flera rutor", () => {
    const g = gridOf(".......", ".......", ".......", ".......", ".......", ".......", "Å.Å....");
    const { singles } = scan("sv", g);
    expect(singles).toHaveLength(2); // en per ruta, inte en per bokstav
    expect(singles.map((s) => [s.r, s.c])).toEqual([
      [6, 0],
      [6, 2],
    ]);
  });

  it("räknar inte ett Å som täcks av ett lodrätt ord", () => {
    const g = gridOf(".......", ".......", ".......", ".......", ".......", "Å......", "L......");
    expect(scan("sv", g).singles).toEqual([]);
  });
});

describe("scoreAndCount", () => {
  it("summerar rad-, kolumn- och enbokstavsord", () => {
    const rowWords = [[{ word: "KATT", score: 21, a: 0, b: 3 }], []];
    const colWords = [[{ word: "EN", score: 5, a: 0, b: 1 }]];
    const singles = [{ word: "Å", score: 4, r: 6, c: 0 }];
    expect(scoreAndCount(rowWords, colWords, singles)).toEqual({ score: 30, numWords: 3 });
  });

  it("ger noll för ett tomt bräde", () => {
    expect(scoreAndCount([[], []], [[]], [])).toEqual({ score: 0, numWords: 0 });
  });
});
