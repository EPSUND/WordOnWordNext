import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import { initialState, reducer } from "../game/reducer";
import type { GameMode, Lang } from "../lib/types";
import { loadDict } from "../lib/dict";
import { makeBag } from "../lib/engine/bag";
import { hashSeed, mulberry32, todayStr } from "../lib/engine/rng";
import { pling, thud } from "../lib/sound";

export function useGame() {
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

  // Tangentbordsstyrning beroende på fas.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state.phase === "arrange") {
        if (e.key === "Enter") {
          dispatch({ type: "finishArrange" });
          e.preventDefault();
        }
        return;
      }
      if (state.phase !== "play") return;
      if (e.key === "ArrowLeft") {
        dispatch({ type: "setCol", c: state.currentCol - 1 });
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        dispatch({ type: "setCol", c: state.currentCol + 1 });
        e.preventDefault();
      } else if (e.key === "ArrowDown" || e.key === " ") {
        dispatch({ type: "drop" });
        e.preventDefault();
      } else if (e.key === "j" || e.key === "J") {
        dispatch({ type: "useJoker" });
        e.preventDefault();
      } else if (/^[1-7]$/.test(e.key)) {
        dispatch({ type: "setCol", c: +e.key - 1 });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.phase, state.currentCol]);

  const start = useCallback(
    async (mode: GameMode) => {
      setStartError(null);
      setStarting(true);
      try {
        await loadDict(state.lang);
      } catch (e) {
        setStarting(false);
        setStartError(e instanceof Error ? e.message : "Kunde inte ladda ordlistan.");
        return;
      }
      const daily = mode === "daily";
      const dailyDate = daily ? todayStr() : null;
      const rng = daily ? mulberry32(hashSeed("wow-daily-" + dailyDate)) : Math.random;
      const bag = makeBag(state.lang, rng);
      dispatch({ type: "start", mode, bag, dailyDate });
      setStarting(false);
    },
    [state.lang],
  );

  const actions = useMemo(
    () => ({
      setLang: (lang: Lang) => dispatch({ type: "setLang", lang }),
      setCol: (c: number) => dispatch({ type: "setCol", c }),
      drop: () => dispatch({ type: "drop" }),
      landed: () => dispatch({ type: "landed" }),
      useJoker: () => dispatch({ type: "useJoker" }),
      chooseJoker: (letter: string) => dispatch({ type: "chooseJoker", letter }),
      selectHand: (i: number) => dispatch({ type: "selectHand", i }),
      arrangeClick: (r: number, c: number) => dispatch({ type: "arrangeClick", r, c }),
      finishArrange: () => dispatch({ type: "finishArrange" }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [],
  );

  return { state, start, starting, startError, actions };
}
