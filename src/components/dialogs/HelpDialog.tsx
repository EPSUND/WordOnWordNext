import { useState } from "react";
import type { Lang } from "../../lib/types";
import { SINGLES, VALUES } from "../../lib/engine/constants";
import Overlay from "./Overlay";
import "./HelpDialog.css";

interface Props {
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
  const [view, setView] = useState<"main" | "scoring">("main");

  if (view === "scoring") {
    const tiers = valueTiers(lang);
    const singles = [...SINGLES[lang]];
    return (
      <Overlay>
        <button className="linkbtn help-back" onClick={() => setView("main")}>
          ← Tillbaka
        </button>
        <h2>Poängsättning</h2>
        <p>
          Ett ords poäng är summan av dess bokstavspoäng plus en <b>längdbonus</b>. Bonusen är{" "}
          <b>längden * längden − 1</b>, så den växer snabbt med längre ord.
        </p>

        <h2 className="help-h">Bokstävernas värde</h2>
        <table className="help-table">
          <thead>
            <tr>
              <th>Poäng</th>
              <th>Bokstäver</th>
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

        <h2 className="help-h">Längdbonus</h2>
        <table className="help-table">
          <thead>
            <tr>
              <th>Ordlängd</th>
              <th>Bonus</th>
            </tr>
          </thead>
          <tbody>
            {[2, 3, 4, 5, 6, 7].map((n) => (
              <tr key={n}>
                <td className="val">{n} bokstäver</td>
                <td className="letters">+{n * n - 1}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{ marginTop: 14 }}>
          Exempel: ett fyrabokstavsord där bokstäverna är värda 6 poäng ger 6 + 15 ={" "}
          <b>21 poäng</b>.
        </p>

        <div className="help-joker">
          <b>Enbokstavsord</b> – {singles.join(" och ")} räknas som ord (utan längdbonus), men bara
          om bokstaven inte redan ingår i ett annat ord.
        </div>

        <div className="btnrow" style={{ marginTop: 18 }}>
          <button className="primary" style={{ flex: 1 }} onClick={onClose}>
            Stäng
          </button>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay>
      <h2>Så spelar du</h2>
      <p>
        Släpp ner bokstavsbrickor och bilda så många och så långa ord som möjligt – vågrätt och
        lodrätt. Orden ligger kvar på brädet och kan byggas ut till längre ord.
      </p>

      <ol className="help-steps">
        <li>
          <span className="num">1</span>
          <span className="txt">
            Det börjar med att du får <b>5 startbrickor</b>. Placera dem i valfria kolumner – de
            faller till botten och kan staplas ovanpå varandra. Bilda så långa ord du kan och
            förbered för vidare spel.
          </span>
        </li>
        <li>
          <span className="num">2</span>
          <span className="txt">
            Efter start faller resten av brickorna <b>en efter en</b>. Välj kolumn och släpp brickan
            där den gör mest nytta.
          </span>
        </li>
        <li>
          <span className="num">3</span>
          <span className="txt">
            Bilda så många och så långa ord som möjligt. Längre ord ger betydligt mer poäng, så bygg
            gärna ut ord du redan lagt.
          </span>
        </li>
      </ol>

      <div className="help-joker">
        <b>Joker</b> – en bricka med valfri bokstav som du kan använda när du vill. Klicka på
        jokerknappen eller tryck <kbd>J</kbd> (på dator). Den går bara att använda en gång.
      </div>

      <h2 className="help-h">Poäng</h2>
      <p>
        Varje bokstav har ett värde och när de används i ett ord får man dess poäng. Ovanpå det får
        man en längdbonus för ord – ju längre ord, desto större bonus.{" "}
        <button className="linkbtn" onClick={() => setView("scoring")}>
          Mer info om poängsättning
        </button>
      </p>

      <h2 className="help-h">Dagens brickor</h2>
      <p>
        I läget <b>Dagens brickor</b> får alla som spelar samma dag exakt samma brickor – tävla på
        lika villkor på topplistan.
      </p>

      <div className="btnrow" style={{ marginTop: 18 }}>
        <button className="primary" style={{ flex: 1 }} onClick={onClose}>
          Stäng
        </button>
      </div>
    </Overlay>
  );
}
