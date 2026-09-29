import { useI18n } from "../../i18n/I18n";
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
  const { t } = useI18n();
  return (
    <Overlay className="jokerdialog">
      <h2>{last ? t.joker.titleLast : t.joker.title}</h2>
      <p>{last ? t.joker.textLast : t.joker.text}</p>
      <div className="jokergrid">
        {[...ALPHABET[lang]].map((ch) => (
          <button key={ch} onClick={() => onChoose(ch)}>
            {ch}
          </button>
        ))}
      </div>
      <div className="btnrow" style={{ marginTop: 12 }}>
        <button style={{ flex: 1 }} onClick={onCancel}>
          {t.cancel}
        </button>
      </div>
    </Overlay>
  );
}
