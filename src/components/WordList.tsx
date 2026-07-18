import type { GameState } from "../game/reducer";

export default function WordList({ state }: { state: GameState }) {
  const sorted = [...state.listedWords].sort((a, b) => b.score - a.score);
  return (
    <ul id="wordlist">
      {sorted.map((w) => (
        <li key={w.id} className={state.freshWordIds.has(w.id) ? "new" : undefined}>
          <span>{w.word}</span>
          <span>{w.score} p</span>
        </li>
      ))}
    </ul>
  );
}
