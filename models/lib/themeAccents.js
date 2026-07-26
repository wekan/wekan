// The accent colour of every named theme — the colour that theme paints its header
// bar with (docs/Design/Page/Theme.md).
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
  clearblue: '#2d8ce7',
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
  return (typeof color === 'string' && THEME_ACCENTS[color]) || '';
}

// The accent to publish as `--theme-accent`, given the active theme and whatever
// custom colours go with it. A custom colour ALWAYS wins: it is the one the user
// chose on top of the theme.
function activeAccent(color, customColors) {
  const custom = Array.isArray(customColors) ? customColors : [];
  if (typeof custom[0] === 'string' && custom[0]) return custom[0];
  return accentOf(color);
}

export { THEME_ACCENTS, accentOf, activeAccent };
