import type { Phase } from "../lib/types";
import type { Action } from "./reducer";

/** Det som behövs ur ett KeyboardEvent – gör keyToAction ren och testbar i node. */
export interface KeyInput {
  key: string;
  repeat: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
}

/** action = det som ska skickas till reducern (null = ingenting, tangenten bara sväljs). */
export interface KeyResult {
  action: Action | null;
  preventDefault: boolean;
}

interface PlayKey {
  action: Action;
  preventDefault: boolean;
  /** Engångsaktion: ska inte upprepas när tangenten hålls nere. */
  oneShot: boolean;
}

function playKey(key: string, currentCol: number): PlayKey | null {
  switch (key) {
    case "ArrowLeft":
      return { action: { type: "setCol", c: currentCol - 1 }, preventDefault: true, oneShot: false };
    case "ArrowRight":
      return { action: { type: "setCol", c: currentCol + 1 }, preventDefault: true, oneShot: false };
    case "ArrowDown":
    case " ":
      return { action: { type: "drop" }, preventDefault: true, oneShot: true };
    case "j":
    case "J":
      return { action: { type: "useJoker" }, preventDefault: true, oneShot: true };
    case "z":
    case "Z":
      return { action: { type: "undo" }, preventDefault: true, oneShot: true };
  }
  if (/^[1-7]$/.test(key)) {
    return { action: { type: "setCol", c: +key - 1 }, preventDefault: false, oneShot: false };
  }
  return null;
}

/**
 * Översätter en tangent till en spelaktion beroende på fas. null = tangenten angår
 * inte spelet och webbläsarens standardbeteende får gälla. Det DOM-nära – öppna
 * dialoger och textfält – sköts av useGame innan den här anropas.
 */
export function keyToAction(phase: Phase, currentCol: number, k: KeyInput): KeyResult | null {
  // Kombinationer som Ctrl+J (nedladdningar) och Alt+← (bakåt) tillhör webbläsaren.
  if (k.ctrlKey || k.metaKey || k.altKey) return null;

  if (phase === "arrange") {
    return k.key === "Enter" ? { action: { type: "finishArrange" }, preventDefault: true } : null;
  }
  if (phase === "joker") {
    // Escape stänger jokerdialogen – även i sista draget, där spelaren själv öppnat den.
    return k.key === "Escape" ? { action: { type: "cancelJoker" }, preventDefault: true } : null;
  }
  if (phase !== "play" && phase !== "fall") return null;

  const m = playKey(k.key, currentCol);
  if (!m) return null;
  // Medan brickan faller, och när en engångsaktion autorepeteras, sväljs tangenten
  // utan aktion: annars scrollar mellanslaget sidan mitt i fallet, och ett nedhållet
  // mellanslag skulle släppa bricka efter bricka i samma kolumn.
  const act = phase === "play" && !(m.oneShot && k.repeat);
  return { action: act ? m.action : null, preventDefault: m.preventDefault };
}
