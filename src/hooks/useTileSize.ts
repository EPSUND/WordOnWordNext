import { useEffect, useState } from "react";

function readTile(): number {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--tile-size");
  const n = parseFloat(v);
  return Number.isNaN(n) ? 56 : n;
}

/** Aktuell brickstorlek i px (följer CSS-variabeln --tile-size, uppdateras vid resize). */
export function useTileSize(): number {
  const [t, setT] = useState(readTile);
  useEffect(() => {
    const on = () => setT(readTile());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return t;
}
