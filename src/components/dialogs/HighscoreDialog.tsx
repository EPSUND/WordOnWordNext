import { useEffect, useRef, useState } from "react";
import type { GameMode, Lang, ScoreEntry } from "../../lib/types";
import { loadDailyScores, loadScoreRank, loadScores, loadScoresByName } from "../../lib/scores";
import { todayStr } from "../../lib/engine/rng";
import Icon from "../icons/Icon";
import HighscoreTable from "./HighscoreTable";
import Overlay from "./Overlay";
import "./HighscoreDialog.css";

/** Stega ett datum ("YYYY-MM-DD") ett antal dagar. Lokal tid, som todayStr. */
function shiftDate(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(y, m - 1, d + days);
  const p = (n: number) => String(n).padStart(2, "0");
  return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate());
}

interface Props {
  initialLang: Lang;
  gameMode: GameMode;
  dailyDate: string | null;
  onClose: () => void;
}

type ViewMode = "all" | "daily" | "search";

export default function HighscoreDialog({ initialLang, gameMode, dailyDate, onClose }: Props) {
  const [viewLang, setViewLang] = useState<Lang>(initialLang);
  const [viewMode, setViewMode] = useState<ViewMode>(gameMode === "daily" ? "daily" : "all");
  const [viewDate, setViewDate] = useState<string>(dailyDate || todayStr());
  // searchInput = det man skriver, searchTerm = det som faktiskt söktes (vid submit).
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [entries, setEntries] = useState<ScoreEntry[] | null>(null);
  // Global placering per poäng – bara i sökläget (annars är radens position placeringen).
  const [rankByScore, setRankByScore] = useState<Map<number, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    // I sökläget hämtar vi inget förrän man faktiskt sökt på ett namn.
    if (viewMode === "search" && !searchTerm) {
      reqRef.current++;
      setEntries(null);
      setRankByScore(null);
      setLoading(false);
      setError(null);
      return;
    }
    const my = ++reqRef.current;
    setLoading(true);
    setError(null);

    const run = async (): Promise<{
      list: ScoreEntry[];
      ranks: Map<number, number> | null;
    }> => {
      if (viewMode === "daily") {
        return { list: viewDate ? await loadDailyScores(viewDate, viewLang) : [], ranks: null };
      }
      if (viewMode === "search") {
        const list = await loadScoresByName(searchTerm, viewLang);
        // Slå upp den globala placeringen en gång per unik poäng.
        const uniqueScores = [...new Set(list.map((e) => e.score))];
        const rankList = await Promise.all(
          uniqueScores.map((s) => loadScoreRank(s, viewLang)),
        );
        const ranks = new Map<number, number>();
        uniqueScores.forEach((s, i) => ranks.set(s, rankList[i]));
        return { list, ranks };
      }
      return { list: await loadScores(viewLang), ranks: null };
    };

    run()
      .then(({ list, ranks }) => {
        if (my === reqRef.current) {
          setEntries(list);
          setRankByScore(ranks);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (my === reqRef.current) {
          setError(e instanceof Error ? e.message : "Fel");
          setEntries(null);
          setRankByScore(null);
          setLoading(false);
        }
      });
  }, [viewLang, viewMode, viewDate, searchTerm]);

  return (
    <Overlay>
      <h2>Topplista</h2>
      <div className="langrow">
        <button className={viewLang === "sv" ? "sel" : ""} onClick={() => setViewLang("sv")}>
          Svenska
        </button>
        <button className={viewLang === "en" ? "sel" : ""} onClick={() => setViewLang("en")}>
          Engelska
        </button>
      </div>
      <div className="langrow" style={{ marginTop: 8 }}>
        <button className={viewMode === "all" ? "sel" : ""} onClick={() => setViewMode("all")}>
          Alla
        </button>
        <button className={viewMode === "daily" ? "sel" : ""} onClick={() => setViewMode("daily")}>
          Dagligt
        </button>
        <button className={viewMode === "search" ? "sel" : ""} onClick={() => setViewMode("search")}>
          Sök
        </button>
      </div>
      {viewMode === "search" && (
        <form
          className="hssearchrow"
          onSubmit={(e) => {
            e.preventDefault();
            setSearchTerm(searchInput.trim());
          }}
        >
          <input
            type="text"
            value={searchInput}
            placeholder="Sök på namn…"
            aria-label="Sök på namn"
            autoFocus
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="primary" disabled={!searchInput.trim()}>
            Sök
          </button>
        </form>
      )}
      {viewMode === "daily" && (
        <div className="hsdaterow">
          <span className="hslabel">Välj dag</span>
          <div className="hsdatenav">
            <button
              onClick={() => setViewDate(shiftDate(viewDate, -1))}
              aria-label="Föregående dag"
            >
              <Icon name="prev" className="hsicon" />
            </button>
            <input
              type="date"
              value={viewDate}
              max={todayStr()}
              onChange={(e) => setViewDate(e.target.value)}
            />
            <button
              onClick={() => setViewDate(shiftDate(viewDate, 1))}
              disabled={viewDate >= todayStr()}
              aria-label="Nästa dag"
            >
              <Icon name="next" className="hsicon" />
            </button>
          </div>
        </div>
      )}

      <HighscoreTable
        entries={entries}
        loading={loading}
        error={error}
        rankByScore={rankByScore}
      />

      <div className="btnrow" style={{ marginTop: 16 }}>
        <button className="primary" style={{ flex: 1 }} onClick={onClose}>
          Stäng
        </button>
      </div>
    </Overlay>
  );
}
