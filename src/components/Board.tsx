import { useEffect, useRef, useState } from "react";
import type { GameState } from "../game/reducer";
import { COLS, ROWS, VALUES } from "../lib/engine/constants";
import { PAD, cellXY, landingRow } from "../lib/engine/grid";
import { useCoarsePointer } from "../hooks/useCoarsePointer";

interface Props {
  state: GameState;
  tile: number;
  onSetCol: (c: number) => void;
  onDrop: () => void;
  onArrangeClick: (r: number, c: number) => void;
  onLanded: () => void;
}

const pts = (lang: GameState["lang"], letter: string) => VALUES[lang][letter] || 0;

interface Float {
  id: number;
  r: number;
  c: number;
  pts: number;
}

export default function Board({ state, tile, onSetCol, onDrop, onArrangeClick, onLanded }: Props) {
  const { grid, lang, phase } = state;
  const coarse = useCoarsePointer();
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const lastFloat = useRef(-1);

  // Poäng-popup vid nya ord.
  useEffect(() => {
    const fc = state.floatCue;
    if (fc && fc.id !== lastFloat.current) {
      lastFloat.current = fc.id;
      const f: Float = { id: fc.id, r: fc.r, c: fc.c, pts: fc.pts };
      setFloats((list) => [...list, f]);
      const t = setTimeout(() => setFloats((list) => list.filter((x) => x.id !== f.id)), 1200);
      return () => clearTimeout(t);
    }
  }, [state.floatCue]);

  useEffect(() => {
    if (phase !== "arrange") setHover(null);
  }, [phase]);

  const t = tile;

  // Placerade brickor
  const tiles: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      const L = grid[r][c];
      if (!L) continue;
      const [x, y] = cellXY(r, c, t);
      const isJoker = !!state.jokerPos && state.jokerPos[0] === r && state.jokerPos[1] === c;
      const landed = !!state.lastLanded && state.lastLanded[0] === r && state.lastLanded[1] === c;
      const style = {
        transform: `translate(${x}px,${y}px)`,
        // land-animationen behöver positionen som variabler för att inte hoppa till hörnet
        ...(landed ? { "--tx": `${x}px`, "--ty": `${y}px` } : {}),
      } as React.CSSProperties;
      tiles.push(
        <div
          key={`t${r}-${c}`}
          className={"tile" + (isJoker ? " joker" : "") + (landed ? " landed" : "")}
          style={style}
        >
          {L}
          <span className="pts">{pts(lang, L)}</span>
        </div>,
      );
    }

  // Ordringar
  const rings: React.ReactNode[] = [];
  state.rowWords.forEach((list, r) =>
    list.forEach((w) => {
      const inset = 3;
      const [x, y] = cellXY(r, w.a, t);
      const key = `r${r}:${w.word}@${w.a}`;
      rings.push(
        <div
          key={key}
          className={"ring" + (state.newRingKeys.has(key) ? " new" : "")}
          style={{
            left: x + inset,
            top: y + inset,
            width: (w.b - w.a + 1) * t - 2 * inset,
            height: t - 2 * inset,
          }}
        />,
      );
    }),
  );
  state.colWords.forEach((list, c) =>
    list.forEach((w) => {
      const inset = 7;
      const [x, y] = cellXY(w.a, c, t);
      const key = `c${c}:${w.word}@${w.a}`;
      rings.push(
        <div
          key={key}
          className={"ring v" + (state.newRingKeys.has(key) ? " new" : "")}
          style={{
            left: x + inset,
            top: y + inset,
            width: t - 2 * inset,
            height: (w.b - w.a + 1) * t - 2 * inset,
          }}
        />,
      );
    }),
  );
  state.singleWords.forEach((w) => {
    const inset = 5;
    const [x, y] = cellXY(w.r, w.c, t);
    const key = `s:${w.r},${w.c}`;
    rings.push(
      <div
        key={key}
        className={"ring s" + (state.newRingKeys.has(key) ? " new" : "")}
        style={{ left: x + inset, top: y + inset, width: t - 2 * inset, height: t - 2 * inset }}
      />,
    );
  });

  // Spök-förhandsvisning (arrangeringsfasen)
  let ghost: React.ReactNode = null;
  if (phase === "arrange" && hover) {
    const idx = state.startHand.findIndex((h) => h.r === hover.r && h.c === hover.c);
    if (idx >= 0) {
      const [x, y] = cellXY(hover.r, hover.c, t);
      ghost = <div className="pickhi" style={{ left: x, top: y, width: t, height: t }} />;
    } else {
      const sel = state.selHand >= 0 ? state.startHand[state.selHand] : null;
      if (sel && sel.r == null) {
        const row = landingRow(grid, hover.c);
        if (row >= 0) {
          const [x, y] = cellXY(row, hover.c, t);
          ghost = (
            <div className="tile ghost" style={{ transform: `translate(${x}px,${y}px)` }}>
              {sel.letter}
              <span className="pts">{pts(lang, sel.letter)}</span>
            </div>
          );
        }
      }
    }
  }

  // Fallande bricka
  let falling: React.ReactNode = null;
  if (state.falling) {
    const f = state.falling;
    const fx = PAD + f.col * t;
    const fy0 = -(t + 14);
    const fy1 = PAD + f.row * t;
    const dur = 90 + (f.row + 1) * 42;
    falling = (
      <div
        key={`fall-${f.col}-${f.row}`}
        className={"tile dropfall" + (f.joker ? " joker" : "")}
        style={
          {
            "--fx": `${fx}px`,
            "--fy0": `${fy0}px`,
            "--fy1": `${fy1}px`,
            "--fdur": `${dur}ms`,
          } as React.CSSProperties
        }
        onAnimationEnd={onLanded}
      >
        {f.letter}
        <span className="pts">{pts(lang, f.letter)}</span>
      </div>
    );
  }

  // Klickytor
  const hits: React.ReactNode[] = [];
  if (phase === "play") {
    for (let c = 0; c < COLS; c++) {
      hits.push(
        <div
          key={`col${c}`}
          className="colhit"
          style={{ left: PAD + c * t }}
          // På touch finns ingen hovring: ett tryck väljer kolumn OCH släpper.
          // (Reducern kör actions i ordning, så drop ser den nya kolumnen.)
          onPointerMove={coarse ? undefined : () => onSetCol(c)}
          onClick={
            coarse
              ? () => {
                  onSetCol(c);
                  onDrop();
                }
              : () => (state.currentCol === c ? onDrop() : onSetCol(c))
          }
        />,
      );
    }
  } else if (phase === "arrange") {
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        const [x, y] = cellXY(r, c, t);
        hits.push(
          <div
            key={`cell${r}-${c}`}
            className="cellhit"
            style={{ left: x, top: y, width: t, height: t }}
            // Spökbrickan är en hover-effekt – på touch skulle den fastna
            // under fingret efter tryck, så den hoppas över där.
            onPointerEnter={coarse ? undefined : () => setHover({ r, c })}
            onPointerLeave={
              coarse ? undefined : () => setHover((h) => (h && h.r === r && h.c === c ? null : h))
            }
            onClick={() => onArrangeClick(r, c)}
          />,
        );
      }
  }

  return (
    <div className="board">
      <div className="gridlines" />
      {tiles}
      {rings}
      {ghost}
      {falling}
      {floats.map((f) => {
        const [x, y] = cellXY(f.r, f.c, t);
        return (
          <div key={`f${f.id}`} className="floatpts" style={{ left: x + 8, top: y - 4 }}>
            +{f.pts}
          </div>
        );
      })}
      {hits}
    </div>
  );
}
