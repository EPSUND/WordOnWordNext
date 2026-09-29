/** Vad som skulle hämtas eller sparas när ett anrop misslyckades. */
export type FetchWhat = "dict" | "scores" | "save";

/**
 * Nätverks- eller HTTP-fel mot ordlistan eller topplistan. Bär bara fakta
 * (vad + status) – texten som visas skapas i UI:t på gränssnittets språk
 * (se errorText i i18n/I18n.tsx). lib vet inget om vilket språk som visas.
 */
export class FetchFailed extends Error {
  constructor(
    readonly what: FetchWhat,
    /** HTTP-status, eller null om anropet aldrig nådde fram (fetch kastade). */
    readonly status: number | null,
  ) {
    super(`${what}: ${status == null ? "nätverksfel" : "HTTP " + status}`);
    this.name = "FetchFailed";
  }
}
