import type { CSSProperties } from "react";
import { useI18n } from "../i18n/I18n";
import { gameLangFor } from "../i18n/langs";
import { VALUES } from "../lib/engine/constants";
import Icon from "./icons/Icon";
import "./Welcome.css";

interface Props {
  onPlay: () => void;
  onOpenHighscores: () => void;
  onOpenHelp: () => void;
  onOpenLanguage: () => void;
}

/* Dekorativ minikorsning: ett treställigt ord vågrätt och samma ord lodrätt som
   möts i mittenbokstaven – en bild av spelets kärna (ord på ord). ORD × ORD på
   svenska, WOW (Word On Word) på engelska; se welcome.cross i i18n. Brickorna
   återanvänder .tile-stilen från Board och visar språkets bokstavsvärden.
   i = bokstavens plats i ordet; delay staplar nedsläppen. */
type Cell = { i: number; delay: number } | null;
const CROSS: Cell[] = [
  null, { i: 0, delay: 0.05 }, null,
  { i: 0, delay: 0.22 }, { i: 1, delay: 0.13 }, { i: 2, delay: 0.31 },
  null, { i: 2, delay: 0.27 }, null,
];

export default function Welcome({ onPlay, onOpenHighscores, onOpenHelp, onOpenLanguage }: Props) {
  const { lang, t } = useI18n();
  const values = VALUES[gameLangFor(lang)];
  return (
    <div className="welcome">
      <button
        className="welcome-lang"
        title={t.language}
        aria-label={t.language}
        onClick={onOpenLanguage}
      >
        <Icon name="globe" />
      </button>

      <div className="welcome-inner">
        <div className="wcross" aria-hidden="true">
          {CROSS.map((c, k) => {
            if (!c) return <span key={k} className="wcell" />;
            const letter = t.welcome.cross[c.i];
            return (
              <div key={k} className="tile" style={{ "--d": `${c.delay}s` } as CSSProperties}>
                {letter}
                <span className="pts">{values[letter]}</span>
              </div>
            );
          })}
        </div>

        <h1 className="welcome-title">
          {t.title.word} <span className="pa">{t.title.on}</span> {t.title.word}
        </h1>

        <div className="welcome-btns">
          <button className="primary welcome-play" onClick={onPlay}>
            {t.welcome.play}
          </button>
          <button onClick={onOpenHighscores}>
            <Icon name="trophy" className="btnicon lead" />
            {t.highscores}
          </button>
        </div>

        <button className="linkbtn welcome-help" onClick={onOpenHelp}>
          {t.howToPlay}
        </button>
      </div>
    </div>
  );
}
