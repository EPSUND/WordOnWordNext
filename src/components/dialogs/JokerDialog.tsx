import type { Lang } from "../../lib/types";
import { ALPHABET } from "../../lib/engine/constants";
import Overlay from "./Overlay";
import "./JokerDialog.css";

interface Props {
  /** Sant när påsen är tom och jokern är sista brickan. */
  last: boolean;
  lang: Lang;
  onChoose: (letter: string) => void;
  onCancel: () => void;
}

export default function JokerDialog({ last, lang, onChoose, onCancel }: Props) {
  return (
    <Overlay className="jokerdialog">
      <h2>{last ? "Sista brickan – joker!" : "Joker – välj bokstav"}</h2>
      <p>
        {last
          ? "Alla vanliga brickor är placerade. Välj vilken bokstav din joker ska vara – eller avbryt och titta på brädet en gång till."
          : "Välj vilken bokstav jokern ska vara. Den blir din nästa bricka."}
      </p>
      <div className="jokergrid">
        {[...ALPHABET[lang]].map((ch) => (
          <button key={ch} onClick={() => onChoose(ch)}>
            {ch}
          </button>
        ))}
      </div>
      <div className="btnrow" style={{ marginTop: 12 }}>
        <button style={{ flex: 1 }} onClick={onCancel}>
          Avbryt
        </button>
      </div>
    </Overlay>
  );
}
