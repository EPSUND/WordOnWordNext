import { useEffect, useState } from "react";
import type { GameMode, Lang, ScoreEntry } from "../../lib/types";
import { loadForMode, submitScore } from "../../lib/scores";
import HighscoreTable from "./HighscoreTable";
import Overlay from "./Overlay";
import "./EndDialog.css";

interface Props {
  score: number;
  numWords: number;
  bestWord: string;
  lang: Lang;
  mode: GameMode;
  dailyDate: string | null;
  onAgain: () => void;
  onClose: () => void;
  /* saved ligger i App och inte här, eftersom dialogen kan stängas och öppnas
     igen – annars hade namnformuläret kommit tillbaka och man hade kunnat
     spara samma resultat till topplistan flera gånger. */
  saved: boolean;
  onSaved: () => void;
}

export default function EndDialog({
  score,
  numWords,
  bestWord,
  lang,
  mode,
  dailyDate,
  onAgain,
  onClose,
  saved,
  onSaved,
}: Props) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [entries, setEntries] = useState<ScoreEntry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    loadForMode(mode, dailyDate, lang)
      .then((list) => alive && (setEntries(list), setLoading(false)))
      .catch((e) => alive && (setError(e.message), setLoading(false)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = async () => {
    const finalName = name.trim().slice(0, 18) || "Anonym";
    setSaving(true);
    setSaveError(null);
    let newId: number | null = null;
    try {
      newId = await submitScore({ name: finalName, score, words: numWords, lang, bestWord, daily: mode === "daily" ? dailyDate : null });
    } catch (e) {
      setSaveError((e instanceof Error ? e.message : "Fel") + " Försök igen.");
      setSaving(false);
      return;
    }
    onSaved();
    try {
      const list = await loadForMode(mode, dailyDate, lang);
      const sorted = [...list].sort((a, b) => b.score - a.score);
      // Peka ut raden på id. Namn + poäng räcker inte: har man redan ett
      // resultat med samma poäng markerades den gamla raden (med fel bästa ord).
      // Utan id från servern tas den *senast sparade* av de matchande raderna.
      const idx =
        newId != null
          ? sorted.findIndex((e) => e.id === newId)
          : sorted.reduce(
              (best, e, i) =>
                e.score === score &&
                e.name === finalName &&
                (best < 0 || (e.created ?? "") > (sorted[best].created ?? ""))
                  ? i
                  : best,
              -1,
            );
      setEntries(list);
      setError(null);
      // Absolut placering (inte bara topp 10): tabellen bläddrar själv till
      // sidan med spelarens resultat och markerar raden.
      setHighlightIdx(idx >= 0 ? idx : null);
    } catch (e) {
      setEntries(null);
      setError(e instanceof Error ? e.message : "Fel");
    }
    setSaving(false);
  };

  const label = mode === "daily" ? "Dagens topplista – " + dailyDate : "Topplista";

  return (
    <Overlay>
      <h2>Spelet är slut!</h2>
      <div className="final">
        <div>
          <b>{score}</b>poäng
        </div>
        <div>
          <b>{numWords}</b>ord
        </div>
        <div>
          <b>{bestWord || "–"}</b>bästa ord
        </div>
      </div>

      {!saved && (
        <div>
          <p style={{ marginBottom: 6 }}>Skriv ditt namn för topplistan:</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              maxLength={18}
              placeholder="Ditt namn"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button className="primary" disabled={saving} onClick={onSave}>
              Spara
            </button>
          </div>
          {saveError && <div className="hserror">{saveError}</div>}
        </div>
      )}

      <div>
        <h2
          style={{
            fontFamily: "system-ui",
            fontSize: 12,
            textTransform: "uppercase",
            letterSpacing: ".14em",
            color: "var(--muted)",
            marginTop: 14,
          }}
        >
          {label}
        </h2>
        <HighscoreTable entries={entries} loading={loading} error={error} highlightIdx={highlightIdx} />
      </div>

      <div className="btnrow" style={{ marginTop: 16 }}>
        {/* Stäng låter spelaren se på det färdiga brädet i stället för att
            tvingas starta om direkt. Nytt spel startas från huvudvyn. */}
        <button style={{ flex: 1 }} onClick={onClose}>
          Stäng
        </button>
        <button className="primary" style={{ flex: 1 }} onClick={onAgain}>
          Spela igen
        </button>
      </div>
    </Overlay>
  );
}
