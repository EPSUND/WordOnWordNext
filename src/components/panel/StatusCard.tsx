import type { GameState } from "../../game/reducer";
import { useI18n } from "../../i18n/I18n";
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
  const { t } = useI18n();
  const handLeft = state.startHand.filter((h) => h.r == null).length;
  const blocksLeft =
    state.phase === "over"
      ? 0
      : Math.max(0, handLeft + (TOTAL_BLOCKS - state.bagIndex) + (state.jokerUsed ? 0 : 1));
  const modeLabel =
    state.mode === "daily" ? t.status.daily(state.dailyDate || "") : t.status.random;
  // Nästa-brickan visas här bara i mobilt stående läge (via .statusnext-media-
  // queryn); där flyttas den upp i statusraden ovanför dropzonen så att den inte
  // förväxlas med den aktiva brickan man släpper. På skrivbord/landskap ligger
  // den kvar i kontrollkortet och det här blocket är dolt.
  const showNext = state.phase === "play" || state.phase === "fall" || state.phase === "joker";

  return (
    <div className="card status">
      <h2>{t.status.score}</h2>
      <div className="scorebig">{state.score}</div>
      <div className="stats">
        <div className="statrow">
          <span>{t.status.numWords}</span>
          <b>{state.numWords}</b>
        </div>
        <div className="statrow">
          <span>{t.status.tilesLeft}</span>
          <b>{blocksLeft}</b>
        </div>
        {/* Språk och läge väljs i startdialogen och behövs inte under spelets
            gång – de döljs på mobil för att statusraden ska rymmas. Språket är
            spelets (ordlistan), inte gränssnittets. */}
        <div className="statrow secondary">
          <span>{t.status.language}</span>
          <b>{t.gameLangs[state.lang]}</b>
        </div>
        <div className="statrow secondary">
          <span>{t.status.mode}</span>
          <b>{modeLabel}</b>
        </div>
      </div>
      {showNext && (
        <div className="statusnext">
          <span className="nextcap">{t.status.next}</span>
          <div className="minitile">{state.nextLetter || "–"}</div>
        </div>
      )}
    </div>
  );
}
