import type { CSSProperties } from "react";
import Icon from "./icons/Icon";
import "./Welcome.css";

interface Props {
  onPlay: () => void;
  onOpenHighscores: () => void;
  onOpenHelp: () => void;
}

/* Dekorativ minikorsning: ORD vågrätt och ORD lodrätt som möts i R – en bild av
   spelets kärna (ord på ord). Brickorna återanvänder .tile-stilen från Board;
   värdena är Alfapet-värden (O=2, R=1, D=1). delay staplar nedsläppen. */
type Cell = { letter: string; val: number; delay: number } | null;
const CROSS: Cell[] = [
  null, { letter: "O", val: 2, delay: 0.05 }, null,
  { letter: "O", val: 2, delay: 0.22 }, { letter: "R", val: 1, delay: 0.13 }, { letter: "D", val: 1, delay: 0.31 },
  null, { letter: "D", val: 1, delay: 0.27 }, null,
];

export default function Welcome({ onPlay, onOpenHighscores, onOpenHelp }: Props) {
  return (
    <div className="welcome">
      <div className="welcome-inner">
        <div className="wcross" aria-hidden="true">
          {CROSS.map((c, i) =>
            c ? (
              <div key={i} className="tile" style={{ "--d": `${c.delay}s` } as CSSProperties}>
                {c.letter}
                <span className="pts">{c.val}</span>
              </div>
            ) : (
              <span key={i} className="wcell" />
            ),
          )}
        </div>

        <h1 className="welcome-title">
          ORD <span className="pa">på</span> ORD
        </h1>

        <div className="welcome-btns">
          <button className="primary welcome-play" onClick={onPlay}>
            Spela
          </button>
          <button onClick={onOpenHighscores}>
            <Icon name="trophy" className="btnicon lead" />
            Topplista
          </button>
        </div>

        <button className="linkbtn welcome-help" onClick={onOpenHelp}>
          Hur man spelar
        </button>
      </div>
    </div>
  );
}
