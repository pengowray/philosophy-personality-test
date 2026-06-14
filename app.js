/* ============================================================== *
 *  Philosophical Profile — app logic
 *  - one-question-at-a-time quiz over the 100 PhilPapers questions
 *  - conviction-aware answers (lean / conviction / agnostic)
 *  - results: leaning axes, a playful archetype, a full breakdown,
 *    and a downloadable colour-banded profile SVG modelled on the
 *    example diagram in /example.
 * ============================================================== */
(function () {
  'use strict';

  var QS = window.PPT_QUESTIONS;
  var CATS = window.PPT_CATEGORIES;
  var CAT_BY_KEY = {};
  CATS.forEach(function (c) { CAT_BY_KEY[c.key] = c; });

  var STORE_KEY = 'ppt_answers_v1';
  var POS_KEY = 'ppt_pos_v1';
  var THEME_KEY = 'ppt_theme';
  var W_FIRM = 1.0, W_LEAN = 0.55, W_NF = 0.6;   // W_NF: weight of an inferred "no fact of the matter" lean
  var loadedFromShare = false;
  var theme = 'light';   // 'light' | 'dark' — reconciled in initTheme()

  /* answers[id] = { sel: number | number[] | null, strength: 'lean'|'firm'|'agnostic' } */
  var answers = {};
  var cur = 0;

  /* ---------- tiny DOM helpers ---------- */
  function el(id) { return document.getElementById(id); }
  function h(html) { var t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- persistence + sharing ---------- */
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(answers)); } catch (e) {}
  }
  /* `#q5` / `#results` / `#intro` are routes; anything else in the hash is
   * treated as a (legacy) base64 share blob. New share links use `?s=`. */
  function isRoute(str) { return /^(intro|results|q\d+)$/.test(str); }
  function load() {
    var sParam = '';
    try { sParam = new URLSearchParams(location.search).get('s') || ''; } catch (e) {}
    var fromQuery = decodeState(sParam);
    if (fromQuery) { answers = fromQuery; loadedFromShare = true; save(); return; }
    var hash = location.hash.replace(/^#/, '');
    if (hash && !isRoute(hash)) {
      var fromHash = decodeState(hash);
      if (fromHash) { answers = fromHash; loadedFromShare = true; save(); return; }
    }
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) answers = JSON.parse(raw) || {};
    } catch (e) { answers = {}; }
  }
  function encodeState() {
    try { return btoa(unescape(encodeURIComponent(JSON.stringify(answers)))); }
    catch (e) { return ''; }
  }
  function decodeState(str) {
    if (!str) return null;
    try {
      var obj = JSON.parse(decodeURIComponent(escape(atob(str))));
      return (obj && typeof obj === 'object') ? obj : null;
    } catch (e) { return null; }
  }

  function answeredCount() { return Object.keys(answers).length; }
  function pickOf(id) { var a = answers[id]; return a && typeof a.sel === 'number' ? a.sel : null; }
  function isPick(id, idx) {
    var a = answers[id]; if (!a) return false;
    if (Array.isArray(a.sel)) return a.sel.indexOf(idx) !== -1;
    return a.sel === idx;
  }

  /* ============================================================ *
   *  ROUTING  (hash-based, so the browser back/forward buttons work)
   * ============================================================ */
  function clampCur(i) { return Math.max(0, Math.min(QS.length - 1, i)); }

  /* navigate: push (or replace) a hash route, then render it */
  function go(hash, replace) {
    if (hash.charAt(0) !== '#') hash = '#' + hash;
    var url = location.pathname + location.search + hash;
    try {
      if (replace) history.replaceState({ h: hash }, '', url);
      else history.pushState({ h: hash }, '', url);
    } catch (e) {}
    route();
  }

  /* render whatever the current hash points at */
  function route() {
    var hash = location.hash.replace(/^#/, '');
    var m = /^q(\d+)$/.exec(hash);
    if (hash === 'results') {
      renderResults();
    } else if (m) {
      cur = clampCur(parseInt(m[1], 10) - 1);
      show('quiz');
      renderQuestion();
    } else {
      show('intro');
      updateProgress();
      updateResumeRow();
    }
  }
  window.addEventListener('popstate', route);

  /* ============================================================ *
   *  QUIZ
   * ============================================================ */
  function startQuiz() {
    go('#q' + (resumePos() + 1));
  }
  function firstUnanswered() {
    for (var i = 0; i < QS.length; i++) if (!answers[QS[i].id]) return i;
    return 0;
  }
  /* where "continue / resume" should land: the last question viewed,
   * falling back to the first unanswered one */
  function resumePos() {
    try {
      var p = parseInt(localStorage.getItem(POS_KEY), 10);
      if (!isNaN(p)) return clampCur(p);
    } catch (e) {}
    return firstUnanswered();
  }

  function renderQuestion() {
    var q = QS[cur];
    var multi = isMulti(q);
    var cat = CAT_BY_KEY[q.cat];
    var cc = catColors(cat);
    var a = answers[q.id];
    var host = el('qhost');
    var nonpos = a && (a.strength === 'agnostic' || a.strength === 'nofact');
    try { localStorage.setItem(POS_KEY, String(cur)); } catch (e) {}

    var optsHtml = q.opts.map(function (label, i) {
      var cls = 'opt';
      if (a && !nonpos && isPick(q.id, i)) {
        cls += multi ? ' firm' : (a.strength === 'firm' ? ' firm' : ' lean');
      }
      var keycap = multi ? '✓' : (i + 1);
      var pickLabel = '';
      if (a && !nonpos && isPick(q.id, i) && !multi) {
        pickLabel = a.strength === 'firm' ? 'Conviction' : 'Leaning · click again for conviction';
      } else if (multi && isPick(q.id, i)) {
        pickLabel = 'Selected';
      }
      return '<button class="' + cls + '" data-opt="' + i + '">' +
        '<span class="key">' + keycap + '</span>' +
        '<span class="lbl">' + esc(label) + '</span>' +
        '<span class="pick">' + pickLabel + '</span>' +
        '</button>';
    }).join('');

    var hint = q.multi
      ? 'Select all that apply.'
      : (q.combo
        ? 'Pick one — or a <b>combination</b>, if you hold several at once.'
        : 'Click once to <b>lean</b> toward an answer, twice to mark <b>conviction</b>.');

    var agnosticOn = a && a.strength === 'agnostic';
    var nofactOn = a && a.strength === 'nofact';
    var isLast = cur === QS.length - 1;

    host.innerHTML =
      '<div class="qcard">' +
        '<span class="qcat" style="background:' + cc.fill + ';color:' + cc.title + '">' +
          '<i style="background:' + cc.stroke + '"></i>' + esc(cat.name) + '</span>' +
        '<div class="qtopic">Q' + q.id + ' · ' + esc(q.topic) + '</div>' +
        '<h2 class="qtext">' + esc(q.q) + '</h2>' +
        (q.detail ? '<p class="qdetail">' + esc(q.detail) + '</p>' : '') +
        '<p class="qhint">' + hint + '</p>' +
        '<div class="opts">' + optsHtml + '</div>' +
        '<div class="qextra">' +
          '<button class="chip ' + (agnosticOn ? 'on' : '') + '" data-act="agnostic">Agnostic / undecided</button>' +
          '<button class="chip ' + (nofactOn ? 'on' : '') + '" data-act="nofact" title="A distinct stance: the question has no determinate answer — not that you are unsure, but that there is nothing to be right about.">No fact of the matter</button>' +
          '<button class="chip" data-act="skip">Skip ›</button>' +
          '<span class="spacer"></span>' +
        '</div>' +
        '<div class="navrow">' +
          '<button class="btn btn-ghost" data-act="prev"' + (cur === 0 ? ' disabled' : '') + '>‹ Back</button>' +
          '<button class="btn btn-primary" data-act="next">' + (isLast ? 'Finish & see results ›' : 'Next ›') + '</button>' +
        '</div>' +
      '</div>';

    host.querySelectorAll('.opt').forEach(function (b) {
      b.addEventListener('click', function () { chooseOption(parseInt(b.getAttribute('data-opt'), 10)); });
    });
    host.querySelectorAll('[data-act]').forEach(function (b) {
      b.addEventListener('click', function () { act(b.getAttribute('data-act')); });
    });

    updateProgress();
  }

  /* list-style (`multi`) and combination (`combo`) questions both let you
   * toggle several options on; single questions cycle lean → conviction → off. */
  function isMulti(q) { return !!(q.multi || q.combo); }

  function chooseOption(optIndex) {
    var q = QS[cur];
    var a = answers[q.id];
    if (isMulti(q)) {
      var prev = (a && Array.isArray(a.sel)) ? a.sel : [];
      var set = prev.slice();
      var at = set.indexOf(optIndex);
      if (at === -1) set.push(optIndex); else set.splice(at, 1);
      if (set.length) answers[q.id] = { sel: set.sort(function (x, y) { return x - y; }), strength: 'firm' };
      else delete answers[q.id];
    } else {
      if (a && a.strength !== 'agnostic' && a.strength !== 'nofact' && a.sel === optIndex) {
        if (a.strength === 'lean') a.strength = 'firm';
        else delete answers[q.id];                 // firm -> off
      } else {
        answers[q.id] = { sel: optIndex, strength: 'lean' };
      }
    }
    save();
    renderQuestion();
  }

  function act(kind) {
    var q = QS[cur];
    if (kind === 'agnostic') {
      if (answers[q.id] && answers[q.id].strength === 'agnostic') delete answers[q.id];
      else answers[q.id] = { sel: null, strength: 'agnostic' };
      save(); renderQuestion();
    } else if (kind === 'nofact') {
      if (answers[q.id] && answers[q.id].strength === 'nofact') delete answers[q.id];
      else answers[q.id] = { sel: null, strength: 'nofact' };
      save(); renderQuestion();
    } else if (kind === 'skip') {
      goNext();
    } else if (kind === 'prev') {
      if (cur > 0) go('#q' + cur);            // cur-1 (0-based) → +1 for the 1-based hash
    } else if (kind === 'next') {
      goNext();
    }
  }
  function goNext() {
    if (cur === QS.length - 1) { go('#results'); return; }
    go('#q' + (cur + 2));                      // next question, 1-based
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateProgress() {
    var n = answeredCount();
    el('progressFill').style.width = (n / QS.length * 100) + '%';
    el('counter').innerHTML = '<b>' + n + '</b> / ' + QS.length + ' answered';
  }

  /* keyboard */
  document.addEventListener('keydown', function (e) {
    if (!el('screen-quiz').classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    var q = QS[cur];
    if (e.key >= '1' && e.key <= '9') {
      var idx = parseInt(e.key, 10) - 1;
      if (idx < q.opts.length) { chooseOption(idx); e.preventDefault(); }
    } else if (e.key === 'ArrowRight' || e.key === 'Enter') { goNext(); e.preventDefault(); }
    else if (e.key === 'ArrowLeft') { act('prev'); e.preventDefault(); }
    else if (e.key.toLowerCase() === 'a') { act('agnostic'); e.preventDefault(); }
    else if (e.key.toLowerCase() === 'f') { act('nofact'); e.preventDefault(); }
    else if (e.key.toLowerCase() === 's') { act('skip'); e.preventDefault(); }
  });

  /* ============================================================ *
   *  SCORING — leaning axes
   * ============================================================ */
  var AXES = [
    { key: 'mind', left: 'Physicalist', right: 'Non-physicalist',
      items: [
        { q: 16, m: { 0: -1, 1: 1 } },
        { q: 50, m: { 0: 1, 1: -1, 2: -0.6, 3: -0.7, 4: 0.6 } },
        { q: 30, m: { 0: -1, 1: 0.3, 2: 1 } },
        { q: 59, m: { 0: 1, 1: -1 } },
        { q: 48, m: { 0: -0.5, 1: 0.5 } }
      ] },
    { key: 'know', left: 'Empiricist', right: 'Rationalist',
      items: [
        { q: 9, m: { 0: -1, 1: 1 } },
        { q: 1, m: { 0: 1, 1: -1 } },
        { q: 4, m: { 0: 0.7, 1: -0.7 } },
        { q: 49, m: { 0: 1, 1: -1 } }
      ] },
    { key: 'moral', left: 'Moral anti-realist', right: 'Moral realist',
      /* `nf`: where saying "no fact of the matter" itself implies a side — here the
       * anti-realist pole (no aesthetic/moral fact = subjectivism / anti-realism). */
      items: [
        { q: 14, m: { 0: 1, 1: -1 }, nf: -0.7 },
        { q: 17, m: { 0: 0.7, 1: -0.7 }, nf: -0.5 },
        { q: 72, m: { 0: 1, 1: 0.8, 2: -0.2, 3: -0.9, 4: -0.6 }, nf: -0.6 },
        { q: 3, m: { 0: 0.8, 1: -0.8 }, nf: -0.6 },
        { q: 36, m: { 0: -0.6, 1: 0.8, 2: -0.4 }, nf: -0.5 }
      ] },
    { key: 'ethics', left: 'Consequentialist', right: 'Deontological',
      items: [
        { q: 20, m: { 0: 1, 1: -1, 2: 0.4 } },
        { q: 28, m: { 0: -0.8, 1: 0.8 } },
        { q: 34, m: { 0: -0.9, 1: 0.6 } }
      ] },
    { key: 'relig', left: 'Naturalist', right: 'Transcendent / theist',
      items: [
        { q: 8, m: { 0: 1, 1: -1 } },
        { q: 15, m: { 0: -1, 1: 1 } },
        { q: 52, m: { 0: 1, 1: -0.5, 2: -0.7, 3: -0.3 } }
      ] },
    { key: 'pol', left: 'Libertarian', right: 'Egalitarian / socialist',
      items: [
        { q: 23, m: { 0: 0.4, 1: 0.8, 2: -1 } },
        { q: 78, m: { 0: -1, 1: 1 } }
      ] },
    { key: 'meta', left: 'Sparse / nominalist', right: 'Abundant / Platonist',
      /* `nf` here is a deliberate guess at low weight (`nfw`): "no fact of the
       * matter" about these existence disputes is metaontological deflationism
       * (Carnap, quantifier variance), which isn't strictly nominalism — but it
       * refuses the heavyweight abundant ontology, so it tips gently sparse. The
       * small magnitude + low weight keep it easily overridden by real answers. */
      items: [
        { q: 2, m: { 0: 1, 1: -1 }, nf: -0.3, nfw: 0.4 },
        { q: 79, m: { 0: 0.6, 1: 0.8, 2: -1 }, nf: -0.3, nfw: 0.4 },
        { q: 81, m: { 0: -0.3, 1: 0.7, 2: 1, 3: 0.4, 4: -1 }, nf: -0.3, nfw: 0.4 },
        { q: 66, m: { 0: -1, 1: 0, 2: 1 }, nf: -0.3, nfw: 0.4 }
      ] }
  ];

  function computeAxis(spec) {
    var sum = 0, wsum = 0, n = 0;
    spec.items.forEach(function (it) {
      var a = answers[it.q];
      if (!a || a.strength === 'agnostic') return;
      /* "no fact of the matter" only counts on items that carry an `nf` loading
       * (i.e. where it implies a side); elsewhere it's neutral, like agnostic. */
      if (a.strength === 'nofact') {
        if (typeof it.nf !== 'number') return;
        var nw = (typeof it.nfw === 'number') ? it.nfw : W_NF;   // per-item weight for shakier mappings
        sum += it.nf * nw; wsum += nw; n++;
        return;
      }
      if (a.sel == null) return;
      /* combination answers contribute the average of their selected options'
       * loadings, so e.g. a deontology+virtue pick lands between the two. */
      var sels = Array.isArray(a.sel) ? a.sel : [a.sel];
      var mapped = 0, mn = 0;
      sels.forEach(function (s) { if (it.m.hasOwnProperty(s)) { mapped += it.m[s]; mn++; } });
      if (!mn) return;
      var w = a.strength === 'firm' ? W_FIRM : W_LEAN;
      sum += (mapped / mn) * w; wsum += w; n++;
    });
    return { key: spec.key, left: spec.left, right: spec.right, n: n, value: wsum ? sum / wsum : null };
  }
  function computeAxes() { return AXES.map(computeAxis); }

  /* ============================================================ *
   *  ARCHETYPE
   * ============================================================ */
  function buildCtx() {
    var ax = {}; computeAxes().forEach(function (a) { ax[a.key] = a.value; });
    function v(k) { return ax[k] == null ? 0 : ax[k]; }
    var multiCount = function (id) { var a = answers[id]; return a && Array.isArray(a.sel) ? a.sel.length : 0; };
    var keys = Object.keys(answers);
    var picks = keys.filter(function (k) { return answers[k].strength === 'agnostic'; }).length;
    var nofacts = keys.filter(function (k) { return answers[k].strength === 'nofact'; }).length;
    return {
      ax: ax, v: v,
      /* true when option `idx` is among this question's picks — works for
       * single, combination and list-style answers (but not agnostic/no-fact). */
      is: function (id, idx) {
        var a = answers[id];
        if (!a || a.strength === 'agnostic' || a.strength === 'nofact') return false;
        return isPick(id, idx);
      },
      /* like `is`, but a position held as one of several picks counts only
       * fractionally — so a 1-of-3 combo doesn't earn a full single-pick bonus. */
      share: function (id, idx) {
        var a = answers[id];
        if (!a || a.strength === 'agnostic' || a.strength === 'nofact' || !isPick(id, idx)) return 0;
        return 1 / (Array.isArray(a.sel) ? a.sel.length : 1);
      },
      multiCount: multiCount,
      answered: answeredCount(),
      agnosticFrac: answeredCount() ? picks / answeredCount() : 0,
      nofactFrac: answeredCount() ? nofacts / answeredCount() : 0,
      phys: -v('mind'), emp: -v('know'), nat: -v('relig'),
      real: v('moral'), deont: v('ethics'), cons: -v('ethics'),
      plat: v('meta'), egal: v('pol'), rat: v('know'), theist: v('relig')
    };
  }

  var ARCHETYPES = [
    { name: 'The Naturalist',
      blurb: 'You see one world, and it is the natural one. Mind is what brains (and maybe machines) do, knowledge grows from experience, and you reach for science before metaphysics. Quine and Dennett would nod along.',
      score: function (c) { return 1.0 * c.phys + 0.8 * c.emp + 0.9 * c.nat + 0.3 * c.cons; } },
    { name: 'The Utilitarian',
      blurb: 'Pull the lever, push the man, count the consequences. For you ethics is arithmetic over well-being, and sentiment that resists the sums is a bug, not a feature. A card-carrying heir to Bentham, Mill and Singer.',
      score: function (c) {
        var s = 1.2 * c.cons + 0.6 * c.phys + 0.5 * c.nat;
        s += 0.6 * c.share(20, 1); if (c.is(28, 0)) s += 0.3; if (c.is(34, 0)) s += 0.4;
        return s; } },
    { name: 'The Platonic Rationalist',
      blurb: 'Reason reaches truths the senses never could, and the abstract objects it discovers — numbers, properties, forms — are every bit as real as chairs. You trust the a priori and keep good company with Plato and Gödel.',
      score: function (c) { var s = 1.0 * c.rat + 1.0 * c.plat + 0.5 * c.real; if (c.is(2, 0)) s += 0.4; if (c.is(1, 0)) s += 0.2; return s; } },
    { name: 'The Kantian',
      blurb: 'Duty over outcomes, reason over appetite, and a moral law you take to be as objective as mathematics. Some acts are simply wrong, whatever the payoff. The sage of Königsberg is your lodestar.',
      score: function (c) { var s = 0.9 * c.real + 0.9 * c.deont + 0.5 * c.rat; if (c.is(82, 2)) s += 0.6; s += 0.5 * c.share(20, 0); if (c.is(15, 1)) s += 0.3; return s; } },
    { name: 'The Theistic Traditionalist',
      blurb: 'You hold that mind, meaning and morality point beyond the merely physical, and that the universe is more than brute fact. Values are real and grounded in something deeper than us.',
      score: function (c) { var s = 1.2 * c.theist + 0.6 * c.real + 0.4 * c.deont; if (c.is(8, 0)) s += 0.6; return s; } },
    { name: 'The Aristotelian',
      blurb: 'Not rules, not sums, but character. The good life is the flourishing of a well-tuned soul, and wisdom is knowing how to act well in the particular case. Virtue is its own reward.',
      score: function (c) { var s = 0.5 * c.real; s += 1.3 * c.share(20, 2); if (c.is(82, 0)) s += 0.6; s += 0.3 * (c.share(31, 2) + c.share(31, 3)); if (c.is(71, 1)) s += 0.3; return s; } },
    { name: 'The Existentialist',
      blurb: 'No cosmic script writes your meaning — you do. Value is something we make rather than find, and authenticity matters more than any ledger of moral facts. You travel light, with Nietzsche, Sartre and de Beauvoir.',
      score: function (c) { var s = 0.9 * (-c.real) + 0.3 * c.nat; if (c.is(36, 0)) s += 0.6; if (c.is(36, 2)) s += 0.4; if (c.is(3, 1)) s += 0.3; if (c.is(33, 1)) s += 0.2; return s; } },
    { name: 'The Pragmatist',
      blurb: 'Truth is what works, meaning is use, and a method earns its keep by its fruits. You are happily pluralist about how to do philosophy and suspicious of grand metaphysical pictures. James, Dewey and the later Wittgenstein are your people.',
      score: function (c) { var s = 0.3 * c.nat + 1.1 * c.nofactFrac; if (c.is(29, 1)) s += 0.6; if (c.multiCount(37) >= 3) s += 0.6; if (c.is(100, 1)) s += 0.3; if (c.is(61, 1)) s += 0.2; if (c.is(67, 1)) s += 0.3; return s; } },
    { name: 'The Idealist',
      blurb: 'Mind is not a late arrival in a dead universe but close to its ground floor. The hard problem is hard for a reason, and reality may be more mental than the physicalists allow. Berkeley, Leibniz and the panpsychists keep you company.',
      score: function (c) { var s = 0.9 * (-c.phys); if (c.is(6, 0)) s += 0.6; if (c.is(16, 1)) s += 0.3; if (c.is(50, 0) || c.is(50, 4)) s += 0.4; if (c.is(59, 0)) s += 0.2; return s; } },
    { name: 'The Egalitarian Humanist',
      blurb: 'Justice is the first virtue of institutions, and a fair society is one that works for everyone. You pair a realist conscience with a reformer’s politics, in the tradition of Rawls and Mill.',
      score: function (c) { var s = 1.0 * c.egal + 0.4 * c.real; if (c.is(78, 1)) s += 0.4; if (c.is(23, 1)) s += 0.4; if (c.is(53, 1)) s += 0.2; return s; } }
  ];

  function chooseArchetype(c) {
    if (c.answered < 8) {
      return { name: 'The Sphinx', blurb: 'You have answered only a few questions, so your portrait is still mostly in shadow. Answer more to bring it into focus.', tags: [] };
    }
    /* a strong deflationary streak (lots of "no fact of the matter") is its own
     * thing — dissolving questions rather than suspending judgment on them. */
    if (c.nofactFrac > 0.3 && c.nofactFrac >= c.agnosticFrac) {
      return { name: 'The Deflationist', blurb: 'You don’t so much answer philosophy’s questions as dissolve them. Where others see deep facts waiting to be uncovered, you suspect a knot in our language or a pseudo-problem dressed up as a real one. Carnap, the later Wittgenstein and the quietists are your people.', tags: archetypeTags(c) };
    }
    if (c.agnosticFrac > 0.42) {
      return { name: 'The Skeptic', blurb: 'You suspend judgment where others rush in. Faced with philosophy’s hardest questions you keep your powder dry — a fox who knows many things rather than one big thing. Hume’s mitigated skepticism suits you.', tags: archetypeTags(c) };
    }
    var best = null, bestS = -1e9;
    ARCHETYPES.forEach(function (a) {
      var s = a.score(c);
      if (s > bestS) { bestS = s; best = a; }
    });
    if (bestS < 0.35) {
      return { name: 'The Eclectic', blurb: 'You resist easy labels, mixing positions that don’t usually travel together. Call it intellectual independence — you build your view à la carte rather than off the rack.', tags: archetypeTags(c) };
    }
    return { name: best.name, blurb: best.blurb, tags: archetypeTags(c) };
  }

  function archetypeTags(c) {
    var tags = [];
    computeAxes().forEach(function (a) {
      if (a.value == null || Math.abs(a.value) < 0.34) return;
      tags.push({ label: a.value < 0 ? a.left : a.right, mag: Math.abs(a.value) });
    });
    tags.sort(function (x, y) { return y.mag - x.mag; });
    return tags.slice(0, 5).map(function (t) { return t.label; });
  }

  /* ============================================================ *
   *  RESULTS
   * ============================================================ */
  function renderResults() {
    if (answeredCount() === 0) { go('#', true); return; }
    show('results');
    window.scrollTo(0, 0);
    var c = buildCtx();
    var arch = chooseArchetype(c);
    var axes = computeAxes();

    /* archetype card */
    el('archetype').innerHTML =
      '<div class="kicker">Your philosophical archetype</div>' +
      '<h2>' + esc(arch.name) + '</h2>' +
      '<p>' + arch.blurb + '</p>' +
      (arch.tags.length ? '<div class="tags">' + arch.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div>' : '') +
      '<div class="tags" style="margin-top:14px"><span class="tag muted">' +
        c.answered + ' / 100 answered · ' + Math.round(c.agnosticFrac * 100) + '% agnostic</span></div>';

    /* axes */
    el('axes').innerHTML = axes.map(renderAxis).join('');

    /* svg */
    var svg = buildProfileSVG();
    el('svgHost').innerHTML = svg;

    /* how you compare with the profession */
    var cmp = el('compare');
    if (cmp) cmp.innerHTML = renderCompare();

    /* breakdown */
    el('breakdown').innerHTML = renderBreakdown();
  }

  function renderAxis(a) {
    if (a.value == null) {
      return '<div class="axis"><div class="axis-ends"><span>' + esc(a.left) + '</span><span>' + esc(a.right) + '</span></div>' +
        '<div class="axis-track"><span class="mid"></span></div>' +
        '<div class="axis-meta">No data yet — answer some related questions.</div></div>';
    }
    var pct = (a.value + 1) / 2 * 100;
    var leftLabel = a.value < -0.05 ? '<b>' + esc(a.left) + '</b>' : esc(a.left);
    var rightLabel = a.value > 0.05 ? '<b>' + esc(a.right) + '</b>' : esc(a.right);
    var fill = a.value >= 0
      ? '<span class="fillR" style="left:50%;width:' + (pct - 50) + '%;background:linear-gradient(90deg,#cfc9f3,#534ab7);border-radius:999px"></span>'
      : '<span class="fillL" style="left:' + pct + '%;width:' + (50 - pct) + '%;background:linear-gradient(90deg,#0f6e56,#9fd9c8);border-radius:999px"></span>';
    var strength = Math.abs(a.value) > 0.66 ? 'strong' : (Math.abs(a.value) > 0.3 ? 'clear' : 'slight');
    return '<div class="axis">' +
      '<div class="axis-ends"><span>' + leftLabel + '</span><span>' + rightLabel + '</span></div>' +
      '<div class="axis-track"><span class="mid"></span>' + fill +
        '<span class="axis-dot" style="left:' + pct + '%;background:' + (a.value >= 0 ? '#534ab7' : '#0f6e56') + '"></span></div>' +
      '<div class="axis-meta">A ' + strength + ' lean toward ' + esc(a.value < 0 ? a.left.toLowerCase() : a.right.toLowerCase()) + ' · ' + a.n + ' question' + (a.n === 1 ? '' : 's') + '</div>' +
    '</div>';
  }

  function positionText(q) {
    var a = answers[q.id];
    if (!a) return null;
    if (a.strength === 'agnostic') return { text: 'Agnostic / undecided', strength: 'agnostic' };
    if (a.strength === 'nofact') return { text: 'No fact of the matter', strength: 'nofact' };
    if (Array.isArray(a.sel)) return { text: a.sel.map(function (i) { return q.opts[i]; }).join(', '), strength: 'multi' };
    return { text: q.opts[a.sel], strength: a.strength };
  }

  var STRENGTH_LABEL = { firm: 'Conviction', lean: 'Leaning', agnostic: 'Agnostic', nofact: 'No fact', multi: 'Selected' };

  function renderBreakdown() {
    return CATS.map(function (cat) {
      var cc = catColors(cat);
      var qs = QS.filter(function (q) { return q.cat === cat.key; });
      var cells = qs.map(function (q) {
        var p = positionText(q);
        if (!p) return '<div class="cell empty"><div class="t">' + esc(q.topic) + '</div><div class="v">—</div></div>';
        var sclass = p.strength === 'firm' ? 's-firm'
          : (p.strength === 'agnostic' ? 's-agno'
          : (p.strength === 'nofact' ? 's-nofact' : 's-lean'));
        return '<div class="cell"><div class="t">' + esc(q.topic) + '</div>' +
          '<div class="v" style="color:' + cc.text + '">' + esc(p.text) + '</div>' +
          '<span class="s ' + sclass + '">' + STRENGTH_LABEL[p.strength] + '</span>' +
          renderSpread(q, cc) + '</div>';
      }).join('');
      return '<div class="cat-block">' +
        '<div class="cat-bar" style="background:' + cc.fill + ';color:' + cc.title + '"><i style="background:' + cc.stroke + '"></i>' + esc(cat.name) + '</div>' +
        '<div class="cat-grid">' + cells + '</div></div>';
    }).join('');
  }

  /* ============================================================ *
   *  COMPARISON  —  how your answers sit against the survey spread
   *  (all figures: 2020 PhilPapers Survey, all respondents)
   * ============================================================ */
  function surveyFor(id) {
    return (window.PPT_SURVEY && PPT_SURVEY.q && PPT_SURVEY.q[id]) || null;
  }
  /* the option indices the user picked (empty for agnostic / no-fact / skip) */
  function selIndices(id) {
    var a = answers[id];
    if (!a || a.strength === 'agnostic' || a.strength === 'nofact') return [];
    if (Array.isArray(a.sel)) return a.sel;
    if (typeof a.sel === 'number') return [a.sel];
    return [];
  }
  function leadIndex(arr) {
    var lead = 0;
    for (var i = 1; i < arr.length; i++) if (arr[i] > arr[lead]) lead = i;
    return lead;
  }

  /* a compact spread bar + caption, shown inside each breakdown cell */
  function renderSpread(q, cc) {
    var d = surveyFor(q.id);
    if (!d) return '';
    var sels = selIndices(q.id);
    var dark = theme === 'dark';

    /* list-style questions store rejection rates per item; show a short
     * "share who agree" line for the user's picks that have data */
    if (d.reject) {
      var picks = sels.filter(function (i) { return i < d.reject.length; });
      var bits = picks.map(function (i) {
        var acc = Math.max(0, Math.round(100 - d.reject[i]));
        return esc(q.opts[i]) + ' <b>' + acc + '%</b>';
      });
      var lead = '';
      if (!bits.length) {
        var li = leadIndex(d.reject.map(function (r) { return 100 - r; }));
        lead = 'Most accepted: ' + esc(q.opts[li]) + ' (' + Math.round(100 - d.reject[li]) + '%)';
      }
      return '<div class="spread"><div class="spread-cap">' +
        (bits.length ? 'Philosophers who agree — ' + bits.join(' · ') : lead) +
        '</div></div>';
    }

    if (!d.p || !d.p.length) return '';
    var total = d.p.reduce(function (x, y) { return x + y; }, 0) + (d.o || 0);
    if (total <= 0) return '';

    var segs = d.p.map(function (pct, i) {
      var w = (pct / total * 100);
      var on = sels.indexOf(i) !== -1;
      var base = catColors(CAT_BY_KEY[q.cat]).stroke;
      var col = on ? base : blend(base, dark ? '#15130f' : '#ffffff', 0.62);
      return '<span class="seg' + (on ? ' on' : '') + '" style="width:' + w.toFixed(2) +
        '%;background:' + col + '" title="' + esc(q.opts[i]) + ': ' + pct + '%"></span>';
    }).join('');
    if (d.o) {
      var ow = (d.o / total * 100);
      segs += '<span class="seg other" style="width:' + ow.toFixed(2) + '%" title="Other / something else: ~' + Math.round(d.o) + '%"></span>';
    }

    var li2 = leadIndex(d.p);
    var cap;
    if (!sels.length) {
      cap = 'Philosophers: ' + esc(q.opts[li2]) + ' leads (' + Math.round(d.p[li2]) + '%)';
    } else if (sels.length === 1) {
      cap = '<b>' + Math.round(d.p[sels[0]]) + '%</b> of philosophers agree';
    } else {
      cap = 'You share: ' + sels.map(function (i) { return esc(q.opts[i]) + ' ' + Math.round(d.p[i]) + '%'; }).join(' · ');
    }
    return '<div class="spread"><div class="spread-bar">' + segs + '</div>' +
      '<div class="spread-cap">' + cap + '</div></div>';
  }

  /* roll-up stats for the summary panel */
  function comparisonRows() {
    var rows = [];
    QS.forEach(function (q) {
      var a = answers[q.id];
      if (!a || a.strength === 'agnostic' || a.strength === 'nofact') return;
      var d = surveyFor(q.id);
      if (!d || !d.p) return;                       // single & combo questions only
      var sels = selIndices(q.id);
      if (!sels.length) return;
      var shares = sels.map(function (i) { return d.p[i] || 0; });
      var share = shares.reduce(function (x, y) { return x + y; }, 0) / shares.length;
      var lead = leadIndex(d.p);
      rows.push({ topic: q.topic, share: share, withPlurality: sels.indexOf(lead) !== -1, lead: q.opts[lead], leadPct: d.p[lead] });
    });
    return rows;
  }

  function renderCompare() {
    if (!window.PPT_SURVEY) return '';
    var rows = comparisonRows();
    if (rows.length < 3) {
      return '<div class="compare-card"><p class="compare-lead">Answer a few more questions to see how your views sit against the profession.</p></div>';
    }
    var avg = rows.reduce(function (s, r) { return s + r.share; }, 0) / rows.length;
    var withPl = rows.filter(function (r) { return r.withPlurality; }).length;
    var byShare = rows.slice().sort(function (a, b) { return a.share - b.share; });
    var heterodox = byShare.slice(0, 3);
    var mainstream = byShare.slice(-3).reverse();

    function line(r) {
      return '<li><span class="ct">' + esc(r.topic) + '</span>' +
        '<span class="cp">' + Math.round(r.share) + '% of philosophers</span></li>';
    }

    return '<div class="compare-card">' +
      '<p class="compare-lead">On the ' + rows.length + ' questions where you took a position, on average <b>' +
        Math.round(avg) + '%</b> of surveyed philosophers shared your view. ' +
        'You sided with the most popular answer on <b>' + withPl + ' of ' + rows.length + '</b>.</p>' +
      '<div class="compare-cols">' +
        '<div class="compare-col"><h4>Your most heterodox positions</h4><ul>' + heterodox.map(line).join('') + '</ul></div>' +
        '<div class="compare-col"><h4>Where you’re most mainstream</h4><ul>' + mainstream.map(line).join('') + '</ul></div>' +
      '</div>' +
      '<p class="compare-note">Spread shown against the <b>' + esc(PPT_SURVEY.meta.group.toLowerCase()) +
        '</b> of the 2020 PhilPapers Survey (n≈' + PPT_SURVEY.meta.n + '). ' +
        'These are the survey’s “accept or lean toward” figures, so a question’s bars can total a little over 100%. ' +
        'Hover a bar to read each option.</p>' +
      '</div>';
  }

  /* ============================================================ *
   *  PROFILE SVG  (modelled on /example diagram)
   * ============================================================ */
  function toRgb(c) {
    if (c.charAt(0) === '#') {
      var hx = c.slice(1);
      if (hx.length === 3) hx = hx.replace(/./g, '$&$&');
      return [parseInt(hx.substr(0, 2), 16), parseInt(hx.substr(2, 2), 16), parseInt(hx.substr(4, 2), 16)];
    }
    var m = c.match(/(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
  }
  /* blend two colours (hex or rgb()) and return hex, so results re-blend cleanly */
  function blend(a, b, t) {
    var A = toRgb(a), B = toRgb(b);
    function hx(n) { n = Math.max(0, Math.min(255, Math.round(n))); return ('0' + n.toString(16)).slice(-2); }
    return '#' + hx(A[0] + (B[0] - A[0]) * t) + hx(A[1] + (B[1] - A[1]) * t) + hx(A[2] + (B[2] - A[2]) * t);
  }

  /* ---------- theme-aware category colours ----------
   * The category palette in questions.js is tuned for light mode. In dark
   * mode we derive legible variants from each category's accent (`stroke`):
   * dark tinted surfaces, light tinted text. */
  function catColors(cat) {
    if (theme === 'dark') {
      return {
        fill:   blend(cat.stroke, '#191713', 0.80),   // dark tinted band / chip background
        stroke: blend(cat.stroke, '#191713', 0.34),   // muted but visible border
        title:  blend(cat.stroke, '#ffffff', 0.62),   // light label on the dark band
        text:   blend(cat.stroke, '#ffffff', 0.50)    // bright coloured value text
      };
    }
    return { fill: cat.fill, stroke: cat.stroke, title: cat.title, text: cat.text };
  }

  /* per-card colours on the profile SVG, by conviction strength */
  function cardStyle(strength, cat) {
    var dark = theme === 'dark';
    if (strength === 'agnostic' || strength === 'nofact') {
      var tag = strength === 'nofact' ? 'No fact' : 'Open';
      return dark
        ? { fill: '#232019', stroke: '#3a352c', title: '#b9b3a8', text: '#8b857a', tag: tag }
        : { fill: '#f3f2ef', stroke: '#d8d2c6', title: '#6b6760', text: '#8a857c', tag: tag };
    }
    var cc = catColors(cat);
    if (strength === 'firm' || strength === 'multi') {
      var ff = dark ? blend(cat.stroke, '#15130f', 0.72) : cat.fill;
      return { fill: ff, stroke: cc.stroke, title: cc.title, text: cc.text, tag: strength === 'multi' ? 'Selected' : 'Conviction' };
    }
    var lf = dark ? blend(cat.stroke, '#15130f', 0.85) : blend(cat.fill, '#ffffff', 0.5);
    var ls = dark ? blend(cat.stroke, '#15130f', 0.45) : blend(cat.stroke, '#ffffff', 0.35);
    return { fill: lf, stroke: ls, title: cc.title, text: cc.text, tag: 'Leaning' };
  }
  function wrap(str, maxChars, maxLines) {
    var words = String(str).split(/\s+/), lines = [], cur = '';
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (!cur) { cur = w; }
      else if ((cur + ' ' + w).length <= maxChars) { cur += ' ' + w; }
      else { lines.push(cur); cur = w; }
      if (lines.length === maxLines - 1 && i < words.length - 1) {
        // pack the rest onto the final line, truncate if needed
        var rest = cur + ' ' + words.slice(i + 1).join(' ');
        if (rest.length > maxChars) rest = rest.slice(0, maxChars - 1).replace(/\s\S*$/, '') + '…';
        lines.push(rest); cur = '';
        return lines;
      }
    }
    if (cur) lines.push(cur);
    if (lines.length === 0) lines.push('');
    if (lines[0].length > maxChars) lines[0] = lines[0].slice(0, maxChars - 1) + '…';
    return lines;
  }

  function buildProfileSVG() {
    var dark = theme === 'dark';
    var PG = dark
      ? { bg: '#1b1916', title: '#f2efe9', sub: '#9a9488', line: 'rgba(255,255,255,0.12)', legend: '#cfc9bd', foot: '#8b857a' }
      : { bg: '#ffffff', title: '#1f1e1d', sub: '#8a857c', line: 'rgba(31,30,29,0.15)', legend: '#3d3d3a', foot: '#8a857c' };

    var W = 760, P = 40, CW = W - 2 * P;
    var COLS = 3, GAP = 12;
    var cardW = (CW - (COLS - 1) * GAP) / COLS;
    var maxChars = Math.floor((cardW - 24) / 6.0);
    var FONT = 'Anthropic Sans, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif';

    var answeredQ = QS.filter(function (q) { return !!answers[q.id]; });
    var parts = [];
    var y = 0;

    /* title */
    parts.push('<text x="' + P + '" y="44" font-size="24" font-weight="600" fill="' + PG.title + '">My philosophical profile</text>');
    parts.push('<text x="' + P + '" y="68" font-size="13" fill="' + PG.sub + '">' + esc(answeredQ.length + ' of 100 questions answered · the 2020 PhilPapers Survey, as a personality test') + '</text>');
    y = 92;

    CATS.forEach(function (cat) {
      var qs = QS.filter(function (q) { return q.cat === cat.key && answers[q.id]; });
      if (!qs.length) return;
      var cc = catColors(cat);

      /* category band */
      parts.push('<rect x="' + P + '" y="' + y + '" width="' + CW + '" height="30" rx="8" fill="' + cc.fill + '" stroke="' + cc.stroke + '" stroke-width="0.5"/>');
      parts.push('<text x="' + (W / 2) + '" y="' + (y + 15) + '" text-anchor="middle" dominant-baseline="central" font-size="14" font-weight="600" fill="' + cc.title + '">' + esc(cat.name) + '</text>');
      y += 30 + GAP;

      /* cards, row by row */
      for (var r = 0; r < qs.length; r += COLS) {
        var row = qs.slice(r, r + COLS);
        var wrapped = row.map(function (q) { return wrap(positionText(q).text, maxChars, 3); });
        var maxLines = wrapped.reduce(function (mx, ls) { return Math.max(mx, ls.length); }, 1);
        var rowH = 26 + maxLines * 15 + 18;          // title + position lines + tag

        row.forEach(function (q, ci) {
          var p = positionText(q);
          var st = cardStyle(p.strength, cat);
          var x = P + ci * (cardW + GAP);
          parts.push('<rect x="' + x.toFixed(1) + '" y="' + y + '" width="' + cardW.toFixed(1) + '" height="' + rowH + '" rx="9" fill="' + st.fill + '" stroke="' + st.stroke + '" stroke-width="0.75"/>');
          parts.push('<text x="' + (x + 12).toFixed(1) + '" y="' + (y + 19) + '" font-size="12.5" font-weight="600" fill="' + st.title + '">' + esc(q.topic) + '</text>');
          wrapped[ci].forEach(function (line, li) {
            parts.push('<text x="' + (x + 12).toFixed(1) + '" y="' + (y + 37 + li * 15) + '" font-size="12" fill="' + st.text + '">' + esc(line) + '</text>');
          });
          parts.push('<text x="' + (x + cardW - 10).toFixed(1) + '" y="' + (y + rowH - 8) + '" text-anchor="end" font-size="9.5" font-weight="600" letter-spacing="0.4" fill="' + blend(st.text, dark ? '#000000' : '#ffffff', 0.2) + '">' + st.tag.toUpperCase() + '</text>');
        });
        y += rowH + GAP;
      }
      y += 6;
    });

    /* legend + footer */
    y += 4;
    parts.push('<line x1="' + P + '" y1="' + y + '" x2="' + (W - P) + '" y2="' + y + '" stroke="' + PG.line + '" stroke-width="0.5"/>');
    y += 22;
    parts.push('<text x="' + P + '" y="' + y + '" font-size="12" fill="' + PG.legend + '">Conviction key:</text>');
    var convC = dark ? '#9b93f0' : '#534AB7';
    var keys = [
      { c: convC, t: 'Conviction (firm)' },
      { c: blend(convC, PG.bg, 0.45), t: 'Leaning' },
      { c: dark ? '#4a4640' : '#cdc8bf', t: 'Agnostic / open' }
    ];
    var kx = P + 92;
    keys.forEach(function (k) {
      parts.push('<rect x="' + kx + '" y="' + (y - 10) + '" width="12" height="12" rx="3" fill="' + k.c + '"/>');
      parts.push('<text x="' + (kx + 17) + '" y="' + (y) + '" font-size="12" fill="' + PG.legend + '">' + esc(k.t) + '</text>');
      kx += 32 + k.t.length * 6.6;
    });
    y += 26;
    parts.push('<text x="' + P + '" y="' + y + '" font-size="11.5" fill="' + PG.foot + '">Generated from the 100 questions of the 2020 PhilPapers Survey. Card shade shows how firmly each position is held.</text>');
    y += 24;

    var H = y;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" ' +
      'font-family="' + FONT + '">' +
      '<title>My philosophical profile</title>' +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="' + PG.bg + '"/>' +
      parts.join('\n') +
      '</svg>';
    return svg;
  }

  /* ---------- downloads / share ---------- */
  function downloadSVG() {
    var svg = buildProfileSVG();
    var blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    triggerDownload(URL.createObjectURL(blob), 'philosophical-profile.svg');
  }
  function downloadPNG() {
    var svg = buildProfileSVG();
    var m = svg.match(/viewBox="0 0 (\d+) (\d+(?:\.\d+)?)"/);
    var w = m ? parseFloat(m[1]) : 760, hh = m ? parseFloat(m[2]) : 1000;
    var scale = 2;
    var img = new Image();
    var url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    img.onload = function () {
      var cv = document.createElement('canvas');
      cv.width = w * scale; cv.height = hh * scale;
      var ctx = cv.getContext('2d');
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      try { triggerDownload(cv.toDataURL('image/png'), 'philosophical-profile.png'); }
      catch (e) { alert('PNG export was blocked by the browser; the SVG download works everywhere.'); }
    };
    img.onerror = function () { alert('Could not render PNG; try the SVG download.'); };
    img.src = url;
  }
  function triggerDownload(href, name) {
    var a = document.createElement('a');
    a.href = href; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function share() {
    var url = location.origin + location.pathname + '?s=' + encodeState() + '#results';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { flash('Shareable link copied to clipboard'); },
        function () { prompt('Copy your shareable link:', url); }
      );
    } else { prompt('Copy your shareable link:', url); }
  }
  function flash(msg) {
    var n = h('<div style="position:fixed;left:50%;bottom:26px;transform:translateX(-50%);background:#1f1e1d;color:#fff;padding:11px 18px;border-radius:10px;font-size:14px;z-index:50;box-shadow:0 8px 30px rgba(0,0,0,.25)">' + esc(msg) + '</div>');
    document.body.appendChild(n);
    setTimeout(function () { n.style.transition = 'opacity .4s'; n.style.opacity = '0'; setTimeout(function () { n.remove(); }, 400); }, 1600);
  }

  /* ============================================================ *
   *  SCREENS + wiring
   * ============================================================ */
  function show(name) {
    ['intro', 'quiz', 'results'].forEach(function (s) {
      el('screen-' + s).classList.toggle('active', s === name);
    });
  }
  function resetAll() {
    if (!confirm('Clear all your answers and start over?')) return;
    answers = {}; cur = 0;
    try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    try { localStorage.removeItem(POS_KEY); } catch (e) {}
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
    go('#', true);
  }

  /* the intro "you have N answers saved" row */
  function updateResumeRow() {
    var n = answeredCount();
    var row = el('resumeRow');
    if (!row) return;
    if (n > 0) {
      row.style.display = 'flex';
      el('resumeText').textContent = n + ' answer' + (n === 1 ? '' : 's') + ' saved on this device.';
    } else {
      row.style.display = 'none';
    }
  }

  /* ---------- theme ---------- */
  function updateThemeToggle() {
    var b = el('themeToggle');
    if (!b) return;
    var dark = theme === 'dark';
    b.innerHTML = '<span class="ti">' + (dark ? '☀' : '☾') + '</span>';
    b.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    b.setAttribute('title', dark ? 'Light mode' : 'Dark mode');
  }
  function applyTheme(t, persist) {
    theme = (t === 'dark') ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (persist) { try { localStorage.setItem(THEME_KEY, theme); } catch (e) {} }
    updateThemeToggle();
    /* re-render the active screen so JS-driven category colours follow suit */
    var hash = location.hash.replace(/^#/, '');
    if (hash === 'results' && answeredCount() > 0) renderResults();
    else if (/^q\d+$/.test(hash)) renderQuestion();
  }
  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved === 'dark' || saved === 'light') theme = saved;
    else theme = (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    updateThemeToggle();
    var btn = el('themeToggle');
    if (btn) btn.addEventListener('click', function () { applyTheme(theme === 'dark' ? 'light' : 'dark', true); });
    /* follow OS changes only while the user hasn't picked explicitly */
    if (window.matchMedia) {
      var mq = matchMedia('(prefers-color-scheme: dark)');
      var onChange = function (e) {
        var s = null; try { s = localStorage.getItem(THEME_KEY); } catch (err) {}
        if (s !== 'dark' && s !== 'light') applyTheme(e.matches ? 'dark' : 'light', false);
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  function init() {
    load();
    initTheme();
    updateProgress();

    el('startBtn').addEventListener('click', startQuiz);
    el('resultsTopBtn').addEventListener('click', function () {
      if (answeredCount() === 0) { flash('Answer a few questions first'); return; }
      go('#results');
    });
    el('resumeBtn').addEventListener('click', startQuiz);

    el('btnContinue').addEventListener('click', function () { go('#q' + (resumePos() + 1)); });
    el('btnRetake').addEventListener('click', function () { go('#q1'); });
    el('btnReset').addEventListener('click', resetAll);
    el('btnSVG').addEventListener('click', downloadSVG);
    el('btnPNG').addEventListener('click', downloadPNG);
    el('btnShare').addEventListener('click', share);
    el('introReset').addEventListener('click', resetAll);

    updateResumeRow();

    /* initial route. A shared link (?s=…) with enough answers jumps to
     * results; otherwise honour any explicit #route, else show the intro. */
    if (isRoute(location.hash.replace(/^#/, ''))) {
      route();
    } else if (loadedFromShare && answeredCount() >= 8) {
      go('#results', true);
    } else {
      go('#intro', true);                       // also cleans any legacy base64 hash out of the URL
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
