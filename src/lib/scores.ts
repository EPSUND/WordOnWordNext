import type { GameMode, Lang, ScoreEntry } from "./types";

/* Global topplista via Supabase REST. Den publicerbara nyckeln är gjord för att
   ligga öppet i klienten; åtkomsten styrs av Row Level Security (läs + lägg till). */
const SUPA_URL = "https://vvspqfbvxuimxcbyyahw.supabase.co";
const SUPA_KEY = "sb_publishable_-T5PvrE5hwqAPqiJ1JcKcQ_ZkrOPTHm";
const SUPA_TABLE = "wow_scores";
const SUPA_HEADERS: Record<string, string> = {
  apikey: SUPA_KEY,
  Authorization: "Bearer " + SUPA_KEY,
  "Content-Type": "application/json",
};
const HS_SELECT =
  "select=name,score,words:word_count,lang:language,bestWord:best_word,daily:daily_game_date";

async function fetchScores(params: string): Promise<ScoreEntry[]> {
  let r: Response;
  try {
    r = await fetch(`${SUPA_URL}/rest/v1/${SUPA_TABLE}?${HS_SELECT}&${params}`, {
      headers: SUPA_HEADERS,
    });
  } catch {
    throw new Error("Kunde inte nå topplistan (nätverksfel).");
  }
  if (!r.ok) throw new Error("Topplistan svarade med fel (" + r.status + ").");
  return (await r.json()) as ScoreEntry[];
}

/** All-time-listan (båda lägena). */
export function loadScores(): Promise<ScoreEntry[]> {
  return fetchScores("order=score.desc&limit=200");
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
  return (await loadScores()).filter((e) => e.lang === lang);
}

export async function submitScore(entry: NewScore): Promise<void> {
  let r: Response;
  try {
    r = await fetch(`${SUPA_URL}/rest/v1/${SUPA_TABLE}`, {
      method: "POST",
      headers: { ...SUPA_HEADERS, Prefer: "return=minimal" },
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
    throw new Error("Kunde inte spara poängen (nätverksfel).");
  }
  if (!r.ok) throw new Error("Poängen kunde inte sparas (" + r.status + ").");
}
