import type { Grid, HandTile } from "../types";
import { COLS, ROWS } from "./constants";

export const PAD = 8;

export function emptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => new Array<string | null>(COLS).fill(null));
}

/** Nedersta lediga raden i en kolumn (gravitation), eller -1 om kolumnen är full. */
export function landingRow(grid: Grid, col: number): number {
  for (let r = ROWS - 1; r >= 0; r--) if (!grid[r][col]) return r;
  return -1;
}

/** Hitta en spelbar kolumn om den valda är full. */
export function ensureColPlayable(grid: Grid, col: number): number {
  if (landingRow(grid, col) >= 0) return col;
  for (let c = 0; c < COLS; c++) if (landingRow(grid, c) >= 0) return c;
  return col;
}

/** Packa kvarvarande startbrickor i en kolumn mot botten (inga luckor). Muterar grid + hand. */
export function collapseColumn(grid: Grid, startHand: HandTile[], c: number): void {
  const inCol = startHand.filter((h) => h.c === c && h.r != null).sort((a, b) => a.r! - b.r!);
  inCol.forEach((h) => {
    grid[h.r!][c] = null;
  });
  let row = ROWS - 1;
  for (let i = inCol.length - 1; i >= 0; i--) {
    inCol[i].r = row;
    grid[row][c] = inCol[i].letter;
    row--;
  }
}

/** Pixelposition för en ruta givet brickstorlek. */
export function cellXY(r: number, c: number, tile: number): [number, number] {
  return [PAD + c * tile, PAD + r * tile];
}
