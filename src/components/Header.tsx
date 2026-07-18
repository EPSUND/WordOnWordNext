import { useState } from "react";
import { isSoundOn, toggleSound } from "../lib/sound";

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
        <button title="Ljud av/på" onClick={() => setOn(toggleSound())}>
          {on ? "🔊" : "🔇"}
        </button>
        <button onClick={onOpenHighscores}>🏆 Topplista</button>
        <button onClick={onNewGame}>Nytt spel</button>
      </div>
    </header>
  );
}
