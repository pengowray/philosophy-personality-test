# Philosophical Profile

The 100 questions of the **2020 PhilPapers Survey**, turned into a personality test.
Answer them and get a colour-banded map of your positions, your *leaning axes*, and a
playful philosophical *archetype* — all client-side, no build step, no server.

## Run it

Open `index.html` in any modern browser. That's it.

(Everything is plain HTML/CSS/JS with no dependencies. Your answers are stored only in
`localStorage`; the "Copy shareable link" button encodes them into the URL hash.)

## Files

| File | What it is |
|------|------------|
| `index.html` | The three screens: intro, quiz, results. |
| `styles.css` | Soft, banded-card styling echoing the example diagram. |
| `questions.js` | All 100 questions, their answer options, and a 10-way thematic category map. |
| `app.js` | Quiz flow, conviction-aware scoring, archetype logic, and the **results SVG generator**. |
| `example/` | The reference diagram the results map is modelled on. |

## How answering works

For each question you can:

- **Lean** toward an answer — one click (light highlight)
- Commit with **conviction** — click the same answer again (strong highlight)
- Mark yourself **Agnostic / undecided**
- **Skip** it

Two questions allow multiple answers (philosophical method; which beings are conscious).
Keyboard: number keys pick an answer, `→`/`Enter` next, `←` back, `A` agnostic, `S` skip.

## Results

1. **Archetype** — e.g. *The Naturalist, The Kantian, The Utilitarian, The Existentialist,
   The Pragmatist, The Skeptic…* — chosen from your overall leanings.
2. **Where you lean** — seven signed axes (physicalist↔non-physicalist, empiricist↔rationalist,
   moral anti-realist↔realist, consequentialist↔deontological, naturalist↔theist,
   libertarian↔egalitarian, sparse↔abundant ontology), weighted by how firmly you answered.
3. **Profile map** — a category-banded SVG modelled on `example/philosophical_positions_llm.svg`,
   where each card's shade shows how firmly the position is held. Downloadable as **SVG** or **PNG**.
4. **Every position, by field** — the full breakdown.

The archetypes and axes are interpretive and just for fun — not how the survey itself was scored.

## Source

Question wording follows the published survey design: David Bourget & David J. Chalmers,
*Philosophers on Philosophy: The 2020 PhilPapers Survey*. Original questions:
<https://survey2020.philpeople.org/survey/design/questions>
