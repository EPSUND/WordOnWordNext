import { useEffect, useRef } from "react";
import type { GameState } from "../game/reducer";
import { COLS, VALUES } from "../lib/engine/constants";
import { PAD } from "../lib/engine/grid";

interface Props {
  state: GameState;
  tile: number;
  onSetCol: (c: number) => void;
  onDrop: () => void;
  onSelectHand: (i: number) => void;
}

const pts = (lang: GameState["lang"], letter: string) => VALUES[lang][letter] || 0;

export default function DropZone({ state, tile, onSetCol, onDrop, onSelectHand }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const shakeSeen = useRef(state.shake);
  const t = tile;

  useEffect(() => {
    if (state.shake === shakeSeen.current) return;
    shakeSeen.current = state.shake;
    ref.current?.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(-5px)" },
        { transform: "translateX(5px)" },
        { transform: "translateX(0)" },
      ],
      { duration: 180 },
    );
  }, [state.shake]);

  const showDrop = state.phase === "play" && state.currentLetter != null;

  return (
    <div className="dropzone" ref={ref}>
      {showDrop && (
        <div
          className={"tile" + (state.isJokerTile ? " joker" : "")}
          style={{ transform: `translate(${6 + state.currentCol * t}px,4px)` }}
        >
          {state.currentLetter}
          <span className="pts">{pts(state.lang, state.currentLetter!)}</span>
        </div>
      )}

      {state.phase === "arrange" &&
        state.startHand.map((h, i) =>
          h.r != null ? null : (
            <div
              key={`hand${i}`}
              className={"tile handtile" + (i === state.selHand ? " sel" : "")}
              style={{ transform: `translate(${6 + i * t}px,4px)` }}
              onClick={() => onSelectHand(i)}
            >
              {h.letter}
              <span className="pts">{pts(state.lang, h.letter)}</span>
            </div>
          ),
        )}

      {state.phase === "play" &&
        Array.from({ length: COLS }, (_, c) => (
          <div
            key={`dcol${c}`}
            className="colhit"
            style={{ left: PAD + c * t }}
            onPointerMove={() => onSetCol(c)}
            onClick={() => (state.currentCol === c ? onDrop() : onSetCol(c))}
          />
        ))}
    </div>
  );
}
