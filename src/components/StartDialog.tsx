import type { GameMode, Lang } from "../lib/types";
import Overlay from "./Overlay";

interface Props {
  lang: Lang;
  mode: GameMode;
  starting: boolean;
  startError: string | null;
  onSetLang: (l: Lang) => void;
  onSetMode: (m: GameMode) => void;
  onStart: () => void;
  onOpenHighscores: () => void;
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
  onOpenHighscores,
}: Props) {
  return (
    <Overlay>
      <h2>Ord på Ord</h2>
      <p>
        Släpp ner bokstavsbrickor och bilda så många och så långa ord som möjligt – vågrätt och
        lodrätt. Orden ligger kvar på brädet och kan byggas ut till längre ord. Du börjar med att få
        alla 5 startbrickor på en gång och placera dem i valfria kolumner – de faller till botten
        och kan staplas ovanpå varandra. Därefter faller resten av brickorna en och en. Du har också
        en <b style={{ color: "#e8a29b" }}>joker</b> med valfri bokstav som du kan använda när du
        vill – klicka på jokerknappen eller tryck <kbd>J</kbd>. Sedan räknas slutpoängen.
      </p>

      <h2 style={muteH2}>Ordlista</h2>
      <div className="langrow">
        <button className={lang === "sv" ? "sel" : ""} onClick={() => onSetLang("sv")}>
          Svenska
        </button>
        <button className={lang === "en" ? "sel" : ""} onClick={() => onSetLang("en")}>
          Engelska
        </button>
      </div>

      <h2 style={{ ...muteH2, marginTop: 14 }}>Spelläge</h2>
      <div className="langrow">
        <button className={mode === "random" ? "sel" : ""} onClick={() => onSetMode("random")}>
          Slumpmässigt
        </button>
        <button className={mode === "daily" ? "sel" : ""} onClick={() => onSetMode("daily")}>
          Dagens brickor
        </button>
      </div>
      <p style={{ fontSize: 12.5, color: "var(--muted)", margin: "8px 0 0" }}>
        Dagens brickor är samma för alla som spelar samma dag – tävla på lika villkor.
      </p>

      {startError && <div className="hserror">{startError}</div>}

      <div className="btnrow" style={{ marginTop: 18 }}>
        <button className="primary" style={{ flex: 1 }} disabled={starting} onClick={onStart}>
          {starting ? "Laddar…" : "Starta spelet"}
        </button>
        <button onClick={onOpenHighscores}>🏆 Topplista</button>
      </div>
    </Overlay>
  );
}
