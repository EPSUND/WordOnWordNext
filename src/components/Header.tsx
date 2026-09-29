import { useState } from "react";
import { useI18n } from "../i18n/I18n";
import { isSoundOn, toggleSound } from "../lib/sound";
import Icon from "./icons/Icon";
import "./Header.css";

interface Props {
  onOpenHighscores: () => void;
  onOpenHelp: () => void;
  onOpenLanguage: () => void;
  onNewGame: () => void;
}

export default function Header({ onOpenHighscores, onOpenHelp, onOpenLanguage, onNewGame }: Props) {
  const { t } = useI18n();
  const [on, setOn] = useState(isSoundOn());
  return (
    <header>
      <h1>
        {t.title.word} <span className="pa">{t.title.on}</span> {t.title.word}
      </h1>
      <div className="header-btns">
        {/* Allt utom Nytt spel är ikonknappar (.iconbtn) – fem knappar och
            rubriken ska rymmas på en rad även på engelska; se Header.css. */}
        <button
          className="iconbtn"
          title={t.howToPlay}
          aria-label={t.howToPlay}
          onClick={onOpenHelp}
        >
          <Icon name="help" />
        </button>
        <button
          className="iconbtn"
          title={t.header.sound}
          aria-label={t.header.sound}
          onClick={() => setOn(toggleSound())}
        >
          <Icon name={on ? "sound-on" : "sound-off"} />
        </button>
        <button
          className="iconbtn"
          title={t.language}
          aria-label={t.language}
          onClick={onOpenLanguage}
        >
          <Icon name="globe" />
        </button>
        <button
          className="iconbtn"
          title={t.highscores}
          aria-label={t.highscores}
          onClick={onOpenHighscores}
        >
          <Icon name="trophy" />
        </button>
        <button onClick={onNewGame}>{t.header.newGame}</button>
      </div>
    </header>
  );
}
