# CLAUDE.md — Ord på Ord

Vägledning för AI-agenter (och människor) som arbetar i det här repot. Håll den kort och
högsignal – den läses in varje session.

## 1. Projektöversikt

"Ord på Ord" är ett ordspel för svenska och engelska, baserat på spelmekaniken i
[EPSUND/WordOnWordApplet](https://github.com/EPSUND/WordOnWordApplet).

- 7×7-bräde. Brickor släpps ner i en kolumn och faller till botten (Connect-4-gravitation).
- Ord (≥2 bokstäver, vågrätt/lodrätt) ligger kvar och kan byggas ut till längre ord.
- **Joker**: en bricka med valfri bokstav, kan användas en gång och när som helst.
- Man **arrangerar själv sina 5 startbrickor** innan resten faller en och en.
- **Dagligt läge**: samma brickor för alla som spelar samma dag (tävla på lika villkor).
- **Global topplista** via Supabase, filtrerbar per språk och per dag.

Live: https://epsund.github.io/WordOnWordNext/

## 2. Teknisk stack

- **React 18 + TypeScript + Vite**, byggs till en statisk sajt på **GitHub Pages**.
- **Supabase** (REST) för topplistan. Inget eget backend.
- Migreringsnot: repot porterades från en enda `index.html`. Den gamla versionen ligger kvar
  i `legacy/index.html` som referens – React-versionen är den aktiva.

## 3. Kommandon

```
npm install          # installera beroenden
npm run dev          # dev-server med HMR (Vite)
npm run build        # tsc -b && vite build → dist/
npm run typecheck    # bara TypeScript, ingen emit
npm run preview      # servera dist/ lokalt (under rätt base-path)
```

## 4. Kodkarta (var saker bor)

```
src/lib/engine/     Ren spellogik, ingen DOM:
  constants.ts        COLS/ROWS=7, TOTAL_BLOCKS=48, INITIAL_BLOCKS=5, FREQ, VALUES, SINGLES, VOWELS, ALPHABET
  rng.ts              todayStr, hashSeed, mulberry32  (determinism – se §7)
  bag.ts              sampleLetter, makeBag (tar lang + rng)
  words.ts            wordScore, isValidWord, bestWordsInLine (DP), scanLine, computeSingles, scoreAndCount
  grid.ts             landingRow, collapseColumn, ensureColPlayable, cellXY, PAD
src/lib/            dict.ts (fetch + cache), scores.ts (Supabase), sound.ts (WebAudio), types.ts
src/game/reducer.ts Hela speltillståndet som en REN reducer (state + actions)
src/hooks/          useGame.ts (reducer-glue, ljud/tangentbord/async start), useTileSize.ts
src/components/     Header, Board, DropZone, SidePanel, WordList, Overlay,
                    StartDialog, JokerDialog, EndDialog, HighscoreDialog, HighscoreTable
src/index.css       All global CSS (porterad från originalet)
public/dict-*.txt   Ordlistor, ett ord per rad (hämtas i runtime)
.github/workflows/  deploy.yml (Actions → Pages)
legacy/index.html   Gamla enfils-versionen (referens)
```

## 5. Arkitektur & dataflöde

- **Reducern (`src/game/reducer.ts`) äger allt speltillstånd** och är ren. Bricksekvensen
  (påsen) genereras i `useGame.start` och skickas in via `start`-action så reducern förblir ren.
- Komponenterna renderar **deklarativt från state**. Sidoeffekter (ljud, tangentbord, async
  ordlisteladdning, Supabase-anrop) ligger i `useGame` och i dialog-komponenterna.
- Faser: `idle → arrange → play → fall → joker → over`. Overlays visas utifrån `phase`.
- Transienta effekter drivs av räknare/objekt i state: `soundThud`, `soundPling`, `shake`,
  `floatCue`, `newRingKeys`, `freshWordIds`, `lastLanded`.
- Den fallande brickan animeras med CSS (`@keyframes fallto`); `onAnimationEnd` → `landed`-action
  (reducern är idempotent mot dubbel-dispatch via `if(!falling)`).

## 6. Speldomän / regler

- **Poäng** (`words.ts` → `wordScore`): bokstavsvärden = **Alfapet** (sv) / **Scrabble** (en),
  se `VALUES`. Ovanpå det en **ordpoäng = `längd² − 1`** (0 för enbokstavsord) som belönar långa ord.
- Bästa uppsättningen icke-överlappande ord per linje väljs med **DP** (`bestWordsInLine`).
- **Enbokstavsord**: Å/Ö (sv) resp. A/I (en) räknas en gång, bara om bokstaven inte täcks av
  ett annat ord.
- **Arrangeringsfasen**: klick placerar vald bricka på nedersta lediga ruta i kolumnen; klick på
  placerad bricka plockar upp den och kolumnen faller ihop (inga luckor).

## 7. Kritiska invarianter / fallgropar (läs innan du ändrar)

- **DETERMINISM.** Dagligt läge seedar `mulberry32(hashSeed("wow-daily-" + datum))` och drar
  bokstäver ur `FREQ` i **insättningsordning**. `rng.ts`, `bag.ts`, `FREQ`-nyckelordningen och
  seed-strängen måste förbli **byte-identiska** – annars ändras dagens brickor och redan sparade
  dagliga topplistor blir ojämförbara. (Verifierat: React-motorn ger samma påse som legacy.)
- **Base-path.** `vite.config.ts` har `base: '/WordOnWordNext/'` (projektsajt, inte roten). Alla
  runtime-hämtningar (ordlistor) går via `import.meta.env.BASE_URL`. Fel bas = blank sida på Pages.
- **Supabase-nyckeln** (`SUPA_KEY` i `scores.ts`) är en *publicerbar* nyckel och ligger avsiktligt
  i klienten. Åtkomsten styrs av Row Level Security: **läs + lägg till, inte ändra/radera**.
- **Topplistan kastar fel** vid nätverks-/API-fel (ingen tyst fallback) – felen visas i dialogerna.
- **React StrictMode** (dev) dubbelkör effekter → ljud/nätverk kan ske två gånger i `npm run dev`.
  Det sker inte i bygget.

## 8. Externa tjänster – Supabase

- URL: `https://vvspqfbvxuimxcbyyahw.supabase.co`, tabell **`wow_scores`**.
- Kolumner: `id, name, score, word_count, language, best_word, daily_game_date, created_at`.
- REST-anropen (i `src/lib/scores.ts`) läser med alias:
  `select=name,score,words:word_count,lang:language,bestWord:best_word,daily:daily_game_date`.
- RLS: anon får `SELECT` och `INSERT`; `DELETE`/`UPDATE` är blockerat.
- `daily_game_date` sätts (YYYY-MM-DD) för dagliga spel, annars `null`.

## 9. Deploy

- **GitHub Actions → Pages.** `.github/workflows/deploy.yml` bygger och deployar `dist/` vid push
  till `main`.
- Engångsinställning i GitHub: **Settings ▸ Pages ▸ Source ▸ GitHub Actions**.
- Nuvarande arbete sker på grenen `feature/react`; cutover = merge till `main` + byt Pages-källan.

## 10. Konventioner

- **Svenska** i UI-text och kodkommentarer.
- TypeScript `strict` (inkl. `noUnusedLocals`/`noUnusedParameters`).
- **Trogen port**: bevara originalets beteende och utseende om inte ändring uttryckligen efterfrågas.
- All CSS är global i `src/index.css` (samma selektorer som originalet).

## 11. Kända begränsningar / TODO

- StrictMode-dubblering i dev (se §7).
- CSS skulle kunna delas upp per komponent (CSS Modules) i stället för en global fil.
- Överväg `.gitattributes` för att tvinga LF (Git varnar om CRLF på Windows).
- Ingen automatiserad testsvit ännu.
