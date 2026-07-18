import type { GameState } from "../game/reducer";
import WordList from "./WordList";

interface Props {
  state: GameState;
}

/** Hittade ord. Sist i båda layouterna. */
export default function WordsCard({ state }: Props) {
  return (
    <div className="card words">
      <h2>Hittade ord</h2>
      <WordList state={state} />
    </div>
  );
}
