import { beforeAll, describe, expect, it } from "vitest";
import { loadRealDicts } from "../test/dictFixture";
import { COLS, INITIAL_BLOCKS, ROWS, TOTAL_BLOCKS } from "../lib/engine/constants";
import { type Action, type GameState, initialState, reducer } from "./reducer";

beforeAll(async () => {
  await loadRealDicts("sv", "en");
});

/** Kör en följd av actions från ett utgångsläge. */
const run = (s: GameState, ...actions: Action[]) => actions.reduce(reducer, s);

/** Påse där brickorna är förutsägbara: fem K först, sedan bara X. */
const bag = (...first: string[]) => {
  const b = [...first];
  while (b.length < TOTAL_BLOCKS) b.push("X");
  return b;
};

const started = (b = bag("K", "A", "T", "T", "X")) =>
  reducer(initialState, { type: "start", mode: "random", bag: b, dailyDate: null });

/** Placerar alla fem starthandsbrickor i varsin kolumn och går till play-fasen. */
function toPlay(s: GameState, cols = [0, 1, 2, 3, 4]) {
  let cur = s;
  for (const c of cols) cur = reducer(cur, { type: "arrangeClick", r: ROWS - 1, c });
  return reducer(cur, { type: "finishArrange" });
}

/** Släpper aktuell bricka i kolumn c och låter den landa. */
const dropIn = (s: GameState, c: number) =>
  run(s, { type: "setCol", c }, { type: "drop" }, { type: "landed" });

describe("start", () => {
  it("går till arrange med fem brickor i handen", () => {
    const s = started();
    expect(s.phase).toBe("arrange");
    expect(s.startHand).toHaveLength(INITIAL_BLOCKS);
    expect(s.startHand.every((h) => h.r === null && h.c === null)).toBe(true);
    expect(s.bagIndex).toBe(INITIAL_BLOCKS);
    expect(s.selHand).toBe(0);
  });

  it("behåller valt språk men nollställer poäng och rutnät", () => {
    const dirty = { ...initialState, lang: "en" as const, score: 99, numWords: 4 };
    const s = reducer(dirty, { type: "start", mode: "daily", bag: bag("A"), dailyDate: "2024-01-01" });
    expect(s.lang).toBe("en");
    expect(s.mode).toBe("daily");
    expect(s.dailyDate).toBe("2024-01-01");
    expect(s.score).toBe(0);
    expect(s.numWords).toBe(0);
    expect(s.grid.flat().every((x) => x === null)).toBe(true);
  });
});

describe("setLang", () => {
  it("går att byta språk i idle och over", () => {
    expect(reducer(initialState, { type: "setLang", lang: "en" }).lang).toBe("en");
    const over = { ...initialState, phase: "over" as const };
    expect(reducer(over, { type: "setLang", lang: "en" }).lang).toBe("en");
  });

  it("är låst mitt i ett spel", () => {
    for (const phase of ["arrange", "play", "fall", "joker"] as const) {
      const s = { ...initialState, phase };
      expect(reducer(s, { type: "setLang", lang: "en" })).toBe(s);
    }
  });
});

describe("arrangeClick", () => {
  it("lägger vald bricka på nedersta lediga rutan oavsett vilken rad man klickar på", () => {
    const s = reducer(started(), { type: "arrangeClick", r: 0, c: 2 });
    expect(s.grid[ROWS - 1][2]).toBe("K");
    expect(s.startHand[0]).toMatchObject({ r: ROWS - 1, c: 2 });
  });

  it("staplar flera brickor i samma kolumn och flyttar markeringen framåt", () => {
    // Andra klicket måste träffa en tom ruta i kolumnen – klick på en placerad
    // bricka plockar upp den i stället (se testet nedan).
    const s = run(
      started(),
      { type: "arrangeClick", r: ROWS - 1, c: 2 },
      { type: "arrangeClick", r: 0, c: 2 },
    );
    expect(s.grid[ROWS - 1][2]).toBe("K");
    expect(s.grid[ROWS - 2][2]).toBe("A");
    expect(s.selHand).toBe(2);
  });

  it("plockar upp en placerad bricka och låter kolumnen falla ihop utan luckor", () => {
    const placed = run(
      started(),
      { type: "arrangeClick", r: ROWS - 1, c: 2 },
      { type: "arrangeClick", r: 0, c: 2 },
    );
    // Plocka upp den nedre – den övre ska falla ner till botten.
    const s = reducer(placed, { type: "arrangeClick", r: ROWS - 1, c: 2 });
    expect(s.grid[ROWS - 1][2]).toBe("A");
    expect(s.grid[ROWS - 2][2]).toBeNull();
    expect(s.selHand).toBe(0); // den upplockade brickan blir vald
    expect(s.startHand[0].r).toBeNull();
  });

  it("räknar poäng löpande under arrangeringen, innan den bekräftats", () => {
    // K,A,T,T i kolumn 0..3 på nedersta raden → KATT. Orden listas först vid
    // finishArrange, men poängen ska synas direkt.
    let s = started();
    for (const c of [0, 1, 2, 3]) s = reducer(s, { type: "arrangeClick", r: ROWS - 1, c });
    expect(s.phase).toBe("arrange");
    expect(s.numWords).toBe(1);
    expect(s.score).toBe(s.rowWords[ROWS - 1][0].score);
    expect(s.rowWords[ROWS - 1][0].word).toBe("KATT");
  });

  it("ignorerar klick i en full kolumn", () => {
    let s = started(bag("A", "B", "C", "D", "E"));
    const full = { ...s, grid: s.grid.map((row) => row.map((_, c) => (c === 0 ? "X" : null))) };
    s = reducer(full, { type: "arrangeClick", r: 0, c: 0 });
    expect(s).toBe(full);
  });

  it("gör ingenting utanför arrange-fasen", () => {
    const s = { ...initialState, phase: "play" as const };
    expect(reducer(s, { type: "arrangeClick", r: 6, c: 0 })).toBe(s);
  });
});

describe("finishArrange", () => {
  it("vägrar så länge en bricka ligger kvar i handen", () => {
    const s = reducer(started(), { type: "arrangeClick", r: ROWS - 1, c: 0 });
    expect(reducer(s, { type: "finishArrange" })).toBe(s);
  });

  it("går till play och serverar bricka 6 ur påsen när alla fem är placerade", () => {
    const b = bag("K", "A", "T", "T", "X");
    const s = toPlay(started(b));
    expect(s.phase).toBe("play");
    expect(s.currentLetter).toBe(b[INITIAL_BLOCKS]);
    expect(s.bagIndex).toBe(INITIAL_BLOCKS + 1);
  });

  it("listar de ord som arrangeringen gav", () => {
    const s = toPlay(started(), [0, 1, 2, 3, 6]);
    expect(s.listedWords.map((w) => w.word)).toContain("KATT");
    expect(s.numWords).toBeGreaterThan(0);
  });
});

describe("setCol och drop", () => {
  it("klämmer kolumnindex till brädet", () => {
    const s = toPlay(started());
    expect(reducer(s, { type: "setCol", c: -3 }).currentCol).toBe(0);
    expect(reducer(s, { type: "setCol", c: 99 }).currentCol).toBe(COLS - 1);
  });

  it("startar fallet mot nedersta lediga rutan", () => {
    const s = reducer(toPlay(started()), { type: "setCol", c: 6 });
    const dropped = reducer(s, { type: "drop" });
    expect(dropped.phase).toBe("fall");
    expect(dropped.falling).toMatchObject({ col: 6, row: ROWS - 1, letter: s.currentLetter });
  });

  it("skakar i stället för att släppa när kolumnen är full", () => {
    const play = toPlay(started());
    const full = {
      ...play,
      grid: play.grid.map((row) => row.map((v, c) => (c === 6 ? "X" : v))),
    };
    const s = run(full, { type: "setCol", c: 6 }, { type: "drop" });
    expect(s.phase).toBe("play");
    expect(s.falling).toBeNull();
    expect(s.shake).toBe(full.shake + 1);
  });

  it("landed är idempotent – en andra dispatch utan falling ändrar inget", () => {
    const landed = dropIn(toPlay(started()), 6);
    expect(reducer(landed, { type: "landed" })).toBe(landed);
  });
});

describe("landed", () => {
  it("skriver brickan i rutnätet och serverar nästa", () => {
    const play = toPlay(started());
    const before = play.bagIndex;
    const s = dropIn(play, 6);
    expect(s.grid[ROWS - 1][6]).toBe(play.currentLetter);
    expect(s.lastLanded).toEqual([ROWS - 1, 6]);
    expect(s.phase).toBe("play");
    expect(s.bagIndex).toBe(before + 1);
    expect(s.soundThud).toBe(play.soundThud + 1);
  });

  it("muterar inte det tidigare rutnätet", () => {
    const play = toPlay(started());
    const snapshot = play.grid.map((r) => r.slice());
    dropIn(play, 6);
    expect(play.grid).toEqual(snapshot);
  });

  it("noterar nya ord och ger poäng när brickan bildar ett ord", () => {
    // S längst ner i kolumn 0, O ovanpå. Kolumnen läses uppifrån och ner → OS.
    const play = toPlay(started(bag("S", "A", "B", "C", "D", "O")), [0, 1, 2, 3, 4]);
    expect(play.currentLetter).toBe("O");
    const s = dropIn(play, 0);
    expect(s.listedWords.map((w) => w.word)).toContain("OS");
    expect(s.score).toBeGreaterThan(play.score);
    expect(s.soundPling).toBe(play.soundPling + 1);
    expect(s.floatCue).not.toBeNull();
  });

  it("listar inte om ett ord som redan fanns", () => {
    const play = toPlay(started(bag("S", "A", "B", "C", "D", "O")), [0, 1, 2, 3, 4]);
    const first = dropIn(play, 0);
    const second = dropIn(first, 6); // X långt bort, inget nytt ord
    expect(second.listedWords.filter((w) => w.word === "OS")).toHaveLength(1);
    expect(second.freshWordIds.size).toBe(0);
  });
});

describe("joker", () => {
  it("går att kalla på under play och backar bagIndex så brickan kommer igen", () => {
    const play = toPlay(started());
    const s = reducer(play, { type: "useJoker" });
    expect(s.phase).toBe("joker");
    expect(s.bagIndex).toBe(play.bagIndex - 1);
  });

  it("ger den valda bokstaven som aktuell bricka", () => {
    const s = run(toPlay(started()), { type: "useJoker" }, { type: "chooseJoker", letter: "Q" });
    expect(s.phase).toBe("play");
    expect(s.currentLetter).toBe("Q");
    expect(s.isJokerTile).toBe(true);
  });

  it("markerar jokern som förbrukad först när brickan landat", () => {
    const chosen = run(
      toPlay(started()),
      { type: "useJoker" },
      { type: "chooseJoker", letter: "Q" },
    );
    expect(chosen.jokerUsed).toBe(false);
    const s = dropIn(chosen, 6);
    expect(s.jokerUsed).toBe(true);
    expect(s.jokerPos).toEqual([ROWS - 1, 6]);
    expect(s.isJokerTile).toBe(false);
  });

  it("går inte att använda två gånger", () => {
    const used = { ...toPlay(started()), jokerUsed: true };
    expect(reducer(used, { type: "useJoker" })).toBe(used);
  });

  it("går inte att använda när jokerbrickan redan är i handen", () => {
    const s = { ...toPlay(started()), isJokerTile: true };
    expect(reducer(s, { type: "useJoker" })).toBe(s);
  });

  it("går inte att använda utanför play-fasen", () => {
    const s = { ...toPlay(started()), phase: "fall" as const };
    expect(reducer(s, { type: "useJoker" })).toBe(s);
  });
});

describe("spelets slut", () => {
  /** Spelar ut hela påsen genom att fördela brickorna över kolumnerna. */
  function playOut(s: GameState) {
    let cur = s;
    for (let i = 0; cur.phase === "play" && i < TOTAL_BLOCKS + 5; i++) {
      const col = [...Array(COLS).keys()].find(
        (c) => cur.grid.findIndex((row) => row[c] === null) >= 0,
      );
      if (col === undefined) break;
      cur = dropIn(cur, col);
    }
    return cur;
  }

  it("erbjuder slutjokern när påsen är slut och jokern är oanvänd", () => {
    const s = playOut(toPlay(started()));
    expect(s.bagIndex).toBe(TOTAL_BLOCKS);
    expect(s.phase).toBe("joker");
  });

  it("avslutar spelet när jokern är använd och påsen är slut", () => {
    let s = playOut(toPlay(started()));
    s = reducer(s, { type: "chooseJoker", letter: "A" });
    s = playOut(s);
    expect(s.phase).toBe("over");
  });

  it("sätter bestWord till det högst poängsatta ordet vid spelets slut", () => {
    let s = playOut(toPlay(started(bag("K", "A", "T", "T", "X"))));
    s = reducer(s, { type: "chooseJoker", letter: "A" });
    s = playOut(s);
    expect(s.phase).toBe("over");
    const best = [...s.listedWords].sort((a, b) => b.score - a.score)[0];
    if (best) expect(s.bestWord).toBe(best.word);
  });

  it("aviserar jokerbrickan som nästa bricka när påsen håller på att ta slut", () => {
    let s = toPlay(started());
    while (s.phase === "play" && s.bagIndex < TOTAL_BLOCKS) {
      const col = [...Array(COLS).keys()].find((c) => s.grid.findIndex((row) => row[c] === null) >= 0);
      if (col === undefined) break;
      s = dropIn(s, col);
      if (s.bagIndex === TOTAL_BLOCKS) expect(s.nextLetter).toBe("🃏");
    }
  });
});

describe("undo", () => {
  it("kan inte ångra innan ett drag har gjorts", () => {
    const play = toPlay(started());
    expect(play.undoSnapshot).toBeNull();
    expect(reducer(play, { type: "undo" })).toBe(play);
  });

  it("återställer play-läget precis före det senaste släppet", () => {
    // Distinkta brickor efter starthanden (bag[5]=O, bag[6]=S) så serveringen syns.
    const play = toPlay(started(bag("K", "A", "T", "T", "B", "O", "S")));
    const after = dropIn(play, 6);
    expect(after.grid[ROWS - 1][6]).toBe(play.currentLetter);
    expect(after.currentLetter).not.toBe(play.currentLetter); // ny bricka serverad

    const undone = reducer(after, { type: "undo" });
    expect(undone.phase).toBe("play");
    expect(undone.grid[ROWS - 1][6]).toBeNull(); // brickan borta från brädet
    expect(undone.currentLetter).toBe(play.currentLetter); // tillbaka i dropzonen
    expect(undone.nextLetter).toBe(play.nextLetter); // gamla nästa-brickan igen
    expect(undone.bagIndex).toBe(play.bagIndex);
    expect(undone.score).toBe(play.score);
    expect(undone.undoUsed).toBe(true);
    expect(undone.undoSnapshot).toBeNull();
  });

  it("återställer poäng och ordlista när det ångrade draget bildade ett ord", () => {
    const play = toPlay(started(bag("S", "A", "B", "C", "D", "O")), [0, 1, 2, 3, 4]);
    const after = dropIn(play, 0); // bildar OS
    expect(after.listedWords.map((w) => w.word)).toContain("OS");
    const undone = reducer(after, { type: "undo" });
    expect(undone.listedWords.map((w) => w.word)).not.toContain("OS");
    expect(undone.score).toBe(play.score);
    expect(undone.numWords).toBe(play.numWords);
  });

  it("går bara att ångra en gång per spelomgång", () => {
    const play = toPlay(started());
    const after = dropIn(play, 6);
    const undone = reducer(after, { type: "undo" });
    expect(undone.undoUsed).toBe(true);

    // Nästa släpp får inte spara någon ny ögonblicksbild.
    const next = dropIn(undone, 5);
    expect(next.undoSnapshot).toBeNull();
    expect(reducer(next, { type: "undo" })).toBe(next);
  });

  it("återutlöser inte ljud eller skak vid ångra", () => {
    const play = toPlay(started());
    const after = dropIn(play, 6);
    const undone = reducer(after, { type: "undo" });
    expect(undone.soundThud).toBe(after.soundThud);
    expect(undone.soundPling).toBe(after.soundPling);
    expect(undone.shake).toBe(after.shake);
  });

  it("gör ingenting utanför play-fasen", () => {
    const play = toPlay(started());
    const after = dropIn(play, 6);
    const falling = { ...after, phase: "fall" as const };
    expect(reducer(falling, { type: "undo" })).toBe(falling);
  });
});

describe("reset", () => {
  it("nollställer allt men behåller språk och läge", () => {
    const played = dropIn(toPlay(started()), 6);
    const s = reducer({ ...played, lang: "en" }, { type: "reset" });
    expect(s.phase).toBe("idle");
    expect(s.score).toBe(0);
    expect(s.listedWords).toEqual([]);
    expect(s.grid.flat().every((x) => x === null)).toBe(true);
    expect(s.lang).toBe("en");
    expect(s.mode).toBe(played.mode);
  });
});
