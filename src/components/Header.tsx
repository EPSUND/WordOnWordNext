import { useState } from "react";
import { isSoundOn, toggleSound } from "../lib/sound";
import Icon from "./icons/Icon";
import "./Header.css";

interface Props {
  onOpenHighscores: () => void;
  onNewGame: () => void;
}

export default function Header({ onOpenHighscores, onNewGame }: Props) {
  const [on, setOn] = useState(isSoundOn());
  return (
    <header>
      <h1>
        ORD <span className="pa">på</span> ORD
      </h1>
      <div className="header-btns">
        <button
          title="Ljud av/på"
          aria-label="Ljud av/på"
          onClick={() => setOn(toggleSound())}
        >
          <Icon name={on ? "sound-on" : "sound-off"} />
        </button>
        <button onClick={onOpenHighscores}>
          <Icon name="trophy" className="btnicon lead" />
          Topplista
        </button>
        <button onClick={onNewGame}>Nytt spel</button>
      </div>
    </header>
  );
}
