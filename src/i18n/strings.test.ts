import { describe, expect, it } from "vitest";
import { FetchFailed } from "../lib/errors";
import { STRINGS, errorText } from "./I18n";
import { UI_LANGS } from "./langs";

/* Att sv och en har samma nycklar kontrolleras redan av kompilatorn (Strings).
   Här testas det som typerna inte ser: felöversättningen och de dynamiska texterna. */

describe("errorText", () => {
  it("behåller de svenska feltexterna från före översättningen", () => {
    const t = STRINGS.sv;
    expect(errorText(t, new FetchFailed("dict", null))).toBe(
      "Kunde inte ladda ordlistan (nätverksfel).",
    );
    expect(errorText(t, new FetchFailed("dict", 404))).toBe("Kunde inte ladda ordlistan (404).");
    expect(errorText(t, new FetchFailed("scores", null))).toBe(
      "Kunde inte nå topplistan (nätverksfel).",
    );
    expect(errorText(t, new FetchFailed("scores", 500))).toBe("Topplistan svarade med fel (500).");
    expect(errorText(t, new FetchFailed("save", null))).toBe(
      "Kunde inte spara poängen (nätverksfel).",
    );
    expect(errorText(t, new FetchFailed("save", 401))).toBe("Poängen kunde inte sparas (401).");
  });

  it("översätter felen till gränssnittets språk", () => {
    const t = STRINGS.en;
    expect(errorText(t, new FetchFailed("dict", null))).toBe(
      "Couldn't load the dictionary (network error).",
    );
    expect(errorText(t, new FetchFailed("scores", 503))).toContain("503");
  });

  it("visar aldrig råa felmeddelanden från okända fel", () => {
    // T.ex. en SyntaxError från r.json() – webbläsarens engelska text hör inte hemma i UI:t.
    for (const { code } of UI_LANGS) {
      const t = STRINGS[code];
      expect(errorText(t, new SyntaxError("Unexpected token <"))).toBe(t.errors.generic);
      expect(errorText(t, "boom")).toBe(t.errors.generic);
    }
  });
});

describe("dynamiska texter", () => {
  it("klicka på dator, tryck på touch", () => {
    expect(STRINGS.sv.controls.arrange(false, 3)).toContain("klicka i en kolumn");
    expect(STRINGS.sv.controls.arrange(true, 3)).toMatch(/tryck i en kolumn.*\(3 kvar\)\. Tryck på/);
    expect(STRINGS.en.controls.arrange(true, 3)).toMatch(/tap a column.*\(3 left\)\. Tap a/);
    expect(STRINGS.en.controls.arranged(false)).toContain("click a tile");
  });

  it("böjer engelskans undo i singular", () => {
    expect(STRINGS.en.controls.undosLeft(1)).toBe("1 undo left");
    expect(STRINGS.en.controls.undosLeft(2)).toBe("2 undos left");
  });

  it("välkomstkorsningens ord har tre bokstäver i alla språk", () => {
    for (const { code } of UI_LANGS) expect([...STRINGS[code].welcome.cross]).toHaveLength(3);
  });
});
