import { useEffect, useState } from "react";
import { useGame } from "./hooks/useGame";
import { useTileSize } from "./hooks/useTileSize";
import type { GameMode, Lang } from "./lib/types";
import { useI18n } from "./i18n/I18n";
import { gameLangFor } from "./i18n/langs";
import Header from "./components/Header";
import Welcome from "./components/Welcome";
import Board from "./components/board/Board";
import DropZone from "./components/board/DropZone";
import StatusCard from "./components/panel/StatusCard";
import ControlsCard from "./components/panel/ControlsCard";
import WordsCard from "./components/panel/WordsCard";
import StartDialog from "./components/dialogs/StartDialog";
import JokerDialog from "./components/dialogs/JokerDialog";
import EndDialog from "./components/dialogs/EndDialog";
import HighscoreDialog from "./components/dialogs/HighscoreDialog";
import HelpDialog from "./components/dialogs/HelpDialog";
import LanguageDialog from "./components/dialogs/LanguageDialog";

export default function App() {
  // StartDialog styrs av en egen flagga, INTE av spel-phase: "Nytt spel" ska
  // kunna öppnas ovanpå ett pågående spel utan att rensa dess state. Först
  // "Starta spelet" (onStart nedan) nollställer och bygger ett nytt spel.
  const [startOpen, setStartOpen] = useState(false);
  const [hsOpen, setHsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  // Spelets tangenter pausas medan en av de här dialogerna ligger över brädet –
  // annars släppte t.ex. mellanslag en bricka bakom Hjälp. Jokerdialogen styrs
  // av phase och hanteras i game/keys.ts; slutdialogen likaså (phase over).
  const { state, start, starting, startError, actions } = useGame(
    startOpen || hsOpen || helpOpen || langOpen,
  );
  const { lang: uiLang, setLang: setUiLang } = useI18n();
  const tile = useTileSize();
  // Startdialogens val gäller NÄSTA spel. De är skilda från state.lang/state.mode,
  // som hör till det pågående (eller avslutade) spelet och bara sätts av start –
  // annars kunde ett språkbyte + Avbryt skriva om ett avslutat spel.
  const [startMode, setStartMode] = useState<GameMode>("random");
  // Förvalt: ordlistan som hör till gränssnittets språk (se LanguageDialog nedan).
  const [startLang, setStartLang] = useState<Lang>(() => gameLangFor(uiLang));
  // Innan något spel startats finns bara startdialogens val att visa i Hjälp och
  // Topplista; därefter spelets språk.
  const shownLang = state.phase === "idle" ? startLang : state.lang;
  // Välkomstsidan är bakgrund vid första besöket. Den blir false först när ett
  // spel faktiskt startas – då kommer man aldrig tillbaka hit under sessionen.
  // Så länge den är true är det den man återgår till om StartDialog avbryts.
  const [welcome, setWelcome] = useState(true);
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
      <Header
        onOpenHighscores={() => setHsOpen(true)}
        onOpenHelp={() => setHelpOpen(true)}
        onOpenLanguage={() => setLangOpen(true)}
        onNewGame={() => setStartOpen(true)}
      />

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
          onUndo={actions.undo}
          onFinishArrange={actions.finishArrange}
          onShowResult={endClosed ? () => setEndClosed(false) : undefined}
        />
        <WordsCard state={state} />
      </div>

      {welcome && (
        <Welcome
          onPlay={() => setStartOpen(true)}
          onOpenHighscores={() => setHsOpen(true)}
          onOpenHelp={() => setHelpOpen(true)}
          onOpenLanguage={() => setLangOpen(true)}
        />
      )}

      {startOpen && (
        <StartDialog
          lang={startLang}
          mode={startMode}
          starting={starting}
          startError={startError}
          onSetLang={setStartLang}
          onSetMode={setStartMode}
          onStart={async () => {
            // Nollställ och bygg spelet först här. Vid lyckad start lämnar vi
            // både dialogen och välkomstsidan; vid fel stannar dialogen kvar
            // (startError visas). Avbryt (onCancel) återgår i stället orört:
            // till välkomstsidan om den ligger kvar, annars till pågående spel.
            const ok = await start(startMode, startLang);
            if (ok) {
              setStartOpen(false);
              setWelcome(false);
            }
          }}
          onCancel={() => setStartOpen(false)}
          onOpenHelp={() => setHelpOpen(true)}
        />
      )}

      {state.phase === "joker" && (
        // Ingen serverad bricka ⇒ påsen är tom och jokern är sista draget. Dialogen
        // går att stänga även då (spelaren öppnade den själv – se ControlsCard).
        <JokerDialog
          last={state.currentLetter == null}
          lang={state.lang}
          onChoose={actions.chooseJoker}
          onCancel={actions.cancelJoker}
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
          onAgain={() => start(state.mode, state.lang)}
          onClose={() => setEndClosed(true)}
          saved={scoreSaved}
          onSaved={() => setScoreSaved(true)}
        />
      )}

      {hsOpen && (
        <HighscoreDialog
          initialLang={shownLang}
          gameMode={state.mode}
          dailyDate={state.dailyDate}
          onClose={() => setHsOpen(false)}
        />
      )}

      {/* Öppnad från startdialogen visar hjälpen värdena för språket man väljer. */}
      {helpOpen && (
        <HelpDialog lang={startOpen ? startLang : shownLang} onClose={() => setHelpOpen(false)} />
      )}

      {langOpen && (
        <LanguageDialog
          onChoose={(l) => {
            // Byter bara texterna. Ett pågående eller avslutat spel behåller sin
            // ordlista (state.lang); det som ändras är förvalet för NÄSTA spel,
            // och det syns och går att ändra i startdialogen.
            if (l !== uiLang) {
              setUiLang(l);
              setStartLang(gameLangFor(l));
            }
            setLangOpen(false);
          }}
          onClose={() => setLangOpen(false)}
        />
      )}
    </>
  );
}
