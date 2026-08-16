// The accent colour of every named theme — the colour that theme paints its header
// bar with (docs/Features/Page/Theme.md).
//
// WeKan's chrome outside a board reads ONE CSS variable, `--theme-accent`: the
// Admin Panel's selected left-menu row, its buttons, every Save button, the table
// page's controls. Until now that variable was only set when a user picked a CUSTOM
// colour for a flat/clear theme, so choosing a named theme like Pumpkin recoloured
// the header (which has its own `.board-color-pumpkin#header` rule) and left the
// menu row and the buttons on the stock blue fallback.
//
// This map closes that gap: whatever theme is active - the user's own override, a
// board's colour, or the site theme - its accent is published as `--theme-accent`,
// and everything that already reads the variable follows along.
//
// The values MIRROR client/components/boards/boardColors.css: each is the
// `background-color` of that theme's `#header` rule. tests/themeAccents.test.cjs
// parses that stylesheet and fails if the two ever disagree, so a new theme cannot
// be added in CSS alone and quietly fall back to blue.
const THEME_ACCENTS = {
  belize: '#2980b9',
  nephritis: '#27ae60',
  pomegranate: '#c0392b',
  pumpkin: '#e67e22',
  wisteria: '#8e44ad',
  moderatepink: '#cd5a91',
  strongcyan: '#00aecc',
  limegreen: '#4bbf6b',
  midnight: '#2c3e50',
  dark: '#2c3e51',
  relax: '#27ae61',
  corteza: '#568ba2',
  appleglasspastel: '#2563eb',
  // The MAIN header bar's colour. It read #2d8ce7 - the quick-access bar's
  // separate, lighter shade - because the guard that derives these matched
  // `#header-quick-access` as well as `#header`. The two bars are one colour
  // now, and it is this one.
  clearblue: '#00aecc',
  // The other colour slides. Each publishes the BOTTOM of its own slide, the
  // way clearblue publishes #00aecc: a variable holds a colour and a gradient
  // is not one, so what everything outside a board reads is the solid end.
  cleargreen: '#4bbf6b',
  clearorange: '#e67e22',
  clearpink: '#cd5a91',
  clearpurple: '#8e44ad',
  clearred: '#c0392b',
  natural: '#596557',
  modern: '#2a80b8',
  moderndark: '#2a2a2a',
  exodark: '#222',
  cleandark: '#2E2E39',
  cleanlight: 'rgba(190, 190, 190, 1)',
};

// The accent of one theme, or '' when the name is unknown (which is what an
// unthemed instance and a bad value both look like).
function accentOf(color) {
  // hasOwnProperty, not a plain lookup: `THEME_ACCENTS['constructor']` answers
  // with Object's constructor, and 'toString' with a function - so a board whose
  // colour is named after any Object.prototype member would have got a FUNCTION
  // as its accent and written it into a stylesheet. Only the map's own keys are
  // themes.
  if (typeof color !== 'string') return '';
  return Object.prototype.hasOwnProperty.call(THEME_ACCENTS, color)
    ? THEME_ACCENTS[color] || ''
    : '';
}

// The accent to publish as `--theme-accent`, given the active theme and whatever
// custom colours go with it. A custom colour ALWAYS wins: it is the one the user
// chose on top of the theme.
function activeAccent(color, customColors) {
  const custom = Array.isArray(customColors) ? customColors : [];
  if (typeof custom[0] === 'string' && custom[0]) return custom[0];
  return accentOf(color);
}

// The two ends of each colour-slide theme, top first.
//
// `--theme-accent` is ONE colour and a gradient is not one, so a slide theme's
// buttons came out flat while its header slid. This is the other half of the
// answer: the pair, from which a `background` value can be built.
//
// Only the `clear` category has one. Everything else is a flat colour and its
// fill IS its accent. MIRRORS boardColors.css, and a guard fails if they ever
// disagree - the same arrangement THEME_ACCENTS has.
const THEME_SLIDES = {
  clearblue: ['#499bea', '#00aecc'],
  cleargreen: ['#8ad59f', '#4bbf6b'],
  clearorange: ['#efab6f', '#e67e22'],
  clearpink: ['#df94b8', '#cd5a91'],
  clearpurple: ['#b685ca', '#8e44ad'],
  clearred: ['#d67e75', '#c0392b'],
};

// The slide of a theme, or null when it is a flat one.
function slideOf(color) {
  const ends = THEME_SLIDES[color];
  return ends ? ends.slice() : null;
}

// What to paint a themed CONTROL with: a full CSS `background` value rather
// than a colour, so a slide theme's buttons slide like its header.
//
// A custom pair wins over the theme's own, the same way a custom colour wins
// over its accent - a user who chose two colours chose a slide. One custom
// colour, or a flat theme, answers with that solid colour.
//
// An unknown theme answers `''`, which is what accentOf() answers - not null.
// Either is falsy and the caller's `if (fill)` treats them alike, but the two
// functions sit beside each other and should not need a reader to remember
// which one returns which kind of nothing.
function activeFill(color, customColors) {
  const custom = Array.isArray(customColors) ? customColors : [];
  const [c1, c2] = custom;
  if (typeof c1 === 'string' && c1 && typeof c2 === 'string' && c2) {
    return `linear-gradient(180deg, ${c1} 0%, ${c2} 100%)`;
  }
  if (typeof c1 === 'string' && c1) return c1;
  const ends = slideOf(color);
  if (ends) return `linear-gradient(180deg, ${ends[0]} 0%, ${ends[1]} 100%)`;
  return accentOf(color);
}

export { THEME_ACCENTS, THEME_SLIDES, accentOf, activeAccent, slideOf, activeFill };
