import { afterEach, describe, expect, it, vi } from "vitest";
import {
  UI_LANGS,
  browserUiLang,
  gameLangFor,
  initialUiLang,
  isUiLang,
  loadSavedUiLang,
  saveUiLang,
} from "./langs";

/* Node har varken localStorage eller en webbläsares navigator.languages, så
   båda stubbas per test. */

function memoryStorage(init: Record<string, string> = {}) {
  const data = new Map(Object.entries(init));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  };
}

// Så beter sig lagringen när webbplatsdata är blockerad (vissa privata lägen).
const blockedStorage = {
  getItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
  setItem: () => {
    throw new DOMException("blocked", "SecurityError");
  },
};

const browser = (languages: string[], language = languages[0] ?? "") =>
  vi.stubGlobal("navigator", { languages, language });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("browserUiLang", () => {
  it("känner igen språket oavsett region", () => {
    browser(["sv-SE"]);
    expect(browserUiLang()).toBe("sv");
    browser(["en-GB"]);
    expect(browserUiLang()).toBe("en");
  });

  it("tar första språket i önskelistan som finns", () => {
    browser(["de-DE", "sv-SE", "en-US"]);
    expect(browserUiLang()).toBe("sv");
    // Ordningen avgör: engelsk webbläsare med svenska som andraspråk ger engelska.
    browser(["en-US", "sv"]);
    expect(browserUiLang()).toBe("en");
  });

  it("faller tillbaka på engelska när inget språk matchar", () => {
    browser(["de-DE", "fr"]);
    expect(browserUiLang()).toBe("en");
  });

  it("använder navigator.language när languages är tom", () => {
    browser([], "sv-FI");
    expect(browserUiLang()).toBe("sv");
  });

  it("klarar sig utan navigator", () => {
    vi.stubGlobal("navigator", undefined);
    expect(browserUiLang()).toBe("en");
  });
});

describe("sparat språkval", () => {
  it("ett sparat val vinner över webbläsarens språk", () => {
    vi.stubGlobal("localStorage", memoryStorage({ "wow-ui-lang": "en" }));
    browser(["sv-SE"]);
    expect(initialUiLang()).toBe("en");
  });

  it("följer webbläsaren när inget är sparat", () => {
    vi.stubGlobal("localStorage", memoryStorage());
    browser(["sv-SE"]);
    expect(initialUiLang()).toBe("sv");
  });

  it("det detekterade förvalet sparas inte", () => {
    // Bara ett aktivt val ska skrivas – annars låstes man vid webbläsarens
    // språk vid första besöket och ett senare byte av webbläsarspråk ignorerades.
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    browser(["sv-SE"]);
    initialUiLang();
    expect(storage.data.size).toBe(0);
  });

  it("ignorerar ett ogiltigt sparat värde", () => {
    // T.ex. ett språk som tagits bort eller ett manuellt ändrat värde.
    vi.stubGlobal("localStorage", memoryStorage({ "wow-ui-lang": "de" }));
    browser(["sv-SE"]);
    expect(loadSavedUiLang()).toBeNull();
    expect(initialUiLang()).toBe("sv");
  });

  it("sparar och läser tillbaka valet", () => {
    const storage = memoryStorage();
    vi.stubGlobal("localStorage", storage);
    saveUiLang("en");
    expect(storage.data.get("wow-ui-lang")).toBe("en");
    expect(loadSavedUiLang()).toBe("en");
  });

  it("kastar aldrig när lagringen är blockerad", () => {
    vi.stubGlobal("localStorage", blockedStorage);
    browser(["sv-SE"]);
    expect(() => saveUiLang("en")).not.toThrow();
    expect(loadSavedUiLang()).toBeNull();
    expect(initialUiLang()).toBe("sv");
  });

  it("kastar aldrig när localStorage saknas helt", () => {
    vi.stubGlobal("localStorage", undefined);
    browser(["en-US"]);
    expect(() => saveUiLang("sv")).not.toThrow();
    expect(initialUiLang()).toBe("en");
  });
});

describe("UI_LANGS", () => {
  it("har giltiga koder och namn på språket självt", () => {
    expect(UI_LANGS.map((l) => [l.code, l.name])).toEqual([
      ["sv", "Svenska"],
      ["en", "English"],
    ]);
    expect(UI_LANGS.every((l) => isUiLang(l.code))).toBe(true);
    expect(isUiLang("de")).toBe(false);
    expect(isUiLang(null)).toBe(false);
  });

  it("föreslår ordlistan som hör till gränssnittets språk", () => {
    expect(gameLangFor("sv")).toBe("sv");
    expect(gameLangFor("en")).toBe("en");
  });
});
