const WORKER_SCRIPT = `
'use strict';

// Restringir APIs de red/almacenamiento dentro del sandbox
const blocked = () => {
  throw new Error('Operación de red o almacenamiento deshabilitada en este entorno.');
};
try {
  self.fetch = blocked;
  self.XMLHttpRequest = function () { blocked(); };
  self.WebSocket = function () { blocked(); };
  self.importScripts = blocked;
} catch (_) {}

function formatValue(val, depth = 0) {
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (typeof val === 'string') return depth === 0 ? val : JSON.stringify(val);
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
    return String(val);
  }
  if (typeof val === 'function') {
    return '[Function: ' + (val.name || 'anonymous') + ']';
  }
  if (val instanceof Error) {
    return val.name + ': ' + val.message;
  }
  if (Array.isArray(val)) {
    if (depth > 3) return '[Array]';
    const items = val.map((item) => formatValue(item, depth + 1));
    return '[' + items.join(', ') + ']';
  }
  if (typeof val === 'object') {
    if (depth > 3) return '[Object]';
    try {
      const entries = Object.entries(val).map(
        ([k, v]) => k + ': ' + formatValue(v, depth + 1)
      );
      return '{ ' + entries.join(', ') + ' }';
    } catch (_) {
      return String(val);
    }
  }
  return String(val);
}

self.onmessage = function (event) {
  const { code, inputs } = event.data;
  const inputQueue = Array.isArray(inputs) ? [...inputs] : [];
  let inputIndex = 0;

  const emit = (type, payload) => {
    self.postMessage({ type, ...payload });
  };

  const sandboxConsole = {
    log: (...args) => emit('log', { level: 'log', text: args.map((a) => formatValue(a)).join(' ') }),
    info: (...args) => emit('log', { level: 'info', text: args.map((a) => formatValue(a)).join(' ') }),
    warn: (...args) => emit('log', { level: 'warn', text: args.map((a) => formatValue(a)).join(' ') }),
    error: (...args) => emit('log', { level: 'error', text: args.map((a) => formatValue(a)).join(' ') }),
    clear: () => emit('clear', {}),
    table: (data) => {
      if (Array.isArray(data) || (data && typeof data === 'object')) {
        emit('table', { data: JSON.parse(JSON.stringify(data)) });
      } else {
        emit('log', { level: 'log', text: formatValue(data) });
      }
    },
  };

  const NEED_INPUT_TAG = '__NEED_PROMPT_INPUT__';

  const sandboxPrompt = (message = 'Ingresa un valor:') => {
    if (inputIndex < inputQueue.length) {
      const value = inputQueue[inputIndex++];
      emit('log', { level: 'prompt', text: String(message) + ' -> ' + value });
      return value;
    }
    const err = new Error(NEED_INPUT_TAG);
    err.promptMessage = String(message);
    throw err;
  };

  const sandboxAlert = (message = '') => {
    emit('log', { level: 'info', text: '[alert] ' + formatValue(message) });
  };

  const start = performance.now();

  try {
    const fn = new Function('console', 'prompt', 'alert', '"use strict";\\n' + code);
    const result = fn(sandboxConsole, sandboxPrompt, sandboxAlert);
    const elapsedMs = Math.round((performance.now() - start) * 100) / 100;

    if (result !== undefined) {
      emit('log', { level: 'result', text: formatValue(result) });
    }
    emit('done', { elapsedMs });
  } catch (err) {
    if (err && err.message === NEED_INPUT_TAG) {
      emit('need_input', { message: err.promptMessage || 'Ingresa un valor:' });
      return;
    }
    const elapsedMs = Math.round((performance.now() - start) * 100) / 100;
    const message = err instanceof Error ? err.name + ': ' + err.message : String(err);
    emit('error', { text: message, elapsedMs });
  }
};
`;

const EXECUTION_TIMEOUT_MS = 3500;

/**
 * Ejecuta código JavaScript dentro de un Web Worker aislado con tiempo límite.
 */
export function runJavaScriptInSandbox({
  code,
  inputs,
  onLog,
  onTable,
  onClear,
  onNeedInput,
  onDone,
  onError,
}) {
  const blob = new Blob([WORKER_SCRIPT], { type: 'text/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);

  let settled = false;

  const cleanup = () => {
    clearTimeout(timeoutId);
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
  };

  const timeoutId = setTimeout(() => {
    if (settled) return;
    settled = true;
    cleanup();
    onError(
      'Tiempo límite excedido (3.5 s). Posible ciclo infinito detenido automáticamente.',
      EXECUTION_TIMEOUT_MS
    );
  }, EXECUTION_TIMEOUT_MS);

  worker.onmessage = (event) => {
    const msg = event.data;
    if (msg.type === 'log') {
      onLog({ level: msg.level, text: msg.text });
    } else if (msg.type === 'table') {
      onTable(msg.data);
    } else if (msg.type === 'clear') {
      onClear();
    } else if (msg.type === 'need_input') {
      if (settled) return;
      settled = true;
      cleanup();
      onNeedInput(msg.message);
    } else if (msg.type === 'done') {
      if (settled) return;
      settled = true;
      cleanup();
      onDone(msg.elapsedMs);
    } else if (msg.type === 'error') {
      if (settled) return;
      settled = true;
      cleanup();
      onError(msg.text, msg.elapsedMs);
    }
  };

  worker.onerror = (err) => {
    if (settled) return;
    settled = true;
    cleanup();
    onError(err.message || 'Error de sintaxis o ejecución.', 0);
  };

  worker.postMessage({ code, inputs });

  return ({ silent = false } = {}) => {
    if (settled) return;
    settled = true;
    cleanup();
    if (!silent) {
      onError('Ejecución detenida por el usuario.', 0);
    }
  };
}
