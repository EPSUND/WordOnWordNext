import type { GameState } from "../../game/reducer";
import { useCoarsePointer } from "../../hooks/useCoarsePointer";
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
  const coarse = useCoarsePointer();
  const handLeft = state.startHand.filter((h) => h.r == null).length;
  const nextTile = state.phase === "arrange" ? "–" : state.nextLetter || "–";

  const jokerHidden = state.jokerUsed;
  const jokerDisabled = !(
    state.phase === "play" &&
    !state.jokerUsed &&
    state.currentLetter != null &&
    !state.isJokerTile
  );

  // Ångra göms när det förbrukats; annars aktivt så snart ett drag finns att ångra.
  const undoHidden = state.undoUsed;
  const undoDisabled = !(state.phase === "play" && state.undoSnapshot != null);

  // Verbet skiljer sig: på touch trycker man, med mus klickar man.
  const verb = coarse ? "Tryck" : "Klicka";

  return (
    <div className="card controls">
      {/* Efter spelets slut är brädet kvar att titta på, men "nästa bricka"
          och spelinstruktionen är inte längre relevanta. På mobil döljs blocket
          även under arrangeringen: nästa-brickan och släpp-hjälpen gäller inte
          där (prepnote nedan förklarar arrangeringen i stället), och utan h2:n
          blir "–" + fel hjälptext bara förvirrande. */}
      {state.phase !== "over" && !(coarse && state.phase === "arrange") && (
        <>
          <h2>Nästa bricka</h2>
          <div className="nextwrap">
            {/* "Nästa"-etiketten visas bara på mobil, där h2:n ovan är dold –
                utan den förväxlas nästa-brickan med den aktiva i dropzonen. */}
            <div className="nextcol">
              <span className="nextcap">Nästa</span>
              <div className="minitile">{nextTile}</div>
            </div>
            <div className="hint">
              {coarse ? (
                "Håll fingret på en kolumn – brickan ovanför brädet flyttar dit. Släpp för att lägga den."
              ) : (
                <>
                  Flytta med <kbd>←</kbd>
                  <kbd>→</kbd> eller musen.
                  <br />
                  Släpp med <kbd>␣</kbd>/<kbd>↓</kbd> eller klick.
                </>
              )}
            </div>
          </div>
        </>
      )}
      {state.phase === "arrange" && (
        <div className="prepnote">
          {handLeft > 0
            ? `Placera dina 5 startbrickor: välj en bricka och ${verb.toLowerCase()} i en kolumn – den faller till botten eller staplas (${handLeft} kvar). ${verb} på en placerad bricka för att ta bort den.`
            : `Alla 5 placerade – ${verb.toLowerCase()} på en bricka för att flytta den, eller “Börja spela”.`}
        </div>
      )}
      {state.phase === "arrange" && (
        <button className="startbtn2" disabled={handLeft !== 0} onClick={onFinishArrange}>
          Börja spela ▶
        </button>
      )}
      {state.phase !== "over" && !jokerHidden && (
        <button className="jokerbtn" disabled={jokerDisabled} onClick={onUseJoker}>
          🃏 Använd joker {!coarse && <kbd>J</kbd>}
        </button>
      )}
      {state.phase !== "over" && !undoHidden && (
        <button className="undobtn" disabled={undoDisabled} onClick={onUndo}>
          ↩︎ Ångra drag {!coarse && <kbd>Z</kbd>}
        </button>
      )}
      {state.phase === "over" && onShowResult && (
        <button className="startbtn2" onClick={onShowResult}>
          Visa resultat
        </button>
      )}
    </div>
  );
}
