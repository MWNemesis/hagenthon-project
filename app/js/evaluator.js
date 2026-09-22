/**
 * evaluator.js — valuta il log delle azioni rispetto agli step attesi.
 * Usato da result.html per costruire il report finale.
 */

function evaluate(steps, actionLog) {
  let errors = 0;

  const stepResults = steps.map((step) => {
    const found = actionLog.some(
      (a) => a.action === step.action && a.targetId === step.target
    );
    if (!found) errors++;

    return {
      description: step.description,
      ok: found,
      errorMessage: found ? '' : step.errorMessage,
    };
  });

  return {
    passed: errors === 0,
    errors,
    steps: stepResults,
  };
}
