import { describe, expect, it, vi } from "vitest";
import { hashSeed, mulberry32, todayStr } from "./rng";
import { makeBag, sampleLetter } from "./bag";
import { FREQ, TOTAL_BLOCKS, VOWELS } from "./constants";

/* SPÄRR MOT REGRESSION. Dagligt läge seedar mulberry32 på datumet, så alla spelare
   ska få samma brickor. Ändras rng.ts, bag.ts, FREQ-nyckelordningen eller
   seed-strängen blir redan sparade dagliga topplistor ojämförbara – då ska de här
   testerna gå sönder. Uppdatera INTE värdena för att "få grönt"; återställ koden. */

const dailySeed = (date: string) => mulberry32(hashSeed("wow-daily-" + date));

describe("hashSeed", () => {
  it("ger de förväntade värdena för kända strängar", () => {
    expect(hashSeed("")).toBe(1779033703);
    expect(hashSeed("a")).toBe(1617361628);
    expect(hashSeed("wow-daily-2024-01-01")).toBe(2247315726);
    expect(hashSeed("wow-daily-2026-07-20")).toBe(276237723);
  });

  it("ger alltid ett unsignerat 32-bitarstal", () => {
    for (let i = 0; i < 500; i++) {
      const h = hashSeed("wow-daily-2024-01-" + i);
      expect(Number.isInteger(h)).toBe(true);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("mulberry32", () => {
  it("ger den kända sekvensen för seed 12345", () => {
    const r = mulberry32(12345);
    expect([r(), r(), r(), r(), r()]).toEqual([
      0.9797282677609473, 0.3067522644996643, 0.484205421525985, 0.817934412509203,
      0.5094283693470061,
    ]);
  });

  it("håller sig i [0,1) och upprepar sig för samma seed", () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
      expect(v).toBe(b());
    }
  });
});

describe("FREQ", () => {
  it("har nyckelordningen som sampleLetter förutsätter (fallande frekvens)", () => {
    for (const lang of ["sv", "en"] as const) {
      const ps = Object.values(FREQ[lang]);
      for (let i = 1; i < ps.length; i++) expect(ps[i]).toBeLessThanOrEqual(ps[i - 1]);
    }
  });

  it("summerar till ~1 så att fallback-returen 'E' aldrig behövs i praktiken", () => {
    for (const lang of ["sv", "en"] as const) {
      const sum = Object.values(FREQ[lang]).reduce((a, b) => a + b, 0);
      expect(sum).toBeGreaterThan(0.999);
      expect(sum).toBeLessThanOrEqual(1.0001);
    }
  });
});

describe("sampleLetter", () => {
  it("mappar rng-värdet på den kumulativa fördelningen i insättningsordning", () => {
    // r=0 → första nyckeln, r strax under summan av två första → andra nyckeln.
    const keys = Object.keys(FREQ.sv);
    expect(sampleLetter("sv", () => 0)).toBe(keys[0]);
    expect(sampleLetter("sv", () => FREQ.sv[keys[0]] + 1e-9)).toBe(keys[1]);
  });

  it("ger bara bokstäver som finns i språkets FREQ-tabell", () => {
    const rng = mulberry32(99);
    for (let i = 0; i < 2000; i++) {
      expect(FREQ.en).toHaveProperty(sampleLetter("en", rng));
    }
  });
});

describe("makeBag – dagliga påsar (golden)", () => {
  const golden: Record<string, string> = {
    "sv/2024-01-01": "LABDSEAYTANAIANSKÅROSVSNPBLÄLUFDRSSJAKHABKFEÖEMS",
    "en/2024-01-01": "LEHUSIEKREOETEOSNFATSMSOGHLBLPYDASSVENWEHNYIYICS",
    "sv/2026-07-20": "BVSREOYJIONYTKRPNIGEIARORLLERITTTFTDAAOEJILALSRE",
    "en/2026-07-20": "HMSAIDKVTTLKRNAGOTUITEATALLIATRRRYRDEETIVNLELSAI",
  };

  for (const [key, expected] of Object.entries(golden)) {
    const [lang, date] = key.split("/") as ["sv" | "en", string];
    it(`${key} är oförändrad`, () => {
      expect(makeBag(lang, dailySeed(date)).join("")).toBe(expected);
    });
  }

  it("ger samma påse vid två anrop med samma datum", () => {
    expect(makeBag("sv", dailySeed("2025-03-14"))).toEqual(makeBag("sv", dailySeed("2025-03-14")));
  });

  it("ger TOTAL_BLOCKS brickor med vokalandel 0.32–0.48", () => {
    for (const lang of ["sv", "en"] as const) {
      for (let i = 0; i < 50; i++) {
        const bag = makeBag(lang, mulberry32(i));
        expect(bag).toHaveLength(TOTAL_BLOCKS);
        const v = bag.filter((c) => VOWELS[lang].includes(c)).length / bag.length;
        expect(v).toBeGreaterThanOrEqual(0.32);
        expect(v).toBeLessThanOrEqual(0.48);
      }
    }
  });
});

describe("todayStr", () => {
  it("formaterar lokalt datum som YYYY-MM-DD med nollutfyllnad", () => {
    vi.useFakeTimers();
    try {
      // Lokal tid (inte UTC) – datumet ska vara det spelaren ser på sin klocka.
      vi.setSystemTime(new Date(2024, 0, 5, 12, 0, 0));
      expect(todayStr()).toBe("2024-01-05");
      vi.setSystemTime(new Date(2026, 11, 31, 23, 59, 0));
      expect(todayStr()).toBe("2026-12-31");
    } finally {
      vi.useRealTimers();
    }
  });
});
