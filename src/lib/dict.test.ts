import { afterEach, describe, expect, it, vi } from "vitest";

/* dict.ts har en modulnivå-cache. Varje test importerar modulen på nytt med
   resetModules() så att cachen börjar tom. */
async function freshDict() {
  vi.resetModules();
  return import("./dict");
}

const okResponse = (body: string) => new Response(body, { status: 200 });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadDict", () => {
  it("parsar en ordlista med LF", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse("KATT\nHUS\nSOL\n")));
    const { loadDict } = await freshDict();
    const set = await loadDict("sv");
    expect([...set].sort()).toEqual(["HUS", "KATT", "SOL"]);
  });

  it("parsar en ordlista med CRLF utan släpande \\r", async () => {
    // Regressionsspärr: med core.autocrlf=true checkas filerna ut med CRLF på
    // Windows. En split på enbart "\n" gav ord som "KATT\r" och då godkändes
    // inget ord alls – en bugg som bara syns lokalt, aldrig i CI på Linux.
    vi.stubGlobal("fetch", vi.fn(async () => okResponse("KATT\r\nHUS\r\nSOL\r\n")));
    const { loadDict } = await freshDict();
    const set = await loadDict("sv");
    expect(set.has("KATT")).toBe(true);
    expect(set.has("KATT\r")).toBe(false);
  });

  it("hoppar över tomma rader", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse("KATT\n\n\nHUS\n")));
    const { loadDict } = await freshDict();
    expect((await loadDict("sv")).size).toBe(2);
  });

  it("hämtar bara en gång per språk (cache)", async () => {
    const spy = vi.fn(async () => okResponse("KATT\n"));
    vi.stubGlobal("fetch", spy);
    const { loadDict } = await freshDict();
    await loadDict("sv");
    await loadDict("sv");
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("delar samma hämtning mellan samtidiga anrop", async () => {
    const spy = vi.fn(async () => okResponse("KATT\n"));
    vi.stubGlobal("fetch", spy);
    const { loadDict } = await freshDict();
    const [a, b] = await Promise.all([loadDict("sv"), loadDict("sv")]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it("håller språken åtskilda", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => okResponse(String(url).includes("-sv") ? "KATT\n" : "CAT\n")),
    );
    const { loadDict } = await freshDict();
    expect((await loadDict("sv")).has("KATT")).toBe(true);
    expect((await loadDict("en")).has("CAT")).toBe(true);
    expect((await loadDict("en")).has("KATT")).toBe(false);
  });

  it("hämtar via BASE_URL så att sökvägen fungerar på Pages", async () => {
    const spy = vi.fn(async (_url: string) => okResponse("KATT\n"));
    vi.stubGlobal("fetch", spy);
    const { loadDict } = await freshDict();
    await loadDict("sv");
    expect(spy.mock.calls[0][0]).toBe(`${import.meta.env.BASE_URL}dict-sv.txt`);
  });

  it("kastar med statuskod när hämtningen misslyckas", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 404 })));
    const { loadDict } = await freshDict();
    await expect(loadDict("sv")).rejects.toThrow(/404/);
  });

  it("ger ett svenskt meddelande vid nätverksfel i stället för webbläsarens", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("Failed to fetch");
      }),
    );
    const { loadDict } = await freshDict();
    await expect(loadDict("sv")).rejects.toThrow("Kunde inte ladda ordlistan (nätverksfel).");
  });

  it("gör ett nytt försök efter ett nätverksfel – felet cachas inte", async () => {
    // Regressionsspärr: det avvisade löftet låg kvar i cachen, så "Starta spelet"
    // visade samma fel för evigt utan nytt anrop. Bara en omladdning hjälpte.
    const spy = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(okResponse("KATT\n"));
    vi.stubGlobal("fetch", spy);
    const { loadDict } = await freshDict();
    await expect(loadDict("sv")).rejects.toThrow(/nätverksfel/);
    expect((await loadDict("sv")).has("KATT")).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("gör ett nytt försök efter ett HTTP-fel", async () => {
    const spy = vi
      .fn()
      .mockResolvedValueOnce(new Response("", { status: 503 }))
      .mockResolvedValueOnce(okResponse("KATT\n"));
    vi.stubGlobal("fetch", spy);
    const { loadDict } = await freshDict();
    await expect(loadDict("sv")).rejects.toThrow(/503/);
    expect((await loadDict("sv")).has("KATT")).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it("delar ett misslyckat försök mellan samtidiga anrop, men nästa anrop försöker igen", async () => {
    const spy = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce(okResponse("KATT\n"));
    vi.stubGlobal("fetch", spy);
    const { loadDict } = await freshDict();
    const results = await Promise.allSettled([loadDict("sv"), loadDict("sv")]);
    expect(results.map((r) => r.status)).toEqual(["rejected", "rejected"]);
    expect(spy).toHaveBeenCalledTimes(1);
    expect((await loadDict("sv")).has("KATT")).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("dictFor och isDictLoaded", () => {
  it("kastar innan ordlistan laddats", async () => {
    const { dictFor, isDictLoaded } = await freshDict();
    expect(isDictLoaded("sv")).toBe(false);
    expect(() => dictFor("sv")).toThrow();
  });

  it("ger den laddade mängden efteråt", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => okResponse("KATT\n")));
    const { loadDict, dictFor, isDictLoaded } = await freshDict();
    const set = await loadDict("sv");
    expect(isDictLoaded("sv")).toBe(true);
    expect(dictFor("sv")).toBe(set);
  });
});
