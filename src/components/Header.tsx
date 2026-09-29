import { useState } from "react";
import { isSoundOn, toggleSound } from "../lib/sound";
import Icon from "./icons/Icon";
import "./Header.css";

interface Props {
  onOpenHighscores: () => void;
  onOpenHelp: () => void;
  onNewGame: () => void;
}

export default function Header({ onOpenHighscores, onOpenHelp, onNewGame }: Props) {
  const [on, setOn] = useState(isSoundOn());
  return (
    <header>
      <h1>
        ORD <span className="pa">på</span> ORD
      </h1>
      <div className="header-btns">
        <button title="Hur man spelar" aria-label="Hur man spelar" onClick={onOpenHelp}>
          <Icon name="help" />
        </button>
        <button
          title="Ljud av/på"
          aria-label="Ljud av/på"
          onClick={() => setOn(toggleSound())}
        >
          <Icon name={on ? "sound-on" : "sound-off"} />
        </button>
        {/* aria-label: i liggande mobil döljs texten och knappen är bara pokalen. */}
        <button aria-label="Topplista" onClick={onOpenHighscores}>
          <Icon name="trophy" className="btnicon lead" />
          <span className="btnlabel">Topplista</span>
        </button>
        <button onClick={onNewGame}>Nytt spel</button>
      </div>
    </header>
  );
}
