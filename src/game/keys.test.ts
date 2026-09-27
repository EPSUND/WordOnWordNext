import { describe, expect, it } from "vitest";
import type { Phase } from "../lib/types";
import { type KeyInput, keyToAction } from "./keys";

/** Ett vanligt tangenttryck utan modifierare eller autorepeat. */
const k = (key: string, over: Partial<KeyInput> = {}): KeyInput => ({
  key,
  repeat: false,
  ctrlKey: false,
  metaKey: false,
  altKey: false,
  ...over,
});

describe("keyToAction – play", () => {
  it("flyttar kolumnen med piltangenterna", () => {
    expect(keyToAction("play", 3, k("ArrowLeft"))).toEqual({
      action: { type: "setCol", c: 2 },
      preventDefault: true,
    });
    expect(keyToAction("play", 3, k("ArrowRight"))?.action).toEqual({ type: "setCol", c: 4 });
  });

  it("släpper med mellanslag och pil ned", () => {
    for (const key of [" ", "ArrowDown"]) {
      expect(keyToAction("play", 3, k(key))).toEqual({ action: { type: "drop" }, preventDefault: true });
    }
  });

  it("joker med j och ångra med z, oavsett skiftläge", () => {
    for (const key of ["j", "J"]) expect(keyToAction("play", 0, k(key))?.action).toEqual({ type: "useJoker" });
    for (const key of ["z", "Z"]) expect(keyToAction("play", 0, k(key))?.action).toEqual({ type: "undo" });
  });

  it("väljer kolumn med siffrorna 1–7 utan att stoppa standardbeteendet", () => {
    expect(keyToAction("play", 3, k("1"))).toEqual({
      action: { type: "setCol", c: 0 },
      preventDefault: false,
    });
    expect(keyToAction("play", 3, k("7"))?.action).toEqual({ type: "setCol", c: 6 });
    expect(keyToAction("play", 3, k("8"))).toBeNull();
    expect(keyToAction("play", 3, k("0"))).toBeNull();
  });

  it("låter övriga tangenter vara", () => {
    for (const key of ["a", "Enter", "Escape", "Tab"]) expect(keyToAction("play", 3, k(key))).toBeNull();
  });
});

describe("keyToAction – autorepeat och modifierare", () => {
  it("upprepar inte släpp, joker eller ångra när tangenten hålls nere, men sväljer den", () => {
    for (const key of [" ", "ArrowDown", "j", "z"]) {
      expect(keyToAction("play", 3, k(key, { repeat: true }))).toEqual({
        action: null,
        preventDefault: true,
      });
    }
  });

  it("låter piltangenterna upprepas så man kan svepa över brädet", () => {
    expect(keyToAction("play", 3, k("ArrowLeft", { repeat: true }))?.action).toEqual({
      type: "setCol",
      c: 2,
    });
  });

  it("lämnar Ctrl/Cmd/Alt-kombinationer åt webbläsaren (Ctrl+J, Cmd+Z, Alt+←)", () => {
    expect(keyToAction("play", 3, k("j", { ctrlKey: true }))).toBeNull();
    expect(keyToAction("play", 3, k("z", { metaKey: true }))).toBeNull();
    expect(keyToAction("play", 3, k("ArrowLeft", { altKey: true }))).toBeNull();
    expect(keyToAction("arrange", 3, k("Enter", { ctrlKey: true }))).toBeNull();
  });
});

describe("keyToAction – övriga faser", () => {
  it("avslutar arrangeringen med Enter, och bara med Enter", () => {
    expect(keyToAction("arrange", 3, k("Enter"))).toEqual({
      action: { type: "finishArrange" },
      preventDefault: true,
    });
    for (const key of [" ", "ArrowLeft", "j", "1"]) expect(keyToAction("arrange", 3, k(key))).toBeNull();
  });

  it("stänger jokerdialogen med Escape men låter Enter aktivera bokstavsknapparna", () => {
    expect(keyToAction("joker", 3, k("Escape"))).toEqual({
      action: { type: "cancelJoker" },
      preventDefault: true,
    });
    expect(keyToAction("joker", 3, k("Enter"))).toBeNull();
    expect(keyToAction("joker", 3, k(" "))).toBeNull();
  });

  it("sväljer spelets tangenter medan brickan faller, utan aktion", () => {
    // Annars scrollar ett mellanslag sidan mitt i fallet.
    expect(keyToAction("fall", 3, k(" "))).toEqual({ action: null, preventDefault: true });
    expect(keyToAction("fall", 3, k("ArrowLeft"))).toEqual({ action: null, preventDefault: true });
    expect(keyToAction("fall", 3, k("a"))).toBeNull();
  });

  it("gör ingenting på välkomstsidan eller efter spelets slut", () => {
    for (const phase of ["idle", "over"] as Phase[])
      for (const key of [" ", "Enter", "Escape", "ArrowLeft", "j", "z", "3"])
        expect(keyToAction(phase, 3, k(key))).toBeNull();
  });
});
