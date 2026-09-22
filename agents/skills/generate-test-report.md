---
name: generate-test-report
description: >
  Genera una suite di unit test per il sorgente JavaScript del progetto
  (tracker.js, evaluator.js) e per i simulatori HTML prodotti dagli agenti,
  esegue i test e produce un report HTML consultabile.
tools:
  - Read
  - Write
  - Bash
  - Agent
---

# Skill: generate-test-report

## Scopo

Verifica la correttezza del codice sorgente generato attraverso unit test
automatici. Copre il motore di tracciamento, la logica di valutazione e
i simulatori prodotti dagli agenti.

---

## Come invocarla

```
/generate-test-report
```

Opzionalmente specifica lo scope:

> "genera il report di test per tutti i sorgenti"
> "genera il report di test solo per evaluator.js"
> "genera il report di test per la missione `crea-ticket-supporto`"

---

## Scope di test

### 1. `tracker.js` — Motore di tracciamento

| Test | Cosa verifica |
|---|---|
| Registrazione click | Un click su elemento con `data-track-id` produce `{action:'click', targetId, ts}` nel log |
| Registrazione fill | Un evento `change` su input produce `{action:'fill', targetId, value}` nel log |
| Registrazione submit | Un submit su form produce `{action:'submit', targetId}` nel log |
| Elementi senza data-track-id | Click su elementi privi di attributo non producono voci nel log |
| Reset log | `Tracker.reset()` svuota il log |
| GetLog immutabile | `Tracker.getLog()` restituisce una copia, non il riferimento interno |
| Ordine cronologico | Le azioni nel log rispettano l'ordine di esecuzione |

### 2. `evaluator.js` — Motore di valutazione

| Test | Cosa verifica |
|---|---|
| Happy path | Tutti gli step eseguiti → `passed:true`, `errors:0` |
| Step mancante | Un step non eseguito → `passed:false`, `errors:1`, step corretto con `ok:false` |
| Più step mancanti | N step mancanti → `errors:N` |
| Step in ordine diverso | Azioni registrate fuori ordine ma presenti → `passed:true` |
| Log vuoto | Nessuna azione → tutti gli step falliti |
| ErrorMessage corretto | Il messaggio di errore corrisponde a quello definito nel JSON |
| Steps vuoti | Missione senza step → `passed:true`, `errors:0` |

### 3. Simulatori generati — Coerenza strutturale

Per ogni file in `app/missions/simulators/`:

| Test | Cosa verifica |
|---|---|
| Caricamento senza errori JS | Nessuna eccezione nella console all'apertura |
| data-track-id unici | Nessun duplicato nell'HTML |
| tracker.js incluso | Tag `<script src="../../js/tracker.js">` presente |
| Tracker.complete() collegato | Il pulsante Completa chiama `Tracker.complete()` |
| sim-section presenti | Almeno una sezione `.sim-section` con `display:block` |
| Navigazione funzionante | Ogni `showSection()` referenzia una sezione esistente |

---

## Processo di esecuzione

### Fase 1 — Generazione suite di test

Delega all'agente `test-runner` che:
- Legge i sorgenti da testare
- Scrive il file `app/tests/test-suite.html` — una pagina HTML autonoma
  con i test scritti in vanilla JS (nessuna dipendenza esterna)

### Fase 2 — Esecuzione

- Apre `app/tests/test-suite.html` in un browser headless
- Raccoglie i risultati da `window.__testResults`
- Chiude il browser

### Fase 3 — Report HTML

Scrive `app/tests/report.html` — pagina consultabile con:
- Riepilogo: test totali / passati / falliti
- Dettaglio per modulo (tracker, evaluator, simulatori)
- Per ogni test fallito: input, output atteso, output ricevuto
- Timestamp di esecuzione

---

## Output

```
📊 REPORT UNIT TEST
───────────────────────────────
Eseguiti:  24
✅ Passati: 22
❌ Falliti:  2

tracker.js      8/8  ✅
evaluator.js    7/8  ⚠️  (1 fallito)
simulatori      7/8  ⚠️  (1 fallito)

Report completo → app/tests/report.html
───────────────────────────────
FALLITI:
  ❌ evaluator / step in ordine diverso
     Atteso: passed=true
     Ricevuto: passed=false
     → possibile bug nell'evaluator per azioni fuori sequenza

  ❌ simulatori / crea-ticket-supporto / navigazione
     showSection('section-form') → sezione non trovata nell'HTML
```
