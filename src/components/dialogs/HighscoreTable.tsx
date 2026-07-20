import type { ScoreEntry } from "../../lib/types";
import "./HighscoreTable.css";

interface Props {
  entries: ScoreEntry[] | null;
  loading: boolean;
  error: string | null;
  highlightIdx?: number | null;
}

const clean = (s: string) => s.replace(/[<>&]/g, "");

export default function HighscoreTable({ entries, loading, error, highlightIdx }: Props) {
  const top = (entries ?? []).slice().sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <table className="hstable">
      <tbody>
        <tr>
          <th>#</th>
          <th>Namn</th>
          <th>Ord</th>
          <th>Bästa ord</th>
          <th>Poäng</th>
        </tr>
        {loading && (
          <tr>
            <td colSpan={5} style={{ color: "var(--muted)" }}>
              Laddar…
            </td>
          </tr>
        )}
        {!loading && error && (
          <tr>
            <td colSpan={5} style={{ color: "var(--lingon)" }}>
              {error}
            </td>
          </tr>
        )}
        {!loading && !error && top.length === 0 && (
          <tr>
            <td colSpan={5} style={{ color: "var(--muted)" }}>
              Inga resultat ännu.
            </td>
          </tr>
        )}
        {!loading &&
          !error &&
          top.map((e, i) => (
            <tr key={i} className={i === highlightIdx ? "me" : undefined}>
              <td>{i + 1}</td>
              <td>{clean(e.name || "")}</td>
              <td>{e.words}</td>
              <td>{clean(e.bestWord || "–")}</td>
              <td>{e.score}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}
