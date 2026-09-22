---
name: generate-simulator
description: >
  Genera il file HTML del simulatore di portale partendo dal JSON della missione
  e da uno o più screenshot del portale reale. Usa questa skill quando vuoi
  creare o aggiornare il simulatore di una missione esistente.
tools:
  - Read
  - Write
  - Agent
---

# Skill: generate-simulator

## Scopo

Dato il file JSON di una missione e uno o più screenshot del portale reale,
genera il file `app/missions/simulators/[id].html` — una riproduzione visiva
fedele del portale, con tutti gli elementi interattivi taggati con
`data-track-id` coerenti con i `target` definiti nel JSON.

---

## Come invocarla

```
/generate-simulator
```

Dopo l'invocazione fornisci:
1. **L'ID della missione** (o il path del JSON, es. `app/missions/crea-ticket-supporto.json`)
2. **Uno o più screenshot** del portale reale — allegali direttamente nella chat

Gli screenshot possono essere:
- L'intera schermata del portale
- Solo la sezione rilevante per la missione
- Schermate multiple che coprono i diversi step (es. schermata iniziale + form aperto)

---

## Processo di esecuzione

1. **Leggi il JSON** della missione per ottenere la lista degli step e i
   `target` attesi (es. `navSupporto`, `btnNuovoTicket`, `fieldTitolo`).

2. **Delega all'agente `simulator-builder`**, passandogli:
   - Il contenuto completo del JSON della missione
   - Gli screenshot allegati
   - La lista dei `target` da mappare obbligatoriamente

3. **L'agente `simulator-builder`** analizza gli screenshot e genera l'HTML.

4. **Verifica** che nel file generato ogni `target` del JSON sia presente come
   attributo `data-track-id` su un elemento interattivo.

5. **Scrivi** il file in `app/missions/simulators/[id].html`.

6. **Segnala** eventuali target non mappati e chiedi conferma prima di salvare.

---

## Struttura dell'HTML generato

Il simulatore è un file HTML autonomo che:

- Riproduce visivamente il portale reale (layout, colori, font, icone)
- Include `../js/tracker.js` per il tracciamento automatico delle azioni
- Espone una **barra di controllo** in cima (fornita dallo skill, non dal portale)
  con: nome missione | pulsante Suggerimento | pulsante Completa
- Ha tutti gli elementi interattivi degli step con attributo `data-track-id`
- Non fa chiamate a server reali — ogni azione è solo UI (form fake, navigazione
  simulata tra sezioni con show/hide di div)

### Template base dell'HTML generato

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>[Titolo Missione] — Simulatore</title>
  <link rel="stylesheet" href="../../css/style.css" />
  <style>
    /* Stili specifici del portale simulato, derivati dagli screenshot */
  </style>
</head>
<body class="simulator-layout">

  <!-- Barra di controllo (fissa, non fa parte del portale simulato) -->
  <div class="simulator-bar">
    <div class="mission-label">🎯 [Titolo Missione]</div>
    <div style="display:flex;gap:.5rem;">
      <button class="hint-toggle" onclick="toggleHint()">💡 Suggerimento</button>
      <button class="complete-btn" onclick="Tracker.complete()">✓ Completa</button>
    </div>
  </div>

  <!-- Pannello suggerimento (nascosto di default) -->
  <div class="hint-panel" id="hint-panel">
    [Testo del suggerimento per lo step corrente — aggiornato dinamicamente]
  </div>

  <!-- Contenuto del portale simulato -->
  <div class="simulator-content">
    <!-- UI del portale riprodotta dagli screenshot -->
    <!-- Ogni elemento interattivo ha data-track-id corrispondente al target del JSON -->
  </div>

  <script src="../../js/tracker.js"></script>
  <script>
    function toggleHint() {
      document.getElementById('hint-panel').classList.toggle('visible');
    }

    // Navigazione simulata: mostra/nasconde sezioni senza server
    function showSection(id) {
      document.querySelectorAll('.sim-section').forEach(s => s.style.display = 'none');
      document.getElementById(id).style.display = 'block';
    }
  </script>
</body>
</html>
```

---

## Regole per l'agente simulator-builder

Queste regole vengono passate all'agente ad ogni invocazione:

- **Fedeltà visiva**: riproduce colori, font, layout e icone degli screenshot
  il più fedelmente possibile usando CSS inline o un blocco `<style>`.
- **Nessuna chiamata esterna**: niente API, niente immagini remote — usa emoji
  o SVG inline al posto di icone, placeholder colorati al posto di loghi.
- **Navigazione fake**: ogni click su un elemento che aprirebbe una nuova
  pagina nel portale reale deve invece mostrare/nascondere una sezione `<div>`
  con `class="sim-section"`.
- **Mapping obbligatorio**: ogni `target` del JSON deve comparire esattamente
  come `data-track-id` su un elemento. Se un target non è visibile negli
  screenshot, l'agente lo segnala e propone dove inserirlo.
- **Elementi interattivi**: i `data-track-id` vanno su `<button>`, `<a>`,
  `<input>`, `<select>`, `<form>` — mai su `<div>` passivi.
- **Suggerimento dinamico**: il pannello hint mostra il testo dello step
  corrente. L'agente inserisce la logica JS per aggiornarlo in base alle
  azioni già tracciate.
