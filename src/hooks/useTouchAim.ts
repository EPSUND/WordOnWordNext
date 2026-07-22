import { useRef, type PointerEvent } from "react";
import { COLS } from "../lib/engine/constants";

/**
 * Touch-styrning för att sikta och släppa en bricka: håll fingret på en kolumn
 * (brickan i dropzonen hoppar dit), dra i sidled för att byta kolumn, släpp för
 * att lägga. Ett snabbt tryck blir ned+upp på samma kolumn = lägg direkt, precis
 * som förut. Speglar musens hover-sikte på skrivbord (se DropZone/Board), så att
 * den aktiva brickan syns röra sig innan man släpper – annars är det oklart
 * vilken bricka som faktiskt faller.
 *
 * Returnerar en fabrik: `aim(c)` ger pekar-handlers för kolumn c.
 */
export function useTouchAim(onSetCol: (c: number) => void, onDrop: () => void) {
  const aiming = useRef(false);

  return (c: number) => ({
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      // Fånga pekaren så move/up fortsätter komma hit även när fingret glider
      // utanför kolumnen c.
      e.currentTarget.setPointerCapture(e.pointerId);
      aiming.current = true;
      onSetCol(c);
    },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
      if (!aiming.current) return;
      // currentTarget är den fångade kolumnen c. Dess rect ger kolumnbredden och
      // var kolumn 0 börjar, så vi kan räkna ut vilken kolumn fingret är över.
      const r = e.currentTarget.getBoundingClientRect();
      const col0Left = r.left - c * r.width;
      const nc = Math.max(0, Math.min(COLS - 1, Math.floor((e.clientX - col0Left) / r.width)));
      onSetCol(nc);
    },
    onPointerUp: () => {
      if (!aiming.current) return;
      aiming.current = false;
      onDrop();
    },
    onPointerCancel: () => {
      // Systemet avbröt gesten (t.ex. inkommande samtal) – släpp inte brickan.
      aiming.current = false;
    },
  });
}
