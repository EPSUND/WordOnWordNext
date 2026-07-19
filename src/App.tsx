import { useEffect, useState } from "react";
import { useGame } from "./hooks/useGame";
import { useTileSize } from "./hooks/useTileSize";
import { TOTAL_BLOCKS } from "./lib/engine/constants";
import type { GameMode } from "./lib/types";
import Header from "./components/Header";
import Board from "./components/Board";
import DropZone from "./components/DropZone";
import StatusCard from "./components/StatusCard";
import ControlsCard from "./components/ControlsCard";
import WordsCard from "./components/WordsCard";
import StartDialog from "./components/StartDialog";
import JokerDialog from "./components/JokerDialog";
import EndDialog from "./components/EndDialog";
import HighscoreDialog from "./components/HighscoreDialog";

export default function App() {
  const { state, start, starting, startError, actions } = useGame();
  const tile = useTileSize();
  const [startMode, setStartMode] = useState<GameMode>("random");
  const [hsOpen, setHsOpen] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [scoreSaved, setScoreSaved] = useState(false);

  // Nollställ slutdialogens tillstånd så fort ett nytt spel börjar. Täcker
  // alla vägar ut ur "over" (Spela igen, Nytt spel) på ett ställe.
  useEffect(() => {
    if (state.phase !== "over") {
      setEndClosed(false);
      setScoreSaved(false);
    }
  }, [state.phase]);

  return (
    <>
      <Header onOpenHighscores={() => setHsOpen(true)} onNewGame={() => actions.reset()} />

      {/* DOM-ordningen är mobilens läsordning; .layout är ett grid som flyttar
          korten till en högerkolumn på skrivbord (grid-template-areas). */}
      <div className="layout">
        <StatusCard state={state} />

        <div className="boardwrap">
          <DropZone
            state={state}
            tile={tile}
            onSetCol={actions.setCol}
            onDrop={actions.drop}
            onSelectHand={actions.selectHand}
          />
          <Board
            state={state}
            tile={tile}
            onSetCol={actions.setCol}
            onDrop={actions.drop}
            onArrangeClick={actions.arrangeClick}
            onLanded={actions.landed}
          />
        </div>

        <ControlsCard
          state={state}
          onUseJoker={actions.useJoker}
          onFinishArrange={actions.finishArrange}
          onShowResult={endClosed ? () => setEndClosed(false) : undefined}
        />
        <WordsCard state={state} />
      </div>

      {state.phase === "idle" && (
        <StartDialog
          lang={state.lang}
          mode={startMode}
          starting={starting}
          startError={startError}
          onSetLang={actions.setLang}
          onSetMode={setStartMode}
          onStart={() => start(startMode)}
          onOpenHighscores={() => setHsOpen(true)}
        />
      )}

      {state.phase === "joker" && (
        <JokerDialog
          forced={state.bagIndex >= TOTAL_BLOCKS}
          lang={state.lang}
          onChoose={actions.chooseJoker}
        />
      )}

      {state.phase === "over" && !endClosed && (
        <EndDialog
          score={state.score}
          numWords={state.numWords}
          bestWord={state.bestWord}
          lang={state.lang}
          mode={state.mode}
          dailyDate={state.dailyDate}
          onAgain={() => start(state.mode)}
          onClose={() => setEndClosed(true)}
          saved={scoreSaved}
          onSaved={() => setScoreSaved(true)}
        />
      )}

      {hsOpen && (
        <HighscoreDialog
          initialLang={state.lang}
          gameMode={state.mode}
          dailyDate={state.dailyDate}
          onClose={() => setHsOpen(false)}
        />
      )}
    </>
  );
}
