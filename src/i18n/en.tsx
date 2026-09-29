import type { Strings } from "./sv";

/* Engelska texter. Samma struktur som sv.tsx (typen Strings) – saknas eller
   tillkommer en nyckel där slutar det här att kompilera. */

// På touch trycker man, med mus klickar man.
const verb = (coarse: boolean) => (coarse ? "tap" : "click");
const Verb = (coarse: boolean) => (coarse ? "Tap" : "Click");

export const en: Strings = {
  title: { word: "WORD", on: "on", full: "Word on Word" },
  close: "Close",
  cancel: "Cancel",
  loading: "Loading…",
  howToPlay: "How to play",
  highscores: "Leaderboard",
  language: "Language",
  intro:
    "Drop letter tiles and make as many words as you can – the longer the better – horizontally and vertically. Words stay on the board and can be extended into longer words.",
  gameLangs: { sv: "Swedish", en: "English" },

  header: {
    sound: "Sound on/off",
    newGame: "New game",
  },

  welcome: {
    play: "Play",
    // WOW = Word On Word. Scrabble-värdena W=4, O=1.
    cross: "WOW",
  },

  start: {
    dictionary: "Dictionary",
    mode: "Game mode",
    random: "Random",
    daily: "Daily tiles",
    dailyNote:
      "Daily tiles are the same for everyone who plays on the same day – compete on equal terms.",
    startGame: "Start game",
  },

  langDialog: {
    note: "Changes the game's texts. You choose which dictionary to play with when you start a game.",
  },

  status: {
    score: "Score",
    numWords: "Words",
    tilesLeft: "Tiles left",
    language: "Language",
    mode: "Mode",
    daily: (date: string) => "Daily " + date,
    random: "Random",
    next: "Next",
  },

  controls: {
    nextTile: "Next tile",
    hintTouch:
      "Hold your finger on a column – the tile above the board moves there. Lift your finger to drop it.",
    hintMouse: (
      <>
        Move with <kbd>←</kbd>
        <kbd>→</kbd> or the mouse.
        <br />
        Drop with <kbd>␣</kbd>/<kbd>↓</kbd> or a click.
      </>
    ),
    lastJokerWaiting: (coarse: boolean) =>
      `Out of regular tiles – the joker is your last tile and must be played for the game to end. Find the letter that scores the most and ${verb(coarse)} “Use joker”.`,
    lastJokerInHand: "Last move: place the joker where it scores the most – then the game is over.",
    arrange: (coarse: boolean, left: number) =>
      `Place your 5 starting tiles: pick a tile and ${verb(coarse)} a column – it falls to the bottom or stacks (${left} left). ${Verb(coarse)} a placed tile to remove it.`,
    arranged: (coarse: boolean) =>
      `All 5 placed – ${verb(coarse)} a tile to move it, or “Start playing”.`,
    startPlaying: "Start playing",
    useJoker: "Use joker",
    undo: "Undo move",
    undosLeft: (n: number) => `${n} ${n === 1 ? "undo" : "undos"} left`,
    showResult: "Show result",
  },

  words: {
    title: "Words",
    pts: "pts",
  },

  joker: {
    titleLast: "Last tile – joker!",
    title: "Joker – choose a letter",
    textLast:
      "All regular tiles have been placed. Choose which letter your joker will be – or cancel and take another look at the board.",
    text: "Choose which letter the joker will be. It becomes your next tile.",
  },

  end: {
    title: "Game over!",
    points: "points",
    words: "words",
    bestWord: "best word",
    enterName: "Enter your name for the leaderboard:",
    namePlaceholder: "Your name",
    save: "Save",
    anonymous: "Anonymous",
    retry: "Please try again.",
    dailyBoard: (date: string) => "Daily leaderboard – " + date,
    playAgain: "Play again",
  },

  hs: {
    all: "All",
    best: "Best",
    daily: "Daily",
    search: "Search",
    bestHint: "Each player's best result.",
    searchPlaceholder: "Search by name…",
    searchLabel: "Search by name",
    chooseDay: "Choose day",
    prevDay: "Previous day",
    nextDay: "Next day",
    colName: "Name",
    colScore: "Score",
    colBestWord: "Best word",
    colMore: "More info",
    empty: "No results yet.",
    wordCount: "Words:",
    played: "Played:",
    firstPage: "First page",
    prevPage: "Previous page",
    nextPage: "Next page",
    lastPage: "Last page",
    pageInfo: (from: number, to: number, total: number) => `${from}–${to} of ${total}`,
  },

  help: {
    title: "How to play",
    steps: [
      <>
        You start with <b>5 starting tiles</b>. Place them in any columns – they fall to the bottom
        and can be stacked on top of each other. Make the longest words you can and set yourself up
        for the rest of the game.
      </>,
      <>
        After that, the rest of the tiles fall <b>one at a time</b>. Choose a column and drop each
        tile where it does the most good.
      </>,
      <>
        Make as many words as you can, as long as you can. Longer words score much more, so extend
        the words you have already made.
      </>,
    ],
    joker: (
      <>
        <b>Joker</b> – a tile with any letter you like, which you can play whenever you want. Click
        the joker button or press <kbd>J</kbd> (on a computer). It can only be used once. If you
        still have it when the other tiles run out, it is your last move – you decide when to open
        the joker picker, and the game ends once the joker has been placed.
      </>
    ),
    points: "Points",
    pointsText:
      "Every letter has a value, and when it is part of a word you get its points. On top of that, words earn a length bonus – the longer the word, the bigger the bonus.",
    moreScoring: "More about scoring",
    dailyTitle: "Daily tiles",
    dailyText: (
      <>
        In <b>Daily tiles</b> mode everyone who plays on the same day gets exactly the same tiles –
        compete on equal terms on the leaderboard.
      </>
    ),
    back: "← Back",
    scoringTitle: "Scoring",
    scoringIntro: (
      <>
        A word's score is the sum of its letter points plus a <b>length bonus</b>. The bonus is{" "}
        <b>length * length − 1</b>, so it grows quickly for longer words.
      </>
    ),
    letterValues: "Letter values",
    colPoints: "Points",
    colLetters: "Letters",
    lengthBonus: "Length bonus",
    colLength: "Word length",
    colBonus: "Bonus",
    nLetters: (n: number) => `${n} letters`,
    example: (
      <>
        Example: a four-letter word whose letters are worth 6 points gives 6 + 15 ={" "}
        <b>21 points</b>.
      </>
    ),
    singles: (letters: string[]) => (
      <>
        <b>One-letter words</b> – {letters.join(" and ")} count as words (without a length bonus),
        but only if the letter is not already part of another word.
      </>
    ),
  },

  errors: {
    dict: (status: number | null) =>
      status == null
        ? "Couldn't load the dictionary (network error)."
        : `Couldn't load the dictionary (${status}).`,
    scores: (status: number | null) =>
      status == null
        ? "Couldn't reach the leaderboard (network error)."
        : `The leaderboard responded with an error (${status}).`,
    save: (status: number | null) =>
      status == null
        ? "Couldn't save the score (network error)."
        : `The score couldn't be saved (${status}).`,
    generic: "Something went wrong.",
  },
};
