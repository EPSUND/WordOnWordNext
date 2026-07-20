# Word on Word Next

A remake of my old word [game](https://github.com/EPSUND/WordOnWordApplet) using Claude and other
modern technology.

**Play it:** https://epsund.github.io/WordOnWordNext/

## How to play

You drop letter tiles onto a 7×7 board and build as many and as long words as possible.

- **Drop tiles** into a column; they fall to the bottom (like Connect Four). Move with the arrow
  keys or the mouse, drop with space / arrow-down or a click.
- **Words** (2+ letters, horizontal or vertical) stay on the board and can be extended into longer
  words as more tiles land.
- **Starting tiles:** you first place your own 5 starting tiles wherever you like (they obey the
  same gravity), then the rest of the tiles fall one at a time.
- **Joker:** you have one wildcard tile of any letter that you can play whenever you want (joker
  button or press `J`).
- The game ends when the board is full; then the final score is tallied.

### Scoring

- **Letter values** follow Alfapet (Swedish) / Scrabble (English).
- On top of that, each word gives a **word bonus of `length² − 1`**, so longer words are rewarded.
- Single-letter words (Å/Ö in Swedish, A/I in English) count once if not part of another word.

### Game modes

- **Random** – a fresh, random set of tiles each game.
- **Daily** – the same tiles for everyone who plays on a given day, so scores are comparable.

A **global highscore list** (via Supabase) can be filtered by language and by day.

## Tech stack

- **React 18 + TypeScript**, built with **Vite**.
- Deployed as a **static site to GitHub Pages** (via GitHub Actions).
- **Supabase** (REST) stores the global highscores. No custom backend.
- Word lists are plain text files loaded at runtime; the rest of the game is pure client-side.

## Project structure

```
src/
  lib/engine/      Pure game logic (no DOM): rng, bag, word search, grid, constants
  lib/             dict (word lists), scores (Supabase), sound, types
  game/reducer.ts  All game state as a pure reducer / state machine
  hooks/           useGame (glue + effects), useTileSize
  components/      UI, driven declaratively from state, grouped by function:
                     board/ (grid + tray), panel/ (side cards), dialogs/
public/            dict-sv.txt / dict-en.txt (word lists)
```

### Key components

- **`Board`** – the 7×7 grid: placed tiles, word rings, the falling tile, and the
  click/hover areas for dropping and arranging.
- **`DropZone`** – the tray above the board (the tile about to fall, or the 5 hand tiles while
  arranging).
- **`SidePanel`** – score, stats, next tile, the joker/arrange buttons, and the found-words list.
- **Dialogs** – `StartDialog` (language + mode), `JokerDialog`, `EndDialog` (save score) and
  `HighscoreDialog` (browse the leaderboard).
- **`game/reducer.ts`** – the heart of the game: every rule and phase transition lives here.

## Getting started

```
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run preview    # serve the production build locally
```

## Deployment

Pushing to `main` triggers a GitHub Actions workflow that builds the app and publishes `dist/` to
GitHub Pages. Pages is configured with **Source: GitHub Actions**.
