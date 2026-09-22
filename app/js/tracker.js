/**
 * tracker.js — incluso in ogni simulatore generato.
 * Registra le azioni dell'utente e le salva in sessionStorage.
 */

const Tracker = (() => {
  const log = [];

  function record(action, targetId, value = null) {
    log.push({ action, targetId, value, ts: Date.now() });
  }

  function getLog() {
    return [...log];
  }

  function reset() {
    log.length = 0;
  }

  // Registra click su elementi con data-track-id
  function init() {
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-track-id]');
      if (el) record('click', el.dataset.trackId);
    });

    document.addEventListener('change', (e) => {
      const el = e.target.closest('[data-track-id]');
      if (el) record('fill', el.dataset.trackId, el.value);
    });

    document.addEventListener('submit', (e) => {
      const el = e.target.closest('[data-track-id]');
      if (el) record('submit', el.dataset.trackId);
    });
  }

  // Chiamato dal pulsante "Completa" del simulatore
  function complete() {
    sessionStorage.setItem('actionLog', JSON.stringify(log));
    // Valuta e reindirizza al risultato
    const mission = JSON.parse(sessionStorage.getItem('currentMission') || '{}');
    if (!mission.steps) {
      window.location.href = '../result.html';
      return;
    }
    const result = evaluate(mission.steps, log);
    sessionStorage.setItem('sessionResult', JSON.stringify(result));
    window.location.href = '../result.html';
  }

  return { init, record, getLog, reset, complete };
})();

// Importa evaluator inline se non già disponibile
function evaluate(steps, log) {
  let errors = 0;
  const stepResults = steps.map((step) => {
    const found = log.some(
      (a) => a.action === step.action && a.targetId === step.target
    );
    if (!found) errors++;
    return {
      description: step.description,
      ok: found,
      errorMessage: found ? '' : step.errorMessage,
    };
  });

  return { passed: errors === 0, errors, steps: stepResults };
}

Tracker.init();
