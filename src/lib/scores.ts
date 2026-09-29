import type { GameMode, Lang, ScoreEntry } from "./types";
import { FetchFailed } from "./errors";

/* Global topplista via Supabase REST. Den publicerbara nyckeln är gjord för att
   ligga öppet i klienten; åtkomsten styrs av Row Level Security (läs + lägg till). */
const SUPA_URL = "https://vvspqfbvxuimxcbyyahw.supabase.co";
const SUPA_KEY = "sb_publishable_-T5PvrE5hwqAPqiJ1JcKcQ_ZkrOPTHm";
const SUPA_TABLE = "wow_scores";
/* Vy över wow_scores med ett resultat per spelare (deras bästa). Definitionen –
   och varför den behövs – står i docs/supabase.md. */
const SUPA_BEST_VIEW = "wow_best_player_scores";
const SUPA_HEADERS: Record<string, string> = {
  apikey: SUPA_KEY,
  Authorization: "Bearer " + SUPA_KEY,
  "Content-Type": "application/json",
};
const HS_SELECT =
  "select=id,name,score,words:word_count,lang:language,bestWord:best_word,daily:daily_game_date,created:created_at";

async function fetchScores(params: string, relation = SUPA_TABLE): Promise<ScoreEntry[]> {
  let r: Response;
  try {
    r = await fetch(`${SUPA_URL}/rest/v1/${relation}?${HS_SELECT}&${params}`, {
      headers: SUPA_HEADERS,
    });
  } catch {
    throw new FetchFailed("scores", null);
  }
  if (!r.ok) throw new FetchFailed("scores", r.status);
  return (await r.json()) as ScoreEntry[];
}

/** All-time-listan för ett språk (filtreras i databasen så limiten gäller per språk). */
export function loadScores(lang: Lang): Promise<ScoreEntry[]> {
  return fetchScores(
    `language=eq.${encodeURIComponent(lang)}&order=score.desc&limit=200`,
  );
}

/** Ett resultat per spelare (deras bästa) i ett språk. Uttunningen görs av vyn
    (DISTINCT ON per språk och normaliserat namn), som har samma kolumner som
    tabellen – limiten gäller alltså redan uttunnade rader. */
export function loadBestPlayerScores(lang: Lang): Promise<ScoreEntry[]> {
  return fetchScores(
    `language=eq.${encodeURIComponent(lang)}&order=score.desc&limit=200`,
    SUPA_BEST_VIEW,
  );
}

/** Alla resultat för ett givet namn (skiftlägesokänsligt) i ett språk. */
export function loadScoresByName(name: string, lang: Lang): Promise<ScoreEntry[]> {
  // ilike utan wildcards = exakt men skiftlägesokänslig träff. Escapa de tecken
  // som annars vore SQL-wildcards (%, _) och PostgREST:s egen wildcard (*), så att
  // ett namn som råkar innehålla dem matchas bokstavligt.
  const literal = name.replace(/[%_*\\]/g, "\\$&");
  return fetchScores(
    `name=ilike.${encodeURIComponent(literal)}&language=eq.${encodeURIComponent(
      lang,
    )}&order=score.desc&limit=200`,
  );
}

/** Global placering (1-baserad) för en viss poäng i språkets topplista:
    antalet resultat med högre poäng + 1. Samma poäng delar placering.
    Räknas via PostgREST:s `count=exact` (totalen i Content-Range-headern), så
    det funkar även för placeringar bortom de 200 som listorna hämtar. */
export async function loadScoreRank(score: number, lang: Lang): Promise<number> {
  const q = `select=id&language=eq.${encodeURIComponent(lang)}&score=gt.${encodeURIComponent(
    String(score),
  )}`;
  let r: Response;
  try {
    r = await fetch(`${SUPA_URL}/rest/v1/${SUPA_TABLE}?${q}`, {
      headers: { ...SUPA_HEADERS, Prefer: "count=exact", Range: "0-0" },
    });
  } catch {
    throw new FetchFailed("scores", null);
  }
  // 206 Partial Content är normalt när Range är satt.
  if (!r.ok && r.status !== 206) {
    throw new FetchFailed("scores", r.status);
  }
  // Content-Range: "0-0/1234" (eller "*/0" när inget ligger över).
  const above = Number((r.headers.get("content-range") || "").split("/")[1]);
  return (Number.isFinite(above) ? above : 0) + 1;
}

/** En specifik dags dagliga spel, ett språk. */
export function loadDailyScores(dateStr: string, lang: Lang): Promise<ScoreEntry[]> {
  return fetchScores(
    `daily_game_date=eq.${encodeURIComponent(dateStr)}&language=eq.${encodeURIComponent(
      lang,
    )}&order=score.desc&limit=200`,
  );
}

export interface NewScore {
  name: string;
  score: number;
  words: number;
  lang: Lang;
  bestWord: string;
  daily: string | null;
}

/** Rätt lista för ett spelläge: dagligt = datum+språk, annars all-time filtrerat på språk. */
export async function loadForMode(
  mode: GameMode,
  dailyDate: string | null,
  lang: Lang,
): Promise<ScoreEntry[]> {
  if (mode === "daily" && dailyDate) return loadDailyScores(dailyDate, lang);
  return loadScores(lang);
}

/** Sparar ett resultat och returnerar radens id, så att anroparen kan peka ut
    exakt den posten i den omladdade listan (namn + poäng räcker inte – samma
    spelare kan ha flera resultat med samma poäng). Returnerar null om servern
    mot förmodan inte skickar tillbaka raden; poängen är sparad ändå. */
export async function submitScore(entry: NewScore): Promise<number | null> {
  let r: Response;
  try {
    r = await fetch(`${SUPA_URL}/rest/v1/${SUPA_TABLE}?select=id`, {
      method: "POST",
      headers: { ...SUPA_HEADERS, Prefer: "return=representation" },
      body: JSON.stringify({
        name: entry.name,
        score: entry.score,
        word_count: entry.words,
        language: entry.lang,
        best_word: entry.bestWord || null,
        daily_game_date: entry.daily || null,
      }),
    });
  } catch {
    throw new FetchFailed("save", null);
  }
  if (!r.ok) throw new FetchFailed("save", r.status);
  try {
    const rows = (await r.json()) as { id?: number }[];
    const id = Array.isArray(rows) ? rows[0]?.id : undefined;
    return typeof id === "number" ? id : null;
  } catch {
    return null;
  }
}
