import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScoreEntry } from "./types";
import { loadDailyScores, loadForMode, loadScores, submitScore } from "./scores";

/* Inga riktiga nätverksanrop – vi kontrollerar URL:er, body och felhantering.
   Topplistan ska kasta vid fel (ingen tyst fallback), felen visas i dialogerna. */

const entry = (over: Partial<ScoreEntry> = {}): ScoreEntry => ({
  name: "Erik",
  score: 100,
  words: 5,
  lang: "sv",
  bestWord: "KATT",
  daily: null,
  ...over,
});

const jsonOk = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => jsonOk([]));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const lastUrl = () => String(fetchMock.mock.calls.at(-1)![0]);
const lastInit = () => fetchMock.mock.calls.at(-1)![1] as RequestInit;

describe("loadScores", () => {
  it("frågar tabellen wow_scores sorterat på poäng med kolumnalias", async () => {
    await loadScores();
    const url = lastUrl();
    expect(url).toContain("/rest/v1/wow_scores?");
    expect(url).toContain("words:word_count");
    expect(url).toContain("lang:language");
    expect(url).toContain("bestWord:best_word");
    expect(url).toContain("daily:daily_game_date");
    expect(url).toContain("order=score.desc");
    expect(url).toContain("limit=200");
  });

  it("skickar apikey och Authorization", async () => {
    await loadScores();
    const headers = lastInit().headers as Record<string, string>;
    expect(headers.apikey).toBeTruthy();
    expect(headers.Authorization).toBe("Bearer " + headers.apikey);
  });

  it("returnerar raderna som de kommer", async () => {
    fetchMock.mockResolvedValueOnce(jsonOk([entry()]));
    await expect(loadScores()).resolves.toEqual([entry()]);
  });

  it("kastar ett begripligt fel vid nätverksfel", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(loadScores()).rejects.toThrow(/nätverksfel/);
  });

  it("kastar med statuskoden vid API-fel", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    await expect(loadScores()).rejects.toThrow(/500/);
  });
});

describe("loadDailyScores", () => {
  it("filtrerar på datum och språk", async () => {
    await loadDailyScores("2024-01-01", "en");
    expect(lastUrl()).toContain("daily_game_date=eq.2024-01-01");
    expect(lastUrl()).toContain("language=eq.en");
  });

  it("URL-kodar parametrarna", async () => {
    await loadDailyScores("2024-01-01&injected=1", "sv");
    expect(lastUrl()).toContain("2024-01-01%26injected%3D1");
  });
});

describe("loadForMode", () => {
  it("hämtar dagens lista för dagligt läge", async () => {
    await loadForMode("daily", "2024-05-05", "sv");
    expect(lastUrl()).toContain("daily_game_date=eq.2024-05-05");
  });

  it("faller tillbaka på all-time när dagligt läge saknar datum", async () => {
    await loadForMode("daily", null, "sv");
    // "daily:daily_game_date" i select finns alltid – det är filtret som ska saknas.
    expect(lastUrl()).not.toContain("daily_game_date=eq");
  });

  it("filtrerar all-time-listan på språk i klienten", async () => {
    fetchMock.mockResolvedValueOnce(jsonOk([entry({ lang: "sv" }), entry({ lang: "en" })]));
    const rows = await loadForMode("random", null, "sv");
    expect(rows).toHaveLength(1);
    expect(rows[0].lang).toBe("sv");
  });
});

describe("submitScore", () => {
  const newScore = {
    name: "Erik",
    score: 120,
    words: 7,
    lang: "sv" as const,
    bestWord: "KATT",
    daily: "2024-01-01",
  };

  it("POSTar med databasens kolumnnamn", async () => {
    await submitScore(newScore);
    expect(lastInit().method).toBe("POST");
    expect(JSON.parse(String(lastInit().body))).toEqual({
      name: "Erik",
      score: 120,
      word_count: 7,
      language: "sv",
      best_word: "KATT",
      daily_game_date: "2024-01-01",
    });
  });

  it("skickar null i stället för tom sträng för bestWord och daily", async () => {
    await submitScore({ ...newScore, bestWord: "", daily: null });
    const body = JSON.parse(String(lastInit().body));
    expect(body.best_word).toBeNull();
    expect(body.daily_game_date).toBeNull();
  });

  it("kastar vid nätverksfel", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(submitScore(newScore)).rejects.toThrow(/nätverksfel/);
  });

  it("kastar med statuskoden när servern nekar", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));
    await expect(submitScore(newScore)).rejects.toThrow(/401/);
  });
});
