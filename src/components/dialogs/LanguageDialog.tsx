import { useI18n } from "../../i18n/I18n";
import { UI_LANGS, type UiLang } from "../../i18n/langs";
import Overlay from "./Overlay";
import "./LanguageDialog.css";

interface Props {
  onChoose: (lang: UiLang) => void;
  onClose: () => void;
}

/** Val av gränssnittets språk. Ett val gäller direkt och stänger dialogen. */
export default function LanguageDialog({ onChoose, onClose }: Props) {
  const { lang, t } = useI18n();
  return (
    <Overlay className="langdialog">
      <h2>{t.language}</h2>
      <div className="langrow langlist" role="group" aria-label={t.language}>
        {/* lang-attributet: skärmläsaren uttalar "English" på engelska även när
            resten av sidan är svensk. */}
        {UI_LANGS.map((l) => (
          <button
            key={l.code}
            lang={l.code}
            className={l.code === lang ? "sel" : ""}
            aria-pressed={l.code === lang}
            onClick={() => onChoose(l.code)}
          >
            {l.name}
          </button>
        ))}
      </div>
      <p className="langnote">{t.langDialog.note}</p>
      <div className="btnrow" style={{ marginTop: 16 }}>
        <button style={{ flex: 1 }} onClick={onClose}>
          {t.close}
        </button>
      </div>
    </Overlay>
  );
}
