import { UI_FONTS } from '/models/lib/uiFonts';

// #4759: detect which curated UI fonts are actually installed in THIS browser, using
// the canvas text-width comparison technique. A candidate font is "available" if
// rendering a probe string in it produces a different width than the generic base
// families — i.e. the browser actually had the font and didn't fall back.
//
// Returns an ordered subset of UI_FONTS. Purely a detection helper; the value the
// user picks is still validated server-side against the whitelist.

const BASE_FONTS = ['monospace', 'sans-serif', 'serif'];
const PROBE = 'mmmmmmmmmmlliWWWWWW';
const PROBE_SIZE = '72px';

export function detectAvailableFonts(candidates = UI_FONTS) {
  let ctx;
  try {
    ctx = document.createElement('canvas').getContext('2d');
  } catch (_) {
    return [];
  }
  if (!ctx) return [];

  const baseWidths = {};
  BASE_FONTS.forEach(base => {
    ctx.font = `${PROBE_SIZE} ${base}`;
    baseWidths[base] = ctx.measureText(PROBE).width;
  });

  return candidates.filter(font =>
    BASE_FONTS.some(base => {
      ctx.font = `${PROBE_SIZE} "${font}", ${base}`;
      return ctx.measureText(PROBE).width !== baseWidths[base];
    }),
  );
}
