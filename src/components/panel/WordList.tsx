import type { GameState } from "../../game/reducer";
import { useI18n } from "../../i18n/I18n";
import "./WordList.css";

export default function WordList({ state }: { state: GameState }) {
  const { t } = useI18n();
  const sorted = [...state.listedWords].sort((a, b) => b.score - a.score);
  return (
    <ul id="wordlist">
      {sorted.map((w) => (
        <li key={w.id} className={state.freshWordIds.has(w.id) ? "new" : undefined}>
          <span>{w.word}</span>
          <span>
            {w.score} {t.words.pts}
          </span>
        </li>
      ))}
    </ul>
  );
}
