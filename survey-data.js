/* ------------------------------------------------------------------ *
 *  2020 PhilPapers Survey — result spread, for the "how you compare"
 *  panel on the results page.
 *
 *  Keyed by the same question `id` as questions.js, and the percentage
 *  arrays are in the SAME order as that question's `opts`, so opts[i]
 *  lines up with p[i].
 *
 *    p : accept-or-lean percentage for each listed option, in opts order
 *    o : the residual "Other / something else" bucket (approximate)
 *    reject (multi questions 37 & 74) : % who REJECT each option; an
 *        acceptance share is shown as ~100 − reject.
 *
 *  PROVENANCE & CAVEATS (be honest about these):
 *   - Figures are for ALL SURVEY RESPONDENTS (~1785). The survey's
 *     "target faculty" (professional philosophers) figures are not
 *     publicly available as a full machine-readable table — the official
 *     site blocks automated access — but for most questions the two
 *     groups differ by only a few points. The respondent pool was
 *     overwhelmingly professional philosophers, so this is a close proxy.
 *   - The named-position percentages are the official "accept or lean
 *     toward" inclusive figures, accurate to ~0.1pp (cross-checked against
 *     the published paper and the official per-question pages).
 *   - Because a respondent can "lean toward both" of two options, the
 *     inclusive figures for a question can sum to a little over 100%, and
 *     the `o` (Other) value is a computed residual rather than the survey's
 *     own "Other" tally. Treat `o` as approximate.
 *
 *  Source: Bourget & Chalmers, "Philosophers on Philosophy: The 2020
 *  PhilPapers Survey", Philosophers' Imprint 23(11), 2023; figures via the
 *  official results pages and the published tables.
 * ------------------------------------------------------------------ */
window.PPT_SURVEY = {
  meta: {
    group: 'All survey respondents',
    n: 1785,
    note: 'Percentages are the survey’s “accept or lean toward” figures; they can sum to a little over 100% because a respondent may lean toward more than one option.'
  },
  q: {
    1:  { p: [72.8, 18.5], o: 8.7 },
    2:  { p: [38.4, 41.9], o: 19.7 },
    3:  { p: [43.5, 40.6], o: 18.9 },
    4:  { p: [62.5, 25.8], o: 11.9 },
    5:  { p: [35.7, 50.5], o: 18.0 },
    6:  { p: [6.6, 5.4, 79.5], o: 9.8 },
    7:  { p: [59.2, 18.8, 11.2], o: 13.5 },
    8:  { p: [18.9, 66.9], o: 14.6 },
    9:  { p: [43.9, 33.5], o: 27.6 },
    10: { p: [54.6, 5.4, 25.5], o: 16.4 },
    11: { p: [31.3, 54.3], o: 14.9 },
    12: { p: [53.6, 26.4], o: 24.2 },
    13: { p: [26.4, 58.1], o: 19.6 },
    14: { p: [62.1, 26.1], o: 11.8 },
    15: { p: [50.2, 31.1], o: 19.1 },
    16: { p: [51.9, 32.1], o: 15.9 },
    17: { p: [69.3, 20.7], o: 10.3 },
    18: { p: [41.0, 39.3], o: 22.0 },
    19: { p: [31.2, 39.0], o: 30.2 },
    20: { p: [32.1, 30.6, 37.0], o: 18.2 },
    21: { p: [15.6, 15.1, 39.3, 5.0], o: 28.1 },
    22: { p: [19.1, 43.7, 14.9], o: 26.6 },
    23: { p: [27.3, 44.0, 13.4], o: 20.5 },
    24: { p: [36.1, 38.7], o: 25.5 },
    25: { p: [72.4, 15.0], o: 12.8 },
    26: { p: [35.2, 40.1], o: 24.8 },
    27: { p: [27.2, 38.2], o: 36.2 },
    28: { p: [63.4, 13.3], o: 23.4 },
    29: { p: [51.4, 24.5, 10.2], o: 16.8 },
    30: { p: [16.4, 36.5, 24.4], o: 22.5 },
    31: { p: [42.2, 55.8, 31.2, 12.6, 22.7], o: 10.8 },
    32: { p: [48.0, 26.5, 18.4], o: 9.9 },
    33: { p: [13.3, 76.9], o: 9.7 },
    34: { p: [22.0, 56.0], o: 22.0 },
    35: { p: [29.0, 21.5, 63.1, 4.2], o: 14.8 },
    36: { p: [33.0, 32.1, 16.1], o: 23.6 },
    37: { reject: [11.6, 20.6, 14.5, 35.9, 12.9, 29.0, 21.5], o: 7.2 },
    38: { p: [3.8, 46.6, 41.7], o: 8.4 },
    39: { p: [18.7, 63.4, 15.0], o: 13.3 },
    40: { p: [24.2, 20.8, 52.1], o: 15.6 },
    41: { p: [81.7, 13.1], o: 5.4 },
    42: { p: [28.2, 14.2, 37.2], o: 24.4 },
    43: { p: [23.6, 32.2, 30.6], o: 13.9 },
    44: { p: [20.9, 17.7, 8.9, 14.2, 9.4], o: 25.2 },
    45: { p: [30.6, 31.3, 19.5], o: 19.3 },
    46: { p: [17.7, 75.1], o: 7.1 },
    47: { p: [37.2, 22.5, 20.5, 4.1], o: 20.6 },
    48: { p: [17.8, 67.1], o: 14.9 },
    49: { p: [28.1, 50.3], o: 25.1 },
    50: { p: [22.0, 4.5, 33.0, 13.3, 7.5], o: 22.7 },
    51: { p: [37.7, 28.7], o: 33.7 },
    52: { p: [17.3, 15.1, 32.1, 21.7], o: 17.8 },
    53: { p: [42.2, 50.7], o: 8.9 },
    54: { p: [23.7, 2.0, 25.2, 33.6], o: 21.8 },
    55: { p: [51.3, 37.1], o: 11.8 },
    56: { p: [15.3, 6.2, 11.8, 21.2, 15.3], o: 34.3 },
    57: { p: [20.4, 50.9, 16.3], o: 15.3 },
    58: { p: [34.7, 9.5, 15.1, 12.6, 13.7], o: 22.3 },
    59: { p: [62.4, 29.8], o: 7.9 },
    60: { p: [64.2, 19.5], o: 16.1 },
    61: { p: [36.5, 54.9], o: 15.8 },
    62: { p: [44.9, 41.3], o: 13.6 },
    63: { p: [29.1, 11.5, 21.0, 24.7], o: 28.3 },
    64: { p: [45.4, 34.9], o: 20.1 },
    65: { p: [39.5, 45.0], o: 16.0 },
    66: { p: [8.2, 35.0, 27.4], o: 30.1 },
    67: { p: [38.6, 28.1, 11.9], o: 21.6 },
    68: { p: [60.8, 44.4], o: 12.0 },
    69: { p: [32.4, 58.0], o: 18.8 },
    70: { p: [27.5, 54.2], o: 18.4 },
    71: { p: [54.6, 33.7], o: 12.9 },
    72: { p: [26.6, 31.6, 20.8, 10.6, 5.3], o: 11.6 },
    73: { p: [7.3, 14.2, 25.4, 37.4], o: 24.5 },
    74: { reject: [0.2, 3.9, 14.7, 38.4, 46.6, 79.7, 89.1, 4.9, 82.4, 26.8], o: 4.7 },
    75: { p: [62.9, 28.3], o: 9.0 },
    76: { p: [3.6, 32.5, 56.2], o: 8.1 },
    77: { p: [52.8, 28.2], o: 19.2 },
    78: { p: [29.5, 53.0], o: 19.3 },
    79: { p: [54.8, 4.6, 30.0], o: 10.9 },
    80: { p: [35.9, 45.7], o: 18.5 },
    81: { p: [11.5, 20.6, 19.8, 15.3, 8.1], o: 29.1 },
    82: { p: [38.7, 30.6, 18.9], o: 16.1 },
    83: { p: [31.5, 6.9, 46.5, 3.5], o: 18.9 },
    84: { p: [8.4, 38.3, 6.9, 8.1, 15.4], o: 25.0 },
    85: { p: [17.1, 21.9, 19.4, 12.8], o: 32.0 },
    86: { p: [8.2, 32.3, 40.4], o: 20.8 },
    87: { p: [22.1, 10.7, 13.4, 18.9, 8.4, 22.8], o: 17.2 },
    88: { p: [19.4, 70.2], o: 10.5 },
    89: { p: [9.4, 52.5, 25.5], o: 13.1 },
    90: { p: [27.7, 18.6], o: 53.4 },
    91: { p: [45.4, 27.5], o: 27.0 },
    92: { p: [30.1, 41.8], o: 28.1 },
    93: { p: [18.4, 39.9, 17.0], o: 24.9 },
    94: { p: [46.3, 22.1, 15.1], o: 21.6 },
    95: { p: [42.3, 41.0], o: 16.7 },
    96: { p: [71.4, 4.8, 12.4], o: 11.7 },
    97: { p: [43.5, 43.1], o: 23.3 },
    98: { p: [17.7, 44.0, 31.1], o: 7.2 },
    99: { p: [12.7, 18.6, 53.2], o: 20.1 },
    100:{ p: [24.6, 57.5], o: 17.2 }
  }
};
