---
name: generate-mission
description: >
  Skill orchestratore che guida lo sviluppatore attraverso l'intero processo
  di creazione di una missione: dalla descrizione testuale fino alla pubblicazione
  nell'app. Ad ogni fase mostra l'output generato, chiede conferma e raccoglie
  il materiale necessario per il passo successivo.
tools:
  - Read
  - Write
  - Edit
  - Agent
---

# Skill: generate-mission

## Scopo

Guida lo sviluppatore attraverso la creazione completa di una missione con
checkpoint interattivi. A ogni step l'output viene mostrato, approvato e — se
necessario — corretto prima di procedere.

---

## Come invocarla

```
/generate-mission
```

Non serve fornire nulla all'invocazione: la skill raccoglie tutto ciò che serve
fase per fase.

---

## Flusso con checkpoint

---

### FASE 1 — Raccolta descrizione

Chiedi allo sviluppatore:

> "Descrivi la procedura che vuoi trasformare in missione.
>  Puoi essere libero nel linguaggio — la skill si occupa di strutturarla."

Attendi la risposta prima di procedere.

---

### FASE 2 — Generazione JSON *(delega a `create-mission`)*

- Invoca la logica di `create-mission` sulla descrizione ricevuta.
- Genera il JSON completo della missione **ma non scriverlo su file ancora**.
- Mostra il JSON allo sviluppatore in un blocco di codice formattato.

**Checkpoint 2 — chiedi:**

> "Ecco il JSON generato per la missione. Vuoi:
>  - ✅ Approvare e continuare
>  - ✏️  Modificare (indica cosa cambiare)
>  - ❌ Annullare"

Applica le eventuali modifiche richieste e mostra nuovamente il JSON finché
non viene approvato.

Una volta approvato, **scrivi il file** `app/missions/[id].json`.

---

### FASE 3 — Raccolta screenshot *(materiale per il simulatore)*

Chiedi allo sviluppatore:

> "Ora genero il simulatore HTML. Per riprodurre fedelmente il portale ho
>  bisogno degli screenshot. Allega:
>
>  - 📸 **Schermata iniziale** — la pagina da cui parte la procedura
>  - 📸 **Schermate intermedie** — ogni pagina/modale che si apre durante gli step
>    (una per ogni cambio di schermata)
>
>  Se non hai screenshot disponibili posso generare un layout placeholder,
>  ma il risultato sarà meno fedele al portale reale."

Attendi che vengano allegati gli screenshot (o confermato di procedere
con placeholder) prima di continuare.

---

### FASE 4 — Generazione simulatore *(delega a `simulator-builder`)*

- Invoca l'agente `simulator-builder` passando il JSON approvato e gli screenshot.
- Attendi il report di mapping dall'agente.
- Mostra allo sviluppatore:
  - Il report di mapping (target mappati, sezioni generate, avvisi)
  - Uno screenshot della pagina generata (se il browser è disponibile)

**Checkpoint 4 — chiedi:**

> "Il simulatore è stato generato. Ecco il mapping dei target e un'anteprima.
>  Vuoi:
>  - ✅ Approvare e continuare alla validazione
>  - ✏️  Richiedere correzioni (descrivi cosa non va)
>  - 📸 Aggiungere altri screenshot per migliorare la fedeltà visiva
>  - ❌ Annullare"

Applica le eventuali correzioni e mostra nuovamente il report finché
non viene approvato.

---

### FASE 5 — Validazione *(delega a `validate-mission`)*

- Invoca la logica di `validate-mission` sulla missione appena creata.
- Mostra il report completo (JSON check + coerenza + test funzionale da `mission-tester`).

**Checkpoint 5 — in base al risultato:**

Se tutto ok:
> "✅ Validazione superata. La missione è pronta per essere pubblicata."

Se ci sono warning:
> "⚠️  Validazione completata con [N] warning. Puoi pubblicare comunque o
>  correggere prima. Vuoi:
>  - ✅ Pubblicare comunque
>  - ✏️  Correggere i warning prima di pubblicare
>  - ❌ Annullare"

Se ci sono errori bloccanti:
> "❌ Trovati [N] errori bloccanti. La missione non funzionerà correttamente.
>  Vuoi che li corregga automaticamente e ripeta la validazione?"

---

### FASE 6 — Pubblicazione

- Aggiungi il path `'missions/[id].json'` all'array `MISSIONS` in `app/index.html`.
- Conferma allo sviluppatore:

> "🎉 Missione '[title]' pubblicata!
>
>  Riepilogo:
>  - JSON:       app/missions/[id].json
>  - Simulatore: app/missions/simulators/[id].html
>  - Visibile in: app/index.html
>
>  Vuoi creare un'altra missione? (/generate-mission)"

---

## Schema del flusso

```
/generate-mission
      │
      ├─ [1] Descrizione procedura  ◄── input sviluppatore
      │
      ├─ [2] Genera JSON
      │       └─ ✋ Checkpoint: mostra JSON → approva / modifica
      │
      ├─ [3] Raccolta screenshot    ◄── input sviluppatore
      │
      ├─ [4] Genera simulatore HTML
      │       └─ ✋ Checkpoint: mostra mapping + anteprima → approva / correggi
      │
      ├─ [5] Valida missione
      │       └─ ✋ Checkpoint: mostra report → pubblica / correggi / annulla
      │
      └─ [6] Pubblica in index.html
              └─ 🎉 Riepilogo finale
```
