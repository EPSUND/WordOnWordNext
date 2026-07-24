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
  // Nästa-brickan visas här bara i mobilt stående läge (via .statusnext-media-
  // queryn); där flyttas den upp i statusraden ovanför dropzonen så att den inte
  // förväxlas med den aktiva brickan man släpper. På skrivbord/landskap ligger
  // den kvar i kontrollkortet och det här blocket är dolt.
  const showNext = state.phase === "play" || state.phase === "fall" || state.phase === "joker";

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
      {showNext && (
        <div className="statusnext">
          <span className="nextcap">Nästa</span>
          <div className="minitile">{state.nextLetter || "–"}</div>
        </div>
      )}
    </div>
  );
}
