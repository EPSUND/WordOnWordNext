import { useLayoutEffect, useState } from "react";

const FALLBACK = 56;

/**
 * Mäter --tile-size genom att stoppa in ett osynligt element med den bredden
 * och läsa av dess faktiska storlek.
 *
 * getComputedStyle på en oregistrerad custom property går INTE att använda här:
 * den returnerar tokensträngen ("min(12.2vw, ...)"), inte ett px-värde, så
 * parseFloat gav NaN så fort variabeln innehöll min()/calc(). Brickorna
 * positionerades då med 56px-avstånd i ett bräde som ritats för ~48px.
 */
function makeProbe(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.cssText =
    "position:absolute;top:0;left:0;height:0;visibility:hidden;pointer-events:none;width:var(--tile-size)";
  el.setAttribute("aria-hidden", "true");
  return el;
}

/** Aktuell brickstorlek i px (följer CSS-variabeln --tile-size). */
export function useTileSize(): number {
  const [t, setT] = useState(FALLBACK);

  // useLayoutEffect: mät före första målningen, annars syns en bildruta med
  // fallback-storleken (56px) innan mobilvärdet slår igenom.
  useLayoutEffect(() => {
    const probe = makeProbe();
    document.body.appendChild(probe);

    const read = () => {
      const w = probe.getBoundingClientRect().width;
      if (w > 0) setT(w);
    };
    read();

    // ResizeObserver fångar allt som ändrar värdet: rotation, fönsterstorlek
    // och dvh-ändringar när mobilens adressfält fälls in/ut (ingen resize då).
    const ro = new ResizeObserver(read);
    ro.observe(probe);
    window.addEventListener("resize", read);
    window.addEventListener("orientationchange", read);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", read);
      window.removeEventListener("orientationchange", read);
      probe.remove();
    };
  }, []);

  return t;
}
