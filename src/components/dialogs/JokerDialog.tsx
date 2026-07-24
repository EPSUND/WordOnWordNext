import type { Lang } from "../../lib/types";
import { ALPHABET } from "../../lib/engine/constants";
import Overlay from "./Overlay";
import "./JokerDialog.css";

interface Props {
  forced: boolean;
  lang: Lang;
  onChoose: (letter: string) => void;
  /** Undefined för den tvingade slutjokern (då finns inget att ångra). */
  onCancel?: () => void;
}

export default function JokerDialog({ forced, lang, onChoose, onCancel }: Props) {
  return (
    <Overlay>
      <h2>{forced ? "Sista brickan – joker!" : "Joker – välj bokstav"}</h2>
      <p>
        {forced
          ? "Alla vanliga brickor är placerade. Välj vilken bokstav din joker ska vara:"
          : "Välj vilken bokstav jokern ska vara. Den blir din nästa bricka."}
      </p>
      <div className="jokergrid">
        {[...ALPHABET[lang]].map((ch) => (
          <button key={ch} onClick={() => onChoose(ch)}>
            {ch}
          </button>
        ))}
      </div>
      {onCancel && (
        <div className="btnrow" style={{ marginTop: 12 }}>
          <button style={{ flex: 1 }} onClick={onCancel}>
            Avbryt
          </button>
        </div>
      )}
    </Overlay>
  );
}
