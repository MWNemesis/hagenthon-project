# Agenti e Skill

Questa cartella raccoglie le definizioni di skill e agenti utilizzati nella
fase di **generazione dei contenuti** del simulatore. Non vengono eseguiti
a runtime dall'applicativo — servono allo sviluppatore per produrre le missioni
e i simulatori tramite Claude Code.

---

## Struttura

```
agents/
├── skills/      ← invocabili con /nome-skill direttamente in chat
└── agents/      ← specialisti delegati dalle skill, non invocati direttamente
```

---

## `skills/` — Skill invocabili

Compiti **singoli e ripetibili** con un input chiaro e un output definito.
Lo sviluppatore le invoca direttamente con `/nome-skill`.

| File | Invocazione | Cosa produce |
|---|---|---|
| `generate-mission.md` | `/generate-mission` | Flusso completo guidato con checkpoint: JSON → simulatore → validazione → pubblicazione |
| `create-mission.md` | `/create-mission` | JSON della missione in `app/missions/` |
| `generate-simulator.md` | `/generate-simulator` | HTML del simulatore in `app/missions/simulators/` |
| `validate-mission.md` | `/validate-mission` | Report di validazione JSON + HTML + test funzionale |
| `update-mission.md` | `/update-mission` | Aggiorna JSON e/o HTML di una missione esistente |
| `batch-generate.md` | `/batch-generate` | Genera N missioni in sequenza da una lista di procedure |
| `generate-test-report.md` | `/generate-test-report` | Suite di unit test per tracker.js, evaluator.js e simulatori + report HTML |

---

## `agents/` — Agenti specializzati

Componenti con **dominio specifico** e logica più complessa. Non vengono
invocati direttamente dall'utente: sono delegati dalle skill quando il compito
richiede ragionamento specializzato.

| File | Delegato da | Specializzazione |
|---|---|---|
| `portal-analyzer.md` | `batch-generate` o utente | Analizza screenshot del portale → catalogo missioni suggerite |
| `simulator-builder.md` | `generate-simulator` | Analisi screenshot → generazione HTML fedele al portale |
| `mission-reviewer.md` | `validate-mission` o utente | Revisione qualità testo: chiarezza, tono, leggibilità per neoassunti |
| `mission-tester.md` | `validate-mission` | Test funzionale del simulatore in browser reale |
| `test-runner.md` | `generate-test-report` | Scrive ed esegue unit test vanilla JS, restituisce risultati strutturati |

---

## Quando usare skill vs agente

| Caratteristica | Skill | Agente |
|---|---|---|
| Invocazione | Diretta (`/nome`) | Delegata da una skill |
| Complessità | Singolo compito lineare | Ragionamento multi-step |
| Input | Testo + file strutturati | Può includere immagini, ambiguità |
| Output | Artefatto definito (JSON, HTML) | Output + report intermedi |

---

## Flusso completo

```
DISCOVERY
  [portal-analyzer] ──────────────────→ app/missions/_catalog.json
        ↓
CREAZIONE (singola)                     CREAZIONE (batch)
  /generate-mission                       /batch-generate
    ├─ [1] descrizione     ✋              ├─ lista procedure / _catalog.json
    ├─ [2] /create-mission ✋              ├─ screenshot collettivi
    ├─ [3] screenshot      ✋              └─ genera N missioni in sequenza
    ├─ [4] [simulator-builder]
    ├─ [5] /validate-mission ✋
    └─ [6] pubblica in index.html
        ↓
QUALITÀ
  /validate-mission
    ├─ check JSON struttura
    ├─ check coerenza JSON ↔ HTML
    ├─ [mission-reviewer]  ← qualità testo
    └─ [mission-tester]    ← test funzionale in browser
        ↓
MANUTENZIONE
  /update-mission          ← quando il portale cambia
        ↓
TEST SORGENTI
  /generate-test-report
    └─ [test-runner]       ← unit test tracker.js + evaluator.js + simulatori
                              → app/tests/report.html
```
