import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScoreEntry } from "./types";
import {
  loadDailyScores,
  loadForMode,
  loadScoreRank,
  loadScores,
  loadScoresByName,
  submitScore,
} from "./scores";

/* Inga riktiga nätverksanrop – vi kontrollerar URL:er, body och felhantering.
   Topplistan ska kasta vid fel (ingen tyst fallback), felen visas i dialogerna. */

const entry = (over: Partial<ScoreEntry> = {}): ScoreEntry => ({
  id: 1,
  name: "Erik",
  score: 100,
  words: 5,
  lang: "sv",
  bestWord: "KATT",
  daily: null,
  created: null,
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
  it("frågar tabellen wow_scores filtrerat på språk och sorterat på poäng med kolumnalias", async () => {
    await loadScores("sv");
    const url = lastUrl();
    expect(url).toContain("/rest/v1/wow_scores?");
    expect(url).toContain("select=id,name,score");
    expect(url).toContain("words:word_count");
    expect(url).toContain("lang:language");
    expect(url).toContain("bestWord:best_word");
    expect(url).toContain("daily:daily_game_date");
    expect(url).toContain("created:created_at");
    expect(url).toContain("language=eq.sv");
    expect(url).toContain("order=score.desc");
    expect(url).toContain("limit=200");
  });

  it("skickar apikey och Authorization", async () => {
    await loadScores("sv");
    const headers = lastInit().headers as Record<string, string>;
    expect(headers.apikey).toBeTruthy();
    expect(headers.Authorization).toBe("Bearer " + headers.apikey);
  });

  it("returnerar raderna som de kommer", async () => {
    fetchMock.mockResolvedValueOnce(jsonOk([entry()]));
    await expect(loadScores("sv")).resolves.toEqual([entry()]);
  });

  it("kastar ett begripligt fel vid nätverksfel", async () => {
    fetchMock.mockRejectedValueOnce(new Error("boom"));
    await expect(loadScores("sv")).rejects.toThrow(/nätverksfel/);
  });

  it("kastar med statuskoden vid API-fel", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 500 }));
    await expect(loadScores("sv")).rejects.toThrow(/500/);
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

describe("loadScoresByName", () => {
  it("filtrerar på namn (skiftlägesokänsligt) och språk, sorterat på poäng", async () => {
    await loadScoresByName("Erik", "sv");
    const url = lastUrl();
    expect(url).toContain("name=ilike.Erik");
    expect(url).toContain("language=eq.sv");
    expect(url).toContain("order=score.desc");
    expect(url).toContain("limit=200");
  });

  it("escapar SQL-wildcards i namnet så de matchas bokstavligt", async () => {
    await loadScoresByName("50%_x", "sv");
    // % _ blir \% \_ och URL-kodas.
    expect(lastUrl()).toContain("name=ilike.50%5C%25%5C_x");
  });
});

describe("loadScoreRank", () => {
  const withCount = (total: number) =>
    new Response(JSON.stringify([{ id: 1 }]), {
      status: 206,
      headers: { "Content-Range": `0-0/${total}`, "Content-Type": "application/json" },
    });

  it("räknar resultat med högre poäng i samma språk och begär count", async () => {
    fetchMock.mockResolvedValueOnce(withCount(41));
    await loadScoreRank(120, "sv");
    const url = lastUrl();
    expect(url).toContain("score=gt.120");
    expect(url).toContain("language=eq.sv");
    const headers = lastInit().headers as Record<string, string>;
    expect(headers.Prefer).toContain("count=exact");
  });

  it("placering = antal med högre poäng + 1", async () => {
    fetchMock.mockResolvedValueOnce(withCount(41));
    await expect(loadScoreRank(120, "sv")).resolves.toBe(42);
  });

  it("ger placering 1 när inget ligger över", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("[]", { status: 206, headers: { "Content-Range": "*/0" } }),
    );
    await expect(loadScoreRank(999, "sv")).resolves.toBe(1);
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

  it("filtrerar all-time-listan på språk i databasen", async () => {
    await loadForMode("random", null, "sv");
    expect(lastUrl()).toContain("language=eq.sv");
    expect(lastUrl()).not.toContain("daily_game_date=eq");
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
    expect(lastUrl()).toContain("select=id");
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

  it("begär tillbaka den sparade raden och returnerar dess id", async () => {
    fetchMock.mockResolvedValueOnce(jsonOk([{ id: 4711 }]));
    await expect(submitScore(newScore)).resolves.toBe(4711);
    const headers = lastInit().headers as Record<string, string>;
    expect(headers.Prefer).toContain("return=representation");
  });

  it("returnerar null om servern inte skickar tillbaka något id", async () => {
    fetchMock.mockResolvedValueOnce(new Response("", { status: 201 }));
    await expect(submitScore(newScore)).resolves.toBeNull();
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
