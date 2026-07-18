import { useEffect, useRef, useState } from "react";
import type { GameMode, Lang, ScoreEntry } from "../lib/types";
import { loadDailyScores, loadScores } from "../lib/scores";
import { todayStr } from "../lib/engine/rng";
import HighscoreTable from "./HighscoreTable";
import Overlay from "./Overlay";

interface Props {
  initialLang: Lang;
  gameMode: GameMode;
  dailyDate: string | null;
  onClose: () => void;
}

type ViewMode = "all" | "daily";

export default function HighscoreDialog({ initialLang, gameMode, dailyDate, onClose }: Props) {
  const [viewLang, setViewLang] = useState<Lang>(initialLang);
  const [viewMode, setViewMode] = useState<ViewMode>(gameMode === "daily" ? "daily" : "all");
  const [viewDate, setViewDate] = useState<string>(dailyDate || todayStr());
  const [entries, setEntries] = useState<ScoreEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reqRef = useRef(0);

  useEffect(() => {
    const my = ++reqRef.current;
    setLoading(true);
    setError(null);
    const p: Promise<ScoreEntry[]> =
      viewMode === "daily"
        ? viewDate
          ? loadDailyScores(viewDate, viewLang)
          : Promise.resolve([])
        : loadScores().then((list) => list.filter((e) => e.lang === viewLang));
    p.then((list) => {
      if (my === reqRef.current) {
        setEntries(list);
        setLoading(false);
      }
    }).catch((e) => {
      if (my === reqRef.current) {
        setError(e instanceof Error ? e.message : "Fel");
        setEntries(null);
        setLoading(false);
      }
    });
  }, [viewLang, viewMode, viewDate]);

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
      </div>
      {viewMode === "daily" && (
        <div style={{ marginTop: 10 }}>
          <input
            type="date"
            value={viewDate}
            max={todayStr()}
            onChange={(e) => setViewDate(e.target.value)}
          />
        </div>
      )}

      <HighscoreTable entries={entries} loading={loading} error={error} />

      <div className="btnrow" style={{ marginTop: 16 }}>
        <button className="primary" style={{ flex: 1 }} onClick={onClose}>
          Stäng
        </button>
      </div>
    </Overlay>
  );
}
