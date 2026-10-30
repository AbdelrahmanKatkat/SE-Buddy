/* Web Worker: loads Pyodide (CPython in WebAssembly) and runs a challenge's tests against the learner's code. */
'use strict';

const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/';

const HARNESS = `
import json, io, contextlib, traceback, copy

def _where(e):
    tb = e.__traceback__
    line = None
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == "main.py":
            line = tb.tb_lineno
        tb = tb.tb_next
    if isinstance(e, SyntaxError) and e.lineno:
        line = e.lineno
    msg = type(e).__name__ + ": " + str(e)
    return ("line %d: " % line if line else "") + msg

def _seb_run(code, fn, tests_json):
    out = io.StringIO()
    report = {"setup": None, "results": [], "stdout": ""}
    ns = {"__name__": "__main__"}
    try:
        with contextlib.redirect_stdout(out):
            exec(compile(code, "main.py", "exec"), ns)
        func = ns.get(fn)
        if not callable(func):
            raise NameError("function '%s' is not defined" % fn)
    except BaseException as e:
        report["setup"] = _where(e)
        report["stdout"] = out.getvalue()
        return json.dumps(report)
    for t in json.loads(tests_json):
        entry = {"ok": False, "got": "", "expected": repr(t["expected"]), "error": None}
        try:
            with contextlib.redirect_stdout(out):
                got = func(*copy.deepcopy(t["args"]))
            entry["got"] = repr(got)
            try:
                norm = json.loads(json.dumps(got))
            except Exception:
                norm = got
            entry["ok"] = bool(norm == t["expected"]) and type(norm) is type(t["expected"])
        except BaseException as e:
            entry["error"] = _where(e)
        report["results"].append(entry)
    report["stdout"] = out.getvalue()[:4000]
    return json.dumps(report)
`;

let pyodide = null;

async function boot() {
  importScripts(PYODIDE_URL + 'pyodide.js');
  pyodide = await loadPyodide({ indexURL: PYODIDE_URL });
  pyodide.runPython(HARNESS);
  postMessage({ type: 'ready' });
}

boot().catch((e) => postMessage({ type: 'fatal', message: 'Could not load the Python runtime: ' + (e && e.message ? e.message : e) }));

self.onmessage = (ev) => {
  const m = ev.data;
  if (m.type !== 'run' || !pyodide) return;
  try {
    const fn = pyodide.globals.get('_seb_run');
    const json = fn(m.code, m.fn, JSON.stringify(m.tests));
    fn.destroy();
    postMessage({ type: 'result', id: m.id, report: JSON.parse(json) });
  } catch (e) {
    postMessage({ type: 'result', id: m.id, report: { setup: String(e && e.message ? e.message : e), results: [], stdout: '' } });
  }
};
