/* Temporary simulation harness — NOT part of the app.
 * Loads the REAL scoring code from app.js (stubbing browser globals so the
 * IIFE's DOM init never runs) and runs sampled populations through the real
 * chooseArchetype() to check the win distribution / reachability.
 *
 * Two respondent models:
 *  - INDEPENDENT: each question sampled from its own survey marginal (gives
 *    incoherent profiles — over-splits naturally-correlated views).
 *  - CORRELATED: each respondent gets latent positions on the app's own 7
 *    axes (plus a light shared "naturalist temperament"); every question that
 *    loads on an axis is tilted by that latent, so the mind questions hang
 *    together, the ethics questions hang together, etc. Marginals are still
 *    respected (the tilt multiplies the survey p[], then renormalises).
 * Delete after use. */
'use strict';
const fs = require('fs');
const path = require('path');

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---- browser-global stubs so app.js can be eval'd in Node ---- */
global.window = global;
global.addEventListener = function () {};
global.document = {
  readyState: 'loading',
  addEventListener() {},
  getElementById() { return null; },
  documentElement: { setAttribute() {} },
  createElement() { return { setAttribute() {}, appendChild() {}, click() {}, remove() {}, style: {} }; },
  body: { appendChild() {} },
};
global.localStorage = { getItem() { return null; }, setItem() {}, removeItem() {} };
global.location = { search: '', hash: '', pathname: '/', origin: '' };
global.history = { replaceState() {}, pushState() {} };

const root = __dirname;
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
(0, eval)(read('questions.js'));
(0, eval)(read('survey-data.js'));

let appSrc = read('app.js');
const EXPORT = ';window.__TEST__={chooseArchetype:chooseArchetype,buildCtx:buildCtx,'
  + 'ARCHETYPES:ARCHETYPES,AXES:AXES,setAnswers:function(a){answers=a;}};';
appSrc = appSrc.replace(/\}\)\(\);\s*$/, EXPORT + '\n})();\n');
if (!/__TEST__/.test(appSrc)) throw new Error('failed to inject export into app.js');
(0, eval)(appSrc);

const T = window.__TEST__;
const QS = window.PPT_QUESTIONS;
const SURVEY = window.PPT_SURVEY.q;
const COMBO = new Set([20, 31, 35, 39]);
const MULTI = new Set([37, 74]);

/* map questionId -> {key, m} from the app's real axis loadings */
const QAX = {};
for (const spec of T.AXES) for (const it of spec.items) QAX[it.q] = { key: spec.key, m: it.m };

function weightedPick(weights, r) {
  let tot = 0; for (const w of weights) tot += w;
  let x = r() * tot;
  for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x <= 0) return i; }
  return weights.length - 1;
}

/* approx standard normal: sum of 6 uniforms, standardised */
function gauss(r) { return ((r() + r() + r() + r() + r() + r()) - 3) / Math.sqrt(0.5); }

const BETA = 1.2; // tilt strength: exp(BETA * latent * loading)

/* draw latent axis positions with a light shared naturalist temperament `g`.
 * sign convention matches AXES: negative = the "left" pole (physicalist,
 * empiricist, naturalist, consequentialist, sparse). g>0 = naturalist. */
function latents(r) {
  const g = gauss(r);
  const mk = load => load * g * 0.55 + gauss(r) * 0.85;
  return {
    mind:  mk(-0.6),   // naturalist temperament -> physicalist
    know:  mk(-0.45),  //                        -> empiricist
    relig: mk(-0.7),   //                        -> naturalist
    ethics: mk(-0.25), //                        -> mildly consequentialist
    meta:  mk(-0.3),   //                        -> mildly sparse/nominalist
    moral: gauss(r) * 1.0,  // realism ~ independent of the naturalist factor
    pol:   gauss(r) * 1.0,
  };
}

/* tilt a question's survey marginal by the respondent's latent on its axis.
 * returns option index, or -1 for the residual "other" bucket. */
function pickTilted(id, latent, m, r) {
  const d = SURVEY[id], p = d.p, o = d.o || 0;
  const w = []; let tot = 0;
  for (let i = 0; i < p.length; i++) {
    const ww = p[i] * (m ? Math.exp(BETA * latent * (m[i] || 0)) : 1);
    w.push(ww); tot += ww;
  }
  tot += o;
  let x = r() * tot;
  for (let i = 0; i < p.length; i++) { x -= w[i]; if (x <= 0) return i; }
  return -1;
}

function sampleMulti(q, r) {
  const d = SURVEY[q.id], sel = [];
  for (let i = 0; i < q.opts.length; i++) {
    const rej = d.reject && d.reject[i] != null ? d.reject[i] : 92;
    if (r() < (100 - rej) / 100) sel.push(i);
  }
  return sel.length ? { sel, strength: 'firm' } : null;
}

function makeSampler(correlated) {
  return function (r) {
    const t = correlated ? latents(r) : null;
    const ans = {};
    for (const q of QS) {
      const id = q.id, d = SURVEY[id]; if (!d) continue;
      if (MULTI.has(id)) { const a = sampleMulti(q, r); if (a) ans[id] = a; continue; }
      const ax = correlated ? QAX[id] : null;
      const latent = ax ? t[ax.key] : 0;
      const m = ax ? ax.m : null;
      const picked = pickTilted(id, latent, m, r);
      if (picked === -1) {
        const u = r();
        if (u < 0.45) ans[id] = { sel: null, strength: 'agnostic' };
        else if (u < 0.55) ans[id] = { sel: null, strength: 'nofact' };
        continue;
      }
      if (COMBO.has(id) && r() < 0.22) {
        const j = pickTilted(id, latent, m, r);
        const sel = (j === -1 || j === picked) ? [picked] : [picked, j];
        ans[id] = { sel, strength: r() < 0.5 ? 'firm' : 'lean' };
      } else {
        ans[id] = { sel: picked, strength: r() < 0.5 ? 'firm' : 'lean' };
      }
    }
    return ans;
  };
}

function sampleExtreme(r) {
  const ans = {};
  for (const q of QS) {
    const id = q.id, n = q.opts.length;
    if (MULTI.has(id)) {
      const sel = []; for (let i = 0; i < n; i++) if (r() < 0.5) sel.push(i);
      if (!sel.length) sel.push((r() * n) | 0);
      ans[id] = { sel, strength: 'firm' };
    } else ans[id] = { sel: (r() * n) | 0, strength: 'firm' };
  }
  return ans;
}

function run(name, sampler, N, seed) {
  const r = rng(seed), tally = {};
  for (let k = 0; k < N; k++) {
    T.setAnswers(sampler(r));
    const a = T.chooseArchetype(T.buildCtx());
    tally[a.name] = (tally[a.name] || 0) + 1;
  }
  const rows = Object.entries(tally).sort((x, y) => y[1] - x[1]);
  console.log(`\n=== ${name}  (N=${N}) ===`);
  for (const [nm, c] of rows) console.log(`  ${(100 * c / N).toFixed(2).padStart(6)}%  ${nm}`);
  return tally;
}

const N = 100000;
const tC = run('CORRELATED (latent axis positions; the better model)', makeSampler(true), N, 1);
const tI = run('INDEPENDENT (per-question marginals; over-splits)', makeSampler(false), N, 2);
const tX = run('OPINIONATED EXTREMIST (niche reachability)', sampleExtreme, N, 3);

const everWon = new Set([...Object.keys(tC), ...Object.keys(tI), ...Object.keys(tX)]);
const scored = T.ARCHETYPES.map(a => a.name);
const dead = scored.filter(n => !everWon.has(n));
console.log('\n=== REACHABILITY ===');
console.log(dead.length ? `NEVER WON: ${dead.join(', ')}` : `all ${scored.length} scored archetypes won at least once ✔`);
