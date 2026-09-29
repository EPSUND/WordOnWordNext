import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FetchFailed } from "../lib/errors";
import { en } from "./en";
import { initialUiLang, saveUiLang, type UiLang } from "./langs";
import { sv, type Strings } from "./sv";

export const STRINGS: Record<UiLang, Strings> = { sv, en };

interface I18n {
  /** Gränssnittets språk – inte spelets (state.lang), se langs.ts. */
  lang: UiLang;
  t: Strings;
  /** Byter språk och sparar valet. Används bara för aktiva val. */
  setLang: (lang: UiLang) => void;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Läses synkront före första renderingen, så sidan blinkar aldrig förbi fel språk.
  const [lang, setLangState] = useState<UiLang>(initialUiLang);

  // <html lang> styr skärmläsarnas uttal och webbläsarens erbjudande att
  // översätta sidan; index.html har "sv" tills det här har körts.
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = STRINGS[lang].title.full;
  }, [lang]);

  const setLang = useCallback((l: UiLang) => {
    setLangState(l);
    saveUiLang(l);
  }, []);

  const value = useMemo(() => ({ lang, t: STRINGS[lang], setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const v = useContext(I18nContext);
  if (!v) throw new Error("useI18n används utanför I18nProvider.");
  return v;
}

/** Visningstext för ett fel från lib. Felet sparas som det är (inte som text)
    så att meddelandet följer med om man byter språk medan det visas. */
export function errorText(t: Strings, e: unknown): string {
  return e instanceof FetchFailed ? t.errors[e.what](e.status) : t.errors.generic;
}
