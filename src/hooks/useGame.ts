import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { initialState, reducer } from "../game/reducer";
import { keyToAction } from "../game/keys";
import type { GameMode, Lang } from "../lib/types";
import { loadDict } from "../lib/dict";
import { makeBag } from "../lib/engine/bag";
import { hashSeed, mulberry32, todayStr } from "../lib/engine/rng";
import { pling, thud, unlockAudio } from "../lib/sound";

/** Skriver man i ett fält hör tangenterna till fältet, inte spelet. */
const isEditable = (t: EventTarget | null): boolean =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * @param inputBlocked Sant när en dialog (Start, Hjälp, Topplista) ligger över brädet.
 *   Då pausas spelets tangenter helt, annars styr de spelet bakom dialogen.
 */
export function useGame(inputBlocked: boolean) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Ljudeffekter drivna av räknare i speltillståndet.
  useEffect(() => {
    if (state.soundThud) thud();
  }, [state.soundThud]);
  useEffect(() => {
    if (state.soundPling) pling(state.soundPlingLen);
    // soundPlingLen medvetet utanför deps – vi spelar bara när räknaren ändras.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.soundPling]);

  // Lås upp ljudet vid första användargesten (krav på iOS – se sound.ts).
  useEffect(() => {
    const on = () => unlockAudio();
    const opts = { once: true, passive: true } as const;
    window.addEventListener("pointerdown", on, opts);
    window.addEventListener("keydown", on, opts);
    return () => {
      window.removeEventListener("pointerdown", on);
      window.removeEventListener("keydown", on);
    };
  }, []);

  // Tangentbordsstyrning beroende på fas (mappningen är ren – se game/keys.ts).
  useEffect(() => {
    if (inputBlocked) return;
    const onKey = (e: KeyboardEvent) => {
      if (isEditable(e.target)) return;
      const r = keyToAction(state.phase, state.currentCol, e);
      if (!r) return;
      if (r.preventDefault) e.preventDefault();
      if (r.action) dispatch(r.action);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, state.currentCol, inputBlocked]);

  // Språket skickas in i stället för att läsas ur state: det aktuella spelets
  // språk och det som väljs för nästa spel är två olika saker (se reducerns start).
  const start = useCallback(async (mode: GameMode, lang: Lang) => {
    setStartError(null);
    setStarting(true);
    try {
      await loadDict(lang);
    } catch (e) {
      setStarting(false);
      setStartError(e instanceof Error ? e.message : "Kunde inte ladda ordlistan.");
      return false;
    }
    const daily = mode === "daily";
    const dailyDate = daily ? todayStr() : null;
    const rng = daily ? mulberry32(hashSeed("wow-daily-" + dailyDate)) : Math.random;
    const bag = makeBag(lang, rng);
    dispatch({ type: "start", mode, lang, bag, dailyDate });
    setStarting(false);
    return true;
  }, []);

  const actions = useMemo(
    () => ({
      setCol: (c: number) => dispatch({ type: "setCol", c }),
      drop: () => dispatch({ type: "drop" }),
      landed: () => dispatch({ type: "landed" }),
      useJoker: () => dispatch({ type: "useJoker" }),
      cancelJoker: () => dispatch({ type: "cancelJoker" }),
      undo: () => dispatch({ type: "undo" }),
      chooseJoker: (letter: string) => dispatch({ type: "chooseJoker", letter }),
      selectHand: (i: number) => dispatch({ type: "selectHand", i }),
      arrangeClick: (r: number, c: number) => dispatch({ type: "arrangeClick", r, c }),
      finishArrange: () => dispatch({ type: "finishArrange" }),
    }),
    [],
  );

  return { state, start, starting, startError, actions };
}
