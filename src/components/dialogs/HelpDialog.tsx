import { useState } from "react";
import { useI18n } from "../../i18n/I18n";
import type { Lang } from "../../lib/types";
import { SINGLES, VALUES } from "../../lib/engine/constants";
import Overlay from "./Overlay";
import "./HelpDialog.css";

interface Props {
  /** Spelets språk: styr bokstavsvärdena och enbokstavsorden, inte texterna. */
  lang: Lang;
  onClose: () => void;
}

/** Bokstäverna grupperade efter poängvärde, stigande. */
function valueTiers(lang: Lang): [number, string[]][] {
  const byVal = new Map<number, string[]>();
  for (const [letter, v] of Object.entries(VALUES[lang])) {
    if (!byVal.has(v)) byVal.set(v, []);
    byVal.get(v)!.push(letter);
  }
  return [...byVal.entries()].sort((a, b) => a[0] - b[0]);
}

export default function HelpDialog({ lang, onClose }: Props) {
  const { t } = useI18n();
  const h = t.help;
  const [view, setView] = useState<"main" | "scoring">("main");

  if (view === "scoring") {
    const tiers = valueTiers(lang);
    const singles = [...SINGLES[lang]];
    return (
      <Overlay>
        <button className="linkbtn help-back" onClick={() => setView("main")}>
          {h.back}
        </button>
        <h2>{h.scoringTitle}</h2>
        <p>{h.scoringIntro}</p>

        <h2 className="help-h">{h.letterValues}</h2>
        <table className="help-table">
          <thead>
            <tr>
              <th>{h.colPoints}</th>
              <th>{h.colLetters}</th>
            </tr>
          </thead>
          <tbody>
            {tiers.map(([value, letters]) => (
              <tr key={value}>
                <td className="val">{value}</td>
                <td className="letters">{letters.join(" ")}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="help-h">{h.lengthBonus}</h2>
        <table className="help-table">
          <thead>
            <tr>
              <th>{h.colLength}</th>
              <th>{h.colBonus}</th>
            </tr>
          </thead>
          <tbody>
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <tr key={n}>
                <td className="val">{h.nLetters(n)}</td>
                <td className="letters">+{n * n - 1}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 14 }}>{h.example}</p>

        <div className="help-joker">{h.singles(singles)}</div>

        <div className="btnrow" style={{ marginTop: 18 }}>
          <button className="primary" style={{ flex: 1 }} onClick={onClose}>
            {t.close}
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <h2>{h.title}</h2>
      <p>{t.intro}</p>

      <ol className="help-steps">
        {h.steps.map((step, i) => (
          <li key={i}>
            <span className="num">{i + 1}</span>
            <span className="txt">{step}</span>
          </li>
        ))}
      </ol>

      <div className="help-joker">{h.joker}</div>

      <h2 className="help-h">{h.points}</h2>
      <p>
        {h.pointsText}{" "}
        <button className="linkbtn" onClick={() => setView("scoring")}>
          {h.moreScoring}
        </button>
      </p>

      <h2 className="help-h">{h.dailyTitle}</h2>
      <p>{h.dailyText}</p>

      <div className="btnrow" style={{ marginTop: 18 }}>
        <button className="primary" style={{ flex: 1 }} onClick={onClose}>
          {t.close}
        </button>
      </div>
    </Overlay>
  );
}
