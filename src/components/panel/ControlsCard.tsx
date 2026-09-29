import { canUseJoker, jokerIsLastTile, type GameState } from "../../game/reducer";
import { TOTAL_BLOCKS } from "../../lib/engine/constants";
import { useCoarsePointer } from "../../hooks/useCoarsePointer";
import { useI18n } from "../../i18n/I18n";
import Icon from "../icons/Icon";
import "./ControlsCard.css";

interface Props {
  state: GameState;
  onUseJoker: () => void;
  onUndo: () => void;
  onFinishArrange: () => void;
  /** Sätts bara när slutdialogen har stängts, så resultatet går att ta fram igen. */
  onShowResult?: () => void;
}

/** Nästa bricka, hjälptext och spelknappar. På mobil direkt under brädet. */
export default function ControlsCard({
  state,
  onUseJoker,
  onUndo,
  onFinishArrange,
  onShowResult,
}: Props) {
  const { t } = useI18n();
  const c = t.controls;
  const coarse = useCoarsePointer();
  const handLeft = state.startHand.filter((h) => h.r == null).length;
  const nextTile = state.phase === "arrange" ? "–" : state.nextLetter || "–";

  const jokerHidden = state.jokerUsed;
  const jokerDisabled = !canUseJoker(state);

  // Sista draget: påsen är tom och jokern måste läggas för att spelet ska ta slut.
  // Väntar = dialogen är inte öppnad än (ingen bricka i dropzonen); i handen = bokstaven
  // är vald och brickan ligger kvar att placera.
  const lastJokerWaiting = jokerIsLastTile(state);
  const lastJokerInHand =
    state.phase === "play" && state.isJokerTile && state.bagIndex >= TOTAL_BLOCKS;

  // Ångra göms när alla användningar är förbrukade; annars aktivt så snart ett
  // oångrat drag finns att ta tillbaka (snapshoten nollas av ett undo, så samma
  // drag går inte att ångra två gånger). Antalet kvar visas på knappen.
  const undoHidden = state.undosLeft <= 0;
  const undoDisabled = !(state.phase === "play" && state.undoSnapshot != null);

  // Texterna som säger "klicka"/"tryck" tar coarse: på touch trycker man.
  return (
    <div className="card controls">
      {/* Efter spelets slut är brädet kvar att titta på, men "nästa bricka"
          och spelinstruktionen är inte längre relevanta. På mobil döljs blocket
          även under arrangeringen: nästa-brickan och släpp-hjälpen gäller inte
          där (prepnote nedan förklarar arrangeringen i stället), och utan h2:n
          blir "–" + fel hjälptext bara förvirrande. */}
      {state.phase !== "over" && !(coarse && state.phase === "arrange") && (
        <>
          <h2>{c.nextTile}</h2>
          <div className="nextwrap">
            {/* "Nästa"-etiketten visas bara på mobil, där h2:n ovan är dold –
                utan den förväxlas nästa-brickan med den aktiva i dropzonen. */}
            <div className="nextcol">
              <span className="nextcap">{t.status.next}</span>
              <div className="minitile">{nextTile}</div>
            </div>
            {/* Under sista draget finns ingen bricka att flytta – då ersätts
                hjälptexten av jokernotisen nedan. */}
            {!lastJokerWaiting && (
              <div className="hint">
                {coarse ? c.hintTouch : c.hintMouse}
              </div>
            )}
          </div>
        </>
      )}
      {(lastJokerWaiting || lastJokerInHand) && (
        <div className="prepnote">
          {lastJokerWaiting ? c.lastJokerWaiting(coarse) : c.lastJokerInHand}
        </div>
      )}
      {state.phase === "arrange" && (
        <div className="prepnote">
          {handLeft > 0 ? c.arrange(coarse, handLeft) : c.arranged(coarse)}
        </div>
      )}
      {state.phase === "arrange" && (
        <button className="startbtn2" disabled={handLeft !== 0} onClick={onFinishArrange}>
          {c.startPlaying}
          <Icon name="next" className="btnicon trail big" />
        </button>
      )}
      {state.phase !== "over" && !jokerHidden && (
        <button className="jokerbtn" disabled={jokerDisabled} onClick={onUseJoker}>
          🃏 {c.useJoker} {!coarse && <kbd>J</kbd>}
        </button>
      )}
      {state.phase !== "over" && !undoHidden && (
        <button className="undobtn" disabled={undoDisabled} onClick={onUndo}>
          <Icon name="undo" className="btnicon lead" />
          {c.undo}
          <span className="undoleft" title={c.undosLeft(state.undosLeft)}>
            {state.undosLeft}
          </span>
          {!coarse && <kbd>Z</kbd>}
        </button>
      )}
      {state.phase === "over" && onShowResult && (
        <button className="startbtn2" onClick={onShowResult}>
          {c.showResult}
        </button>
      )}
    </div>
  );
}
