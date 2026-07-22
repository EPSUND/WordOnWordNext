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
- Migreringsnot: repot porterades från en enda `index.html`. Den gamla versionen är borttagen
  (commit c940799) och finns bara i git-historiken.

## 3. Kommandon

```
npm install          # installera beroenden
npm run dev          # dev-server med HMR (Vite)
npm run build        # tsc -b && vite build → dist/
npm run typecheck    # bara TypeScript, ingen emit
npm test             # kör testsviten en gång (Vitest)
npm run test:watch   # Vitest i watch-läge
npm run preview      # servera dist/ lokalt (under rätt base-path)
npm run dev -- --host   # exponera på LAN för test i telefon
node scripts/make-icons.mjs   # generera om app-ikonerna i public/
```

## 4. Kodkarta (var saker bor)

```
src/lib/engine/     Ren spellogik, ingen DOM:
  constants.ts        COLS/ROWS=7, TOTAL_BLOCKS=48, INITIAL_BLOCKS=5, FREQ, VALUES, SINGLES, VOWELS,
                        ALPHABET + påsens trim-konstanter (VOWEL_TARGET/JITTER, REPEAT_DECAY, ALLOWANCE_FACTOR, MAX_RUN)
  rng.ts              todayStr, hashSeed, mulberry32  (determinism – se §7)
  bag.ts              makeBag (grupperad, mjukt dämpad, interfolierad – se §6), sampleLetter
  words.ts            wordScore, isValidWord, bestWordsInLine (DP), scanLine, computeSingles, scoreAndCount
  grid.ts             landingRow, collapseColumn, ensureColPlayable, cellXY, PAD
src/lib/            dict.ts (fetch + cache), scores.ts (Supabase), sound.ts (WebAudio), types.ts
src/game/reducer.ts Hela speltillståndet som en REN reducer (state + actions)
src/hooks/          useGame.ts (reducer-glue, ljud/tangentbord/async start)
                    useTileSize.ts (mäter --tile-size i DOM:en – se §7)
                    useCoarsePointer.ts (touch vs mus – styr inmatningsidiom)
src/components/     Grupperade efter funktion. Foo.css bredvid Foo.tsx, importerad
                    därifrån – se §5.
  Header.tsx          Titelrad + knappar (hör inte till någon grupp)
  board/              Board, DropZone – brädytan. Delar .tile-CSS:en, som bor i
                        Board.css (DropZone.css förutsätter den)
  panel/              StatusCard, ControlsCard, WordsCard + WordList – de tre korten
                        (gamla SidePanel, uppdelad så att .layout-griden kan placera
                        dem olika – se §5)
  dialogs/            Overlay (chrome + det dialogerna delar) och
                        StartDialog, JokerDialog, EndDialog, HighscoreDialog,
                        HighscoreTable
src/index.css       Laddar bara basen (@import styles/*)
src/styles/base.css   Variabler, reset, element- och .card-regler
src/styles/layout.css .layout-griden och kortens placering
public/dict-*.txt   Ordlistor, ett ord per rad (hämtas i runtime)
public/manifest.webmanifest, icon-*.png, apple-touch-icon.png  (PWA/hemskärm)
scripts/make-icons.mjs  Genererar ikonerna ur spelets palett (körs manuellt)
.github/workflows/  deploy.yml (Actions → Pages; kör npm test före bygget)
src/test/dictFixture.ts  Laddar de riktiga ordlistorna in i dict.ts:s cache i tester
*.test.ts           Ligger bredvid koden de testar – se §12
```

## 5. Arkitektur & dataflöde

- **Reducern (`src/game/reducer.ts`) äger allt speltillstånd** och är ren. Bricksekvensen
  (påsen) genereras i `useGame.start` och skickas in via `start`-action så reducern förblir ren.
- Komponenterna renderar **deklarativt från state**. Sidoeffekter (ljud, tangentbord, async
  ordlisteladdning, Supabase-anrop) ligger i `useGame` och i dialog-komponenterna.
- Faser: `idle → arrange → play → fall → joker → over`. Overlays visas utifrån `phase`.
- **`.layout` är ett grid med `grid-template-areas`.** DOM-ordningen är mobilens läsordning
  (status → bräde → kontroller → ordlista); på skrivbord flyttar griden korten till en
  högerkolumn. Samma markup i båda lägena – lägg inte till en parallell mobil-DOM.
- **CSS ligger per komponent**: `Foo.css` bredvid `Foo.tsx` och importeras av den. Klassnamnen
  är fortfarande *globala* (inte CSS Modules), och det är ett medvetet val: flera selektorer
  delas över komponentgränserna (`.tile` av Board och DropZone, `.card` av de tre korten,
  `.langrow`/`.btnrow`/`.hserror` av dialogerna, `@keyframes pop` av Board och WordList), och
  `--tile-size` måste ligga i `:root`. Med moduler hade allt det behövt `:global`/`composes`,
  alltså mer maskineri än det som finns nu – inte mindre. Regler som
  spänner över flera komponenter bor i `src/styles/`. **Varje komponents media queries ligger i
  komponentens egen fil**, sist i filen, så att kaskaden är korrekt inom filen och ordningen
  mellan filer inte spelar roll.
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
- **Bokstavsfördelning i påsen** (`bag.ts` → `makeBag`): ska vara *språkligt rimlig* (ovanliga
  bokstäver ovanliga) men *tillfredsställande* – man ska sällan få väldigt många av samma bokstav
  och vokaler/konsonanter ska inte klustras. Tre steg, allt deterministiskt givet `rng`:
  1. **Målantal vokaler** ≈ `VOWEL_TARGET·48` ± `VOWEL_JITTER` (så antalet varierar mellan matcher).
  2. **Mjukt dämpad dragning** per grupp (vokaler/konsonanter var för sig, viktat efter `FREQ`):
     varje bokstav dras fritt upp till sin "rimliga andel" (≈ förväntat antal · `ALLOWANCE_FACTOR`),
     därefter avtar vikten geometriskt (`REPEAT_DECAY`) per extra kopia. **Ingen hård gräns** –
     bara allt osannolikare, och mer så ju ovanligare bokstaven är (medvetet val: en fast gräns
     kändes förutsägbar; "5 A" ska vara rimligt, "5 L" osannolikt men inte omöjligt).
  3. **Interfoliering**: väver samman grupperna så aldrig fler än `MAX_RUN` vokaler/konsonanter (och
     aldrig fler än `MAX_RUN` av samma bokstav) hamnar i rad. Detta gör också starthanden spelbar.
  Trim-konstanterna valdes empiriskt (analysskript, 20 000 påsar/språk). Ändra dem inte utan att
  köra om analysen och regenerera golden-testerna (§7/§12).

## 7. Kritiska invarianter / fallgropar (läs innan du ändrar)

- **DETERMINISM.** Dagligt läge seedar `mulberry32(hashSeed("wow-daily-" + datum))` och drar
  bokstäver ur `FREQ` i **insättningsordning**. `rng.ts`, `bag.ts`, `FREQ`-nyckelordningen,
  påsens trim-konstanter och seed-strängen avgör tillsammans dagens brickor; **rör dem inte av
  misstag** – alla som spelar en viss dag måste få samma påse. Golden-testerna i
  `src/lib/engine/determinism.test.ts` bevakar detta (se §12).
  En *medveten* ändring av påsalgoritmen är däremot ofarlig: daglig-seeden bygger på `todayStr()`,
  så man kan bara spela **dagens** dagliga spel (äldre datum är enbart visningsbara i topplistan).
  Från utrullningen och framåt får alltså alla samma nya påse. Regenerera då golden-strängarna
  (enda kantfallet är en utrullning mitt på dagen – två kohorter den dagen; försumbart).
- **Base-path.** `vite.config.ts` har `base: '/WordOnWordNext/'` (projektsajt, inte roten). Alla
  runtime-hämtningar (ordlistor) går via `import.meta.env.BASE_URL`. Fel bas = blank sida på Pages.
- **Supabase-nyckeln** (`SUPA_KEY` i `scores.ts`) är en *publicerbar* nyckel och ligger avsiktligt
  i klienten. Åtkomsten styrs av Row Level Security: **läs + lägg till, inte ändra/radera**.
- **Topplistan kastar fel** vid nätverks-/API-fel (ingen tyst fallback) – felen visas i dialogerna.
- **React StrictMode** (dev) dubbelkör effekter → ljud/nätverk kan ske två gånger i `npm run dev`.
  Det sker inte i bygget.
- **`--tile-size` får INTE läsas med `getComputedStyle`.** För en oregistrerad custom property
  returneras tokensträngen (`"min(12.2vw, 48px)"`), inte px – `parseFloat` gav `NaN`. `useTileSize`
  mäter därför ett dolt probe-element med `ResizeObserver`. JS och CSS måste vara överens om
  brickstorleken, annars ritas brädet i en storlek och brickorna placeras i en annan.
- **Använd `svh`, aldrig `dvh`, i höjdberäkningar.** `dvh` krymper/växer när mobilens adressfält
  fälls in och ut, så `--tile-size` räknades om mitt under scrollen och brädet ändrade storlek
  medan man scrollade. `svh` är den stabila minsta höjden.
- **Ordlistorna måste vara LF.** `.gitattributes` tvingar `eol=lf`; `dict.ts` delar dessutom på
  `/\r?\n/`. Med CRLF och en `"\n"`-split får varje ord ett släpande `\r` och *inget* ord utom
  enbokstavsorden godkänns – en bugg som bara syns lokalt på Windows, eftersom Actions bygger
  på Linux.
- **`index.css` måste importeras före `App` i `main.tsx`.** Vite emitterar CSS i modulernas
  evalueringsordning. Kastas de två raderna om hamnar komponent-CSS:en före basen, och basens
  `.card`/`button`-regler skriver över komponenternas (samma specificitet – ordningen avgör).
- **Ljud kräver en användargest.** iOS startar `AudioContext` som `suspended`; våra ljud spelas
  från `animationend`-callbacks, alltså utanför en gest. `useGame` anropar `unlockAudio()` vid
  första `pointerdown`/`keydown` – tas det bort blir spelet tyst på iPhone.

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
- React-versionen är sedan tidigare mergad till `main` och är den som ligger live.

## 10. Konventioner

- **Svenska** i UI-text och kodkommentarer.
- TypeScript `strict` (inkl. `noUnusedLocals`/`noUnusedParameters`).
- **Trogen port**: bevara originalets beteende och utseende om inte ändring uttryckligen efterfrågas.
- CSS är uppdelad per komponent men med **globala klassnamn** (samma selektorer som originalet).
  Nya regler läggs i komponentens egen `.css`; bara det som verkligen delas hör hemma i
  `src/styles/`.

## 11. Kända begränsningar / TODO

- StrictMode-dubblering i dev (se §7).
- Testsviten täcker motor, reducer och lib – **inga komponenttester** (se §12).
- PWA:n saknar service worker → ingen offlinekörning och ingen automatisk installationsprompt i
  Chrome. Manifest + ikoner finns, så "Lägg till på hemskärmen" fungerar manuellt.
- På mobil döljs språk och läge i statusraden (de väljs ändå i startdialogen). Ordlistan är inte
  hopfällbar utan bara höjdbegränsad och scrollbar.

## 12. Tester

- **Vitest**, node-miljö (ingen jsdom). Testfilerna ligger bredvid koden: `src/**/*.test.ts`.
- Typkollas av **`tsconfig.test.json`** (ES2023 + node-typer); `tsconfig.app.json` exkluderar dem
  så att appens tsconfig kan förbli browser-riktad. Båda körs av `tsc -b`.
- Vad som täcks:
  - `determinism.test.ts` – **golden-test för de dagliga påsarna** (låser hashSeed, mulberry32 och
    `makeBag`-utfallet för kända datum) plus **fördelningsinvarianter** (längd, vokalband, inga
    kluster > `MAX_RUN`, sällsynt överrepresentation). **Uppdatera aldrig golden-värdena bara för
    att få grönt** vid en oavsiktlig ändring – då har §7 brutits, återställ koden. Vid en *medveten*
    ändring av påsalgoritmen ska de regenereras (ofarligt, se §7) och analysskriptet köras om.
  - `words.test.ts` – poängformeln, DP:n för bästa orden per linje, enbokstavsorden.
  - `grid.test.ts` – gravitation, kolumnkollaps, pixelmappning.
  - `reducer.test.ts` – hela fasflödet `arrange → play → fall → joker → over`, inklusive
    guard-fallen (ingen ändring i fel fas) och att jokern bara går att använda en gång.
  - `dict.test.ts` – parsning, cache, och **regressionsspärren mot CRLF** (§7).
  - `scores.test.ts` – Supabase-URL:er, kolumnalias, POST-body och att fel kastas (ingen tyst
    fallback). Inga riktiga nätverksanrop; `fetch` stubbas.
- **Riktiga ordlistor i testerna.** `src/test/dictFixture.ts` läser `public/dict-*.txt` från disk
  och matar dem genom `loadDict`, så ordlisteparsningen körs på riktigt. Använder man påhittade
  ord i ett test: verifiera först att de faktiskt finns i ordlistan (t.ex. `DOG` finns även på
  svenska).
- Komponenter/hooks testas inte – de skulle kräva jsdom och testing-library. Logiken de renderar
  ligger redan i reducern, som är täckt.
