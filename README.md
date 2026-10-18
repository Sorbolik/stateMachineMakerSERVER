# State machine API

Backend di [State machine maker](https://github.com/Sorbolik/vanillaAndWebpackStateMachineMaker):
un Worker Cloudflare che salva le macchine a stati in un database D1 (SQLite).
Nessuna dipendenza a runtime.

```bash
npm install
npm run dev      # http://localhost:8787, con un D1 locale in .wrangler/
npm run check    # typecheck
npm run deploy   # pubblica (lo fa già Cloudflare a ogni push su main)
```

## API

| Metodo | Percorso | Risposta |
| --- | --- | --- |
| `GET` | `/machines` | `[{ "id", "name", "updated" }]`, dalla più recente |
| `POST` | `/machines` | crea, risponde `201 { "id" }` |
| `GET` | `/machines/:id` | la macchina |
| `PUT` | `/machines/:id` | aggiorna, `204` (`404` se non esiste) |
| `DELETE` | `/machines/:id` | elimina, `204` |

Il corpo è il JSON dell'editor (`{ v, name, initial, final, states, transitions }`).
Il server lo valida campo per campo e scarta tutto quello che non fa parte del formato.
Gli errori rispondono `{ "error": "..." }` con lo status giusto.

Limiti: 200 KB per macchina, 500 stati, 2000 transizioni, 1000 macchine in tutto.

## Database

Una sola tabella, creata dal Worker alla prima richiesta (`CREATE TABLE IF NOT EXISTS`):

```sql
machines(id TEXT PRIMARY KEY, name TEXT, data TEXT, updated TEXT)
```

`data` è il JSON della macchina. `name` e `updated` sono copiati fuori solo per l'elenco.

## Pubblicazione

`wrangler.jsonc` non ha `database_id`: al primo deploy Wrangler crea da solo il
database `state-machines` e lo collega. `ALLOWED_ORIGINS` elenca i siti che
possono chiamare l'API dal browser.
