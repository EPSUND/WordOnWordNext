import type { GameState } from "../../game/reducer";
import { TOTAL_BLOCKS } from "../../lib/engine/constants";
import "./StatusCard.css";

interface Props {
  state: GameState;
}

/**
 * Poäng och statistik. På skrivbord ett kort högst upp i högerkolumnen,
 * på mobil en kompakt rad ovanför brädet (se .status i index.css).
 */
export default function StatusCard({ state }: Props) {
  const handLeft = state.startHand.filter((h) => h.r == null).length;
  const blocksLeft =
    state.phase === "over"
      ? 0
      : Math.max(0, handLeft + (TOTAL_BLOCKS - state.bagIndex) + (state.jokerUsed ? 0 : 1));
  const modeLabel =
    state.mode === "daily" ? "Dagligt " + (state.dailyDate || "") : "Slumpmässigt";

  return (
    <div className="card status">
      <h2>Poäng</h2>
      <div className="scorebig">{state.score}</div>
      <div className="stats">
        <div className="statrow">
          <span>Antal ord</span>
          <b>{state.numWords}</b>
        </div>
        <div className="statrow">
          <span>Brickor kvar</span>
          <b>{blocksLeft}</b>
        </div>
        {/* Språk och läge väljs i startdialogen och behövs inte under spelets
            gång – de döljs på mobil för att statusraden ska rymmas. */}
        <div className="statrow secondary">
          <span>Språk</span>
          <b>{state.lang === "sv" ? "Svenska" : "Engelska"}</b>
        </div>
        <div className="statrow secondary">
          <span>Läge</span>
          <b>{modeLabel}</b>
        </div>
      </div>
    </div>
  );
}
