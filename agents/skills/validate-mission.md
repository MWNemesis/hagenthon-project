---
name: validate-mission
description: >
  Valida una missione completa verificando la coerenza tra JSON e simulatore HTML,
  e delega a mission-tester il test funzionale interattivo della pagina.
  Usa questa skill prima di rilasciare una missione ai neoassunti.
tools:
  - Read
  - Bash
  - Agent
---

# Skill: validate-mission

## Scopo

Dato l'ID di una missione, esegue una validazione completa su tre livelli:

1. **Struttura** — il JSON è ben formato e completo
2. **Coerenza** — JSON e HTML del simulatore sono allineati
3. **Funzionale** — il simulatore si comporta correttamente quando usato (delegato a `mission-tester`)

---

## Come invocarla

```
/validate-mission
```

Fornisci l'ID della missione da validare:

> "valida la missione `crea-ticket-supporto`"

---

## Processo di esecuzione

### Fase 1 — Validazione JSON

Leggi `app/missions/[id].json` e verifica:

| Check | Critico | Dettaglio |
|---|---|---|
| Campi obbligatori presenti | ✅ | `id`, `title`, `description`, `explanation`, `steps`, `simulator`, `successMessage` |
| Nessun campo stringa vuoto | ✅ | Tutti i valori string devono avere contenuto |
| `steps` non vuoto | ✅ | La missione deve avere almeno 1 step |
| `target` unici | ✅ | Nessun `target` duplicato tra gli step |
| `action` valide | ✅ | Solo `click`, `fill`, `submit` |
| `id` step progressivi | ⚠️ | `step-1`, `step-2`, ... senza salti |
| `difficulty` valida | ⚠️ | Solo `base`, `medio`, `avanzato` |
| `estimatedMinutes` coerente | ⚠️ | Circa 1 min ogni 2 step |
| `icon` presente | ⚠️ | Campo non obbligatorio ma consigliato |

### Fase 2 — Validazione HTML simulatore

Leggi `app/missions/simulators/[id].html` e verifica:

| Check | Critico | Dettaglio |
|---|---|---|
| File esiste | ✅ | Il path in `simulator` del JSON punta a un file reale |
| `tracker.js` incluso | ✅ | `<script src="../../js/tracker.js">` presente |
| `Tracker.complete()` richiamato | ✅ | Il pulsante Completa usa `onclick="Tracker.complete()"` |
| Tutti i `target` mappati | ✅ | Ogni `target` del JSON esiste come `data-track-id` nell'HTML |
| `data-track-id` su elementi interattivi | ✅ | Mai su `<div>` o `<span>` |
| Nessun `data-track-id` orfano | ⚠️ | Ogni `data-track-id` nell'HTML deve corrispondere a un `target` nel JSON |
| `.sim-section` presente | ⚠️ | Almeno una sezione con `class="sim-section"` |
| Nessuna chiamata esterna | ⚠️ | Niente `fetch`, `XMLHttpRequest`, URL assoluti |
| `.simulator-bar` presente | ⚠️ | La barra di controllo deve essere inclusa |

### Fase 3 — Test funzionale

**Esegui questa fase solo se Fase 1 e Fase 2 non hanno errori bloccanti.**
Se ci sono errori bloccanti, salta il browser test e riporta subito il report finale —
il test funzionale su un simulatore strutturalmente rotto è sempre inaffidabile e costoso.

Delega all'agente `mission-tester` passando:
- Il path del simulatore HTML
- La lista degli step con `action` e `target`

L'agente apre la pagina in un browser, esegue ogni step e restituisce
il risultato del test.

---

## Report finale

Al termine stampa un report strutturato:

```
═══════════════════════════════════════════
  REPORT VALIDAZIONE: crea-ticket-supporto
═══════════════════════════════════════════

📋 FASE 1 — JSON
  ✅ Struttura completa
  ✅ 5 target unici
  ✅ Azioni valide
  ⚠️  estimatedMinutes: 8 (suggerito: 3 per 5 step)

🔗 FASE 2 — COERENZA JSON ↔ HTML
  ✅ File simulatore trovato
  ✅ tracker.js incluso
  ✅ Tutti i target mappati (5/5)
  ✅ data-track-id su elementi interattivi
  ⚠️  data-track-id orfano trovato: "btnAnnulla" (non presente nel JSON)

🧪 FASE 3 — TEST FUNZIONALE
  → vedi report mission-tester

───────────────────────────────────────────
ESITO: ⚠️  MISSIONE CON WARNING
  Errori bloccanti: 0
  Warning: 2
───────────────────────────────────────────
```

Se ci sono **errori bloccanti**, la skill chiede allo sviluppatore se
procedere con il fix automatico prima di concludere.
