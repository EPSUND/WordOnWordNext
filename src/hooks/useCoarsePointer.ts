import { useEffect, useState } from "react";

const QUERY = "(pointer: coarse)";

/**
 * True när huvudpekdonet är ett finger (mobil/platta). Styr inmatningsidiom:
 * på touch finns ingen hovring, så "välj kolumn" + "släpp" måste bli ett tryck.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(
    () => typeof window !== "undefined" && window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setCoarse(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  return coarse;
}
