# SE-Buddy Architecture

SE-Buddy is a gamified learning app for software engineering: a learning map, Python coding challenges that execute in the browser, quizzes, hints, XP, streaks and achievements. It is a **fully static site**: HTML, CSS and JavaScript files served as-is, with no server, no database and no build step.

This document explains how it is put together and, more importantly, why each choice was made and what it costs.

---

## 1. Goals and constraints

| Constraint | Consequence |
|---|---|
| Hosted on GitHub Pages | Only static files. No server code, no server-side rewrites, served from a `/<repo>/` sub-path. |
| Must run learner-written Python safely | Execution has to happen client-side, sandboxed, and be stoppable. |
| Small team / learning project | Few moving parts: no toolchain to install, upgrade or break. |
| Works for any visitor, no accounts | State lives in the browser, with an export/import escape hatch. |

Everything below follows from these four lines.

## 2. System overview

```
                    Browser
 ┌───────────────────────────────────────────────────────────┐
 │  index.html  (shell: #sidebar  #main  #panel)             │
 │                                                           │
 │  app.js ──────── router + views + challenge workspace     │
 │    │  │  │                                                │
 │    │  │  └─► editor.js   textarea + highlighted <pre>     │
 │    │  └────► runner.js ──postMessage──► worker.js          │
 │    │                                      │  Pyodide      │
 │    │                                      ▼  (CPython→WASM)│
 │    └──────► store.js ◄──► localStorage   jsDelivr CDN      │
 │                ▲                                           │
 │             data.js  (regions, topics, challenges)         │
 └───────────────────────────────────────────────────────────┘
                    GitHub Pages (static hosting)
```

Dependencies point one way, downwards: `app` → `store`/`editor`/`runner` → `data`. `data.js` knows nothing about the DOM; `store.js` knows nothing about views. This keeps content, rules and presentation separately changeable.

## 3. Why a static site?

**Theory.** A static site is a set of immutable files; the server's only job is to return bytes. All application logic runs on the client. The architecture is sometimes called a *client-side application with no backend*, and it sits at one end of the spectrum from server-rendered pages to full SPAs with APIs.

**Reasons for choosing it**
- **Hosting fit.** GitHub Pages is free, has a global CDN, HTTPS and zero operations. Any backend would need separate hosting, secrets, scaling and security work.
- **The problem has no shared state.** A single learner's progress is the only data. Nothing needs to be consistent across users, so a database would add cost without adding value.
- **Safety by construction.** Running untrusted Python on our own server is a security risk (sandbox escapes, resource abuse). Running it in the visitor's own browser means the worst a malicious snippet can do is affect that visitor's tab.
- **Instant deploys and rollbacks.** A deploy is "copy files"; a rollback is a git revert.

**Trade-offs accepted**
- No real multi-user features: the leaderboard rivals are sample data, clearly labelled as such.
- Progress is per-browser. Mitigated with JSON export/import in Profile.
- Client-side validation can be bypassed by a determined user (e.g. editing localStorage). Acceptable because there is nothing to protect: cheating only cheats yourself.

## 4. Why vanilla JavaScript, with no framework or bundler?

**Theory.** Frameworks (React, Vue, Svelte) solve *state-to-DOM synchronisation* at scale, using a virtual DOM or compile-time reactivity, plus component composition. Bundlers solve *module resolution, minification and dependency management*. Their value grows with the number of developers, components and dependencies.

**Reasons**
- The UI is a handful of views rendered from a small data set; re-rendering a template string is cheap and simple.
- No `node_modules`, no lockfile, no build failure modes, no supply-chain surface. The repo *is* the deployable artifact; CI only copies files and syntax-checks them.
- Smaller first load and nothing to hydrate.
- Easy for a learner to read: the code is the same HTML/CSS/JS they would see in a tutorial.

**Classic scripts, one global.** Files are plain `<script>` tags that attach to `window.SEB`, not ES modules. ES modules are blocked from `file://` and need CORS-correct serving; classic scripts load anywhere. Load order in `index.html` is the dependency order (`data` → `store` → `editor` → `runner` → `app`). The cost is a manual ordering rule and a single namespace; with ~1,000 lines that is a good trade.

**Where this would stop scaling.** If views grow complex, fine-grained updates matter, or several contributors need components and tests, adopting a framework and Vite becomes justified. The separation between `data`, `store` and `app` means that migration would mostly touch `app.js`.

**Rendering strategy.** Views are functions that return HTML strings; the router assigns them to `innerHTML`. Two safeguards follow:
1. Every dynamic value passes through `esc()` to prevent HTML injection (including the user-editable display name).
2. The challenge workspace is mounted separately from the home view, so completing a challenge refreshes the map, hero and sidebar (`refreshHome`) without destroying the learner's editor, tab and hint state.

## 5. Routing: hash-based

**Theory.** A client-side router maps the URL to a view without a page load. There are two mechanisms: the History API (`/challenge/prog-3`) and the URL fragment (`#/challenge/prog-3`).

**Reasoning.** History-API paths need the server to return `index.html` for unknown paths. GitHub Pages cannot do server rewrites, so a refresh on `/challenge/prog-3` would 404. Fragments are never sent to the server, so refresh, deep links and the back button work with zero configuration, and relative asset URLs stay valid under the `/<repo>/` sub-path. The cost is slightly less pretty URLs and no per-route SEO, which does not matter for an app behind an interaction loop.

Routes: `#/home`, `#/path`, `#/challenges`, `#/topics`, `#/topic/:id`, `#/region/:n`, `#/challenge/:id`, `#/achievements`, `#/leaderboard`, `#/profile`. Unknown routes render a not-found card.

## 6. Data model (`data.js`)

Content is **data, not code**. Three collections:

- **regions** – the seven map areas (position as a percentage, hue, icon).
- **topics** – nine subjects, each belonging to a region (`region`) and carrying a display number `n`.
- **challenges** – two kinds sharing one shape:
  - `code`: `fn` (function the tests call), `starter`, `tests` (visible), `hidden` (run only on Submit), three `hints`, `solution`.
  - `quiz`: four `options`, an `answer` index, an `explain` string, one `hint`.

Each challenge has a `level` (1-based within its topic) and an `xp` value. A challenge's visible number is `<topic.n>.<level>`.

**Why data-driven?** Adding a challenge is adding an object; no view or rule code changes. Tests are JSON-serialisable (`args`, `expected`), which matters because they cross the worker boundary (section 8).

**Why two challenge kinds?** Coding challenges cover programming topics where running code is the natural exercise. Topics such as security, DevOps and system design are conceptual, so multiple-choice quizzes give every region something playable without needing infrastructure to simulate.

**Quiz hints are generated.** Hint 2 strikes out one wrong option; hint 3 reveals the first letter. This gives three progressive hints without authoring three texts per question.

**Integrity checks.** Authoring errors are the main risk in data files, so every `solution` was verified to pass all its tests and every `starter` verified to fail at least one, using a script over the exported data.

## 7. State and game rules (`store.js`)

**State** is a single JSON object under the `localStorage` key `sebuddy.v1`: name, avatar, XP, gems, completed map (`id → {at, xp, hints}`), code drafts, hints revealed, daily counter, streak and seen achievements.

**Why localStorage?** It is synchronous, universally supported and sufficient for a few kilobytes. IndexedDB would add asynchronous complexity for no gain. All reads and writes are wrapped in `try/catch`, because storage can be unavailable (private mode, blocked cookies); the app then still works for the session.

**Versioned key and defaults.** The `v1` suffix lets a future incompatible change migrate or ignore old data. Loading merges saved data over `fresh()` defaults, so adding a new field never breaks existing saves.

**Derived, not stored.** Level, unlock status, region progress and achievements are *computed* from `completed` and `xp` on demand. Storing only the primary facts avoids two sources of truth drifting apart.

**Rules**
- Level = `floor(xp / 500) + 1`; one gem per completed challenge.
- Region *N* unlocks when region *N-1* is at least 50% complete; within a topic, level *k* unlocks when level *k-1* is done. Half-completion rather than full completion keeps learners from being blocked by one hard puzzle (a standard mastery-gating compromise in game design).
- Completion is idempotent: re-submitting never grants XP twice.
- Daily goal is 5 completions per local calendar day. Streak counts consecutive local days with at least one completion; it displays as 0 once a day has been missed.
- Achievements are predicates over state (e.g. "3 solved without hints"), evaluated before and after a completion so the UI can announce exactly what was newly unlocked.

**Gamification rationale.** XP, levels, streaks and goals are feedback loops that make progress visible and encourage regular practice; the gating gives a sense of a journey rather than a flat list. Hints are free but tracked, so the "Unassisted" achievement rewards solving without them while never blocking a stuck learner.

## 8. Running Python in the browser (`runner.js`, `worker.js`)

This is the most technically interesting part.

### 8.1 Pyodide

**Theory.** Pyodide is CPython compiled to WebAssembly (via Emscripten). WebAssembly is a compact binary format that browsers execute at near-native speed in a memory-safe sandbox. Running the real CPython interpreter means learners get genuine Python semantics and error messages.

**Alternatives considered**
| Option | Verdict |
|---|---|
| Server-side execution API | Needs a backend and a hardened sandbox: contradicts the static-hosting goal and is a security liability. |
| Third-party code-runner service | Adds an external dependency, rate limits and sometimes cost; also sends learner code off-device. |
| Transpiling Python to JS (Skulpt, Brython) | Smaller download, but partial language coverage and subtly different behaviour. |
| Teach JavaScript instead, run natively | Zero download, but changes the product to a JS course. |
| **Pyodide in the browser** | Full CPython, no server, code never leaves the device. **Chosen.** |

**Cost.** About 10 MB on the first run, downloaded from the jsDelivr CDN and cached by the browser afterwards. It is loaded lazily, on first focus of the editor or first Run, so visitors who only browse never pay for it. The version is pinned (`v0.26.4`) so a CDN update cannot change behaviour.

### 8.2 Why a Web Worker?

Python code runs synchronously. In the main thread, an infinite loop would freeze the entire page, and there is no way to interrupt it. In a Web Worker:
- The UI stays responsive while Pyodide loads and tests run.
- `worker.terminate()` kills the thread unconditionally. The runner starts a 5-second timer for each run; if it fires, the worker is terminated and the learner sees "Timed out… possible infinite loop". The next run re-creates the worker.

### 8.3 Protocol

```
main                         worker
 │ new Worker('js/worker.js')  │ importScripts(pyodide.js) → loadPyodide → define harness
 │ ◄──────────── {type:'ready'} │
 │ {type:'run', id, code, fn, tests} ─►  _seb_run(code, fn, tests_json)
 │ ◄────── {type:'result', id, report}   (JSON report)
```
Messages are structured-cloned, so tests must be plain data, which is why `expected` values are JSON. A request `id` ties each response to its run.

### 8.4 The Python harness

A small Python function, defined once in the worker, does the grading:
1. `exec` the learner's source in a fresh namespace with `compile(..., "main.py")`, so tracebacks name `main.py`.
2. Look up the function named in `fn`; report a clear error if it is missing.
3. For each test, call it with a deep copy of `args` (so a function that mutates its input cannot corrupt later tests).
4. Compare the JSON-normalised result with `expected` and also require equal types, so `True` does not pass as `1`.
5. Capture `stdout` through `contextlib.redirect_stdout` for the Output tab.
6. Convert exceptions to `line N: ErrorType: message` by walking the traceback to the last `main.py` frame.

The result is returned as one JSON string.

**Visible vs hidden tests.** Run Tests uses only the visible set; Submit adds the hidden set. Without hidden tests a learner could hard-code the displayed examples; with them, a solution must be correct in general.

**Failure handling.** Load timeout (90 s), load failure (offline or CDN blocked), no `Worker` support, and `file://` all produce an explanatory message rather than a silent hang.

**Security note.** Learner code runs in the Pyodide sandbox inside a worker with no DOM access, but it is still the learner's own code on their own machine. This is a learning tool, not a platform for running other people's code.

## 9. The editor (`editor.js`)

A code editor library (CodeMirror, Monaco) adds hundreds of KB to MBs and a dependency. The needs here are modest, so a lightweight technique is used: a transparent `<textarea>` layered exactly over a `<pre>` that contains the syntax-highlighted copy of the same text.
- The textarea provides native input, selection, undo, IME, mobile keyboards and accessibility for free.
- Highlighting is a single regular expression with alternation (comments, strings, keywords, numbers, built-ins) that walks the text once, escaping the gaps and wrapping tokens in `<span>`s.
- Scroll positions of the `<pre>` and the line-number gutter are synchronised with the textarea.
- Quality-of-life: Tab inserts four spaces, Enter keeps indentation and adds a level after a trailing `:`, and Ctrl/Cmd+Enter runs the tests.

Limitation: a regex highlighter is not a parser, so unusual constructs (nested f-string quotes, for instance) may be coloured imperfectly. This is cosmetic only, since execution is done by real Python.

## 10. The learning map

The map is **SVG scenery with real HTML on top**. The islands, trail and sea are SVG (they scale uniformly using a fixed `viewBox` and matching CSS `aspect-ratio`, so nothing distorts). The clickable region labels are ordinary absolutely-positioned `<a>` elements placed by percentage. This split matters:
- Links are keyboard-focusable, announced by screen readers (each has an `aria-label` such as "Databases & Storage, 0 of 4 complete, locked") and styled with CSS, none of which come easily with shapes inside an SVG.
- The decorative SVG is `aria-hidden`.
- The dashed trail turns gold up to the furthest unlocked region, so progress is visible at a glance.

A List View shows the same data as cards for anyone who prefers text or finds the map hard to use.

## 11. Layout, styling and accessibility

- **CSS custom properties** hold the palette; there is no preprocessor. A single dark theme matches the design and avoids doubling the visual surface to maintain.
- **CSS Grid** drives the page: sidebar + main + challenge panel on wide screens, the panel dropping below at 1280 px, and the sidebar becoming a header at 820 px.
- **Accessibility:** semantic landmarks, a skip link, visible focus rings, `aria-current` on navigation, `role="progressbar"` on bars, `role="radiogroup"` on quiz options, `aria-live` on results and toasts, native `<details>` for hints, and `prefers-reduced-motion` support.
- **No webfonts or images:** the system font stack, emoji and inline SVG keep the first load tiny and avoid extra requests.

## 12. Build and deployment

`.github/workflows/pages.yml` runs on every push to `main`:
1. Check out the repo.
2. `node --check` every script, a cheap guard against shipping a syntax error.
3. Copy only `index.html`, `css`, `js`, `assets` and `.nojekyll` into `_site/`, so design references and documentation are never published.
4. Upload and deploy with the official Pages actions.

`.nojekyll` stops GitHub from running Jekyll processing over the files. All URLs are relative, so the site works at `https://<user>.github.io/<repo>/`.

## 13. Testing approach

There is no test framework, in keeping with the zero-tooling constraint; verification is targeted:
- A script checks that every reference solution passes and no starter already passes.
- A headless-browser run drives the real UI: quiz flow, running and submitting code, hints, XP and achievements, rendering every route, and the infinite-loop timeout.

A natural next step is to turn those scripts into a CI job.

## 14. Known limitations and future directions

| Limitation | Possible direction |
|---|---|
| Python needs internet on first load and `http(s)` (not `file://`) | Vendor Pyodide into the repo or add a service worker for offline use. |
| Progress is per-browser | Optional sync via a backend or a user-owned gist. |
| Leaderboard is sample data | Needs a backend with authentication and anti-cheat. |
| Only Python challenges | The harness interface (`code`, `fn`, `tests`) could be reimplemented for JavaScript in a worker. |
| Regex syntax highlighter | Swap in CodeMirror if richer editing is needed. |
| Single string-template renderer | Introduce a framework if the UI outgrows it. |

## 15. Summary of decisions

| Decision | Chosen | Main reason |
|---|---|---|
| Hosting | GitHub Pages (static) | Free, zero ops, matches problem |
| UI | Vanilla JS, template strings | No toolchain, small, readable |
| Modules | Classic scripts on `window.SEB` | Works from any origin, no bundler |
| Routing | URL hash | No server rewrites needed |
| Content | Data file | Add challenges without touching logic |
| State | `localStorage` + derived values | Simple, one source of truth |
| Code execution | Pyodide in a Web Worker | Real Python, safe, interruptible, serverless |
| Editor | Textarea over highlighted `<pre>` | Native input behaviour, no dependency |
| Map | SVG scenery + HTML links | Accessible and scalable |
| Deploy | Actions copy-and-publish | Publishes only what the site needs |
