import { errorText, useI18n } from "../../i18n/I18n";
import type { GameMode, Lang } from "../../lib/types";
import Overlay from "./Overlay";

interface Props {
  lang: Lang;
  mode: GameMode;
  starting: boolean;
  /** Felet från senaste startförsöket (null = inget); görs till text här. */
  startError: unknown;
  onSetLang: (l: Lang) => void;
  onSetMode: (m: GameMode) => void;
  onStart: () => void;
  onCancel: () => void;
  onOpenHelp: () => void;
}

const muteH2: React.CSSProperties = {
  fontFamily: "system-ui",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: ".14em",
  color: "var(--muted)",
};

export default function StartDialog({
  lang,
  mode,
  starting,
  startError,
  onSetLang,
  onSetMode,
  onStart,
  onCancel,
  onOpenHelp,
}: Props) {
  const { t } = useI18n();
  return (
    <Overlay>
      <h2>{t.title.full}</h2>
      <p>
        {t.intro}{" "}
        <button className="linkbtn" onClick={onOpenHelp}>
          {t.howToPlay}
        </button>
      </p>

      <h2 style={muteH2}>{t.start.dictionary}</h2>
      <div className="langrow">
        <button className={lang === "sv" ? "sel" : ""} onClick={() => onSetLang("sv")}>
          {t.gameLangs.sv}
        </button>
        <button className={lang === "en" ? "sel" : ""} onClick={() => onSetLang("en")}>
          {t.gameLangs.en}
        </button>
      </div>

      <h2 style={{ ...muteH2, marginTop: 14 }}>{t.start.mode}</h2>
      <div className="langrow">
        <button className={mode === "random" ? "sel" : ""} onClick={() => onSetMode("random")}>
          {t.start.random}
        </button>
        <button className={mode === "daily" ? "sel" : ""} onClick={() => onSetMode("daily")}>
          {t.start.daily}
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" }}>
        {t.start.dailyNote}
      </p>

      {startError != null && <div className="hserror">{errorText(t, startError)}</div>}

      <div className="btnrow" style={{ marginTop: 18 }}>
        <button className="primary" style={{ flex: 1 }} disabled={starting} onClick={onStart}>
          {starting ? t.loading : t.start.startGame}
        </button>
        <button disabled={starting} onClick={onCancel}>
          {t.cancel}
        </button>
      </div>
    </Overlay>
  );
}
