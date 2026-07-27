import Overlay from "./Overlay";
import "./HelpDialog.css";

interface Props {
  onClose: () => void;
}

export default function HelpDialog({ onClose }: Props) {
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
            Det börjar med att du får <b>5 startbrickor</b>. 
            Placera dem i valfria kolumner – de faller till botten och kan staplas ovanpå varandra. Bilda så långa ord du kan och förbered för vidare spel.
          </span>
        </li>
        <li>
          <span className="num">2</span>
          <span className="txt">
            Efter start faller resten av brickorna <b>en efter en</b>. 
            Välj kolumn och släpp brickan där den gör mest nytta.
          </span>
        </li>
        <li>
          <span className="num">3</span>
          <span className="txt">
            Bilda så många och så långa ord som möjligt. 
            Längre ord ger betydligt mer poäng, så bygg gärna ut ord du redan lagt.
          </span>
        </li>
      </ol>

      <div className="help-joker">
        <b>Joker</b> – en bricka med valfri bokstav som du kan använda när du vill. Klicka på
        jokerknappen eller tryck <kbd>J</kbd> (på dator). Den går bara att använda en gång.
      </div>

      <h2 className="help-h">Poäng</h2>
      <p>
        Varje bokstav har ett värde och när de används i ett ord får man dess poäng. Ovanpå det får man en längdbonus för ord – ju längre ord,
        desto större bonus.
      </p>

      <h2 className="help-h">Dagens brickor</h2>
      <p>
        I läget <b>Dagens brickor</b> får alla som spelar samma dag exakt samma brickor – tävla
        på lika villkor på topplistan.
      </p>

      <div className="btnrow" style={{ marginTop: 18 }}>
        <button className="primary" style={{ flex: 1 }} onClick={onClose}>
          Stäng
        </button>
      </div>
    </Overlay>
  );
}
