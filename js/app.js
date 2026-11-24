/* =====================================================================
   BLACK BULLS GRIMOIRE — App logic
   Everything is stored on this device (localStorage). No servers, no videos.
   ===================================================================== */
(function () {
  'use strict';

  const STORE_KEY = 'bb_grimoire_strength_v1';
  const TITLES = { E: 'E-Rank Hunter', D: 'D-Rank Hunter', C: 'C-Rank Hunter', B: 'B-Rank Hunter', A: 'A-Rank Hunter', S: 'S-Rank · Shadow Monarch' };
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  /* ------------------------------------------------------------------
     Helpers
  ------------------------------------------------------------------ */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pad = (n) => String(n).padStart(2, '0');
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const todayKey = () => keyOf(new Date());
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
  const dowOf = (k) => parseKey(k).getDay();
  const daysBetween = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 86400000);
  const prettyDate = (k) => { const d = parseKey(k); return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`; };
  const shortDate = (k) => { const d = parseKey(k); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const fmtTime = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
  const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };
  const rankOfLevel = (lv) => (lv < 10 ? 'E' : lv < 20 ? 'D' : lv < 35 ? 'C' : lv < 55 ? 'B' : lv < 80 ? 'A' : 'S');

  /* ------------------------------------------------------------------
     State
  ------------------------------------------------------------------ */
  function freshState() {
    const t = todayKey();
    return {
      v: 1,
      setup: false,
      name: 'Warrior',
      startDate: t,
      programStart: t,
      profile: { heightCm: 170, goalWeight: 78 },
      settings: { kcal: 2200, protein: 120, autoRest: true, sound: true, vibrate: true },
      levels: {},
      days: {},
      body: [],
      trials: {},
      maxLevelSeen: 1
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return freshState();
      const p = JSON.parse(raw);
      const f = freshState();
      return {
        ...f, ...p,
        profile: { ...f.profile, ...(p.profile || {}) },
        settings: { ...f.settings, ...(p.settings || {}) },
        levels: p.levels || {}, days: p.days || {}, body: Array.isArray(p.body) ? p.body : [], trials: p.trials || {}
      };
    } catch (e) { return freshState(); }
  }

  let state = loadState();
  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ } }

  const ui = { tab: 'quest', sel: todayKey(), vaultMsg: '', animate: true };

  const EMPTY_DAY = Object.freeze({ sets: {}, warm: false, meals: {}, plan: null, water: 0, steps: '', sleep: '', best: {}, pen: {}, cleared: false, clearShown: false });
  const readDay = (k) => state.days[k] || EMPTY_DAY;
  function getDay(k) {
    if (!state.days[k]) state.days[k] = { sets: {}, warm: false, meals: {}, plan: null, water: 0, steps: '', sleep: '', best: {}, pen: {}, cleared: false, clearShown: false };
    return state.days[k];
  }

  /* ------------------------------------------------------------------
     Program / plan for a date
  ------------------------------------------------------------------ */
  function weekInfo(key) {
    const diff = Math.max(0, daysBetween(state.programStart, key));
    const weekNo = Math.floor(diff / 7) + 1;
    const bp = (weekNo - 1) % 4;           // position in block 0..3
    const block = Math.floor((weekNo - 1) / 4);
    return { weekNo, bp, block, deload: bp === 3 };
  }
  const levelIdx = (id) => clamp(state.levels[id] ?? EX[id].start ?? 0, 0, EX[id].levels.length - 1);

  function planFor(key) {
    const day = PLAN[dowOf(key)];
    const wk = weekInfo(key);
    const exercises = day.ids.map((id) => {
      const ex = EX[id];
      const li = levelIdx(id);
      const sets = wk.deload ? Math.max(2, ex.sets - 1) : ex.sets;
      const target = wk.deload ? ex.base : ex.base + ex.step * (wk.bp + Math.min(wk.block, 3));
      const chips = sets * (ex.perSide ? 2 : 1);
      return { id, ex, li, name: ex.levels[li], sets, chips, target };
    });
    return { day, wk, exercises };
  }

  function exDone(rec, e) {
    const arr = rec.sets[e.id] || [];
    let d = 0;
    for (let i = 0; i < e.chips; i++) if (arr[i] > 0) d++;
    return d;
  }

  function dayProgress(key) {
    const plan = planFor(key);
    const rec = readDay(key);
    let total = 0, done = 0;
    plan.exercises.forEach((e) => { total += e.chips; done += exDone(rec, e); });
    return { total, done, cleared: total > 0 && done === total, plan, rec };
  }

  /* ------------------------------------------------------------------
     XP, levels, rank, stats
  ------------------------------------------------------------------ */
  const needFor = (lv) => 600 + 120 * lv;
  function levelFromXP(xp) {
    let lv = 1, rem = xp;
    while (rem >= needFor(lv)) { rem -= needFor(lv); lv++; }
    return { lv, into: rem, need: needFor(lv), pct: rem / needFor(lv) };
  }

  function dayXP(key) {
    const rec = state.days[key];
    if (!rec) return { xp: 0, parts: {} };
    const plan = planFor(key);
    const parts = { sets: 0, holds: 0, ex: 0, clear: 0, warm: 0, meals: 0, water: 0, sleep: 0, steps: 0, pen: 0 };
    let allDone = plan.exercises.length > 0;
    plan.exercises.forEach((e) => {
      const arr = rec.sets[e.id] || [];
      let d = 0;
      for (let i = 0; i < e.chips; i++) {
        const v = arr[i];
        if (v > 0) { d++; parts.sets += 10; if (e.ex.type === 'hold') parts.holds += Math.floor(v / 6); }
      }
      if (d === e.chips) parts.ex += 15; else allDone = false;
    });
    if (allDone) parts.clear = 100;
    if (rec.warm) parts.warm = 10;
    parts.meals = Object.values(rec.meals || {}).filter(Boolean).length * 12;
    parts.water = clamp(rec.water || 0, 0, 10) * 3;
    if (num(rec.sleep) >= 7) parts.sleep = 20;
    if (num(rec.steps) >= 8000) parts.steps = 20;
    if (PENALTY.every((p) => (rec.pen || {})[p.id])) parts.pen = 20;
    const xp = Object.values(parts).reduce((a, b) => a + b, 0);
    return { xp, parts };
  }

  function totalXP() {
    let xp = 0;
    Object.keys(state.days).forEach((k) => { xp += dayXP(k).xp; });
    xp += Object.values(state.trials).filter(Boolean).length * 150;
    return xp;
  }

  function potentialXP(key) {
    const plan = planFor(key);
    let xp = 0;
    plan.exercises.forEach((e) => {
      xp += e.chips * 10 + 15;
      if (e.ex.type === 'hold') xp += e.chips * Math.floor(e.target / 6);
    });
    return xp + 100 + 10 + 60 + 30 + 20 + 20;
  }

  function clearedSet() {
    const s = new Set();
    Object.keys(state.days).forEach((k) => { if (state.days[k].cleared) s.add(k); });
    return s;
  }
  function streaks() {
    const s = clearedSet();
    const t = todayKey();
    let cur = 0;
    let k = s.has(t) ? t : addDays(t, -1);
    while (s.has(k)) { cur++; k = addDays(k, -1); }
    const keys = [...s].sort();
    let best = 0, run = 0, prev = null;
    keys.forEach((kk) => { run = prev && daysBetween(prev, kk) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = kk; });
    return { cur, best, total: s.size };
  }

  function computeStats() {
    let strSets = 0, holdSec = 0, legMob = 0, meals = 0, water = 0, steps = 0, sleepOk = 0, sets = 0;
    const pr = {};
    Object.keys(state.days).forEach((k) => {
      const rec = state.days[k];
      Object.keys(rec.sets || {}).forEach((id) => {
        const ex = EX[id]; if (!ex) return;
        (rec.sets[id] || []).forEach((v) => {
          if (v > 0) {
            sets++;
            if (ex.type === 'hold') holdSec += v; else if (['push', 'pull', 'legs'].includes(ex.cat)) strSets++;
            if (ex.cat === 'legs' || ex.cat === 'mobility') legMob++;
          }
        });
      });
      Object.keys(rec.best || {}).forEach((id) => { const v = num(rec.best[id]); if (v > (pr[id] || 0)) pr[id] = v; });
      meals += Object.values(rec.meals || {}).filter(Boolean).length;
      water += rec.water || 0;
      steps += num(rec.steps);
      if (num(rec.sleep) >= 7) sleepOk++;
    });
    const tb = (stat) => TRIALS.filter((t) => t.stat === stat && state.trials[t.id]).length * 3;
    const st = streaks();
    return {
      sets, holdSec, strSets, pr, st,
      STR: 10 + Math.floor(strSets / 3) + tb('STR'),
      END: 10 + Math.floor(holdSec / 45) + tb('END'),
      VIT: 10 + Math.floor(meals / 6) + Math.floor(water / 15) + Math.floor(sleepOk / 2),
      AGI: 10 + Math.floor(legMob / 4) + Math.floor(steps / 25000) + tb('AGI'),
      MANA: 10 + st.best * 2 + st.total + tb('MANA')
    };
  }

  /* ------------------------------------------------------------------
     Audio / haptics / wake lock
  ------------------------------------------------------------------ */
  let actx = null, master = null, noiseBuf = null;
  function ctx() {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    if (!master) {
      master = actx.createGain(); master.gain.value = 0.9;
      const dl = actx.createDelay(); dl.delayTime.value = 0.17;
      const fb = actx.createGain(); fb.gain.value = 0.32;
      const wet = actx.createGain(); wet.gain.value = 0.28;
      master.connect(actx.destination); master.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(actx.destination);
      noiseBuf = actx.createBuffer(1, actx.sampleRate * 2, actx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    return actx;
  }
  /* tone with optional pitch glide; the building block of every sound */
  function beep(freq = 880, dur = 0.12, type = 'sine', vol = 0.18, when = 0, glideTo = null, detune = 0) {
    if (!state.settings.sound) return;
    try {
      const c = ctx(), o = c.createOscillator(), g = c.createGain(), t0 = c.currentTime + when;
      o.type = type; o.frequency.setValueAtTime(freq, t0); o.detune.value = detune;
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.03);
    } catch (e) { /* audio unavailable */ }
  }
  /* filtered noise sweep: risers, whooshes, impacts */
  function sweep(f0, f1, dur, vol = 0.2, when = 0, q = 6, kind = 'bandpass') {
    if (!state.settings.sound) return;
    try {
      const c = ctx(), s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t0 = c.currentTime + when;
      s.buffer = noiseBuf; f.type = kind; f.Q.value = q;
      f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.05);
      s.connect(f); f.connect(g); g.connect(master); s.start(t0); s.stop(t0 + dur + 0.1);
    } catch (e) { /* ignore */ }
  }
  /* the iconic System "ding-ding" window chime */
  const chime = (when = 0, v = 1) => { [1568, 2093].forEach((f, i) => { beep(f, 0.55, 'sine', 0.13 * v, when + i * 0.11); beep(f * 2.01, 0.3, 'sine', 0.04 * v, when + i * 0.11); }); };
  const sfx = {
    tick: () => beep(1320, 0.05, 'square', 0.05),
    set: () => { beep(1175, 0.18, 'sine', 0.15); beep(1760, 0.3, 'sine', 0.1, 0.06); },
    go: () => { sweep(300, 3000, 0.3, 0.2); beep(110, 0.35, 'sawtooth', 0.16, 0.2, 55); chime(0.22, 0.8); },
    sys: () => chime(0, 1),
    arise: () => { beep(55, 1.6, 'sawtooth', 0.2, 0, 40, 6); beep(82, 1.4, 'square', 0.08, 0.1, 41); sweep(120, 1800, 1.1, 0.25, 0, 3); sweep(900, 80, 0.8, 0.18, 1.0, 2, 'lowpass'); chime(1.0, 1); },
    done: () => { sweep(200, 4000, 0.45, 0.18); [523, 659, 784, 1046, 1318, 1568].forEach((f, i) => { beep(f, 0.5, 'triangle', 0.14, 0.3 + i * 0.09); beep(f / 2, 0.5, 'sine', 0.1, 0.3 + i * 0.09); }); chime(0.95, 1); },
    level: () => { beep(65, 1.2, 'sawtooth', 0.22, 0, 32); sweep(150, 5000, 1.0, 0.28, 0, 4); [392, 523, 659, 784, 1046, 1318, 1568].forEach((f, i) => { beep(f, 0.4, 'sawtooth', 0.07, 0.9 + i * 0.07, null, -8); beep(f, 0.55, 'triangle', 0.13, 0.9 + i * 0.07, null, 8); }); chime(1.6, 1.2); },
    speech: () => { beep(73, 1.2, 'sawtooth', 0.14, 0, 55); sweep(200, 1200, 0.8, 0.14, 0, 3); chime(0.7, 0.9); }
  };
  const buzz = (p) => { if (state.settings.vibrate && navigator.vibrate) { try { navigator.vibrate(p); } catch (e) { /* ignore */ } } };

  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { /* not supported / denied */ }
  }

  /* ------------------------------------------------------------------
     Toasts, modal, floating XP
  ------------------------------------------------------------------ */
  function toast(msg, err) {
    const el = document.createElement('div');
    el.className = 'toast' + (err ? ' err' : '');
    el.textContent = msg;
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }
  function floatXP(text, x, y) {
    const el = document.createElement('div');
    el.className = 'xp-float'; el.textContent = text;
    el.style.left = `${clamp(x - 24, 8, window.innerWidth - 90)}px`; el.style.top = `${y - 30}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1000);
  }

  const modalQueue = [];
  let modalOpen = false;
  function showModal(html, onClose) {
    modalQueue.push({ html, onClose });
    if (!modalOpen) nextModal();
  }
  function nextModal() {
    const m = modalQueue.shift();
    const wrap = $('#modal');
    if (!m) { wrap.classList.add('hidden'); modalOpen = false; return; }
    modalOpen = true;
    $('#modal-body').innerHTML = m.html;
    $('#modal-body').scrollTop = 0;
    wrap.classList.remove('hidden');
    wrap._onClose = m.onClose;
  }
  function closeModal() {
    const wrap = $('#modal');
    const cb = wrap._onClose; wrap._onClose = null;
    wrap.classList.add('hidden');
    modalOpen = false;
    if (cb) cb();
    nextModal();
  }
  function confirmModal(title, text, okLabel, onOk) {
    showModal(`
      <p class="sys-tag">[ SYSTEM ] CONFIRM</p>
      <h2>${esc(title)}</h2>
      <p>${esc(text)}</p>
      <div class="btns">
        <button class="btn" data-action="confirm-ok">${esc(okLabel)}</button>
        <button class="btn ghost" data-action="modal-close">Cancel</button>
      </div>`);
    $('#modal')._confirm = onOk;
  }

  /* ------------------------------------------------------------------
     Commit helper: apply a change, detect clear / level-up, re-render
  ------------------------------------------------------------------ */
  function commit(key, mutate, ev) {
    const beforeXP = totalXP();
    const rec = getDay(key);
    mutate(rec);
    const prog = dayProgress(key);
    rec.cleared = prog.cleared;
    save();
    const afterXP = totalXP();
    const delta = afterXP - beforeXP;
    if (ev && delta > 0 && ev.clientX != null) floatXP(`+${delta} XP`, ev.clientX, ev.clientY);

    render();
    updateHud();

    if (rec.cleared && !rec.clearShown) {
      rec.clearShown = true; save();
      showDayClear(key);
    }
    const lv = levelFromXP(afterXP).lv;
    if (lv > state.maxLevelSeen) {
      const old = state.maxLevelSeen;
      state.maxLevelSeen = lv; save();
      showLevelUp(old, lv);
    } else if (lv < state.maxLevelSeen && afterXP < beforeXP) {
      /* user un-ticked something; keep the highest level seen to avoid replays */
    }
  }

  function showDayClear(key) {
    const { xp, parts } = dayXP(key);
    const st = streaks();
    sfx.done(); buzz([80, 60, 120]);
    showModal(`
      <p class="sys-tag">[ SYSTEM ] DAILY QUEST COMPLETE</p>
      <h2>Quest Cleared!</h2>
      <p>${esc(PLAN[dowOf(key)].title)} — you surpassed your limits.</p>
      <div class="rewards">
        <div><span>Sets cleared</span><b>+${parts.sets + parts.ex}</b></div>
        <div><span>Hold bonus</span><b>+${parts.holds}</b></div>
        <div><span>Day-clear bonus</span><b>+${parts.clear}</b></div>
        <div><span>XP earned today</span><b>${xp}</b></div>
        <div><span>Streak</span><b>🔥 ${st.cur} day${st.cur === 1 ? '' : 's'}</b></div>
      </div>
      <p class="small muted">Now fuel the recovery: finish your rations and water to earn more XP.</p>
      <div class="btns">
        <button class="btn gold" data-action="close-goto" data-tab="rations">Go to Rations</button>
        <button class="btn ghost" data-action="modal-close">Continue</button>
      </div>`);
  }

  function showLevelUp(oldLv, lv) {
    const r = rankOfLevel(lv), rOld = rankOfLevel(oldLv);
    sfx.level(); buzz([60, 40, 60, 40, 200]);
    showModal(`
      <p class="sys-tag">[ SYSTEM ] LEVEL UP</p>
      <div class="big">${lv}</div>
      <h2>${r !== rOld ? 'Rank ' + r + ' Unlocked!' : 'You grow stronger'}</h2>
      <p>${esc(TITLES[r])}</p>
      <p class="small muted" style="margin-top:8px">“${esc(QUOTES[lv % QUOTES.length])}”</p>
      <div class="btns"><button class="btn gold" data-action="modal-close">Arise ➔</button></div>`);
  }

  /* ------------------------------------------------------------------
     HUD
  ------------------------------------------------------------------ */
  function updateHud() {
    const xp = totalXP();
    const L = levelFromXP(xp);
    const r = rankOfLevel(L.lv);
    $('#hud-rank').textContent = r;
    $('#hud-name').textContent = state.name || 'Warrior';
    $('#hud-lv').textContent = L.lv;
    $('#hud-xpfill').style.width = `${(L.pct * 100).toFixed(1)}%`;
    $('#hud-streak').innerHTML = `🔥 <b>${streaks().cur}</b>`;
  }

  /* ------------------------------------------------------------------
     Rest timer
  ------------------------------------------------------------------ */
  const rest = { end: 0, total: 0, timer: null, lastTick: -1 };
  function startRest(sec) {
    rest.total = sec; rest.end = Date.now() + sec * 1000; rest.lastTick = -1;
    $('#rest-bar').classList.remove('hidden');
    document.body.classList.add('has-rest');
    clearInterval(rest.timer);
    rest.timer = setInterval(tickRest, 200);
    tickRest();
    keepAwake(true);
  }
  function tickRest() {
    const left = Math.max(0, (rest.end - Date.now()) / 1000);
    $('#rest-time').textContent = fmtTime(Math.ceil(left));
    $('#rest-fill').style.transform = `scaleX(${clamp(left / rest.total, 0, 1)})`;
    const sec = Math.ceil(left);
    if (left > 0 && sec <= 3 && sec !== rest.lastTick) { rest.lastTick = sec; sfx.tick(); }
    if (left <= 0) {
      stopRest();
      sfx.go(); buzz([200, 80, 200]);
      toast('⚔ Rest over — arise, Hunter!');
    }
  }
  function stopRest() {
    clearInterval(rest.timer); rest.timer = null;
    $('#rest-bar').classList.add('hidden');
    document.body.classList.remove('has-rest');
    if (!hold.active) keepAwake(false);
  }

  /* ------------------------------------------------------------------
     Hold timer overlay
  ------------------------------------------------------------------ */
  const hold = { active: false, key: null, id: null, idx: 0, total: 0, phase: 'ready', t0: 0, readyDur: 5, timer: null, lastTick: -1, chips: 1 };
  const RING = 552.92;
  function startHold(key, id, idx) {
    const plan = planFor(key);
    const e = plan.exercises.find((x) => x.id === id);
    if (!e) return;
    stopRest();
    Object.assign(hold, { active: true, key, id, idx, total: e.target, phase: 'ready', t0: Date.now(), lastTick: -1, chips: e.chips });
    const label = e.ex.perSide ? `${idx % 2 === 0 ? 'Left' : 'Right'} side · set ${Math.floor(idx / 2) + 1}` : `Set ${idx + 1} of ${e.chips}`;
    $('#hold-name').textContent = e.name;
    $('#hold-set').textContent = `${label} · ${e.target}s`;
    $('#hold-cue').textContent = e.ex.cue;
    $('#hold-overlay').classList.remove('hidden');
    $('.hold-ring').classList.remove('go');
    $('#hold-phase').textContent = 'GET READY';
    clearInterval(hold.timer);
    hold.timer = setInterval(tickHold, 100);
    tickHold();
    keepAwake(true);
    sfx.tick();
  }
  function tickHold() {
    const el = (Date.now() - hold.t0) / 1000;
    const fg = $('#hold-ring-fg'), cnt = $('#hold-count'), ring = $('.hold-ring');
    if (hold.phase === 'ready') {
      const left = hold.readyDur - el;
      if (left <= 0) {
        hold.phase = 'hold'; hold.t0 = Date.now();
        ring.classList.add('go'); $('#hold-phase').textContent = 'HOLD!';
        sfx.go(); buzz(150);
        return;
      }
      const s = Math.ceil(left);
      cnt.textContent = s;
      fg.style.strokeDashoffset = (RING * (el / hold.readyDur)).toFixed(1);
      if (s !== hold.lastTick && s <= 3) { hold.lastTick = s; sfx.tick(); }
    } else {
      const left = hold.total - el;
      if (left <= 0) { finishHold(hold.total); return; }
      const s = Math.ceil(left);
      cnt.textContent = s;
      fg.style.strokeDashoffset = (RING * (el / hold.total)).toFixed(1);
      if (s !== hold.lastTick && s <= 3) { hold.lastTick = s; sfx.tick(); buzz(40); }
    }
  }
  function closeHold() {
    clearInterval(hold.timer); hold.timer = null; hold.active = false;
    $('#hold-overlay').classList.add('hidden');
    if (!rest.timer) keepAwake(false);
  }
  function finishHold(secs) {
    const { key, id, idx } = hold;
    closeHold();
    sfx.done(); buzz([100, 50, 200]);
    completeSet(key, id, idx, Math.max(1, Math.round(secs)), null);
  }

  /* ------------------------------------------------------------------
     Actions on data
  ------------------------------------------------------------------ */
  function completeSet(key, id, idx, value, ev) {
    const plan = planFor(key);
    const e = plan.exercises.find((x) => x.id === id);
    if (!e) return;
    commit(key, (rec) => {
      const arr = rec.sets[id] || (rec.sets[id] = []);
      arr[idx] = value;
      for (let i = 0; i < idx; i++) if (arr[i] == null) arr[i] = 0;
    }, ev);
    const prog = dayProgress(key);
    if (state.settings.autoRest && !prog.cleared && key === todayKey()) startRest(e.ex.rest);
  }

  function onSetTap(ev, id, idx) {
    const key = ui.sel;
    if (key > todayKey()) { toast('Future quests cannot be cleared yet.', true); return; }
    const plan = planFor(key);
    const e = plan.exercises.find((x) => x.id === id);
    const rec = readDay(key);
    const cur = (rec.sets[id] || [])[idx] || 0;
    if (cur > 0) {                 // undo
      commit(key, (r) => { r.sets[id][idx] = 0; });
      return;
    }
    if (e.ex.type === 'hold') { startHold(key, id, idx); return; }
    sfx.set(); buzz(25);
    completeSet(key, id, idx, 1, ev);
  }

  function setLevel(id, dir) {
    const max = EX[id].levels.length - 1;
    const cur = levelIdx(id);
    const nx = clamp(cur + dir, 0, max);
    if (nx === cur) return;
    state.levels[id] = nx;
    save(); render();
    toast(dir > 0 ? `▲ Rank ${RANKS[nx]}: ${EX[id].levels[nx]}` : `▼ Rank ${RANKS[nx]}: ${EX[id].levels[nx]}`);
    if (dir > 0) { sfx.set(); }
  }

  function dietIdFor(key) { return readDay(key).plan || DIET_BY_DAY[dowOf(key)]; }
  const dietById = (id) => DIETS.find((d) => d.id === id) || DIETS[0];

  /* ------------------------------------------------------------------
     RENDER: shared bits
  ------------------------------------------------------------------ */
  function meter(cls, label, val, max, unit) {
    const pct = clamp(max ? (val / max) * 100 : 0, 0, 100);
    return `<div class="meter ${cls}"><div class="lbl"><span>${label}</span><span>${Math.round(val)} / ${Math.round(max)} ${unit}</span></div><div class="bar"><i style="width:${pct.toFixed(1)}%"></i></div></div>`;
  }

  /* ------------------------------------------------------------------
     RENDER: QUEST tab
  ------------------------------------------------------------------ */
  function weekStripHTML(sel) {
    const t = todayKey();
    const d = parseKey(sel);
    const mondayOffset = (d.getDay() + 6) % 7;
    const start = addDays(sel, -mondayOffset);
    let h = '';
    for (let i = 0; i < 7; i++) {
      const k = addDays(start, i);
      const rec = state.days[k];
      let cls = 'wd';
      if (rec && rec.cleared) cls += ' cleared';
      else if (rec && Object.values(rec.sets || {}).some((a) => a.some((v) => v > 0))) cls += ' partial';
      if (k === t) cls += ' today';
      if (k === sel) cls += ' sel';
      h += `<button class="${cls}" data-action="day-pick" data-key="${k}" aria-label="${prettyDate(k)}"><small>${DAY_SHORT[dowOf(k)]}</small><b>${parseKey(k).getDate()}</b><span class="dot"></span></button>`;
    }
    return `<div class="weekstrip">${h}</div>`;
  }

  function exerciseCard(key, e, rec, wk) {
    const arr = rec.sets[e.id] || [];
    const done = exDone(rec, e);
    const complete = done === e.chips;
    const isHold = e.ex.type === 'hold';
    const rankLetter = RANKS[Math.min(e.li, RANKS.length - 1)];
    const maxLi = e.ex.levels.length - 1;
    let chips = '';
    for (let i = 0; i < e.chips; i++) {
      const v = arr[i] > 0 ? arr[i] : 0;
      const label = e.ex.perSide ? `${i % 2 === 0 ? 'L' : 'R'}${Math.floor(i / 2) + 1}` : `Set ${i + 1}`;
      const big = v ? (isHold ? `${v}s` : '✓') : (isHold ? `▶ ${e.target}s` : e.target);
      chips += `<button class="setchip ${v ? 'done' : ''} ${isHold && !v ? 'hold-go' : ''}" data-action="set" data-ex="${e.id}" data-i="${i}" aria-label="${esc(e.name)} ${label}"><small>${label}</small><span>${big}</span></button>`;
    }
    const unit = isHold ? 'sec hold' : (e.ex.perSide ? 'reps / side' : 'reps');
    const best = rec.best && rec.best[e.id] ? rec.best[e.id] : '';
    const hint = complete && !wk.deload && wk.bp >= 2 && e.li < maxLi
      ? `<div class="rankup-hint">⚔ Every set cleared at peak target. Ready to rank up to <b>${esc(e.ex.levels[e.li + 1])}</b>?</div>` : '';
    return `
    <article class="panel ex ${complete ? 'done' : ''}" data-exid="${e.id}">
      <div class="ex-head">
        <div class="ex-rank"><b>${rankLetter}</b><small>RANK</small></div>
        <div class="grow">
          <div class="row between wrap" style="gap:6px"><span class="badge ${isHold ? 'hold' : 'reps'}">${isHold ? 'Hold' : 'Strength'}</span><span class="small muted">${done}/${e.chips} sets</span></div>
          <h3 class="ex-name" style="margin-top:6px">${esc(e.name)}</h3>
          <p class="ex-muscle">${esc(e.ex.muscle)}</p>
        </div>
      </div>
      <div class="target"><span class="tv">${e.sets} × ${e.target}${isHold ? 's' : ''}${e.ex.perSide ? ' / side' : ''}</span><span class="small muted">${unit}${wk.deload ? ' · deload' : ''}</span></div>
      <div class="sets">${chips}</div>
      ${hint}
      <div class="ex-foot">
        <button class="cue-btn" data-action="cue" data-ex="${e.id}">ⓘ Form cue</button>
        <div class="bestrow"><span>Best ${isHold ? 'sec' : 'reps'}</span><input type="number" inputmode="numeric" min="0" max="999" value="${best}" data-best="${e.id}" aria-label="Best ${esc(e.name)}"/></div>
        <div class="rank-ctl">
          <button data-action="rank" data-ex="${e.id}" data-dir="-1" ${e.li === 0 ? 'disabled' : ''} aria-label="Easier variation">▼</button>
          <button data-action="rank" data-ex="${e.id}" data-dir="1" ${e.li >= maxLi ? 'disabled' : ''} aria-label="Harder variation">▲</button>
        </div>
      </div>
      <div class="cue hidden" id="cue-${e.id}">${esc(e.ex.cue)}</div>
    </article>`;
  }

  function renderQuest() {
    const key = ui.sel;
    const t = todayKey();
    const isToday = key === t, isFuture = key > t;
    const prog = dayProgress(key);
    const { plan, rec } = prog;
    const wk = plan.wk;
    const diet = dietById(dietIdFor(key));
    const mealsDone = diet.meals.filter((m) => (rec.meals || {})[m.id]).length;
    const pct = prog.total ? Math.round((prog.done / prog.total) * 100) : 0;
    const holdCount = plan.exercises.filter((e) => e.ex.type === 'hold').length;

    // penalty
    const yest = addDays(t, -1);
    const penaltyDue = isToday && yest >= state.startDate && !(state.days[yest] && state.days[yest].cleared);
    const penDone = PENALTY.every((p) => (rec.pen || {})[p.id]);

    let html = `<div class="${ui.animate ? 'tab-in' : ''}">`;

    // Date navigation
    html += `
    <section class="panel">
      <div class="daynav">
        <button class="sq" data-action="day-prev" aria-label="Previous day">‹</button>
        <div class="mid">
          <div class="date">${DAY_NAMES[dowOf(key)]}</div>
          <div class="small muted">${prettyDate(key)} ${isToday ? '· <b class="gold">TODAY</b>' : isFuture ? '· upcoming' : ''}</div>
        </div>
        ${isToday ? '' : '<button class="chip-btn on" data-action="day-today">Today</button>'}
        <button class="sq" data-action="day-next" aria-label="Next day">›</button>
      </div>
      ${weekStripHTML(key)}
    </section>`;

    // System window: quest
    html += `
    <section class="panel sys hero">
      <div class="hero-bg"><svg viewBox="-100 -100 200 200" class="spin-slow"><use href="#svg-magic-circle"></use></svg></div>
      <p class="sys-tag">[ SYSTEM ] ${isFuture ? 'Upcoming Quest' : 'Daily Quest Has Arrived'}</p>
      <h2 class="h-title" style="font-size:22px;margin-top:6px">${plan.day.icon} ${esc(plan.day.title)}</h2>
      <p class="muted small" style="margin-top:2px">${esc(plan.day.sub)}</p>
      <div class="row wrap" style="margin-top:10px;gap:6px">
        <span class="tagx k">Week ${wk.weekNo}</span>
        <span class="tagx">Block ${wk.block + 1} · ${wk.deload ? 'DELOAD' : 'Phase ' + (wk.bp + 1) + '/3'}</span>
        <span class="tagx p">${holdCount} holds</span>
        <span class="tagx">~${Math.round(plan.exercises.reduce((a, e) => a + e.chips * (e.ex.type === 'hold' ? e.target + e.ex.rest : 30 + e.ex.rest), 0) / 60) + 5} min</span>
      </div>
      <div class="meter k" style="margin-top:14px"><div class="lbl"><span>Quest progress</span><span>${prog.done} / ${prog.total} sets</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>
      <p class="quote">“${esc(plan.day.quote)}”</p>
      <p class="small muted" style="margin-top:8px">Reward: up to <b class="gold">${potentialXP(key)} XP</b>${wk.deload ? ' · Deload week: lighter volume, recover & grow' : ''}</p>
    </section>`;

    html += speechCard(key);

    // Penalty
    if (penaltyDue) {
      html += `
      <section class="panel warn">
        <p class="sys-tag">[ SYSTEM ] ⚠ Penalty Quest</p>
        <p class="small" style="margin:6px 0 10px">Yesterday's quest was not cleared. Pay the penalty to keep your honor (+20 XP).</p>
        <div class="qlist" style="margin-top:0">
          ${PENALTY.map((p) => `<button class="qitem ${(rec.pen || {})[p.id] ? 'done' : ''}" data-action="pen" data-id="${p.id}"><span class="ck">✓</span><span class="ql" style="text-transform:none;letter-spacing:0;font-family:var(--f-body);font-weight:500;font-size:14px">${esc(p.text)}</span></button>`).join('')}
        </div>
        ${penDone ? '<p class="ok small" style="margin-top:8px">Penalty cleared. Return to the quest.</p>' : ''}
      </section>`;
    }

    // Checklist
    const sleepOk = num(rec.sleep) >= 7;
    html += `
    <section class="panel">
      <h3 class="h3">Daily Checklist</h3>
      <div class="qlist">
        <div class="qitem ${prog.cleared ? 'done' : ''}"><span class="ck">✓</span><span class="ql">Strength training</span><span class="qv">${prog.done}/${prog.total}</span></div>
        <button class="qitem ${mealsDone === diet.meals.length ? 'done' : ''}" data-action="goto" data-tab="rations"><span class="ck">✓</span><span class="ql">South Indian rations</span><span class="qv">${mealsDone}/${diet.meals.length}</span></button>
        <button class="qitem ${(rec.water || 0) >= 10 ? 'done' : ''}" data-action="goto" data-tab="rations"><span class="ck">✓</span><span class="ql">Hydration</span><span class="qv">${rec.water || 0}/10</span></button>
        <button class="qitem ${sleepOk ? 'done' : ''}" data-action="goto" data-tab="rations"><span class="ck">✓</span><span class="ql">Sleep 7h+</span><span class="qv">${rec.sleep ? rec.sleep + 'h' : '—'}</span></button>
      </div>
    </section>`;

    // Warm-up
    html += `
    <details class="panel fold">
      <summary><span style="font-size:20px">🔥</span><span class="h3" style="flex:1">Warm-Up Ritual · 5 min</span>
        <button class="chip-btn ${rec.warm ? 'on' : ''}" data-action="warm">${rec.warm ? '✓ Done' : 'Mark done'}</button><span class="chev">▾</span></summary>
      <ol class="wu-list">${WARMUP.map((w) => `<li>${esc(w)}</li>`).join('')}</ol>
    </details>`;

    // Exercises
    html += `<div class="row between" style="margin:4px 2px 10px"><h3 class="h3">Today's Spells</h3><span class="small muted">Tap a set when done · holds start a timer</span></div>`;
    html += plan.exercises.map((e) => exerciseCard(key, e, rec, wk)).join('');

    html += `<p class="foot-note">Equipment: bodyweight + pull-up bar + sturdy chair/table + a wall.<br/>Pain (not burn) = stop and rank down ▼.</p></div>`;
    return html;
  }

  /* ------------------------------------------------------------------
     RENDER: RATIONS tab
  ------------------------------------------------------------------ */
  function renderRations() {
    const key = ui.sel;
    const rec = readDay(key);
    const diet = dietById(dietIdFor(key));
    const eaten = diet.meals.filter((m) => (rec.meals || {})[m.id]);
    const sum = (arr, f) => arr.reduce((a, m) => a + m[f], 0);
    const planK = sum(diet.meals, 'kcal'), planP = sum(diet.meals, 'p'), planC = sum(diet.meals, 'cost');
    const water = rec.water || 0;

    let h = `<div class="${ui.animate ? 'tab-in' : ''}">`;
    h += `
    <section class="panel sys">
      <p class="sys-tag">[ SYSTEM ] Rations · ${DAY_NAMES[dowOf(key)]} ${shortDate(key)}</p>
      <h2 class="h-title" style="font-size:20px;margin-top:6px">South Indian Budget Fuel</h2>
      <p class="small muted">Home-cooked, high-protein, ~₹${planC}/day. Strength is built in the kitchen too.</p>
      ${meter('k', 'Calories eaten', sum(eaten, 'kcal'), state.settings.kcal, 'kcal')}
      ${meter('p', 'Protein eaten', sum(eaten, 'p'), state.settings.protein, 'g')}
      <div class="row between small muted" style="margin-top:10px"><span>Spent so far: <b class="gold">₹${sum(eaten, 'cost')}</b></span><span>Plan total: ${planK} kcal · ${planP} g · ₹${planC}</span></div>
    </section>

    <section class="panel">
      <h3 class="h3">Choose today's menu</h3>
      <div class="plan-pick" style="margin-top:10px">
        ${DIETS.map((d) => `<button class="${d.id === diet.id ? 'on' : ''}" data-action="diet-pick" data-id="${d.id}"><b>${d.id}</b><small>₹${d.cost}</small></button>`).join('')}
      </div>
      <p class="small" style="margin-top:8px"><b>${esc(diet.name)}</b> <span class="muted">— ${esc(diet.tag)}</span></p>
    </section>

    <div class="stack" style="margin-bottom:14px">
      ${diet.meals.map((m) => `
        <button class="meal ${(rec.meals || {})[m.id] ? 'done' : ''}" data-action="meal" data-id="${m.id}">
          <span class="mi">${m.icon}</span>
          <span class="grow">
            <span class="mt">${m.slot}</span><br/>
            <span class="mn">${esc(m.name)}</span>
            <span class="mm"><span class="tagx k">${m.kcal} kcal</span><span class="tagx p">${m.p} g protein</span><span class="tagx">₹${m.cost}</span></span>
            <span class="tip" style="display:block">💡 ${esc(m.tip)}</span>
          </span>
          <span class="mcheck">✓</span>
        </button>`).join('')}
    </div>

    <section class="panel">
      <h3 class="h3">Hydration & Recovery</h3>
      <div class="row between small" style="margin-top:8px"><span>Water — 10 glasses (250 ml) ≈ 2.5 L</span><b class="gold">${water}/10</b></div>
      <div class="water">${Array.from({ length: 10 }, (_, i) => `<button class="glass ${i < water ? 'on' : ''}" data-action="water" data-i="${i}" aria-label="Glass ${i + 1}"></button>`).join('')}</div>
      <div class="inputs2" style="margin-top:14px">
        <div class="field"><label for="in-steps">Steps (goal 8000)</label><input id="in-steps" type="number" inputmode="numeric" min="0" step="100" value="${esc(rec.steps)}" data-day="steps" placeholder="8000"/></div>
        <div class="field"><label for="in-sleep">Sleep hours (7+)</label><input id="in-sleep" type="number" inputmode="decimal" min="0" max="24" step="0.5" value="${esc(rec.sleep)}" data-day="sleep" placeholder="7.5"/></div>
      </div>
    </section>

    <details class="panel fold">
      <summary><span style="font-size:20px">💰</span><span class="h3" style="flex:1">Budget Intel · protein per ₹</span><span class="chev">▾</span></summary>
      <p class="small muted" style="margin:10px 0 6px">Approximate prices (they vary by city and season). Highest "g per ₹10" = cheapest protein.</p>
      <table class="tbl">
        <thead><tr><th>Food</th><th>₹</th><th>Protein</th><th style="text-align:right">g / ₹10</th></tr></thead>
        <tbody>
          ${[...BUDGET_INTEL].sort((a, b) => b.p / b.rs - a.p / a.rs).map((r) => `<tr><td>${esc(r.food)}<br/><span class="small muted">${esc(r.per)} · ${esc(r.note)}</span></td><td>₹${r.rs}</td><td>${r.p} g</td><td class="n">${((r.p / r.rs) * 10).toFixed(1)}</td></tr>`).join('')}
        </tbody>
      </table>
      <hr class="sep"/>
      <h3 class="h3">Money-saving rules</h3>
      <ul class="wu-list">${BUDGET_TIPS.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
    </details>
    <p class="foot-note">Calories and protein are estimates for home portions. Adjust targets in the Vault.</p>
    </div>`;
    return h;
  }

  /* ------------------------------------------------------------------
     RENDER: STATUS tab
  ------------------------------------------------------------------ */
  function radarSVG(stats) {
    const keys = ['STR', 'END', 'VIT', 'AGI', 'MANA'];
    const max = Math.max(40, ...keys.map((k) => stats[k])) * 1.15;
    const cx = 150, cy = 140, R = 100;
    const pt = (i, r) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
    const ring = (f) => keys.map((_, i) => pt(i, R * f).join(',')).join(' ');
    const poly = keys.map((k, i) => pt(i, (stats[k] / max) * R).join(',')).join(' ');
    return `
    <svg class="radar" viewBox="0 0 300 280" role="img" aria-label="Stat radar">
      ${[0.25, 0.5, 0.75, 1].map((f) => `<polygon points="${ring(f)}" fill="none" stroke="rgba(227,179,76,.25)" stroke-width="1"/>`).join('')}
      ${keys.map((_, i) => `<line x1="${cx}" y1="${cy}" x2="${pt(i, R)[0]}" y2="${pt(i, R)[1]}" stroke="rgba(227,179,76,.18)"/>`).join('')}
      <polygon points="${poly}" fill="rgba(255,51,71,.28)" stroke="#ff3347" stroke-width="2.2" stroke-linejoin="round" style="filter:drop-shadow(0 0 6px rgba(255,51,71,.7))"/>
      ${keys.map((k, i) => { const [x, y] = pt(i, (stats[k] / max) * R); return `<circle cx="${x}" cy="${y}" r="4" fill="#e3b34c"/>`; }).join('')}
      ${keys.map((k, i) => { const [x, y] = pt(i, R + 22); return `<text x="${x}" y="${y + 4}" text-anchor="middle" font-family="Rajdhani,sans-serif" font-weight="700" font-size="14" letter-spacing="2" fill="#e3b34c">${k}</text>`; }).join('')}
    </svg>`;
  }

  function weightChart() {
    const pts = [...state.body].filter((b) => b.w).sort((a, b) => (a.date < b.date ? -1 : 1));
    if (pts.length < 2) return '<div class="empty">Log your weight on two different days to see the trend.</div>';
    const W = 320, H = 130, pl = 30, pr = 10, pt = 12, pb = 22;
    const ws = pts.map((p) => p.w);
    let mn = Math.min(...ws), mx = Math.max(...ws);
    if (mx - mn < 2) { mn -= 1; mx += 1; }
    const x = (i) => pl + (i * (W - pl - pr)) / (pts.length - 1);
    const y = (v) => pt + (1 - (v - mn) / (mx - mn)) * (H - pt - pb);
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(p.w).toFixed(1)}`).join(' ');
    const area = `${line} L${x(pts.length - 1).toFixed(1)} ${H - pb} L${pl} ${H - pb} Z`;
    return `
    <svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight chart">
      <defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff3347" stop-opacity=".4"/><stop offset="1" stop-color="#ff3347" stop-opacity="0"/></linearGradient></defs>
      <text x="2" y="${y(mx) + 3}">${mx.toFixed(1)}</text><text x="2" y="${y(mn) + 3}">${mn.toFixed(1)}</text>
      <line x1="${pl}" x2="${W - pr}" y1="${y(mx)}" y2="${y(mx)}" stroke="rgba(255,255,255,.08)"/><line x1="${pl}" x2="${W - pr}" y1="${y(mn)}" y2="${y(mn)}" stroke="rgba(255,255,255,.08)"/>
      <path d="${area}" fill="url(#wg)"/><path d="${line}" fill="none" stroke="#ff3347" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.w)}" r="3.4" fill="#e3b34c"/>`).join('')}
      <text x="${pl}" y="${H - 5}">${shortDate(pts[0].date)}</text><text x="${W - pr}" y="${H - 5}" text-anchor="end">${shortDate(pts[pts.length - 1].date)}</text>
    </svg>`;
  }

  function renderStatus() {
    const xp = totalXP();
    const L = levelFromXP(xp);
    const rank = rankOfLevel(L.lv);
    const s = computeStats();
    const bodySorted = [...state.body].sort((a, b) => (a.date < b.date ? 1 : -1));
    const latest = bodySorted[0];
    const first = [...state.body].sort((a, b) => (a.date < b.date ? -1 : 1))[0];
    const h = state.profile.heightCm;
    const bmi = latest && h ? latest.w / Math.pow(h / 100, 2) : 0;
    const bmiCat = bmi < 18.5 ? 'Under' : bmi < 25 ? 'Healthy' : bmi < 30 ? 'Over' : 'Obese';
    const prs = Object.keys(s.pr).filter((id) => EX[id]).sort((a, b) => s.pr[b] - s.pr[a]);
    const clearedTrials = Object.values(state.trials).filter(Boolean).length;

    return `
    <div class="${ui.animate ? 'tab-in' : ''}">
    <section class="panel sys">
      <p class="sys-tag">[ SYSTEM ] Status Window</p>
      <div class="rankplate" style="margin-top:12px">
        <div class="rank-big">${rank}</div>
        <div class="grow">
          <div class="rank-title">${esc(TITLES[rank])}</div>
          <div class="small muted">${esc(state.name)} · Level <b class="gold">${L.lv}</b> · ${xp.toLocaleString()} XP</div>
          <div class="bigxp"><i style="width:${(L.pct * 100).toFixed(1)}%"></i></div>
          <div class="small muted" style="margin-top:3px">${Math.round(L.into)} / ${L.need} XP to Level ${L.lv + 1}</div>
        </div>
      </div>
      ${radarSVG(s)}
      <div class="statgrid">
        <div class="stat"><div class="sn">STR</div><div class="sv">${s.STR}</div><div class="sx">${s.strSets} strength sets</div></div>
        <div class="stat"><div class="sn">END</div><div class="sv">${s.END}</div><div class="sx">${fmtTime(s.holdSec)} total hold time</div></div>
        <div class="stat"><div class="sn">VIT</div><div class="sv">${s.VIT}</div><div class="sx">food · water · sleep</div></div>
        <div class="stat"><div class="sn">AGI</div><div class="sv">${s.AGI}</div><div class="sx">legs · mobility · steps</div></div>
        <div class="stat" style="grid-column:1/-1"><div class="sn">MANA (consistency)</div><div class="sv">${s.MANA}</div><div class="sx">best streak ${s.st.best} · ${s.st.total} quests cleared</div></div>
      </div>
    </section>

    <section class="panel">
      <h3 class="h3">Lifetime Record</h3>
      <div style="margin-top:6px">
        <div class="kv"><span>Current streak</span><b>🔥 ${s.st.cur} days</b></div>
        <div class="kv"><span>Best streak</span><b>${s.st.best} days</b></div>
        <div class="kv"><span>Quests cleared</span><b>${s.st.total}</b></div>
        <div class="kv"><span>Total sets</span><b>${s.sets}</b></div>
        <div class="kv"><span>Total hold time</span><b>${fmtTime(s.holdSec)}</b></div>
        <div class="kv"><span>Rank trials cleared</span><b>${clearedTrials} / ${TRIALS.length}</b></div>
      </div>
    </section>

    <section class="panel">
      <h3 class="h3">Personal Records</h3>
      ${prs.length ? `<div style="margin-top:6px">${prs.map((id) => `<div class="kv"><span>${esc(EX[id].name)}</span><b>${s.pr[id]}${EX[id].type === 'hold' ? ' s' : ' reps'}</b></div>`).join('')}</div>` : '<div class="empty">Enter your best set in any exercise card and it appears here.</div>'}
    </section>

    <section class="panel">
      <h3 class="h3">Body Log</h3>
      <div class="row between" style="margin:8px 0 12px"><div><div class="small muted">Latest</div><b style="font-family:var(--f-hud);font-size:26px">${latest ? latest.w + ' kg' : '—'}</b> <span class="small muted">${bmi ? 'BMI ' + bmi.toFixed(1) + ' · ' + bmiCat : ''}</span></div>
        <div style="text-align:right"><div class="small muted">Change</div><b class="gold" style="font-family:var(--f-hud);font-size:22px">${latest && first && latest !== first ? ((latest.w - first.w) > 0 ? '+' : '') + (latest.w - first.w).toFixed(1) + ' kg' : '—'}</b></div></div>
      ${weightChart()}
      <hr class="sep"/>
      <div class="inputs2">
        <div class="field"><label for="b-w">Weight (kg)</label><input id="b-w" type="number" inputmode="decimal" step="0.1" placeholder="e.g. 94.5"/></div>
        <div class="field"><label for="b-waist">Waist (cm)</label><input id="b-waist" type="number" inputmode="decimal" step="0.5" placeholder="optional"/></div>
        <div class="field"><label for="b-chest">Chest (cm)</label><input id="b-chest" type="number" inputmode="decimal" step="0.5" placeholder="optional"/></div>
        <div class="field"><label for="b-arm">Arm (cm)</label><input id="b-arm" type="number" inputmode="decimal" step="0.5" placeholder="optional"/></div>
      </div>
      <button class="btn block" style="margin-top:12px" data-action="body-add">+ Log for ${shortDate(todayKey())}</button>
      <div style="margin-top:10px">
        ${bodySorted.length ? bodySorted.slice(0, 12).map((b) => `
          <div class="logrow"><span class="d">${shortDate(b.date)}</span><span>${b.w ? b.w + ' kg' : ''}<span class="x">${b.waist ? ' · waist ' + b.waist : ''}${b.chest ? ' · chest ' + b.chest : ''}${b.arm ? ' · arm ' + b.arm : ''}</span></span><button data-action="body-del" data-date="${b.date}" aria-label="Delete entry">✕</button></div>`).join('') : '<div class="empty">No entries yet.</div>'}
      </div>
    </section>
    </div>`;
  }

  /* ------------------------------------------------------------------
     RENDER: GRIMOIRE tab
  ------------------------------------------------------------------ */
  function renderGrimoire() {
    const t = todayKey();
    const wk = weekInfo(t);
    const order = [1, 2, 3, 4, 5, 6, 0];
    const cats = [['push', 'Push'], ['pull', 'Pull'], ['legs', 'Legs'], ['core', 'Core'], ['mobility', 'Mobility']];
    const holdIds = Object.keys(EX).filter((id) => EX[id].type === 'hold');

    return `
    <div class="${ui.animate ? 'tab-in' : ''}">
    <section class="panel sys">
      <p class="sys-tag">[ SYSTEM ] Training Protocol</p>
      <h2 class="h-title" style="font-size:20px;margin-top:6px">Whole-Body Strength · Daily</h2>
      <p class="small muted" style="margin-top:4px">You are in <b class="gold">Week ${wk.weekNo}</b> (Block ${wk.block + 1}, ${wk.deload ? 'deload' : 'phase ' + (wk.bp + 1)}). Every day trains strength and finishes with <b>isometric holds</b>. Targets rise each week; week 4 of every block is a lighter deload.</p>
    </section>

    <section class="panel">
      <h3 class="h3">The Weekly Grimoire</h3>
      ${order.map((d) => {
        const p = PLAN[d];
        const holds = p.ids.filter((id) => EX[id].type === 'hold').length;
        const isToday = dowOf(t) === d;
        return `<button class="dayrow ${isToday ? 'today' : ''}" style="width:100%;text-align:left" data-action="goto-dow" data-dow="${d}">
          <span class="di">${p.icon}</span>
          <span class="grow"><span class="dd">${DAY_NAMES[d]}${isToday ? ' · today' : ''}</span><br/><span class="dt">${esc(p.title)}</span><span class="dx" style="display:block">${esc(p.sub)}</span><span class="dx" style="display:block">${p.ids.length} movements · ${holds} holds</span></span>
        </button>`;
      }).join('')}
    </section>

    <section class="panel">
      <h3 class="h3">How Ranks Work</h3>
      <ul class="wu-list" style="margin-top:10px">
        <li>Each movement has a ladder of variations, <b>E → S</b>. Use ▲ / ▼ on any exercise card.</li>
        <li>Clear <b>every set at the full target</b> in the peak week → rank up ▲ to the harder variation.</li>
        <li>If form breaks or something pinches, rank down ▼. No ego. Strength is built on clean reps.</li>
        <li>Rest 45–90 s between sets (timer starts automatically).</li>
        <li>Holds: breathe, squeeze every muscle, quality over seconds.</li>
      </ul>
    </section>

    <section class="panel">
      <h3 class="h3">12-Week Roadmap</h3>
      ${BLOCKS.map((b, i) => `<div class="dayrow ${wk.block === i ? 'today' : ''}"><span class="di">${['🌱', '⚔', '👑'][i]}</span><span class="grow"><span class="dd">${b.weeks}</span><br/><span class="dt">${esc(b.name)}</span><span class="dx" style="display:block">${esc(b.text)}</span></span></div>`).join('')}
      <p class="small muted" style="margin-top:10px">After week 12 the cycle repeats with a higher starting target. Keep ranking up.</p>
    </section>

    <section class="panel">
      <div class="row between"><h3 class="h3">Rank Trials</h3><span class="small muted">${Object.values(state.trials).filter(Boolean).length}/${TRIALS.length} · +150 XP each</span></div>
      <p class="small muted" style="margin:6px 0 10px">Real-world strength milestones. Test yourself fresh, then tick the gate you cleared.</p>
      <div class="stack">
        ${TRIALS.map((tr) => `<button class="trial ${state.trials[tr.id] ? 'done' : ''}" data-action="trial" data-id="${tr.id}"><span class="tk">✓</span><span class="tn">${esc(tr.name)}</span><span class="ts">${tr.stat}</span></button>`).join('')}
      </div>
    </section>

    <section class="panel">
      <h3 class="h3">Hold Library · ${holdIds.length} isometrics</h3>
      <p class="small muted" style="margin:6px 0 4px">Holds build tendon and joint strength, core tension and mental toughness.</p>
      ${holdIds.map((id) => `<div class="kv" style="display:block"><b style="font-size:16px">${esc(EX[id].name)}</b><div class="small muted">${esc(EX[id].muscle)}</div><div class="small" style="margin-top:3px">${EX[id].levels.map((l, i) => `<span class="gold">${RANKS[i]}</span> ${esc(l)}`).join(' &nbsp;›&nbsp; ')}</div></div>`).join('')}
    </section>

    <section class="panel">
      <h3 class="h3">Spell Library · all movements</h3>
      ${cats.map(([c, label]) => `
        <details class="fold" style="margin-top:8px"><summary><span class="ex-name" style="font-size:16px">${label}</span><span class="chev">▾</span></summary>
          ${Object.keys(EX).filter((id) => EX[id].cat === c && EX[id].type === 'reps').map((id) => `<div class="kv" style="display:block"><b style="font-size:16px">${esc(EX[id].name)}</b><div class="small muted">${esc(EX[id].cue)}</div><div class="small" style="margin-top:3px">${EX[id].levels.map((l, i) => `<span class="gold">${RANKS[i]}</span> ${esc(l)}`).join(' › ')}</div></div>`).join('') || '<div class="small muted" style="padding:8px 0">See Hold Library above.</div>'}
        </details>`).join('')}
    </section>
    </div>`;
  }

  /* ------------------------------------------------------------------
     RENDER: VAULT tab
  ------------------------------------------------------------------ */
  let installEvt = null;
  function renderVault() {
    const st = state.settings;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    return `
    <div class="${ui.animate ? 'tab-in' : ''}">
    <section class="panel sys">
      <p class="sys-tag">[ SYSTEM ] Vault</p>
      <h2 class="h-title" style="font-size:20px;margin-top:6px">Settings & Backup</h2>
      <p class="small muted">Everything is stored privately on this device.</p>
    </section>

    <section class="panel">
      <h3 class="h3">Hunter Profile</h3>
      <div class="inputs2" style="margin-top:10px">
        <div class="field"><label for="s-name">Name</label><input id="s-name" type="text" maxlength="20" value="${esc(state.name)}" data-prof="name"/></div>
        <div class="field"><label for="s-height">Height (cm)</label><input id="s-height" type="number" inputmode="numeric" value="${state.profile.heightCm}" data-prof="heightCm"/></div>
        <div class="field"><label for="s-goal">Goal weight (kg)</label><input id="s-goal" type="number" inputmode="decimal" step="0.5" value="${state.profile.goalWeight || ''}" data-prof="goalWeight"/></div>
        <div class="field"><label for="s-start">Program start</label><input id="s-start" type="date" value="${state.programStart}" data-prof="programStart"/></div>
      </div>
      <p class="small muted" style="margin-top:8px">Program start decides your week number (and deload weeks).</p>
    </section>

    <section class="panel">
      <h3 class="h3">Diet Targets</h3>
      <div class="inputs2" style="margin-top:10px">
        <div class="field"><label for="s-kcal">Calories / day</label><input id="s-kcal" type="number" inputmode="numeric" step="50" value="${st.kcal}" data-set="kcal"/></div>
        <div class="field"><label for="s-prot">Protein g / day</label><input id="s-prot" type="number" inputmode="numeric" step="5" value="${st.protein}" data-set="protein"/></div>
      </div>
      <p class="small muted" style="margin-top:8px">Default 2200 kcal / 120 g protein: fuels strength with a gentle lean-out at ~95 kg. Eat nearer 2600 to gain size faster.</p>
    </section>

    <section class="panel">
      <h3 class="h3">Training Options</h3>
      <div class="stack" style="margin-top:10px">
        ${toggleRow('Auto rest timer after each set', 'autoRest', st.autoRest)}
        ${toggleRow('Sound effects', 'sound', st.sound)}
        ${toggleRow('Vibration', 'vibrate', st.vibrate)}
      </div>
    </section>

    <section class="panel">
      <h3 class="h3">Install on your phone</h3>
      ${isStandalone ? '<p class="ok small" style="margin-top:8px">✓ Installed — you are running the app.</p>' : `
      <p class="small muted" style="margin:8px 0 12px">Add the System to your Home Screen to run it full-screen, offline.</p>
      <button class="btn gold block" data-action="install">📲 Install App</button>`}
    </section>

    <section class="panel">
      <h3 class="h3">Backup</h3>
      <p class="small muted" style="margin:8px 0 12px">Your data lives only on this phone. Export a backup now and then.</p>
      <div class="inputs2">
        <button class="btn ghost" data-action="export">⬇ Export</button>
        <label class="btn ghost" style="display:grid;place-items:center;cursor:pointer">⬆ Import<input type="file" id="import-file" accept=".json,application/json" hidden/></label>
      </div>
      ${ui.vaultMsg ? `<p class="small gold" style="margin-top:10px">${esc(ui.vaultMsg)}</p>` : ''}
      <hr class="sep"/>
      <button class="btn ghost block" style="color:#ff8b97" data-action="reset">Reset all data</button>
    </section>
    <p class="foot-note">ARISE System · built for one Hunter only<br/>“I alone level up.”</p>
    </div>`;
  }
  function toggleRow(label, key, on) {
    return `<div class="row between"><span>${label}</span><button class="chip-btn ${on ? 'on' : ''}" data-action="toggle" data-key="${key}" style="min-width:64px">${on ? 'ON' : 'OFF'}</button></div>`;
  }

  /* ------------------------------------------------------------------
     Render dispatcher
  ------------------------------------------------------------------ */
  function render() {
    const view = $('#view');
    const y = window.scrollY;
    const map = { quest: renderQuest, rations: renderRations, status: renderStatus, grimoire: renderGrimoire, vault: renderVault };
    view.innerHTML = (map[ui.tab] || renderQuest)();
    ui.animate = false;
    document.querySelectorAll('#nav button').forEach((b) => b.classList.toggle('active', b.dataset.tab === ui.tab));
    window.scrollTo(0, y);
  }

  function gotoTab(tab) {
    ui.tab = tab; ui.animate = true;
    render();
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------
     Events
  ------------------------------------------------------------------ */
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-action]');
    if (!t) return;
    const a = t.dataset.action;
    const key = ui.sel;
    const futureBlock = () => { if (key > todayKey()) { toast('Future quests cannot be cleared yet.', true); return true; } return false; };

    switch (a) {
      case 'goto': gotoTab(t.dataset.tab); break;
      case 'close-goto': closeModal(); gotoTab(t.dataset.tab); break;
      case 'goto-dow': {
        const d = Number(t.dataset.dow);
        const tk = todayKey();
        const off = (d - dowOf(tk) + 7) % 7;
        ui.sel = addDays(tk, off); gotoTab('quest');
        break;
      }
      case 'day-prev': ui.sel = addDays(ui.sel, -1); ui.animate = true; render(); break;
      case 'day-next': ui.sel = addDays(ui.sel, 1); ui.animate = true; render(); break;
      case 'day-today': ui.sel = todayKey(); ui.animate = true; render(); break;
      case 'day-pick': ui.sel = t.dataset.key; render(); break;
      case 'set': onSetTap(ev, t.dataset.ex, Number(t.dataset.i)); break;
      case 'cue': { const el = $('#cue-' + t.dataset.ex); if (el) el.classList.toggle('hidden'); break; }
      case 'rank': setLevel(t.dataset.ex, Number(t.dataset.dir)); break;
      case 'warm': ev.preventDefault(); if (futureBlock()) break; commit(key, (r) => { r.warm = !r.warm; }, ev); break;
      case 'pen': commit(todayKey(), (r) => { r.pen = r.pen || {}; r.pen[t.dataset.id] = !r.pen[t.dataset.id]; }, ev); break;
      case 'meal': if (futureBlock()) break; commit(key, (r) => { r.meals = r.meals || {}; r.meals[t.dataset.id] = !r.meals[t.dataset.id]; }, ev); break;
      case 'diet-pick': commit(key, (r) => { r.plan = t.dataset.id; r.meals = {}; }); break;
      case 'water': {
        if (futureBlock()) break;
        const i = Number(t.dataset.i);
        commit(key, (r) => { r.water = (r.water || 0) === i + 1 ? i : i + 1; }, ev);
        break;
      }
      case 'trial': {
        const id = t.dataset.id;
        const before = totalXP();
        state.trials[id] = !state.trials[id];
        save(); render(); updateHud();
        if (state.trials[id]) { sfx.done(); toast('🏆 Rank Trial cleared! +150 XP'); }
        const lv = levelFromXP(totalXP()).lv;
        if (lv > state.maxLevelSeen && totalXP() > before) { const old = state.maxLevelSeen; state.maxLevelSeen = lv; save(); showLevelUp(old, lv); }
        break;
      }
      case 'body-add': addBodyEntry(); break;
      case 'body-del': confirmModal('Delete entry?', `Remove the log for ${shortDate(t.dataset.date)}?`, 'Delete', () => { state.body = state.body.filter((b) => b.date !== t.dataset.date); save(); render(); }); break;
      case 'hold-cancel': closeHold(); break;
      case 'hold-finish': {
        if (hold.phase === 'hold') finishHold(Math.min(hold.total, (Date.now() - hold.t0) / 1000));
        else closeHold();
        break;
      }
      case 'rest-add': rest.end += 15000; rest.total += 15; tickRest(); break;
      case 'rest-skip': stopRest(); break;
      case 'modal-close': closeModal(); break;
      case 'confirm-ok': { const cb = $('#modal')._confirm; $('#modal')._confirm = null; closeModal(); if (cb) cb(); break; }
      case 'toggle': { const k = t.dataset.key; state.settings[k] = !state.settings[k]; save(); render(); break; }
      case 'install': doInstall(); break;
      case 'export': exportData(); break;
      case 'reset': confirmModal('Reset everything?', 'This permanently erases all progress, logs, ranks and settings on this device.', 'Erase all', () => { localStorage.removeItem(STORE_KEY); state = freshState(); ui.sel = todayKey(); ui.vaultMsg = ''; render(); updateHud(); startOnboarding(); }); break;
      default: break;
    }
  });

  document.addEventListener('change', (ev) => {
    const t = ev.target;
    if (t.id === 'import-file') { importData(t.files[0]); return; }
    if (t.dataset.best) {
      const v = t.value === '' ? '' : clamp(num(t.value), 0, 999);
      commit(ui.sel, (r) => { r.best = r.best || {}; if (v === '') delete r.best[t.dataset.best]; else r.best[t.dataset.best] = v; });
      if (v !== '') toast('Best saved');
      return;
    }
    if (t.dataset.day) {
      const f = t.dataset.day;
      if (ui.sel > todayKey()) { toast('Future days cannot be logged yet.', true); render(); return; }
      commit(ui.sel, (r) => { r[f] = t.value; });
      return;
    }
    if (t.dataset.prof) {
      const f = t.dataset.prof;
      if (f === 'name') state.name = t.value.trim() || 'Warrior';
      else if (f === 'programStart') { if (t.value) state.programStart = t.value; }
      else state.profile[f] = num(t.value);
      save(); updateHud(); toast('Saved');
      return;
    }
    if (t.dataset.set) {
      state.settings[t.dataset.set] = clamp(num(t.value), 500, 6000);
      save(); toast('Targets saved');
    }
  });

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' && ev.target.id === 'hud-mini') gotoTab('status');
    if (ev.key === 'Escape') { if (hold.active) closeHold(); else if (modalOpen) closeModal(); }
  });

  function addBodyEntry() {
    const w = num($('#b-w').value), waist = num($('#b-waist').value), chest = num($('#b-chest').value), arm = num($('#b-arm').value);
    if (!w && !waist && !chest && !arm) { toast('Enter at least one measurement.', true); return; }
    if (w && (w < 30 || w > 300)) { toast('Weight looks wrong.', true); return; }
    const date = todayKey();
    const ex = state.body.find((b) => b.date === date) || (state.body.push({ date }), state.body[state.body.length - 1]);
    if (w) ex.w = w; if (waist) ex.waist = waist; if (chest) ex.chest = chest; if (arm) ex.arm = arm;
    save(); render(); toast('📜 Body log saved');
  }

  /* ------------------------------------------------------------------
     Backup / install / onboarding
  ------------------------------------------------------------------ */
  function exportData() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `grimoire-backup-${todayKey()}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    ui.vaultMsg = 'Backup downloaded.'; render();
  }
  function importData(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const p = JSON.parse(r.result);
        if (!p || typeof p !== 'object' || !p.days || !p.settings) throw new Error('bad');
        localStorage.setItem(STORE_KEY, JSON.stringify(p));
        state = loadState();
        state.setup = true; save();
        state.maxLevelSeen = Math.max(state.maxLevelSeen || 1, levelFromXP(totalXP()).lv); save();
        ui.vaultMsg = 'Backup restored.'; render(); updateHud();
      } catch (e) { ui.vaultMsg = 'That file is not a valid backup.'; render(); }
    };
    r.readAsText(file);
  }

  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvt = e; });
  window.addEventListener('appinstalled', () => { installEvt = null; toast('System installed!'); if (ui.tab === 'vault') render(); });
  async function doInstall() {
    if (installEvt) {
      installEvt.prompt();
      try { await installEvt.userChoice; } catch (e) { /* ignore */ }
      installEvt = null;
      return;
    }
    showModal(`
      <p class="sys-tag">[ SYSTEM ] INSTALL</p>
      <h2>Add to Home Screen</h2>
      <ol>
        <li><b>Android (Chrome):</b> tap the ⋮ menu → <b>Install app</b> / <b>Add to Home screen</b>.</li>
        <li><b>iPhone (Safari):</b> tap <b>Share</b> (□↑) → <b>Add to Home Screen</b>.</li>
        <li>Open the site once online; after that it works offline.</li>
      </ol>
      <div class="btns"><button class="btn" data-action="modal-close">Got it</button></div>`);
  }

  function startOnboarding() {
    showModal(`
      <p class="sys-tag">[ SYSTEM ] NEW PLAYER DETECTED · ARISE</p>
      <h2>Awaken, Warrior</h2>
      <p class="small">Set up your Grimoire. You can change all of this later in the Vault.</p>
      <div class="stack-left stack" style="margin-top:14px">
        <div class="field"><label for="o-name">Your name</label><input id="o-name" type="text" maxlength="20" placeholder="Warrior" value=""/></div>
        <div class="inputs2">
          <div class="field"><label for="o-w">Weight (kg)</label><input id="o-w" type="number" inputmode="decimal" step="0.1" value="95"/></div>
          <div class="field"><label for="o-h">Height (cm)</label><input id="o-h" type="number" inputmode="numeric" value="170"/></div>
        </div>
      </div>
      <div class="btns"><button class="btn gold" data-action="onboard-done">Begin Training ➔</button></div>`);
  }
  document.addEventListener('click', (ev) => {
    if (!ev.target.closest('[data-action="onboard-done"]')) return;
    const name = ($('#o-name').value || '').trim() || 'Warrior';
    const w = num($('#o-w').value), h = num($('#o-h').value);
    state.name = name; state.setup = true;
    if (h >= 100 && h <= 250) state.profile.heightCm = h;
    state.startDate = todayKey(); state.programStart = todayKey();
    if (w >= 30 && w <= 300) state.body = [{ date: todayKey(), w }];
    save(); closeModal(); render(); updateHud();
    toast(`Welcome, ${name}. Quest begins now.`);
  });

  /* ------------------------------------------------------------------
     Boot
  ------------------------------------------------------------------ */
  function dismissSplash() {
    const s = $('#splash');
    if (!s || s.classList.contains('out')) return;
    s.classList.add('out');
    try { sessionStorage.setItem('bb_splash', '1'); } catch (e) { /* ignore */ }
    setTimeout(() => s.remove(), 700);
    sfx.arise();
    if (!state.setup) startOnboarding(); else setTimeout(maybeSpeech, 1500);
  }

  /* ------------------------------------------------------------------
     Daily motivation speech (once per morning, plus a card on Quest tab)
  ------------------------------------------------------------------ */
  function speechCard(key) {
    const sp = SPEECHES[dowOf(key)];
    return `<section class="panel speech"><p class="sys-tag">[ SYSTEM ] Message from the Shadow Monarch</p>
      <h3 class="h3" style="margin-top:6px">${esc(sp.by)}</h3><p class="speech-text">“${esc(sp.text)}”</p></section>`;
  }
  function maybeSpeech() {
    const k = todayKey(); let seen = null;
    try { seen = localStorage.getItem('bb_speech_day'); } catch (e) { /* ignore */ }
    if (seen === k) return;
    try { localStorage.setItem('bb_speech_day', k); } catch (e) { /* ignore */ }
    const sp = SPEECHES[dowOf(k)];
    sfx.speech(); buzz([60, 40, 160]);
    showModal(`<p class="sys-tag">[ SYSTEM ] DAILY MOTIVATION</p><h2>${esc(sp.by)}</h2>
      <p class="speech-text">“${esc(sp.text)}”</p>
      <div class="btns"><button class="btn gold" data-action="modal-close">I will rise ➔</button></div>`);
  }

  function boot() {
    // Fix: first-run state.maxLevelSeen
    state.maxLevelSeen = Math.max(state.maxLevelSeen || 1, 1);
    render(); updateHud();
    let seen = false;
    try { seen = sessionStorage.getItem('bb_splash') === '1'; } catch (e) { /* ignore */ }
    const splash = $('#splash');
    if (seen) { splash.remove(); if (!state.setup) startOnboarding(); else setTimeout(maybeSpeech, 600); }
    else {
      splash.addEventListener('click', dismissSplash);
      setTimeout(dismissSplash, 2600);
    }
    // Midnight rollover
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        const t = todayKey();
        if (ui._lastToday && ui._lastToday !== t && ui.sel === ui._lastToday) ui.sel = t;
        ui._lastToday = t; render(); updateHud();
      }
    });
    ui._lastToday = todayKey();

    if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
      navigator.serviceWorker.register('sw.js').catch(() => { /* offline support optional */ });
    }
  }
  boot();
})();
