import type { Lang } from "./types";
import { FetchFailed } from "./errors";

/* Ordlistorna ligger som ren text i public/ (ett ord per rad) och hämtas via fetch.
   BASE_URL gör att sökvägen fungerar både i dev ("/") och på Pages ("/WordOnWordNext/"). */
const DICTS: Partial<Record<Lang, Set<string>>> = {};
const loading: Partial<Record<Lang, Promise<Set<string>>>> = {};

export async function loadDict(lang: Lang): Promise<Set<string>> {
  const cached = DICTS[lang];
  if (cached) return cached;
  if (!loading[lang]) {
    loading[lang] = (async () => {
      let res: Response;
      try {
        res = await fetch(`${import.meta.env.BASE_URL}dict-${lang}.txt`);
      } catch {
        // fetch kastar med webbläsarens egen text ("Failed to fetch"), som annars
        // hamnade rakt i startdialogen. UI:t översätter FetchFailed (errorText).
        throw new FetchFailed("dict", null);
      }
      if (!res.ok) throw new FetchFailed("dict", res.status);
      const raw = await res.text();
      // Dela på både LF och CRLF. Med core.autocrlf=true checkas filerna ut med
      // CRLF på Windows; en split på enbart "\n" gav då ord med släpande \r,
      // så INGET ord utom enbokstavsorden (som inte slår i ordlistan) godkändes.
      const set = new Set(
        raw
          .split(/\r?\n/)
          .map((w) => w.trim())
          .filter(Boolean),
      );
      DICTS[lang] = set;
      return set;
    })().catch((e: unknown) => {
      // Ett misslyckat försök får inte ligga kvar i cachen: då visade "Starta
      // spelet" samma fel för evigt utan att hämta igen, och bara en omladdning
      // av sidan hjälpte. Nästa anrop gör ett nytt försök. (.catch och inte
      // try/catch i funktionen: den här körs garanterat efter tilldelningen.)
      delete loading[lang];
      throw e;
    });
  }
  return loading[lang]!;
}

/** Synk-åtkomst till en redan laddad ordlista (kastar om den inte laddats än). */
export function dictFor(lang: Lang): Set<string> {
  const d = DICTS[lang];
  if (!d) throw new Error(`Ordlistan för ${lang} är inte laddad.`);
  return d;
}

export function isDictLoaded(lang: Lang): boolean {
  return !!DICTS[lang];
}
