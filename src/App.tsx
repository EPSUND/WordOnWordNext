import { useState } from "react";
import { useGame } from "./hooks/useGame";
import { useTileSize } from "./hooks/useTileSize";
import { TOTAL_BLOCKS } from "./lib/engine/constants";
import type { GameMode } from "./lib/types";
import Header from "./components/Header";
import Board from "./components/Board";
import DropZone from "./components/DropZone";
import SidePanel from "./components/SidePanel";
import StartDialog from "./components/StartDialog";
import JokerDialog from "./components/JokerDialog";
import EndDialog from "./components/EndDialog";
import HighscoreDialog from "./components/HighscoreDialog";

export default function App() {
  const { state, start, starting, startError, actions } = useGame();
  const tile = useTileSize();
  const [startMode, setStartMode] = useState<GameMode>("random");
  const [hsOpen, setHsOpen] = useState(false);

  return (
    <>
      <Header onOpenHighscores={() => setHsOpen(true)} onNewGame={() => actions.reset()} />

      <div className="layout">
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
        <SidePanel state={state} onUseJoker={actions.useJoker} onFinishArrange={actions.finishArrange} />
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

      {state.phase === "over" && (
        <EndDialog
          score={state.score}
          numWords={state.numWords}
          bestWord={state.bestWord}
          lang={state.lang}
          mode={state.mode}
          dailyDate={state.dailyDate}
          onAgain={() => start(state.mode)}
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
