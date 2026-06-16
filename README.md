# Philosophical Profile

The 100 questions of the **2020 PhilPapers Survey**, turned into a personality test.
Answer them and get a colour-banded map of your positions, your *leaning axes*, and a
playful philosophical *archetype* — all client-side, no build step, no server.

## Run it

Open `index.html` in any modern browser. That's it.

(Everything is plain HTML/CSS/JS with no dependencies. Your answers are stored only in
`localStorage`; the "Copy shareable link" button encodes them into a `?s=` URL parameter.)

The quiz is fully resumable: the URL hash routes to `#intro`, `#q<n>`, or `#results`, so the
**browser back/forward buttons work**, and you can leave and **continue where you left off**.

## Files

| File | What it is |
|------|------------|
| `index.html` | The three screens: intro, quiz, results. |
| `styles.css` | Soft, banded-card styling echoing the example diagram. |
| `questions.js` | All 100 questions, their answer options, a plain-language `detail` explainer for each, and a 10-way thematic category map. |
| `survey-data.js` | The 2020 survey's result spread per question (all respondents), used by the "how you compare" panel. |
| `app.js` | Quiz flow, conviction-aware scoring, archetype logic, the **comparison panel**, and the **results SVG generator**. |
| `example/` | The reference diagram the results map is modelled on. |

## How answering works

For each question you can:

- **Lean** toward an answer — one click (light highlight)
- Commit with **conviction** — click the same answer again (strong highlight)
- Mark yourself **Agnostic / undecided**
- Hold that there is **No fact of the matter** — a distinct anti-realist stance, separate from
  agnosticism (you're not unsure; you think the question has no determinate answer). This mirrors
  the survey's own "there is no fact of the matter" response.
- **Skip** it

Some questions accept a **combination** of answers. The two list-style questions (philosophical
method; which beings are conscious) always have, and following the survey's own data — and the
editors' note that combinations were "widely endorsed" — normative ethics, the aim of philosophy,
gender, and race do too. The philosophical-method question is also **broadened** with the most
common write-in methods (phenomenology, historical, pragmatist, genealogical, hermeneutic, critical
theory, reflective equilibrium), which respondents felt the survey's analytic-leaning seven left out.

Keyboard: number keys pick an answer, `→`/`Enter` next, `←` back, `A` agnostic, `F` no fact of the
matter, `S` skip.

## Results

1. **Archetype** — picked from a gallery of 25-plus, e.g. *The Naturalist, The Kantian,
   The Utilitarian, The Existentialist, The Pragmatist, The Skeptic, The Deflationist…*,
   chosen from your overall leanings. Common archetypes score off the axes; niche ones
   (*The Panpsychist, The Eliminativist, The Error Theorist…*) are gated behind distinctive
   answer picks, so they only surface for a profile that earns them. Every gate is
   **strength-aware** — a conviction counts full, a bare lean about half, a hedged "…but"
   lean less again — so a tentative answer can't railroad you into a niche label.
   *The Skeptic* falls out of heavy **agnostic** use (suspending judgment); *The Deflationist*
   from heavy **no-fact-of-the-matter** use (dissolving the questions).
   - **Badges** — a few distinctive single positions (*Modal Realist, Dialetheist, Mysterian,
     Moral Particularist*) are too thin to headline but too fun to drop, so they appear as
     stackable badges that decorate whatever archetype you land on. Click one to read its blurb.
     You earn a badge only by committing to the position, not by a hedged lean.
2. **Where you lean** — seven signed axes (physicalist↔non-physicalist, empiricist↔rationalist,
   moral anti-realist↔realist, consequentialist↔deontological, naturalist↔theist,
   libertarian↔egalitarian, sparse↔abundant ontology), weighted by how firmly you answered.
3. **Profile map** — a category-banded SVG modelled on `example/philosophical_positions_llm.svg`,
   where each card's shade shows how firmly the position is held. Downloadable as **SVG** or **PNG**.
4. **How you compare with philosophers** — a summary of how mainstream your answers are (the average
   share of surveyed philosophers who agreed, how often you sided with the most popular answer, and
   your most heterodox vs. most mainstream positions).
5. **Every position, by field** — the full breakdown, each card carrying a small bar of how the
   profession split on that question, with your pick highlighted.

The archetypes and axes are interpretive and just for fun — not how the survey itself was scored.

## Comparison data

`survey-data.js` holds the result spread per question. A few caveats baked into that file:

- Figures are for **all survey respondents** (~1785), not the narrower "target faculty" group. The
  official site blocks automated access, so a full professional-philosophers table wasn't
  extractable; the two groups differ by only a few points on most questions, and the pool was
  overwhelmingly professional philosophers, so it's a close proxy. (Swapping in target-faculty
  numbers later just means editing one file.)
- The percentages are the survey's **"accept or lean toward"** figures, so a question's options can
  sum to a little over 100% (a respondent may lean toward more than one), and the `o` ("Other")
  value is an approximate residual.

## Source

Question wording follows the published survey design: David Bourget & David J. Chalmers,
*Philosophers on Philosophy: The 2020 PhilPapers Survey* (Philosophers' Imprint, 2023). Original
questions: <https://survey2020.philpeople.org/survey/design/questions>. Result figures: the survey's
published tables and per-question results pages.
