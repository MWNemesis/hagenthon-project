# Portal Simulator

Simulatore di portale aziendale per la formazione dei neoassunti.

Il sistema permette di apprendere le procedure operative attraverso missioni interattive: il neoassunto legge la spiegazione, esegue la procedura nel portale simulato e riceve un feedback immediato su errori o successo.

---

## Architettura

Il progetto è diviso in due fasi distinte:

### Fase di generazione (con AI)
Gli agenti e le skill vengono usati dallo sviluppatore per produrre i contenuti — missioni JSON e simulatori HTML — a partire dalla descrizione delle procedure e da screenshot del portale reale.

### Fase di fruizione (zero AI)
L'app gira completamente lato client, senza chiamate esterne. Funziona anche offline.

---

## Struttura del progetto

```
hagenthon-project/
├── app/                          ← applicativo statico
│   ├── index.html                ← lista missioni disponibili
│   ├── mission.html              ← spiegazione e avvio simulazione
│   ├── result.html               ← feedback finale con dettaglio step
│   ├── css/style.css             ← design system
│   ├── js/
│   │   ├── tracker.js            ← traccia le azioni utente nel simulatore
│   │   └── evaluator.js          ← valuta il log vs gli step attesi
│   └── missions/
│       ├── *.json                ← missioni generate dagli agenti
│       └── simulators/           ← simulatori HTML generati dagli agenti
├── agents/                       ← skill e agenti per la generazione dei contenuti
│   └── README.md                 ← catalogo completo, flussi e convenzioni
└── presentation/
    └── index.html                ← presentazione HTML del progetto
```

---

## Flusso di creazione di una missione

```
Sviluppatore
    │
    └─ /generate-mission          ← punto d'ingresso consigliato
           │
           ├─ [1] Descrivi la procedura
           ├─ [2] Revisione JSON generato        ✋ checkpoint
           ├─ [3] Allega screenshot del portale
           ├─ [4] Revisione simulatore HTML       ✋ checkpoint
           ├─ [5] Validazione automatica          ✋ checkpoint
           └─ [6] Pubblicazione in index.html
```

Per la creazione massiva di missioni:

```
/portal-analyzer  →  catalogo da screenshot del portale
/batch-generate   →  genera N missioni in sequenza (accetta anche XLSX/CSV)
```

Per il catalogo completo di skill e agenti disponibili → [agents/README.md](agents/README.md)

---

## Schema JSON missione

```json
{
  "id": "kebab-case-id",
  "title": "Titolo breve",
  "description": "Una riga descrittiva",
  "icon": "🔖",
  "difficulty": "base | medio | avanzato",
  "estimatedMinutes": 3,
  "explanation": "Spiegazione contestuale in seconda persona",
  "steps": [
    {
      "id": "step-1",
      "description": "Istruzione leggibile per l'utente",
      "action": "click | fill | submit",
      "target": "identificatoreTarget",
      "errorMessage": "Messaggio se lo step non viene eseguito"
    }
  ],
  "simulator": "missions/simulators/[id].html",
  "successMessage": "Messaggio di congratulazioni"
}
```

I valori di `target` devono corrispondere esattamente agli attributi `data-track-id` degli elementi interattivi nel simulatore HTML.

---

## Come funziona il tracciamento

1. Il simulatore HTML include `tracker.js`
2. `tracker.js` ascolta click, change e submit su elementi con `data-track-id`
3. Al click su **Completa**, il log delle azioni viene confrontato con gli step attesi
4. Il risultato viene salvato in `sessionStorage` e `result.html` mostra il report
