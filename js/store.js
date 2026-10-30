/* Progress state, persisted to localStorage. Also derives levels, unlocks and achievements. */
(function (SEB) {
  'use strict';

  const KEY = 'sebuddy.v1';
  const XP_PER_LEVEL = 500;
  const DAILY_GOAL = 5;
  const { regions, topics, challenges } = SEB.data;

  const fresh = () => ({
    name: 'Learner', avatar: '🧑‍💻', xp: 0, gems: 0,
    completed: {},      // id -> { at: ISO time, xp, hints }
    drafts: {},         // id -> code text
    hints: {},          // id -> number of hints revealed
    daily: { date: '', count: 0 },
    streak: { last: '', count: 0 },
    seenAchievements: []
  });

  let state = fresh();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) state = Object.assign(fresh(), JSON.parse(raw));
    } catch (e) { state = fresh(); }
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage unavailable */ }
  }

  const dayKey = (d) => {
    const x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  };
  const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };

  const byId = (id) => challenges.find((c) => c.id === id);
  const topicOf = (c) => topics.find((t) => t.id === c.topic);
  const topicChallenges = (topicId) => challenges.filter((c) => c.topic === topicId).sort((a, b) => a.level - b.level);
  const isDone = (id) => !!state.completed[id];
  const numberOf = (c) => topicOf(c).n + '.' + c.level;

  function regionChallenges(regionId) {
    const ids = topics.filter((t) => t.region === regionId).map((t) => t.id);
    return ids.flatMap(topicChallenges);
  }

  function progress(list) {
    const done = list.filter((c) => isDone(c.id)).length;
    return { done, total: list.length, pct: list.length ? Math.round((done / list.length) * 100) : 0 };
  }

  const regionProgress = (regionId) => progress(regionChallenges(regionId));
  const topicProgress = (topicId) => progress(topicChallenges(topicId));

  // A region opens once the previous one is at least half done.
  function regionUnlocked(regionId) {
    if (regionId === 1) return true;
    return regionProgress(regionId - 1).pct >= 50;
  }

  // A challenge opens when its region is open and the previous level in its topic is done.
  function challengeUnlocked(c) {
    const region = topicOf(c).region;
    if (!regionUnlocked(region)) return false;
    if (c.level === 1) return true;
    const prev = topicChallenges(c.topic).find((x) => x.level === c.level - 1);
    return !prev || isDone(prev.id);
  }

  function nextChallenge() {
    for (const r of regions) {
      if (!regionUnlocked(r.id)) continue;
      const hit = regionChallenges(r.id).find((c) => !isDone(c.id) && challengeUnlocked(c));
      if (hit) return hit;
    }
    return null;
  }

  const levelInfo = () => ({
    level: Math.floor(state.xp / XP_PER_LEVEL) + 1,
    into: state.xp % XP_PER_LEVEL,
    size: XP_PER_LEVEL
  });

  function dailyCount() {
    return state.daily.date === dayKey() ? state.daily.count : 0;
  }

  function streakCount() {
    const last = state.streak.last;
    return last === dayKey() || last === yesterdayKey() ? state.streak.count : 0;
  }

  const achievementDefs = [
    { id: 'first', icon: '🌱', name: 'First Steps', desc: 'Complete your first challenge.', test: (s, n) => n >= 1 },
    { id: 'five', icon: '🔥', name: 'On a Roll', desc: 'Complete 5 challenges.', test: (s, n) => n >= 5 },
    { id: 'twenty', icon: '🏅', name: 'Veteran', desc: 'Complete 20 challenges.', test: (s, n) => n >= 20 },
    { id: 'bug', icon: '🐛', name: 'Bug Squasher', desc: 'Fix the bug in "Fix the Bug".', test: (s) => !!s.completed['prog-3'] },
    { id: 'nohint', icon: '🧠', name: 'Unassisted', desc: 'Solve 3 challenges without using a hint.', test: (s) => Object.values(s.completed).filter((c) => !c.hints).length >= 3 },
    { id: 'streak3', icon: '📆', name: 'Three-Day Streak', desc: 'Learn 3 days in a row.', test: () => streakCount() >= 3 },
    { id: 'quiz', icon: '🎓', name: 'Quiz Whiz', desc: 'Answer 10 quizzes correctly.', test: (s) => Object.keys(s.completed).filter((id) => byId(id) && byId(id).kind === 'quiz').length >= 10 },
    { id: 'region', icon: '🗺️', name: 'Region Cleared', desc: 'Complete every challenge in one topic.', test: () => topics.some((t) => topicProgress(t.id).pct === 100) },
    { id: 'level5', icon: '👑', name: 'Level 5', desc: 'Reach level 5.', test: (s) => Math.floor(s.xp / XP_PER_LEVEL) + 1 >= 5 },
    { id: 'all', icon: '🏆', name: 'Master Engineer', desc: 'Complete every challenge.', test: (s, n) => n >= challenges.length }
  ];

  function achievements() {
    const n = Object.keys(state.completed).length;
    return achievementDefs.map((a) => ({ id: a.id, icon: a.icon, name: a.name, desc: a.desc, unlocked: !!a.test(state, n) }));
  }

  // Marks a challenge complete once; returns what changed so the UI can celebrate.
  function complete(id) {
    const c = byId(id);
    if (!c || isDone(id)) return { first: false, xp: 0, newAchievements: [] };
    const before = new Set(achievements().filter((a) => a.unlocked).map((a) => a.id));
    const lvlBefore = levelInfo().level;
    const today = dayKey();

    state.completed[id] = { at: new Date().toISOString(), xp: c.xp, hints: state.hints[id] || 0 };
    state.xp += c.xp;
    state.gems += 1;

    state.daily = state.daily.date === today ? { date: today, count: state.daily.count + 1 } : { date: today, count: 1 };
    if (state.streak.last !== today) {
      state.streak = { last: today, count: state.streak.last === yesterdayKey() ? state.streak.count + 1 : 1 };
    }

    const newAchievements = achievements().filter((a) => a.unlocked && !before.has(a.id));
    save();
    return { first: true, xp: c.xp, newAchievements, leveledUp: levelInfo().level > lvlBefore };
  }

  function leaderboard() {
    const me = { name: state.name, avatar: state.avatar, xp: state.xp, me: true };
    return SEB.data.rivals.concat([me]).sort((a, b) => b.xp - a.xp);
  }

  const api = {
    get: () => state,
    save, load,
    byId, topicOf, topicChallenges, regionChallenges, numberOf, isDone,
    regionProgress, topicProgress, regionUnlocked, challengeUnlocked, nextChallenge,
    levelInfo, dailyCount, streakCount, achievements, complete, leaderboard,
    totalProgress: () => progress(challenges),
    DAILY_GOAL,
    setDraft(id, text) { state.drafts[id] = text; save(); },
    clearDraft(id) { delete state.drafts[id]; save(); },
    revealHint(id, n) { state.hints[id] = Math.max(state.hints[id] || 0, n); save(); },
    setProfile(name, avatar) {
      state.name = (name || '').trim().slice(0, 24) || 'Learner';
      state.avatar = avatar || state.avatar;
      save();
    },
    reset() { state = fresh(); save(); },
    exportJson: () => JSON.stringify(state, null, 2),
    importJson(text) {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || typeof parsed.xp !== 'number' || typeof parsed.completed !== 'object') {
        throw new Error('This file is not a SE-Buddy progress export.');
      }
      state = Object.assign(fresh(), parsed);
      save();
    }
  };

  load();
  SEB.store = api;
})(window.SEB = window.SEB || {});
