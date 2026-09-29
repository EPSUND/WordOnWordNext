import type { Lang } from "../lib/types";

/* Svenska texter. Filen är facit för strukturen: en.tsx (och varje nytt språk)
   typas som Strings = typeof sv och måste ha exakt samma nycklar och
   signaturer. Rik text (fetstil, <kbd>) skrivs som JSX här i stället för att
   klistras ihop i komponenterna – ordföljden skiljer sig mellan språken. */

// På touch trycker man, med mus klickar man.
const verb = (coarse: boolean) => (coarse ? "tryck" : "klicka");
const Verb = (coarse: boolean) => (coarse ? "Tryck" : "Klicka");

export const sv = {
  /** Rubriken "ORD på ORD": ordet, det kursiverade bindeordet och hela namnet. */
  title: { word: "ORD", on: "på", full: "Ord på Ord" },
  close: "Stäng",
  cancel: "Avbryt",
  loading: "Laddar…",
  howToPlay: "Hur man spelar",
  highscores: "Topplista",
  language: "Språk",
  intro:
    "Släpp ner bokstavsbrickor och bilda så många och så långa ord som möjligt – vågrätt och lodrätt. Orden ligger kvar på brädet och kan byggas ut till längre ord.",
  /** Spelets språk (ordlistan) med namn på gränssnittets språk. */
  gameLangs: { sv: "Svenska", en: "Engelska" } satisfies Record<Lang, string>,

  header: {
    sound: "Ljud av/på",
    newGame: "Nytt spel",
  },

  welcome: {
    play: "Spela",
    /** Treställigt ord som korsar sig självt i mittenbokstaven (dekor). */
    cross: "ORD",
  },

  start: {
    dictionary: "Ordlista",
    mode: "Spelläge",
    random: "Slumpmässigt",
    daily: "Dagens brickor",
    dailyNote: "Dagens brickor är samma för alla som spelar samma dag – tävla på lika villkor.",
    startGame: "Starta spelet",
  },

  langDialog: {
    note: "Gäller spelets texter. Vilken ordlista du spelar med väljer du när du startar ett spel.",
  },

  status: {
    score: "Poäng",
    numWords: "Antal ord",
    tilesLeft: "Brickor kvar",
    language: "Språk",
    mode: "Läge",
    daily: (date: string) => "Dagligt " + date,
    random: "Slumpmässigt",
    next: "Nästa",
  },

  controls: {
    nextTile: "Nästa bricka",
    hintTouch:
      "Håll fingret på en kolumn – brickan ovanför brädet flyttar dit. Släpp för att lägga den.",
    hintMouse: (
      <>
        Flytta med <kbd>←</kbd>
        <kbd>→</kbd> eller musen.
        <br />
        Släpp med <kbd>␣</kbd>/<kbd>↓</kbd> eller klick.
      </>
    ),
    lastJokerWaiting: (coarse: boolean) =>
      `Slut på vanliga brickor – jokern är din sista bricka och måste läggas för att spelet ska ta slut. Hitta den bokstav som ger mest poäng och ${verb(coarse)} på “Använd joker”.`,
    lastJokerInHand: "Sista draget: lägg jokern där den ger mest poäng – sedan är spelet slut.",
    arrange: (coarse: boolean, left: number) =>
      `Placera dina 5 startbrickor: välj en bricka och ${verb(coarse)} i en kolumn – den faller till botten eller staplas (${left} kvar). ${Verb(coarse)} på en placerad bricka för att ta bort den.`,
    arranged: (coarse: boolean) =>
      `Alla 5 placerade – ${verb(coarse)} på en bricka för att flytta den, eller “Börja spela”.`,
    startPlaying: "Börja spela",
    useJoker: "Använd joker",
    undo: "Ångra drag",
    undosLeft: (n: number) => `${n} ångra kvar`,
    showResult: "Visa resultat",
  },

  words: {
    title: "Ord",
    /** Enhet efter poängen i ordlistan. */
    pts: "p",
  },

  joker: {
    titleLast: "Sista brickan – joker!",
    title: "Joker – välj bokstav",
    textLast:
      "Alla vanliga brickor är placerade. Välj vilken bokstav din joker ska vara – eller avbryt och titta på brädet en gång till.",
    text: "Välj vilken bokstav jokern ska vara. Den blir din nästa bricka.",
  },

  end: {
    title: "Spelet är slut!",
    points: "poäng",
    words: "ord",
    bestWord: "bästa ord",
    enterName: "Skriv ditt namn för topplistan:",
    namePlaceholder: "Ditt namn",
    save: "Spara",
    /** Sparas som namn i topplistan när fältet lämnas tomt. */
    anonymous: "Anonym",
    retry: "Försök igen.",
    dailyBoard: (date: string) => "Dagens topplista – " + date,
    playAgain: "Spela igen",
  },

  hs: {
    all: "Alla",
    best: "Rekord",
    daily: "Dagligt",
    search: "Sök",
    bestHint: "Bästa resultat per spelare.",
    searchPlaceholder: "Sök på namn…",
    searchLabel: "Sök på namn",
    chooseDay: "Välj dag",
    prevDay: "Föregående dag",
    nextDay: "Nästa dag",
    colName: "Namn",
    colScore: "Poäng",
    colBestWord: "Bästa ord",
    colMore: "Mer info",
    empty: "Inga resultat ännu.",
    wordCount: "Antal ord:",
    played: "Spelad:",
    firstPage: "Första sidan",
    prevPage: "Föregående sida",
    nextPage: "Nästa sida",
    lastPage: "Sista sidan",
    pageInfo: (from: number, to: number, total: number) => `${from}–${to} av ${total}`,
  },

  help: {
    title: "Så spelar du",
    steps: [
      <>
        Det börjar med att du får <b>5 startbrickor</b>. Placera dem i valfria kolumner – de faller
        till botten och kan staplas ovanpå varandra. Bilda så långa ord du kan och förbered för
        vidare spel.
      </>,
      <>
        Efter start faller resten av brickorna <b>en efter en</b>. Välj kolumn och släpp brickan där
        den gör mest nytta.
      </>,
      <>
        Bilda så många och så långa ord som möjligt. Längre ord ger betydligt mer poäng, så bygg
        gärna ut ord du redan lagt.
      </>,
    ],
    joker: (
      <>
        <b>Joker</b> – en bricka med valfri bokstav som du kan använda när du vill. Klicka på
        jokerknappen eller tryck <kbd>J</kbd> (på dator). Den går bara att använda en gång. Har du
        den kvar när andra brickor är slut är den ditt sista drag – du bestämmer själv när du öppnar
        jokerväljaren, och spelet tar slut när jokern är lagd.
      </>
    ),
    points: "Poäng",
    pointsText:
      "Varje bokstav har ett värde och när den används i ett ord får man dess poäng. Tillagt till det får man en längdbonus för ord – ju längre ord, desto större bonus.",
    moreScoring: "Mer info om poängsättning",
    dailyTitle: "Dagens brickor",
    dailyText: (
      <>
        I läget <b>Dagens brickor</b> får alla som spelar samma dag exakt samma brickor – tävla på
        lika villkor på topplistan.
      </>
    ),
    back: "← Tillbaka",
    scoringTitle: "Poängsättning",
    scoringIntro: (
      <>
        Ett ords poäng är summan av dess bokstavspoäng plus en <b>längdbonus</b>. Bonusen är{" "}
        <b>längden * längden − 1</b>, så den växer snabbt med längre ord.
      </>
    ),
    letterValues: "Bokstävernas värde",
    colPoints: "Poäng",
    colLetters: "Bokstäver",
    lengthBonus: "Längdbonus",
    colLength: "Ordlängd",
    colBonus: "Bonus",
    nLetters: (n: number) => `${n} bokstäver`,
    example: (
      <>
        Exempel: ett fyrabokstavsord där bokstäverna är värda 6 poäng ger 6 + 15 ={" "}
        <b>21 poäng</b>.
      </>
    ),
    singles: (letters: string[]) => (
      <>
        <b>Enbokstavsord</b> – {letters.join(" och ")} räknas som ord (utan längdbonus), men bara om
        bokstaven inte redan ingår i ett annat ord.
      </>
    ),
  },

  /** Fel från lib (FetchFailed). status null = nätverksfel. */
  errors: {
    dict: (status: number | null) =>
      status == null
        ? "Kunde inte ladda ordlistan (nätverksfel)."
        : `Kunde inte ladda ordlistan (${status}).`,
    scores: (status: number | null) =>
      status == null
        ? "Kunde inte nå topplistan (nätverksfel)."
        : `Topplistan svarade med fel (${status}).`,
    save: (status: number | null) =>
      status == null
        ? "Kunde inte spara poängen (nätverksfel)."
        : `Poängen kunde inte sparas (${status}).`,
    generic: "Något gick fel.",
  },
};

export type Strings = typeof sv;
