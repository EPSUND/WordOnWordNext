import { describe, expect, it } from "vitest";
import type { HandTile } from "../types";
import { COLS, ROWS } from "./constants";
import { PAD, cellXY, collapseColumn, emptyGrid, ensureColPlayable, landingRow } from "./grid";

/** Bygger ett rutnät ur rader uppifrån och ner; "." = tom ruta. */
function gridOf(...rows: string[]) {
  const g = emptyGrid();
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      if (ch !== ".") g[r][c] = ch;
    });
  });
  return g;
}

describe("emptyGrid", () => {
  it("är ROWS×COLS med bara null", () => {
    const g = emptyGrid();
    expect(g).toHaveLength(ROWS);
    expect(g.every((row) => row.length === COLS && row.every((x) => x === null))).toBe(true);
  });

  it("ger fristående rader (inte samma array delad)", () => {
    const g = emptyGrid();
    g[0][0] = "A";
    expect(g[1][0]).toBeNull();
  });
});

describe("landingRow", () => {
  it("ger nedersta raden i en tom kolumn", () => {
    expect(landingRow(emptyGrid(), 3)).toBe(ROWS - 1);
  });

  it("ger raden ovanför den översta bricka som ligger i kolumnen", () => {
    const g = emptyGrid();
    g[6][2] = "A";
    g[5][2] = "B";
    expect(landingRow(g, 2)).toBe(4);
  });

  it("ger -1 när kolumnen är full", () => {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++) g[r][1] = "A";
    expect(landingRow(g, 1)).toBe(-1);
  });

  it("hittar hålet om en kolumn (mot invarianten) har en lucka", () => {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++) g[r][0] = "A";
    g[3][0] = null;
    expect(landingRow(g, 0)).toBe(3);
  });
});

describe("ensureColPlayable", () => {
  it("behåller kolumnen om den går att spela i", () => {
    expect(ensureColPlayable(emptyGrid(), 5)).toBe(5);
  });

  it("byter till första spelbara kolumnen när den valda är full", () => {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++) {
      g[r][0] = "A";
      g[r][1] = "A";
      g[r][4] = "A";
    }
    expect(ensureColPlayable(g, 4)).toBe(2);
  });

  it("returnerar den valda kolumnen när hela brädet är fullt", () => {
    const g = emptyGrid();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) g[r][c] = "A";
    expect(ensureColPlayable(g, 6)).toBe(6);
  });
});

describe("collapseColumn", () => {
  const hand = (...tiles: [string, number | null, number | null][]): HandTile[] =>
    tiles.map(([letter, r, c]) => ({ letter, r, c }));

  it("packar brickorna mot botten utan luckor och behåller inbördes ordning", () => {
    // A på rad 6, C på rad 4 – lucka på rad 5 efter att B plockats upp.
    const g = gridOf(".......", ".......", ".......", ".......", "..C....", ".......", "..A....");
    const h = hand(["A", 6, 2], ["C", 4, 2]);
    collapseColumn(g, h, 2);

    expect(g[6][2]).toBe("A");
    expect(g[5][2]).toBe("C");
    expect(g[4][2]).toBeNull();
    expect(h.find((t) => t.letter === "A")!.r).toBe(6);
    expect(h.find((t) => t.letter === "C")!.r).toBe(5);
  });

  it("rör inte andra kolumner", () => {
    const g = emptyGrid();
    g[6][0] = "X";
    g[3][1] = "Y";
    const h = hand(["X", 6, 0], ["Y", 3, 1]);
    collapseColumn(g, h, 1);
    expect(g[6][0]).toBe("X");
    expect(g[6][1]).toBe("Y");
    expect(h[0].r).toBe(6);
  });

  it("är en no-op för en tom kolumn", () => {
    const g = emptyGrid();
    collapseColumn(g, [], 4);
    expect(g.every((row) => row[4] === null)).toBe(true);
  });

  it("ignorerar brickor i handen som ännu inte placerats", () => {
    const g = emptyGrid();
    g[6][3] = "A";
    const h = hand(["A", 6, 3], ["B", null, null]);
    collapseColumn(g, h, 3);
    expect(g[6][3]).toBe("A");
    expect(h[1].r).toBeNull();
  });
});

describe("cellXY", () => {
  it("lägger PAD-marginal och multiplicerar med brickstorleken", () => {
    expect(cellXY(0, 0, 40)).toEqual([PAD, PAD]);
    expect(cellXY(2, 3, 40)).toEqual([PAD + 120, PAD + 80]);
  });

  it("ger [x, y] – kolumnen styr x och raden y", () => {
    const [x, y] = cellXY(1, 5, 10);
    expect(x).toBe(PAD + 50);
    expect(y).toBe(PAD + 10);
  });
});
