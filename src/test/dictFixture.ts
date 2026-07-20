import { readFileSync } from "node:fs";
import { loadDict } from "../lib/dict";
import type { Lang } from "../lib/types";

/* dict.ts cachar per språk i en modulnivå-Set och hämtar med fetch. I testerna
   låtsas vi vara nätverket och serverar de riktiga filerna från public/, så att
   ordlisteparsningen (inkl. radbrytningshanteringen) faktiskt körs. */

export function stubFetchWithDicts(): void {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);
    const m = /dict-(sv|en)\.txt$/.exec(url);
    if (!m) throw new Error("Oväntad fetch i test: " + url);
    const text = readFileSync(new URL(`../../public/dict-${m[1]}.txt`, import.meta.url), "utf8");
    return new Response(text, { status: 200 });
  }) as typeof fetch;
}

/** Laddar de riktiga ordlistorna in i dict.ts:s cache. Anropas i beforeAll. */
export async function loadRealDicts(...langs: Lang[]): Promise<void> {
  const saved = globalThis.fetch;
  stubFetchWithDicts();
  try {
    for (const lang of langs) await loadDict(lang);
  } finally {
    globalThis.fetch = saved;
  }
}
