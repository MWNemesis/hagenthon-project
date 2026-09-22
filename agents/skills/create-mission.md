---
name: create-mission
description: >
  Genera un file JSON di missione per il simulatore di portale, partendo dalla
  descrizione testuale di una procedura aziendale. Usa questa skill quando vuoi
  aggiungere una nuova missione all'applicativo senza doverla scrivere a mano.
tools:
  - Read
  - Write
  - Edit
---

# Skill: create-mission

## Scopo

Dato un testo che descrive una procedura da eseguire nel portale aziendale,
genera il file `app/missions/[id].json` completo e registra la missione
nell'array `MISSIONS` di `app/index.html`.

---

## Come invocarla

```
/create-mission
```

Dopo l'invocazione, descrivi la procedura in linguaggio naturale. Esempi:

> "L'utente deve accedere alla sezione Anagrafica, cercare un dipendente per
>  matricola, aprire la sua scheda e modificare il numero di telefono."

> "Procedura di richiesta ferie: l'utente va su Presenze, clicca su Richiedi
>  Assenza, sceglie il tipo Ferie, imposta le date e conferma."

---

## Processo di esecuzione

1. **Analizza** la descrizione e identifica ogni azione atomica dell'utente
   (click, compilazione campo, selezione da lista, submit).

2. **Chiede Spiegazioni** dall'analisi fatta richiede ed approfondisce ambiguità 
   di quanto scritto nel linguaggio naturale

3. **Genera l'ID** della missione: stringa kebab-case derivata dal titolo
   (es. `modifica-telefono-dipendente`).

4. **Determina la difficoltà** secondo questi criteri:
   - `base` → fino a 5 step, nessuna condizione
   - `medio` → 6-10 step, o presenza di ricerca/filtro
   - `avanzato` → oltre 10 step, o navigazione tra sezioni diverse

5. **Stima il tempo** in minuti (circa 1 minuto per ogni 2 step).

6. **Assegna un'icona** emoji coerente con il dominio della procedura.

7. **Costruisce gli step** rispettando queste regole:
   - Ogni step è **una sola azione atomica** (non raggruppare più azioni)
   - `action` può essere solo: `click`, `fill`, `submit`
   - `target` è un identificatore camelCase descrittivo, senza spazi
     (es. `btnNuovaRichiesta`, `fieldMatricola`, `selectTipoAssenza`)
   - `errorMessage` spiega cosa l'utente non ha fatto, in italiano, in modo
     chiaro e non tecnico
   - Gli step seguono l'ordine cronologico esatto della procedura

8. **Scrive il file** `app/missions/[id].json` rispettando lo schema seguente.

9. **Aggiorna** l'array `MISSIONS` in `app/index.html` aggiungendo il path
   `'missions/[id].json'`.

---

## Schema JSON prodotto

```json
{
  "id": "string (kebab-case)",
  "title": "string — titolo breve e descrittivo",
  "description": "string — una riga, spiega cosa impara l'utente",
  "icon": "string — una emoji rappresentativa",
  "difficulty": "base | medio | avanzato",
  "estimatedMinutes": "number",
  "explanation": "string — paragrafo in italiano che spiega la procedura prima di iniziare",
  "steps": [
    {
      "id": "step-N",
      "description": "string — istruzione leggibile per l'utente",
      "action": "click | fill | submit",
      "target": "string — identificatore camelCase (deve corrispondere al data-track-id nel simulatore)",
      "errorMessage": "string — messaggio mostrato se lo step non viene eseguito"
    }
  ],
  "simulator": "missions/simulators/[id].html",
  "successMessage": "string — messaggio di congratulazioni mostrato a procedura completata"
}
```

---

## Regole di qualità

- **Ogni `target` deve essere unico** all'interno della missione.
- **Non usare ID generici** come `btn1`, `input1`: i target devono essere
  autodescrittivi anche fuori contesto.
- **L'`explanation`** deve essere scritta in seconda persona singolare e non
  deve ripetere gli step verbatim — è un'introduzione contestuale.
- **Il `successMessage`** deve essere incoraggiante e specifico alla procedura,
  non generico.
- Se la descrizione fornita è ambigua o incompleta, **fai domande** prima di
  generare il JSON.

---

## Esempio di output

Input:
> "L'utente deve creare un nuovo ticket di supporto: va su Supporto, clicca
>  Nuovo Ticket, compila titolo e categoria, poi invia."

Output → `app/missions/crea-ticket-supporto.json`:

```json
{
  "id": "crea-ticket-supporto",
  "title": "Creare un ticket di supporto",
  "description": "Impara ad aprire una richiesta di assistenza nel portale.",
  "icon": "🎫",
  "difficulty": "base",
  "estimatedMinutes": 3,
  "explanation": "Quando hai bisogno di assistenza tecnica puoi aprire un ticket direttamente dal portale. Accedi alla sezione Supporto, compila i campi richiesti e invia la tua richiesta: il team riceverà una notifica automatica.",
  "steps": [
    {
      "id": "step-1",
      "description": "Clicca su 'Supporto' nella barra di navigazione",
      "action": "click",
      "target": "navSupporto",
      "errorMessage": "Non hai aperto la sezione Supporto"
    },
    {
      "id": "step-2",
      "description": "Clicca sul pulsante 'Nuovo Ticket'",
      "action": "click",
      "target": "btnNuovoTicket",
      "errorMessage": "Non hai cliccato su 'Nuovo Ticket'"
    },
    {
      "id": "step-3",
      "description": "Compila il campo Titolo",
      "action": "fill",
      "target": "fieldTitolo",
      "errorMessage": "Il campo Titolo è obbligatorio e non è stato compilato"
    },
    {
      "id": "step-4",
      "description": "Seleziona una Categoria dal menu a tendina",
      "action": "fill",
      "target": "selectCategoria",
      "errorMessage": "Non hai selezionato la categoria del ticket"
    },
    {
      "id": "step-5",
      "description": "Clicca su 'Invia' per confermare",
      "action": "click",
      "target": "btnInvia",
      "errorMessage": "Non hai confermato l'invio del ticket"
    }
  ],
  "simulator": "missions/simulators/crea-ticket-supporto.html",
  "successMessage": "Ottimo! Hai aperto il tuo primo ticket di supporto. Il team ti risponderà entro 24 ore."
}
```
