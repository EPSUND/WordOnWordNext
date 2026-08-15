# Supabase – databasobjekt som appen är beroende av

Appen har inget eget backend: topplistan går direkt mot Supabases REST-API (PostgREST) från
klienten, se [`src/lib/scores.ts`](../src/lib/scores.ts). Schemat bor alltså i Supabase-projektet
och inte i repot – **den här filen är facit** över vad som måste finnas där. Skapas projektet om
från grunden är det de här objekten som ska återskapas, i den här ordningen.

- Projekt-URL: `https://vvspqfbvxuimxcbyyahw.supabase.co`
- Nyckeln i klienten är den *publicerbara* anon-nyckeln. Den är gjord för att ligga öppet;
  åtkomsten styrs av Row Level Security.

## Tabellen `wow_scores`

Ett resultat per sparad omgång.

| Kolumn            | Typ           | Not                                              |
| ----------------- | ------------- | ------------------------------------------------ |
| `id`              | bigint (PK)   | Enda säkra sättet att peka ut en specifik post   |
| `name`            | text          | Spelarens namn, som det skrevs in                 |
| `score`           | int           |                                                   |
| `word_count`      | int           | Antal ord                                         |
| `language`        | text          | `sv` / `en`                                       |
| `best_word`       | text, null    |                                                   |
| `daily_game_date` | date, null    | `YYYY-MM-DD` för dagliga spel, annars `null`      |
| `created_at`      | timestamptz   | Default `now()`                                   |

**RLS:** anon får `SELECT` och `INSERT`. `UPDATE` och `DELETE` är blockerat – ett sparat resultat
kan alltså inte ändras eller tas bort från klienten.

## Vyn `wow_best_player_scores`

Driver Rekord-vyn i topplistan: **ett resultat per spelare, deras bästa**. Vyn har exakt samma
kolumner som tabellen, så klienten kan använda samma `select`-alias och läsa den som vilken
relation som helst (`loadBestPlayerScores` i `scores.ts`).

```sql
create or replace view wow_best_player_scores with (security_invoker = on) as
select distinct on (language, lower(btrim(name)))
       id, name, score, word_count, language, best_word, daily_game_date, created_at
from wow_scores
order by language, lower(btrim(name)), score desc, created_at asc;

grant select on wow_best_player_scores to anon, authenticated;
```

### Varför en vy och inte en vanlig query?

- **PostgREST kan inte uttrycka det.** "Bästa raden per grupp" (greatest-n-per-group) kräver
  `distinct on` eller en fönsterfunktion, och inget av det går att skriva i frågesträngen.
- **`score.max()` räcker inte** även om man slår på aggregat: man får bara `name` + högsta poäng,
  inte *raden* poängen kom från, så `best_word`, `word_count` och `created_at` skulle saknas eller
  kunna komma från en annan omgång. (Aggregat är dessutom avstängda på projektet – REST svarar
  `PGRST123: Use of aggregate functions is not allowed`.)
- **Alternativet var att tunna ut i klienten**, men då måste man hämta ett stort spann rader och
  hoppas att alla spelares bästa ligger inom det. Vyn gör att `limit` gäller redan uttunnade rader.

### Detaljer som är medvetna

- **`security_invoker = on` är inte valfritt.** Utan den körs vyn med ägarens rättigheter och
  kringgår RLS på `wow_scores`. Med den gäller tabellens policyer för den som frågar.
- **Namn normaliseras med `lower(btrim(name))`**, så "Erik", "erik" och " Erik " är samma spelare.
  Samma regel som namnsökningen, som matchar med `ilike`.
- **`order by ... score desc, created_at asc`** avgör vilken rad som vinner: högsta poängen, och
  vid lika poäng den äldsta (rekordet sattes ju då). `distinct on`-kolumnerna måste komma först i
  `order by` – det är ett krav i Postgres, inte en stilfråga.
- Vyn är inte materialiserad: den speglar tabellen direkt, så ett nytt personbästa syns med en gång.

### Om listan växer

`distinct on` sorterar hela tabellen per fråga. Vid dagens storlek (hundratals rader) är det inget
problem. Skulle det bli tiotusentals rader hjälper ett index som matchar sorteringen:

```sql
create index on wow_scores (language, lower(btrim(name)), score desc, created_at asc);
```

## Att tänka på vid ändringar

- Ändras vyns namn eller kolumner måste `SUPA_BEST_VIEW`/`HS_SELECT` i `scores.ts` följa med.
  Testerna i `scores.test.ts` låser vilken relation som frågas, men de stubbar `fetch` – de kan
  inte upptäcka att vyn saknas i databasen. Det syns först som ett fel i topplistan
  (`Topplistan svarade med fel (404).`).
- Topplistan har ingen tyst fallback: fel kastas och visas i dialogen. Det är avsiktligt.
