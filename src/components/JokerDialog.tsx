import type { Lang } from "../lib/types";
import { ALPHABET } from "../lib/engine/constants";
import Overlay from "./Overlay";

interface Props {
  forced: boolean;
  lang: Lang;
  onChoose: (letter: string) => void;
}

export default function JokerDialog({ forced, lang, onChoose }: Props) {
  return (
    <Overlay>
      <h2>{forced ? "Sista brickan – joker!" : "Joker – välj bokstav"}</h2>
      <p>
        {forced
          ? "Alla vanliga brickor är placerade. Välj vilken bokstav din joker ska vara:"
          : "Välj vilken bokstav jokern ska vara. Den blir din nästa bricka att släppa."}
      </p>
      <div className="jokergrid">
        {[...ALPHABET[lang]].map((ch) => (
          <button key={ch} onClick={() => onChoose(ch)}>
            {ch}
          </button>
        ))}
      </div>
    </Overlay>
  );
}
