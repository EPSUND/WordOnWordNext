import type { GameState } from "../game/reducer";
import { TOTAL_BLOCKS } from "../lib/engine/constants";
import WordList from "./WordList";

interface Props {
  state: GameState;
  onUseJoker: () => void;
  onFinishArrange: () => void;
}

export default function SidePanel({ state, onUseJoker, onFinishArrange }: Props) {
  const handLeft = state.startHand.filter((h) => h.r == null).length;
  const blocksLeft =
    state.phase === "over"
      ? 0
      : Math.max(0, handLeft + (TOTAL_BLOCKS - state.bagIndex) + (state.jokerUsed ? 0 : 1));
  const nextTile = state.phase === "arrange" ? "–" : state.nextLetter || "–";
  const modeLabel =
    state.mode === "daily" ? "Dagligt " + (state.dailyDate || "") : "Slumpmässigt";

  const jokerHidden = state.jokerUsed;
  const jokerDisabled = !(
    state.phase === "play" &&
    !state.jokerUsed &&
    state.currentLetter != null &&
    !state.isJokerTile
  );

  return (
    <div className="panel">
      <div className="card">
        <h2>Poäng</h2>
        <div className="scorebig">{state.score}</div>
        <div style={{ marginTop: 8 }}>
          <div className="statrow">
            <span>Antal ord</span>
            <b>{state.numWords}</b>
          </div>
          <div className="statrow">
            <span>Brickor kvar</span>
            <b>{blocksLeft}</b>
          </div>
          <div className="statrow">
            <span>Språk</span>
            <b>{state.lang === "sv" ? "Svenska" : "Engelska"}</b>
          </div>
          <div className="statrow">
            <span>Läge</span>
            <b>{modeLabel}</b>
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Nästa bricka</h2>
        <div className="nextwrap">
          <div className="minitile">{nextTile}</div>
          <div className="hint">
            Flytta med <kbd>←</kbd>
            <kbd>→</kbd> eller musen.
            <br />
            Släpp med <kbd>␣</kbd>/<kbd>↓</kbd> eller klick.
          </div>
        </div>
        {state.phase === "arrange" && (
          <div className="prepnote">
            {handLeft > 0
              ? `Placera dina 5 startbrickor: välj en bricka och klicka i en kolumn – den faller till botten eller staplas (${handLeft} kvar). Klicka en placerad bricka för att ta bort den.`
              : "Alla 5 placerade – klicka en bricka för att flytta den, eller “Börja spela”."}
          </div>
        )}
        {state.phase === "arrange" && (
          <button className="startbtn2" disabled={handLeft !== 0} onClick={onFinishArrange}>
            Börja spela ▶
          </button>
        )}
        {!jokerHidden && (
          <button className="jokerbtn" disabled={jokerDisabled} onClick={onUseJoker}>
            🃏 Använd joker <kbd>J</kbd>
          </button>
        )}
      </div>

      <div className="card">
        <h2>Hittade ord</h2>
        <WordList state={state} />
      </div>
    </div>
  );
}
