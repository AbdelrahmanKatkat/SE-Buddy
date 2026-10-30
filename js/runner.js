/* Main-thread side of the Python runner. Owns the worker, load state and the infinite-loop timeout. */
(function (SEB) {
  'use strict';

  const LOAD_TIMEOUT_MS = 90000;
  const RUN_TIMEOUT_MS = 5000;

  let worker = null;
  let readyPromise = null;
  let seq = 0;
  let pending = null;
  const listeners = new Set();

  const status = { state: 'idle' }; // idle | loading | ready | error
  function setStatus(state, message) {
    status.state = state; status.message = message;
    listeners.forEach((fn) => fn(status));
  }

  function start() {
    if (readyPromise) return readyPromise;
    if (typeof Worker === 'undefined') {
      setStatus('error', 'Web Workers are not available in this browser.');
      return Promise.reject(new Error(status.message));
    }
    setStatus('loading');
    readyPromise = new Promise((resolve, reject) => {
      try {
        worker = new Worker('js/worker.js');
      } catch (e) {
        const msg = 'The Python runtime could not start. If you opened index.html from disk, serve the folder over http (for example "python -m http.server") instead.';
        setStatus('error', msg);
        readyPromise = null;
        reject(new Error(msg));
        return;
      }
      const timer = setTimeout(() => fail('Loading Python took too long. Check your connection and try again.'), LOAD_TIMEOUT_MS);
      const fail = (msg) => {
        clearTimeout(timer);
        if (worker) worker.terminate();
        worker = null; readyPromise = null;
        setStatus('error', msg);
        reject(new Error(msg));
      };
      worker.onerror = () => fail('The Python runtime failed to load. It needs internet access to download Pyodide from the jsDelivr CDN.');
      worker.onmessage = (ev) => {
        const m = ev.data;
        if (m.type === 'ready') { clearTimeout(timer); setStatus('ready'); resolve(); }
        else if (m.type === 'fatal') fail(m.message);
        else if (m.type === 'result' && pending && pending.id === m.id) {
          clearTimeout(pending.timer);
          const p = pending; pending = null;
          p.resolve(m.report);
        }
      };
    });
    return readyPromise;
  }

  // Runs `tests` against `code`. Rejects with an Error whose message is shown to the learner.
  async function run(code, fn, tests) {
    await start();
    if (pending) throw new Error('Tests are already running.');
    return new Promise((resolve, reject) => {
      const id = ++seq;
      const timer = setTimeout(() => {
        // Killing the worker is the only way to stop an infinite loop in Python.
        if (worker) worker.terminate();
        worker = null; readyPromise = null; pending = null;
        setStatus('idle');
        reject(new Error('Timed out after ' + RUN_TIMEOUT_MS / 1000 + ' seconds. Your code may contain an infinite loop or be too slow.'));
      }, RUN_TIMEOUT_MS);
      pending = { id, timer, resolve, reject };
      worker.postMessage({ type: 'run', id, code, fn, tests });
    });
  }

  SEB.runner = {
    run, start, status,
    onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); }
  };
})(window.SEB = window.SEB || {});
