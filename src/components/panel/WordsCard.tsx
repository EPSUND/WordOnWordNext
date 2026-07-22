import type { GameState } from "../../game/reducer";
import WordList from "./WordList";

interface Props {
  state: GameState;
}

/** De just nu poänggivande orden. Sist i båda layouterna. */
export default function WordsCard({ state }: Props) {
  return (
    <div className="card words">
      <h2>Ord</h2>
      <WordList state={state} />
    </div>
  );
}
