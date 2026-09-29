import type { GameState } from "../../game/reducer";
import { useI18n } from "../../i18n/I18n";
import WordList from "./WordList";

interface Props {
  state: GameState;
}

/** De just nu poänggivande orden. Sist i båda layouterna. */
export default function WordsCard({ state }: Props) {
  const { t } = useI18n();
  return (
    <div className="card words">
      <h2>{t.words.title}</h2>
      <WordList state={state} />
    </div>
  );
}
