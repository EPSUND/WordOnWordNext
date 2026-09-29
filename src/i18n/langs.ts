import type { Lang } from "../lib/types";

/* Gränssnittets språk: vilka texter som visas. Det är INTE samma sak som
   spelets språk (Lang i lib/types – ordlista, bokstavsvärden, topplista), som
   hör till varje spel och väljs i startdialogen. Att koderna sammanfaller nu
   är en slump; ett nytt UI-språk behöver ingen ordlista. */
export type UiLang = "sv" | "en";

/** Valbara språk i den ordning de visas. Namnet står alltid på språket självt,
    så att man hittar sitt eget även om man inte förstår det som visas nu. */
export const UI_LANGS: readonly { code: UiLang; name: string }[] = [
  { code: "sv", name: "Svenska" },
  { code: "en", name: "English" },
];

export function isUiLang(v: unknown): v is UiLang {
  return UI_LANGS.some((l) => l.code === v);
}

/** Ordlistan som föreslås för nästa spel när gränssnittet har ett visst språk.
    Läggs ett UI-språk utan ordlista till slutar det här att kompilera – avsiktligt,
    då måste man bestämma vilken ordlista det språket ska föreslå. */
export function gameLangFor(ui: UiLang): Lang {
  return ui;
}

/* Valet sparas i localStorage och inte i en kaka. En kaka skickas med varje
   anrop till epsund.github.io (alla Pages-projekt på domänen) utan att någon
   server läser den, och kräver ett utgångsdatum; localStorage stannar i
   webbläsaren. Origin delas ändå med de andra projekten, därav prefixet.
   Bara ett aktivt val sparas (se I18nProvider) – det detekterade förvalet
   skrivs aldrig, så den som inte valt fortsätter följa webbläsarens språk. */
const STORAGE_KEY = "wow-ui-lang";

/** Sparat val, eller null om inget (giltigt) finns eller lagringen är blockerad. */
export function loadSavedUiLang(): UiLang | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return isUiLang(v) ? v : null;
  } catch {
    // Blockerad lagring (vissa privata lägen, avstängda webbplatsdata) kastar.
    return null;
  }
}

export function saveUiLang(lang: UiLang): void {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Utan lagring gäller valet bara tills sidan laddas om.
  }
}

/** Första språket i webbläsarens önskelista som vi har en översättning till.
    Engelska om inget matchar – den som varken har svenska eller engelska
    inställt förstår troligare engelska. */
export function browserUiLang(): UiLang {
  try {
    const prefs = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const p of prefs) {
      const base = (p || "").toLowerCase().split("-")[0];
      if (isUiLang(base)) return base;
    }
  } catch {
    // Ingen navigator – faller igenom till engelska.
  }
  return "en";
}

/** Språket vid sidstart: det man själv valt, annars webbläsarens. */
export function initialUiLang(): UiLang {
  return loadSavedUiLang() ?? browserUiLang();
}
