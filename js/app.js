/* SE-Buddy UI: hash router, views and the challenge workspace. */
(function (SEB) {
  'use strict';

  const S = SEB.store;
  const { regions, topics, challenges, quotes } = SEB.data;

  /* ---------- helpers ---------- */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const ICON_PATHS = {
    home: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
    path: 'M3 17l6-6 4 4 8-8M17 7h4v4',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z',
    grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
    trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3',
    board: 'M5 21V10M12 21V4M19 21v-7',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
    lock: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4',
    check: 'M5 12l5 5 9-10',
    flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
    arrow: 'M5 12h14M13 6l6 6-6 6',
    play: 'M7 5l12 7-12 7z',
    x: 'M6 6l12 12M18 6L6 18',
    chevron: 'M6 9l6 6 6-6',
    bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 0 0-4-10z',
    bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
    gem: 'M6 3h12l4 6-10 12L2 9zM2 9h20',
    crown: 'M3 8l4 4 5-7 5 7 4-4-2 11H5z'
  };
  const icon = (name, size) =>
    '<svg class="ic" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICON_PATHS[name] + '"/></svg>';

  // Python-style repr of a JSON value, so expected values read like the editor's language.
  function pyRepr(v) {
    if (v === null) return 'None';
    if (v === true) return 'True';
    if (v === false) return 'False';
    if (typeof v === 'string') return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
    if (Array.isArray(v)) return '[' + v.map(pyRepr).join(', ') + ']';
    if (typeof v === 'object') return '{' + Object.keys(v).map((k) => pyRepr(k) + ': ' + pyRepr(v[k])).join(', ') + '}';
    return String(v);
  }

  function toast(msg, kind) {
    const host = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.remove(), 3800);
  }

  /* ---------- shell ---------- */
  const NAV = [
    ['home', 'Home', 'home'], ['path', 'Learning Path', 'path'], ['challenges', 'Challenges', 'shield'],
    ['topics', 'Topics', 'grid'], ['achievements', 'Achievements', 'trophy'], ['leaderboard', 'Leaderboard', 'board'], ['profile', 'Profile', 'user']
  ];

  function renderSidebar(active) {
    const goal = S.DAILY_GOAL;
    const count = S.dailyCount();
    const C = 2 * Math.PI * 48;
    const off = C * (1 - Math.min(1, count / goal));
    const streak = S.streakCount();
    const quote = quotes[new Date().getDate() % quotes.length];
    $('#sidebar').innerHTML =
      '<a class="brand" href="#/home" aria-label="SE-Buddy home"><span class="brand-bot" aria-hidden="true">🤖</span><span class="brand-name">SE-Buddy</span><span class="brand-tag">Learn · Solve · Build</span></a>' +
      '<nav class="nav" aria-label="Main">' + NAV.map(([id, label, ic]) =>
        '<a href="#/' + id + '" class="nav-item' + (active === id ? ' active' : '') + '"' + (active === id ? ' aria-current="page"' : '') + '>' + icon(ic, 20) + '<span>' + label + '</span></a>').join('') + '</nav>' +
      '<div class="goal-card"><h3>Daily Goal</h3>' +
      '<div class="ring" role="img" aria-label="' + count + ' of ' + goal + ' challenges today"><svg viewBox="0 0 110 110"><circle cx="55" cy="55" r="48" class="ring-bg"/><circle cx="55" cy="55" r="48" class="ring-fg" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + off.toFixed(1) + '" transform="rotate(-90 55 55)"/></svg>' +
      '<div class="ring-txt"><strong>' + Math.min(count, 99) + '/' + goal + '</strong><span>Challenges</span></div></div>' +
      '<div class="streak">' + icon('flame', 16) + ' ' + streak + ' day streak!</div></div>' +
      '<div class="quote-card"><p>“' + esc(quote) + '”</p><span class="mascot" aria-hidden="true">🤖</span></div>';
  }

  /* ---------- reusable pieces ---------- */
  function statusIcon(c) {
    if (S.isDone(c.id)) return '<span class="st st-done" title="Completed">' + icon('check', 14) + '</span>';
    if (!S.challengeUnlocked(c)) return '<span class="st st-lock" title="Locked">' + icon('lock', 14) + '</span>';
    return '<span class="st st-open" title="Ready"></span>';
  }

  function challengeRow(c) {
    const t = S.topicOf(c);
    const locked = !S.challengeUnlocked(c);
    return '<a class="crow' + (locked ? ' is-locked' : '') + '" href="#/challenge/' + c.id + '">' + statusIcon(c) +
      '<span class="crow-num">' + S.numberOf(c) + '</span>' +
      '<span class="crow-main"><strong>' + esc(c.title) + '</strong><small>' + esc(t.name) + ' · ' + esc(c.type) + '</small></span>' +
      '<span class="xp-chip">+' + c.xp + ' XP</span></a>';
  }

  const bar = (pct) => '<div class="bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100"><i style="width:' + pct + '%"></i></div>';

  /* ---------- views ---------- */
  function heroSection() {
    const lv = S.levelInfo();
    const pct = Math.round((lv.into / lv.size) * 100);
    const next = S.nextChallenge();
    return '<section class="hero card">' +
      '<svg class="skyline" viewBox="0 0 400 160" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">' +
      '<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1030"/><stop offset="1" stop-color="#2a1b5e"/></linearGradient></defs>' +
      '<rect width="400" height="160" fill="url(#sky)"/>' +
      '<g fill="#fff" opacity=".7"><circle cx="40" cy="20" r="1"/><circle cx="120" cy="40" r="1.2"/><circle cx="210" cy="14" r="1"/><circle cx="300" cy="30" r="1.4"/><circle cx="360" cy="12" r="1"/><circle cx="260" cy="60" r="1"/></g>' +
      '<g fill="#0a0d24"><polygon points="0,160 0,110 30,110 30,90 50,90 50,120 80,120 80,100 110,100 110,160"/><polygon points="130,160 130,80 150,60 170,80 170,160"/><rect x="180" y="90" width="40" height="70"/><polygon points="230,160 230,50 245,30 260,50 260,160"/><rect x="270" y="100" width="35" height="60"/><polygon points="315,160 315,70 345,70 345,40 365,40 365,90 400,90 400,160"/></g>' +
      '<g fill="#ffcf5a" opacity=".85"><rect x="138" y="100" width="4" height="6"/><rect x="152" y="100" width="4" height="6"/><rect x="238" y="80" width="4" height="6"/><rect x="248" y="110" width="4" height="6"/><rect x="326" y="85" width="4" height="6"/><rect x="346" y="60" width="4" height="6"/><rect x="190" y="110" width="4" height="6"/></g></svg>' +
      '<div class="hero-copy"><h1>Master Software Engineering <span class="grad">One Puzzle at a Time</span></h1>' +
      '<p>Solve real-world challenges, unlock new topics, and build your skills from fundamentals to expert level.</p>' +
      (next ? '<a class="btn primary" href="#/challenge/' + next.id + '">Continue Journey ' + icon('arrow', 16) + '</a>'
        : '<a class="btn primary" href="#/achievements">You finished everything! ' + icon('trophy', 16) + '</a>') + '</div>' +
      '<div class="path-card"><div class="pc-top"><span class="pc-title">' + icon('crown', 22) + ' Your Path</span><span class="pc-gems">' + icon('gem', 14) + ' ' + S.get().gems + '</span></div>' +
      '<div class="pc-level">Level ' + lv.level + '</div>' + bar(pct) + '<div class="pc-xp">' + lv.into + ' / ' + lv.size + ' XP</div></div></section>';
  }

  /* Map view: SVG scenery underneath, accessible HTML buttons on top. */
  function mapView() {
    const W = 1000, H = 560;
    const pts = regions.map((r) => [r.x * W / 100, r.y * H / 100]);
    let paths = '';
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + (i % 2 ? -40 : 40);
      const lit = S.regionUnlocked(regions[i + 1].id);
      paths += '<path d="M' + x1 + ',' + y1 + ' Q' + mx + ',' + my + ' ' + x2 + ',' + y2 + '" class="trail' + (lit ? ' lit' : '') + '"/>';
    }
    let islands = '';
    regions.forEach((r, i) => {
      const [cx, cy] = pts[i];
      const open = S.regionUnlocked(r.id);
      const sat = open ? 55 : 18;
      islands += '<g class="island' + (open ? '' : ' dim') + '">' +
        '<ellipse cx="' + cx + '" cy="' + (cy + 14) + '" rx="150" ry="92" fill="rgba(0,0,0,.28)"/>' +
        '<ellipse cx="' + cx + '" cy="' + cy + '" rx="140" ry="86" fill="hsl(' + r.hue + ',' + sat + '%,24%)"/>' +
        '<ellipse cx="' + cx + '" cy="' + (cy - 6) + '" rx="118" ry="68" fill="hsl(' + r.hue + ',' + sat + '%,34%)"/>' +
        '<ellipse cx="' + (cx - 10) + '" cy="' + (cy - 14) + '" rx="80" ry="42" fill="hsl(' + r.hue + ',' + sat + '%,42%)" opacity=".7"/>' +
        '<circle cx="' + (cx - 100) + '" cy="' + (cy + 20) + '" r="12" fill="hsl(' + r.hue + ',' + sat + '%,20%)"/><circle cx="' + (cx + 96) + '" cy="' + (cy + 26) + '" r="14" fill="hsl(' + r.hue + ',' + sat + '%,20%)"/><circle cx="' + (cx + 60) + '" cy="' + (cy - 44) + '" r="9" fill="hsl(' + r.hue + ',' + sat + '%,20%)"/></g>';
    });
    const nodes = regions.map((r) => {
      const p = S.regionProgress(r.id);
      const open = S.regionUnlocked(r.id);
      const done = p.total > 0 && p.done === p.total;
      const badge = done ? '<span class="st st-done">' + icon('check', 12) + '</span>' : open ? '' : icon('lock', 14);
      return '<a class="node' + (open ? '' : ' locked') + '" style="left:' + r.x + '%;top:' + r.y + '%" href="#/region/' + r.id + '" aria-label="' + esc(r.name) + ', ' + p.done + ' of ' + p.total + ' complete' + (open ? '' : ', locked') + '">' +
        '<span class="node-ico" aria-hidden="true">' + r.icon + '</span>' +
        '<span class="node-card"><span class="node-name">' + badge + ' ' + r.id + '. ' + esc(r.short) + '</span><span class="node-prog">' + (done ? icon('check', 12) : '') + ' ' + p.done + '/' + p.total + '</span></span></a>';
    }).join('');
    return '<div class="map" style="aspect-ratio:' + W + '/' + H + '"><svg viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<defs><radialGradient id="sea" cx=".5" cy=".5" r=".8"><stop offset="0" stop-color="#103a5e"/><stop offset="1" stop-color="#071526"/></radialGradient></defs>' +
      '<rect width="' + W + '" height="' + H + '" fill="url(#sea)"/>' +
      '<g stroke="rgba(255,255,255,.07)" fill="none"><path d="M0,120 q60,-14 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0"/><path d="M0,330 q60,-14 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0"/><path d="M0,500 q60,-14 120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0 t120,0"/></g>' +
      islands + paths + '</svg>' + nodes + '</div>';
  }

  function listView() {
    return '<div class="list-view">' + regions.map((r) => {
      const p = S.regionProgress(r.id);
      const open = S.regionUnlocked(r.id);
      return '<article class="region-card' + (open ? '' : ' is-locked') + '"><header><span class="rc-ico">' + r.icon + '</span><div><h3>' + r.id + '. ' + esc(r.name) + '</h3><small>' + p.done + '/' + p.total + ' complete' + (open ? '' : ' · locked') + '</small></div>' +
        (open ? '<a class="btn ghost sm" href="#/region/' + r.id + '">Open</a>' : '<span class="lock-note">' + icon('lock', 14) + ' Finish 50% of region ' + (r.id - 1) + '</span>') + '</header>' + bar(p.pct) +
        (open ? '<div class="chips">' + S.regionChallenges(r.id).map((c) => '<a class="chip ' + (S.isDone(c.id) ? 'done' : S.challengeUnlocked(c) ? 'open' : 'locked') + '" href="#/challenge/' + c.id + '" title="' + esc(c.title) + '">' + S.numberOf(c) + '</a>').join('') + '</div>' : '') + '</article>';
    }).join('') + '</div>';
  }

  function topicCard(t) {
    const p = S.topicProgress(t.id);
    const unlocked = S.regionUnlocked(t.region);
    return '<a class="topic-card' + (unlocked ? '' : ' is-locked') + '" href="#/topic/' + t.id + '"><span class="tc-ico" aria-hidden="true">' + t.icon + '</span><strong>' + esc(t.name) + '</strong><small>' + p.total + ' levels</small>' + bar(p.pct) + '</a>';
  }

  function homeView(state) {
    const mode = state.mapMode || 'map';
    return heroSection() +
      '<section class="card journey"><div class="sec-head"><div><h2>Learning Journey</h2><p>Explore topics and complete challenges to unlock new areas</p></div>' +
      '<div class="seg" role="tablist" aria-label="Journey view"><button role="tab" aria-selected="' + (mode === 'map') + '" data-mode="map" class="' + (mode === 'map' ? 'on' : '') + '">Map View</button><button role="tab" aria-selected="' + (mode === 'list') + '" data-mode="list" class="' + (mode === 'list' ? 'on' : '') + '">List View</button></div></div>' +
      (mode === 'map' ? mapView() : listView()) + '</section>' +
      '<section class="card topics-strip"><div class="sec-head"><div><h2>Topics</h2><p>Explore all software engineering areas</p></div><a class="btn ghost sm" href="#/topics">View All ' + icon('arrow', 14) + '</a></div><div class="topic-grid">' + topics.map(topicCard).join('') + '</div></section>';
  }

  function pageHead(title, sub) {
    return '<header class="page-head"><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</header>';
  }

  function pathView() {
    const tot = S.totalProgress();
    return pageHead('Learning Path', 'Work through the regions in order. Each opens once you finish half of the one before.') +
      '<section class="card"><div class="sec-head"><div><h2>Overall progress</h2><p>' + tot.done + ' of ' + tot.total + ' challenges complete</p></div></div>' + bar(tot.pct) + '</section>' + listView();
  }

  function challengesView(f) {
    const q = (f.q || '').toLowerCase();
    const list = challenges.filter((c) => {
      if (f.topic && c.topic !== f.topic) return false;
      if (f.kind && c.kind !== f.kind) return false;
      if (f.status === 'done' && !S.isDone(c.id)) return false;
      if (f.status === 'todo' && (S.isDone(c.id) || !S.challengeUnlocked(c))) return false;
      if (f.status === 'locked' && (S.isDone(c.id) || S.challengeUnlocked(c))) return false;
      if (q && !(c.title + ' ' + c.type + ' ' + S.topicOf(c).name).toLowerCase().includes(q)) return false;
      return true;
    });
    const opt = (v, label, cur) => '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + label + '</option>';
    return pageHead('Challenges', 'Every puzzle in one place. Filter by topic, type or status.') +
      '<section class="card"><div class="filters">' +
      '<input id="f-q" type="search" placeholder="Search challenges" aria-label="Search challenges" value="' + esc(f.q || '') + '">' +
      '<select id="f-topic" aria-label="Topic">' + opt('', 'All topics', f.topic || '') + topics.map((t) => opt(t.id, t.name, f.topic || '')).join('') + '</select>' +
      '<select id="f-kind" aria-label="Type">' + opt('', 'All types', f.kind || '') + opt('code', 'Coding', f.kind || '') + opt('quiz', 'Quizzes', f.kind || '') + '</select>' +
      '<select id="f-status" aria-label="Status">' + opt('', 'Any status', f.status || '') + opt('todo', 'Ready to play', f.status || '') + opt('done', 'Completed', f.status || '') + opt('locked', 'Locked', f.status || '') + '</select></div>' +
      '<div id="f-results" class="rows">' + (list.length ? list.map(challengeRow).join('') : '<p class="empty">No challenges match these filters.</p>') + '</div></section>';
  }

  function topicsView() {
    return pageHead('Topics', 'Nine areas of software engineering.') +
      '<div class="topic-grid big">' + topics.map((t) => {
        const p = S.topicProgress(t.id);
        return '<a class="card topic-card big' + (S.regionUnlocked(t.region) ? '' : ' is-locked') + '" href="#/topic/' + t.id + '"><span class="tc-ico" aria-hidden="true">' + t.icon + '</span><strong>' + esc(t.name) + '</strong><p>' + esc(t.desc) + '</p><small>' + p.done + '/' + p.total + ' complete</small>' + bar(p.pct) + '</a>';
      }).join('') + '</div>';
  }

  function topicView(id) {
    const t = topics.find((x) => x.id === id);
    if (!t) return notFound();
    const p = S.topicProgress(t.id);
    const r = regions.find((x) => x.id === t.region);
    return '<p class="crumb"><a href="#/topics">Topics</a> &rsaquo; ' + esc(t.name) + '</p>' + pageHead(t.icon + ' ' + t.name, esc(t.desc)) +
      '<section class="card"><div class="sec-head"><div><h2>' + p.done + '/' + p.total + ' complete</h2><p>Part of region ' + r.id + ': ' + esc(r.name) + (S.regionUnlocked(r.id) ? '' : ' (locked)') + '</p></div></div>' + bar(p.pct) +
      '<div class="rows">' + S.topicChallenges(t.id).map(challengeRow).join('') + '</div></section>';
  }

  function regionView(id) {
    const r = regions.find((x) => x.id === Number(id));
    if (!r) return notFound();
    const p = S.regionProgress(r.id);
    const open = S.regionUnlocked(r.id);
    const prev = regions.find((x) => x.id === r.id - 1);
    return '<p class="crumb"><a href="#/home">Home</a> &rsaquo; Region ' + r.id + '</p>' + pageHead(r.icon + ' ' + r.name, p.done + ' of ' + p.total + ' challenges complete') +
      (open ? '' : '<div class="card notice">' + icon('lock', 18) + ' This region is locked. Complete 50% of “' + esc(prev.name) + '” to open it.</div>') +
      topics.filter((t) => t.region === r.id).map((t) => '<section class="card"><div class="sec-head"><div><h2>' + t.icon + ' ' + esc(t.name) + '</h2><p>' + esc(t.desc) + '</p></div></div><div class="rows">' + S.topicChallenges(t.id).map(challengeRow).join('') + '</div></section>').join('');
  }

  function achievementsView() {
    const list = S.achievements();
    const n = list.filter((a) => a.unlocked).length;
    return pageHead('Achievements', n + ' of ' + list.length + ' unlocked') +
      '<div class="ach-grid">' + list.map((a) => '<div class="card ach' + (a.unlocked ? ' on' : '') + '"><span class="ach-ico" aria-hidden="true">' + (a.unlocked ? a.icon : '🔒') + '</span><strong>' + esc(a.name) + '</strong><p>' + esc(a.desc) + '</p><small>' + (a.unlocked ? 'Unlocked' : 'Locked') + '</small></div>').join('') + '</div>';
  }

  function leaderboardView() {
    const rows = S.leaderboard();
    return pageHead('Leaderboard', 'SE-Buddy is a static site with no server, so the other learners below are sample data. Your XP is real and stored in this browser.') +
      '<section class="card"><table class="board"><thead><tr><th>#</th><th>Learner</th><th>Level</th><th>XP</th></tr></thead><tbody>' +
      rows.map((r, i) => '<tr class="' + (r.me ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><span class="av">' + r.avatar + '</span> ' + esc(r.name) + (r.me ? ' <em>(you)</em>' : '') + '</td><td>' + (Math.floor(r.xp / 500) + 1) + '</td><td>' + r.xp.toLocaleString() + '</td></tr>').join('') + '</tbody></table></section>';
  }

  const AVATARS = ['🧑‍💻', '👩‍💻', '👨‍💻', '🦊', '🐧', '🚀', '🦉', '🐢', '🐙', '🦄', '🤖', '🐱'];
  function profileView() {
    const st = S.get();
    const lv = S.levelInfo();
    const tot = S.totalProgress();
    return pageHead('Profile') +
      '<section class="card profile"><div class="pf-top"><span class="pf-av">' + st.avatar + '</span><div><h2>' + esc(st.name) + '</h2><p>Level ' + lv.level + ' · ' + st.xp + ' XP</p></div></div>' +
      '<div class="stats"><div><strong>' + tot.done + '/' + tot.total + '</strong><span>Challenges</span></div><div><strong>' + st.gems + '</strong><span>Gems</span></div><div><strong>' + S.streakCount() + '</strong><span>Day streak</span></div><div><strong>' + S.achievements().filter((a) => a.unlocked).length + '</strong><span>Achievements</span></div></div></section>' +
      '<section class="card"><h2>Edit profile</h2><form id="pf-form"><label>Display name<input id="pf-name" maxlength="24" value="' + esc(st.name) + '"></label>' +
      '<fieldset><legend>Avatar</legend><div class="avs">' + AVATARS.map((a) => '<label><input type="radio" name="av" value="' + a + '"' + (a === st.avatar ? ' checked' : '') + '><span>' + a + '</span></label>').join('') + '</div></fieldset>' +
      '<button class="btn primary" type="submit">Save</button></form></section>' +
      '<section class="card"><h2>Your data</h2><p class="muted">Progress lives only in this browser. Export it to back it up or move to another device.</p><div class="btn-row">' +
      '<button class="btn ghost" id="pf-export">Export progress</button><label class="btn ghost file">Import progress<input id="pf-import" type="file" accept="application/json" hidden></label><button class="btn danger" id="pf-reset">Reset all progress</button></div></section>';
  }

  function notFound() {
    return '<div class="card notice">Page not found. <a href="#/home">Back to Home</a></div>';
  }

  /* ---------- challenge workspace ---------- */
  function mountWorkspace(host, c, opts) {
    const done = () => S.isDone(c.id);
    const t = S.topicOf(c);
    const locked = !S.challengeUnlocked(c);
    const isCode = c.kind === 'code';
    let tab = 'tests';
    let report = null;     // last run report
    let ranHidden = false;
    let outputText = '';
    let busy = false;
    let picked = null;     // quiz selection
    let quizFeedback = null;
    let editor = null;

    const hintList = () => {
      if (isCode) return c.hints;
      const wrong = c.options.find((_, i) => i !== c.answer);
      return [c.hint, 'Eliminate this one: “' + wrong + '” is not the answer.', 'The answer starts with “' + c.options[c.answer].charAt(0) + '”.'];
    };

    host.innerHTML =
      '<div class="ws">' +
      '<p class="crumb">' + esc(t.name) + ' &rsaquo; Level ' + c.level + '</p>' +
      '<div class="ws-head"><h2>Challenge ' + S.numberOf(c) + '</h2><span class="xp-badge">' + icon('bolt', 14) + ' +' + c.xp + ' XP</span></div>' +
      '<p class="ws-sub">' + esc(c.title) + (done() ? ' <span class="pill ok">' + icon('check', 12) + ' Completed</span>' : '') + '</p>' +
      '<p class="ws-desc">' + esc(c.description) + '</p>' +
      (locked ? '<div class="notice card">' + icon('lock', 18) + ' Locked. ' + (S.regionUnlocked(t.region) ? 'Finish the previous level in ' + esc(t.name) + ' first.' : 'Finish 50% of the previous region first.') + '</div>' :
        (isCode ? '<div class="code-card"><div class="code-title"><span>main.py</span><span class="kbd">Ctrl+Enter runs tests</span></div><div class="editor" id="ed"></div></div>' :
          '<div class="quiz" role="radiogroup" aria-label="Answer options">' + c.options.map((o, i) => '<button class="opt" role="radio" aria-checked="false" data-i="' + i + '"><span class="opt-k">' + 'ABCD'[i] + '</span><span>' + esc(o) + '</span></button>').join('') + '</div>') +
        '<div class="ws-actions">' + (isCode ? '<button class="btn primary" id="b-run">Run Tests ' + icon('play', 14) + '</button>' : '') +
        '<button class="btn success" id="b-submit">' + icon('check', 16) + ' ' + (isCode ? 'Submit Solution' : 'Submit Answer') + '</button>' +
        (isCode ? '<button class="btn ghost sm" id="b-reset" title="Restore starter code">Reset</button>' : '') + '</div>' +
        '<div class="panel-box"><div class="tabs" role="tablist">' +
        '<button role="tab" data-tab="tests">' + (isCode ? 'Tests (' + c.tests.length + ')' : 'Result') + '</button><button role="tab" data-tab="output">Output</button><button role="tab" data-tab="solution">' + (isCode ? 'Solution' : 'Explanation') + '</button></div><div class="tab-body" id="tab-body" aria-live="polite"></div></div>' +
        '<div class="hint-card"><div class="hint-head"><h3>' + icon('bulb', 20) + ' Hint Assistant</h3><button class="btn primary sm" id="b-hint">Get Hint</button></div><div id="hint-list"></div></div>') +
      '</div>';

    if (locked) return;
    const body = $('#tab-body', host);

    /* tab bodies */
    function resultRow(r, i, label, shown) {
      const state = r.pending ? 'pending' : r.ok ? 'pass' : 'fail';
      const mark = state === 'pass' ? icon('check', 14) : state === 'fail' ? icon('x', 14) : '';
      let detail = '';
      if (shown && r.expected !== undefined) detail += '<span class="exp">Expected: ' + esc(r.expected) + '</span>';
      if (!r.pending) detail += (detail ? '' : '') + '<span class="got">' + (r.error ? esc(r.error) : 'Got: ' + esc(r.got)) + '</span>';
      return '<li class="tr ' + state + '"><span class="tr-ic">' + mark + '</span><div><strong>' + esc(label) + '</strong><div class="tr-detail">' + detail + '</div></div></li>';
    }

    function renderTests() {
      if (!isCode) {
        body.innerHTML = quizFeedback ? '<p class="fb ' + quizFeedback.kind + '">' + esc(quizFeedback.msg) + '</p>' : '<p class="muted">Pick an answer and submit it.</p>';
        return;
      }
      const rows = c.tests.map((tc, i) => {
        const r = report && report.results[i] ? Object.assign({}, report.results[i], { expected: pyRepr(tc.expected) }) : { pending: true, expected: pyRepr(tc.expected) };
        return resultRow(r, i, 'Test ' + (i + 1) + ': ' + tc.args.map(pyRepr).join(', '), true);
      });
      if (ranHidden && report) {
        for (let i = c.tests.length; i < report.results.length; i++) {
          const r = Object.assign({}, report.results[i], { expected: undefined });
          rows.push(resultRow(r, i, 'Hidden test ' + (i - c.tests.length + 1), false));
        }
      }
      const summary = report && !report.setup ? '<p class="summary">' + report.results.filter((r) => r.ok).length + ' / ' + report.results.length + ' tests passed</p>' : '';
      body.innerHTML = (report && report.setup ? '<p class="fb bad">Your code could not run: ' + esc(report.setup) + '</p>' : '') + summary + '<ul class="tests">' + rows.join('') + '</ul>';
    }

    function renderOutput() {
      body.innerHTML = '<pre class="out">' + esc(outputText || 'Print statements and errors from your code appear here.') + '</pre>';
    }

    function renderSolution() {
      const open = done() || S.get().hints[c.id] >= 3;
      if (!open) { body.innerHTML = '<p class="muted">' + icon('lock', 14) + ' Solve the challenge or use all three hints to reveal this.</p>'; return; }
      body.innerHTML = isCode ? '<pre class="out code">' + SEB.editor.highlight(c.solution) + '</pre>' : '<p>' + esc(c.explain) + '</p>';
    }

    function showTab(name) {
      tab = name;
      $$('[data-tab]', host).forEach((b) => { const on = b.dataset.tab === name; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
      if (name === 'tests') renderTests(); else if (name === 'output') renderOutput(); else renderSolution();
    }

    /* hint assistant */
    function renderHints() {
      const shown = S.get().hints[c.id] || 0;
      const hints = hintList();
      $('#hint-list', host).innerHTML = hints.map((h, i) => {
        const open = i < shown;
        return '<details class="hint' + (open ? '' : ' locked') + '"' + (i === shown - 1 ? ' open' : '') + '><summary' + (open ? '' : ' tabindex="-1"') + '><span class="h-n">' + (open ? icon('bulb', 14) : icon('lock', 14)) + ' Hint ' + (i + 1) + (i === 0 ? '/' + hints.length : '') + '</span><span class="h-t">' + (open ? '' : 'Locked') + '</span></summary>' + (open ? '<p>' + esc(h) + '</p>' : '') + '</details>';
      }).join('');
      $$('.hint.locked summary', host).forEach((s) => s.addEventListener('click', (e) => e.preventDefault()));
      $('#b-hint', host).disabled = shown >= hints.length;
      $('#b-hint', host).textContent = shown >= hints.length ? 'No more hints' : 'Get Hint';
      if (!isCode) markEliminated();
    }

    function markEliminated() {
      const shown = S.get().hints[c.id] || 0;
      const wrong = c.options.findIndex((_, i) => i !== c.answer);
      $$('.opt', host).forEach((b) => b.classList.toggle('struck', shown >= 2 && Number(b.dataset.i) === wrong));
    }

    $('#b-hint', host).addEventListener('click', () => {
      const shown = S.get().hints[c.id] || 0;
      S.revealHint(c.id, shown + 1);
      renderHints();
      if (tab === 'solution') renderSolution();
    });

    /* code challenges */
    function setBusy(v) { busy = v; $$('.ws-actions .btn', host).forEach((b) => { b.disabled = v; }); }

    async function runTests(submit) {
      if (busy) return;
      setBusy(true);
      showTab('tests');
      const notReady = SEB.runner.status.state !== 'ready';
      body.innerHTML = '<p class="muted spin">' + (notReady ? 'Loading the Python runtime (first run only, about 10 MB)…' : 'Running tests…') + '</p>';
      const tests = submit ? c.tests.concat(c.hidden || []) : c.tests;
      try {
        report = await SEB.runner.run(editor.getValue(), c.fn, tests);
        ranHidden = submit;
        outputText = report.setup ? report.setup : (report.stdout || '');
        const passed = !report.setup && report.results.length === tests.length && report.results.every((r) => r.ok);
        showTab('tests');
        if (submit) {
          if (passed) finish(); else toast(report.setup ? 'Fix the error first, then submit again.' : 'Not yet: ' + report.results.filter((r) => !r.ok).length + ' test(s) still failing.', 'warn');
        } else if (passed) {
          toast('All visible tests pass. Submit to claim your XP!', 'ok');
        }
      } catch (e) {
        report = null;
        outputText = e.message;
        showTab('output');
        toast(e.message, 'warn');
      } finally { setBusy(false); }
    }

    function finish() {
      const res = S.complete(c.id);
      if (opts && opts.onComplete) opts.onComplete(res);
      $('.ws-sub', host).innerHTML = esc(c.title) + ' <span class="pill ok">' + icon('check', 12) + ' Completed</span>';
      celebrate(c, res);
      renderHints();
    }

    if (isCode) {
      const draft = S.get().drafts[c.id];
      editor = SEB.editor.mount($('#ed', host), draft != null ? draft : c.starter, {
        onChange: (v) => S.setDraft(c.id, v), onRun: () => runTests(false)
      });
      $('#ed textarea', host).addEventListener('focus', () => SEB.runner.start().catch(() => {}), { once: true });
      $('#b-run', host).addEventListener('click', () => runTests(false));
      $('#b-submit', host).addEventListener('click', () => runTests(true));
      $('#b-reset', host).addEventListener('click', () => {
        if (confirm('Replace your code with the starter code?')) { editor.setValue(c.starter); S.clearDraft(c.id); report = null; showTab(tab); }
      });
    } else {
      $$('.opt', host).forEach((b) => b.addEventListener('click', () => {
        picked = Number(b.dataset.i);
        $$('.opt', host).forEach((x) => { const on = x === b; x.classList.toggle('sel', on); x.setAttribute('aria-checked', on); });
      }));
      $('#b-submit', host).addEventListener('click', () => {
        if (picked === null) { toast('Pick an answer first.', 'warn'); return; }
        showTab('tests');
        if (picked === c.answer) {
          quizFeedback = { kind: 'ok', msg: 'Correct! ' + c.explain };
          renderTests();
          if (!done()) finish();
        } else {
          quizFeedback = { kind: 'bad', msg: 'Not quite. Try again, or use the Hint Assistant.' };
          renderTests();
        }
      });
    }

    $$('[data-tab]', host).forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
    renderHints();
    showTab('tests');
    if (isCode) $('#ed textarea', host).addEventListener('input', () => { /* draft saved in editor onChange */ });
  }

  function celebrate(c, res) {
    if (!res.first) return;
    const next = S.nextChallenge();
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="m-title"><div class="m-ico" aria-hidden="true">🎉</div><h2 id="m-title">Challenge complete!</h2><p class="m-xp">+' + res.xp + ' XP · +1 gem</p>' +
      (res.leveledUp ? '<p class="m-line">' + icon('crown', 16) + ' You reached level ' + S.levelInfo().level + '!</p>' : '') +
      res.newAchievements.map((a) => '<p class="m-line">' + a.icon + ' Achievement unlocked: <strong>' + esc(a.name) + '</strong></p>').join('') +
      '<div class="btn-row"><button class="btn ghost" data-close>Stay here</button>' + (next ? '<a class="btn primary" href="#/challenge/' + next.id + '" data-close>Next challenge ' + icon('arrow', 14) + '</a>' : '<a class="btn primary" href="#/achievements" data-close>See achievements</a>') + '</div></div>';
    document.body.appendChild(wrap);
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.addEventListener('click', (e) => { if (e.target === wrap || e.target.closest('[data-close]')) close(); });
    const first = $('.btn.primary', wrap); if (first) first.focus();
  }

  /* ---------- router ---------- */
  const ui = { mapMode: 'map', filters: {} };

  function parse() {
    const h = location.hash.replace(/^#\/?/, '') || 'home';
    const [name, param] = h.split('/');
    return { name: name || 'home', param };
  }

  function render() {
    const { name, param } = parse();
    const main = $('#main');
    const panel = $('#panel');
    const layout = $('#layout');
    const activeNav = ['challenge', 'region', 'topic'].includes(name) ? (name === 'topic' ? 'topics' : name === 'challenge' ? 'challenges' : 'path') : name;
    renderSidebar(activeNav);
    layout.classList.toggle('with-panel', name === 'home');
    panel.innerHTML = '';
    let html;
    switch (name) {
      case 'home': html = homeView(ui); break;
      case 'path': html = pathView(); break;
      case 'challenges': html = challengesView(ui.filters); break;
      case 'topics': html = topicsView(); break;
      case 'topic': html = topicView(param); break;
      case 'region': html = regionView(param); break;
      case 'achievements': html = achievementsView(); break;
      case 'leaderboard': html = leaderboardView(); break;
      case 'profile': html = profileView(); break;
      case 'challenge': html = '<div id="ws-host" class="card ws-page"></div>'; break;
      default: html = notFound();
    }
    main.innerHTML = html;
    document.title = 'SE-Buddy · ' + (NAV.find((n) => n[0] === name) || [0, name === 'challenge' ? 'Challenge' : 'Learn'])[1];
    main.scrollTop = 0; window.scrollTo(0, 0);

    if (name === 'home') {
      const c = S.nextChallenge();
      panel.innerHTML = '<div class="card" id="ws-host"></div>';
      if (c) mountWorkspace($('#ws-host'), c, { onComplete: refreshHome });
      else $('#ws-host').innerHTML = '<div class="ws"><h2>All caught up 🎉</h2><p class="muted">You have completed every available challenge. Check your <a href="#/achievements">achievements</a>.</p></div>';
      $$('.seg button', main).forEach((b) => b.addEventListener('click', () => { ui.mapMode = b.dataset.mode; refreshHome(); }));
    } else if (name === 'challenge') {
      const c = S.byId(param);
      if (!c) { main.innerHTML = notFound(); return; }
      const nav = '<div class="ws-nav"><a class="btn ghost sm" href="#/topic/' + c.topic + '">&larr; ' + esc(S.topicOf(c).name) + '</a></div>';
      main.insertAdjacentHTML('afterbegin', nav);
      mountWorkspace($('#ws-host'), c, { onComplete: () => renderSidebar(activeNav) });
    } else if (name === 'challenges') {
      const redo = () => {
        ui.filters = { q: $('#f-q').value, topic: $('#f-topic').value, kind: $('#f-kind').value, status: $('#f-status').value };
        const res = $('#f-results');
        const q = ui.filters.q.toLowerCase();
        const list = challenges.filter((c) => (!ui.filters.topic || c.topic === ui.filters.topic) && (!ui.filters.kind || c.kind === ui.filters.kind) &&
          (!ui.filters.status || (ui.filters.status === 'done' ? S.isDone(c.id) : ui.filters.status === 'todo' ? !S.isDone(c.id) && S.challengeUnlocked(c) : !S.isDone(c.id) && !S.challengeUnlocked(c))) &&
          (!q || (c.title + ' ' + c.type + ' ' + S.topicOf(c).name).toLowerCase().includes(q)));
        res.innerHTML = list.length ? list.map(challengeRow).join('') : '<p class="empty">No challenges match these filters.</p>';
      };
      $$('.filters input, .filters select', main).forEach((el) => el.addEventListener('input', redo));
    } else if (name === 'profile') {
      bindProfile(main);
    }
  }

  // Re-render the home view (map, hero, topics) without remounting the workspace the learner is using.
  function refreshHome() {
    renderSidebar('home');
    $('#main').innerHTML = homeView(ui);
    $$('.seg button', $('#main')).forEach((b) => b.addEventListener('click', () => { ui.mapMode = b.dataset.mode; refreshHome(); }));
  }

  function bindProfile(main) {
    $('#pf-form', main).addEventListener('submit', (e) => {
      e.preventDefault();
      const av = $('input[name=av]:checked', main);
      S.setProfile($('#pf-name', main).value, av && av.value);
      toast('Profile saved.', 'ok'); render();
    });
    $('#pf-export', main).addEventListener('click', () => {
      const url = URL.createObjectURL(new Blob([S.exportJson()], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'se-buddy-progress.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
    $('#pf-import', main).addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((text) => { S.importJson(text); toast('Progress imported.', 'ok'); render(); }).catch((err) => toast(err.message, 'warn'));
    });
    $('#pf-reset', main).addEventListener('click', () => {
      if (confirm('Delete all progress, XP and saved code? This cannot be undone.')) { S.reset(); toast('Progress reset.'); render(); }
    });
  }

  window.addEventListener('hashchange', render);
  document.addEventListener('DOMContentLoaded', render);
  SEB.ui = { render, toast };
})(window.SEB = window.SEB || {});
