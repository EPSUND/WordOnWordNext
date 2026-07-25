import { useEffect, useState } from "react";
import type { ScoreEntry } from "../../lib/types";
import Icon from "../icons/Icon";
import "./HighscoreTable.css";

interface Props {
  entries: ScoreEntry[] | null;
  loading: boolean;
  error: string | null;
  highlightIdx?: number | null;
}

const PAGE_SIZE = 10;
const clean = (s: string) => s.replace(/[<>&]/g, "");

export default function HighscoreTable({ entries, loading, error, highlightIdx }: Props) {
  const sorted = (entries ?? []).slice().sort((a, b) => b.score - a.score);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  const [page, setPage] = useState(0);

  // Nollställ till första sidan när listan byts (t.ex. språk/läge/datum).
  useEffect(() => {
    setPage(0);
  }, [entries]);

  // Hoppa till sidan med spelarens eget resultat när placeringen blir känd.
  // Deklareras efter nollställnings-effekten så att den vinner när båda körs
  // samtidigt (t.ex. efter att ett resultat sparats laddas listan om och
  // highlightIdx sätts i samma render).
  useEffect(() => {
    if (highlightIdx != null && highlightIdx >= 0) {
      setPage(Math.floor(highlightIdx / PAGE_SIZE));
    }
  }, [highlightIdx]);

  // Håll sidan inom giltigt intervall även om listan krympt sedan senast.
  const curPage = Math.min(page, pageCount - 1);
  const start = curPage * PAGE_SIZE;
  const visible = sorted.slice(start, start + PAGE_SIZE);

  return (
    <>
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
          {!loading && !error && sorted.length === 0 && (
            <tr>
              <td colSpan={5} style={{ color: "var(--muted)" }}>
                Inga resultat ännu.
              </td>
            </tr>
          )}
          {!loading &&
            !error &&
            visible.map((e, i) => {
              const rank = start + i;
              return (
                <tr key={rank} className={rank === highlightIdx ? "me" : undefined}>
                  <td>{rank + 1}</td>
                  <td>{clean(e.name || "")}</td>
                  <td>{e.words}</td>
                  <td>{clean(e.bestWord || "–")}</td>
                  <td>{e.score}</td>
                </tr>
              );
            })}
        </tbody>
      </table>

      {!loading && !error && sorted.length > PAGE_SIZE && (
        <div className="hspager">
          <button
            onClick={() => setPage(0)}
            disabled={curPage === 0}
            aria-label="Första sidan"
          >
            <Icon name="first" className="hsicon" />
          </button>
          <button
            onClick={() => setPage(curPage - 1)}
            disabled={curPage === 0}
            aria-label="Föregående sida"
          >
            <Icon name="prev" className="hsicon" />
          </button>
          <span className="hspageinfo">
            {start + 1}–{Math.min(start + PAGE_SIZE, sorted.length)} av {sorted.length}
          </span>
          <button
            onClick={() => setPage(curPage + 1)}
            disabled={curPage >= pageCount - 1}
            aria-label="Nästa sida"
          >
            <Icon name="next" className="hsicon" />
          </button>
          <button
            onClick={() => setPage(pageCount - 1)}
            disabled={curPage >= pageCount - 1}
            aria-label="Sista sidan"
          >
            <Icon name="last" className="hsicon" />
          </button>
        </div>
      )}
    </>
  );
}
