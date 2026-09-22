---
name: batch-generate
description: >
  Genera più missioni in sequenza da una lista di procedure. Accetta input
  in quattro formati: lista testuale, file XLSX/CSV, file di testo, o catalogo
  prodotto da portal-analyzer. Utile quando si devono creare molte missioni
  in una volta sola.
tools:
  - Read
  - Write
  - Edit
  - Bash
  - Agent
---

# Skill: batch-generate

## Scopo

Crea N missioni in sequenza riducendo l'interazione manuale al minimo.
Ogni missione passa per JSON → simulatore → validazione, con un unico
checkpoint collettivo per gli screenshot.

---

## Come invocarla

```
/batch-generate
```

Puoi fornire le procedure in quattro modi:

**1. Lista testuale diretta:**
> "Crea missioni per queste procedure:
>  1. Creare un ticket di supporto
>  2. Modificare il numero di telefono in anagrafica
>  3. Richiedere un giorno di ferie"

**2. File XLSX o CSV:** ← *formato consigliato per grandi volumi*
> Allega un file Excel o CSV con le procedure strutturate per colonne.
> La skill legge il file, valida le colonne e mostra un'anteprima prima
> di procedere. Vedi la sezione **Formato XLSX/CSV** per lo schema atteso.

**3. File di testo semplice:**
> Allega un file `.txt` con una procedura per riga.

**4. Output di portal-analyzer:**
> "Usa il catalogo generato da portal-analyzer" — la skill legge
> `app/missions/_catalog.json` prodotto dall'agente.
>
> Le missioni con `"status": "incomplete"` vengono automaticamente escluse
> dalla generazione e segnalate nel report finale. Quelle con `"status": "ready"`
> vengono processate usando i dati già raccolti da portal-analyzer
> (explanation, draftSteps, clarifications) senza richiedere ulteriori input.

---

## Formato XLSX / CSV

### Colonne obbligatorie

| Colonna | Tipo | Descrizione |
|---|---|---|
| `titolo` | stringa | Nome breve della missione |
| `procedura` | stringa | Descrizione in linguaggio naturale della procedura da eseguire |

### Colonne opzionali (se presenti, vengono usate direttamente)

| Colonna | Tipo | Valori ammessi | Default |
|---|---|---|---|
| `difficolta` | stringa | `base`, `medio`, `avanzato` | derivata automaticamente |
| `sezione` | stringa | Nome della sezione del portale | — |
| `minuti` | numero | Durata stimata in minuti | derivata automaticamente |
| `icona` | stringa | Emoji rappresentativa | derivata automaticamente |
| `note` | stringa | Informazioni aggiuntive non desumibili dagli screenshot | — |

### Esempio CSV

```csv
titolo,procedura,difficolta,sezione,minuti,icona,note
Creare un ticket di supporto,L'utente accede a Supporto clicca Nuovo Ticket compila Titolo e Categoria e invia,base,Supporto,3,🎫,Titolo e Categoria sono obbligatori
Modificare telefono anagrafica,L'utente va in Anagrafica apre la sua scheda clicca Modifica cambia il numero di telefono e salva,base,Anagrafica,4,📋,
Richiedere ferie,L'utente accede a Presenze clicca Richiedi Assenza sceglie tipo Ferie imposta date inizio e fine e conferma,medio,Presenze,5,📅,Le date devono essere lavorative
```

### Esempio XLSX

Il file Excel deve avere i nomi di colonna nella **prima riga** del foglio
attivo. Fogli multipli sono supportati: la skill chiede quale foglio usare
se ne trova più di uno.

---

## Processo di esecuzione

### 1. Parsing e validazione input

**Se input è XLSX/CSV:**
- Leggi il file con Bash (`python3` o strumenti disponibili)
- Verifica che le colonne obbligatorie `titolo` e `procedura` siano presenti
- Se mancano colonne obbligatorie, segnala l'errore e mostra il formato atteso
- Se ci sono colonne sconosciute, ignorale e avvisa

**Se input è testo / lista:**
- Estrai una procedura per riga / elemento

**Se input è `_catalog.json`:**
- Filtra solo le missioni con `"status": "ready"`

### 2. Anteprima e conferma lista

Mostra l'elenco delle procedure parsed con ID suggerito:

```
Ho trovato [N] procedure da [sorgente]. Le genererò in questo ordine:

  #  Titolo                            ID suggerito                Difficoltà
  ─────────────────────────────────────────────────────────────────────────────
  1  Creare un ticket di supporto      crea-ticket-supporto        base
  2  Modificare telefono anagrafica    modifica-telefono-anagrafica base
  3  Richiedere ferie                  richiedi-ferie              medio

Vuoi riordinare, escludere qualcuna o procedere?
```

### 3. Raccolta screenshot (collettiva)

Se l'input era XLSX/CSV o testo (non _catalog.json), chiedi gli screenshot:

> "Prima di iniziare, allega gli screenshot del portale per ogni missione.
>  Puoi allegarli tutti insieme — indicami a quale procedura si riferisce
>  ciascuno (es. 'screenshot 1-2: ticket, screenshot 3: anagrafica').
>
>  Se non hai screenshot per alcune procedure posso usare un placeholder."

Se l'input era `_catalog.json`, usa i `screenshotsNeeded` già indicati
dall'agente portal-analyzer come riferimento per richiedere solo quelli mancanti.

### 4. Generazione in sequenza

Per ogni missione nella lista, senza interrompere lo sviluppatore:

```
[1/3] ██████████░░░░░░░░░░ Generazione: Creare un ticket di supporto
  ├─ JSON generato              ✅
  ├─ Simulatore generato        ✅
  └─ Validazione                ✅ ok

[2/3] ████████████████████ Generazione: Modificare telefono anagrafica
  ├─ JSON generato              ✅
  ├─ Simulatore generato        ✅
  └─ Validazione                ⚠️  1 warning (errorMessage generico in step-3)

[3/3] ████████████████████ Generazione: Richiedere ferie
  ├─ JSON generato              ✅
  ├─ Simulatore generato        ❌  target "selectTipoAssenza" non trovato nell'HTML
  └─ Validazione                saltata → missione in quarantena
```

Regole durante la generazione:
- Errori bloccanti → missione in **quarantena** (non pubblicata)
- Solo warning → pubblicata con segnalazione nel report
- Lo sviluppatore non viene interrotto durante il batch

### 5. Report finale

```
═══════════════════════════════════════════════
  BATCH COMPLETATO — [sorgente: nome-file.xlsx]
  Elaborate: 3 | Pubblicate: 2 | Quarantena: 1
═══════════════════════════════════════════════

✅ crea-ticket-supporto              → pubblicata
✅ modifica-telefono-anagrafica      → pubblicata ⚠️ 1 warning
❌ richiedi-ferie                    → in quarantena

DETTAGLIO QUARANTENA:
  richiedi-ferie: target "selectTipoAssenza" non trovato nel simulatore
  → Azione: /validate-mission richiedi-ferie per correggere e ripubblicare

═══════════════════════════════════════════════
```

### 6. Aggiornamento index.html

Aggiunge in blocco tutte le missioni approvate all'array `MISSIONS`
di `app/index.html`.
