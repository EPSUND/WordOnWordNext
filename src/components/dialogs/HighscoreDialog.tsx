import { useEffect, useRef, useState } from "react";
import { errorText, useI18n } from "../../i18n/I18n";
import type { GameMode, Lang, ScoreEntry } from "../../lib/types";
import {
  loadBestPlayerScores,
  loadDailyScores,
  loadScoreRank,
  loadScores,
  loadScoresByName,
} from "../../lib/scores";
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

type ViewMode = "all" | "best" | "daily" | "search";

export default function HighscoreDialog({ initialLang, gameMode, dailyDate, onClose }: Props) {
  const { t } = useI18n();
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
  // Felet sparas som det är och blir text vid renderingen (errorText).
  const [error, setError] = useState<unknown>(null);
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
      if (viewMode === "best") {
        return { list: await loadBestPlayerScores(viewLang), ranks: null };
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
          setError(e);
          setEntries(null);
          setRankByScore(null);
          setLoading(false);
        }
      });
  }, [viewLang, viewMode, viewDate, searchTerm]);

  return (
    <Overlay>
      <h2>{t.highscores}</h2>
      <div className="langrow">
        <button className={viewLang === "sv" ? "sel" : ""} onClick={() => setViewLang("sv")}>
          {t.gameLangs.sv}
        </button>
        <button className={viewLang === "en" ? "sel" : ""} onClick={() => setViewLang("en")}>
          {t.gameLangs.en}
        </button>
      </div>
      <div className="langrow hsmoderow" style={{ marginTop: 8 }}>
        <button className={viewMode === "all" ? "sel" : ""} onClick={() => setViewMode("all")}>
          {t.hs.all}
        </button>
        <button className={viewMode === "best" ? "sel" : ""} onClick={() => setViewMode("best")}>
          {t.hs.best}
        </button>
        <button className={viewMode === "daily" ? "sel" : ""} onClick={() => setViewMode("daily")}>
          {t.hs.daily}
        </button>
        <button className={viewMode === "search" ? "sel" : ""} onClick={() => setViewMode("search")}>
          {t.hs.search}
        </button>
      </div>
      {viewMode === "best" && <p className="hshint">{t.hs.bestHint}</p>}
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
            placeholder={t.hs.searchPlaceholder}
            aria-label={t.hs.searchLabel}
            autoFocus
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="primary" disabled={!searchInput.trim()}>
            {t.hs.search}
          </button>
        </form>
      )}
      {viewMode === "daily" && (
        <div className="hsdaterow">
          <span className="hslabel">{t.hs.chooseDay}</span>
          <div className="hsdatenav">
            <button
              onClick={() => setViewDate(shiftDate(viewDate, -1))}
              aria-label={t.hs.prevDay}
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
              aria-label={t.hs.nextDay}
            >
              <Icon name="next" className="hsicon" />
            </button>
          </div>
        </div>
      )}

      <HighscoreTable
        entries={entries}
        loading={loading}
        error={error != null ? errorText(t, error) : null}
        rankByScore={rankByScore}
      />

      <div className="btnrow" style={{ marginTop: 16 }}>
        <button className="primary" style={{ flex: 1 }} onClick={onClose}>
          {t.close}
        </button>
      </div>
    </Overlay>
  );
}
