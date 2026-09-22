---
name: update-mission
description: >
  Aggiorna una missione esistente quando la procedura del portale reale cambia.
  Modifica solo le parti necessarie (JSON, HTML o entrambi) senza ricreare
  tutto da zero, e riesegue la validazione al termine.
tools:
  - Read
  - Write
  - Edit
  - Agent
---

# Skill: update-mission

## Scopo

Mantiene una missione allineata al portale reale quando quest'ultimo cambia.
Evita di ricreare da zero artefatti che non sono stati impattati dalla modifica.

---

## Come invocarla

```
/update-mission
```

Fornisci l'ID della missione da aggiornare:

> "aggiorna la missione `crea-ticket-supporto`"

---

## Processo di esecuzione

### 1. Carica la missione esistente

- Leggi `app/missions/[id].json`
- Leggi `app/missions/simulators/[id].html`
- Mostra un riepilogo: titolo, numero step, data ultima modifica.

### 2. Raccogli le modifiche

Chiedi allo sviluppatore cosa è cambiato:

> "Cosa è cambiato nel portale? Puoi descriverlo liberamente. Esempi:
>
>  - 'Il pulsante Nuovo Ticket si chiama ora Apri Richiesta'
>  - 'È stato aggiunto un campo Priorità obbligatorio dopo Categoria'
>  - 'La sezione Supporto è stata spostata nel menu Aiuto'
>  - 'L'intera schermata del form è stata ridisegnata' (allega screenshot)"

Attendi la risposta. Se la modifica impatta l'interfaccia visiva, chiedi
gli screenshot aggiornati delle schermate coinvolte.

### 3. Analisi impatto

Determina cosa va aggiornato:

| Tipo di modifica | Aggiorna JSON | Aggiorna HTML |
|---|---|---|
| Testo di un pulsante / label | ✅ description, errorMessage | ✅ testo visibile |
| Aggiunta / rimozione step | ✅ steps array | ✅ elemento + data-track-id |
| Cambio nome target (id elemento) | ✅ target | ✅ data-track-id |
| Redesign visivo schermata | ❌ | ✅ intera sezione HTML |
| Cambio titolo / descrizione missione | ✅ | ❌ (solo barra controllo) |

Mostra l'analisi di impatto allo sviluppatore e chiedi conferma prima
di procedere.

### 4. Applica le modifiche

**Se cambia solo il JSON:**
- Modifica il file con `Edit`, mostra il diff.
- Checkpoint: chiedi conferma.

**Se cambia solo l'HTML:**
- Delega all'agente `simulator-builder` passando le sezioni da rigenerare
  e i nuovi screenshot.
- Checkpoint: mostra anteprima e mapping aggiornato.

**Se cambiano entrambi:**
- Prima JSON (con checkpoint), poi HTML (con checkpoint).

### 5. Riesegui la validazione

- Invoca `validate-mission` sulla missione aggiornata.
- Mostra il report.

### 6. Conferma finale

> "✅ Missione '[title]' aggiornata.
>  Modifiche applicate: [elenco]
>  Validazione: [esito]"
