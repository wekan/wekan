// Curated set of card "stickers", shared by the Trello importer and the
// in-app sticker picker.
//
// Icons are rendered in templates as `i.fa.fa-<name>` (the `fa` base class +
// Font Awesome v4 names, which WeKan's Font Awesome build supports via its v4
// compatibility shims — the same way existing minicard badges use names like
// `fa-comment-o`). So the names below are FA4-compatible names that render with
// the bare `fa` class.

// All names are Font Awesome v4 names (render with the bare `fa` class). The set
// mirrors Trello's built-in stickers plus a few common generic markers.
const STICKER_ICONS = [
  'thumbs-up',
  'thumbs-down',
  'heart',
  'star',
  'check',
  'clock-o',
  'exclamation-triangle',
  'exclamation-circle',
  'info-circle',
  'question-circle',
  'smile-o',
  'meh-o',
  'frown-o',
  'rocket',
  'globe',
  'pencil',
  'sticky-note-o',
  'flag',
  'bell',
  'bookmark',
  'bolt',
  'fire',
  'lightbulb-o',
  'trophy',
  'gift',
  'bug',
  'wrench',
  'lock',
  'key',
  'eye',
  'comment-o',
  'paperclip',
  'calendar',
  'ban',
];

// Trello built-in sticker name => Font Awesome (v4) icon name. Unknown Trello
// stickers fall back to a generic note sticker.
const TRELLO_STICKER_TO_FA = {
  thumbsup: 'thumbs-up',
  thumbsdown: 'thumbs-down',
  heart: 'heart',
  star: 'star',
  clock: 'clock-o',
  check: 'check',
  warning: 'exclamation-triangle',
  smile: 'smile-o',
  laugh: 'smile-o',
  huh: 'meh-o',
  frown: 'frown-o',
  rocketship: 'rocket',
  globe: 'globe',
  pencil: 'pencil',
};

const DEFAULT_STICKER_ICON = 'sticky-note-o';

// Trello's two named premium sticker packs are renamed in WeKan: the "taco"
// pack => "mascot" and the "pete" pack => "computer". Each is highlighted
// (instead of colour) so the two are still visually distinct: taco/mascot icons
// are underlined and pete/computer icons get a ring around them. The icon itself
// keeps its normal Font Awesome colour.
const TRELLO_STICKER_PACK_NAME = { taco: 'mascot', pete: 'computer' };
const TRELLO_STICKER_PACK_HIGHLIGHT = { taco: 'underline', pete: 'round' };

// Highlight style for an imported sticker icon, derived from its Trello pack
// name (taco => 'underline', pete => 'round'), or undefined for stickers that
// belong to no named pack.
function trelloStickerHighlight(name) {
  if (!name) return undefined;
  const n = String(name).toLowerCase();
  if (n.includes('taco')) return TRELLO_STICKER_PACK_HIGHLIGHT.taco;
  if (n.includes('pete')) return TRELLO_STICKER_PACK_HIGHLIGHT.pete;
  return undefined;
}

// Substring keywords -> Font Awesome (v4) icon, used to pick a *similar* icon
// for Trello's named sticker packs (e.g. taco-love, pete-happy) and any sticker
// whose name contains a recognisable word. Checked after the exact map above.
const STICKER_KEYWORD_TO_FA = [
  ['ghost', 'snapchat-ghost'],
  // Distinct icons for named taco/pete stickers that would otherwise collide
  // with a more generic keyword below (checked first, so these win):
  ['active', 'heartbeat'],   // taco-active
  ['pixel', 'qrcode'],       // taco-pixelated
  ['proto', 'flask'],        // taco-prototype
  ['embarrass', 'meh-o'],    // taco-embarrassed
  ['shipped', 'truck'],      // pete-shipped (vs pete-space => rocket)
  ['thumbsup', 'thumbs-up'], ['thumbup', 'thumbs-up'],
  ['thumbsdown', 'thumbs-down'], ['thumbdown', 'thumbs-down'],
  ['love', 'heart'], ['heart', 'heart'],
  ['trophy', 'trophy'], ['award', 'trophy'], ['win', 'trophy'],
  ['proud', 'star'], ['celebrate', 'star'], ['star', 'star'],
  ['money', 'money'], ['dollar', 'money'], ['cash', 'money'],
  ['happy', 'smile-o'], ['smile', 'smile-o'], ['cool', 'smile-o'], ['laugh', 'smile-o'],
  ['angry', 'frown-o'], ['sad', 'frown-o'], ['frown', 'frown-o'], ['cry', 'frown-o'],
  ['confus', 'question-circle'], ['huh', 'question-circle'], ['question', 'question-circle'],
  ['alert', 'exclamation-triangle'], ['warn', 'exclamation-triangle'], ['broken', 'exclamation-triangle'],
  ['complet', 'check'], ['done', 'check'], ['clean', 'bath'], ['check', 'check'],
  ['busy', 'clock-o'], ['clock', 'clock-o'], ['time', 'clock-o'],
  ['rocket', 'rocket'], ['space', 'rocket'], ['ship', 'rocket'],
  ['globe', 'globe'], ['world', 'globe'], ['earth', 'globe'],
  ['read', 'book'], ['book', 'book'],
  ['robot', 'android'], ['computer', 'desktop'], ['desktop', 'desktop'], ['screen', 'desktop'],
  ['sleep', 'bed'], ['bed', 'bed'],
  ['music', 'music'], ['song', 'music'],
  ['talk', 'comment-o'], ['comment', 'comment-o'], ['chat', 'comment-o'],
  ['vacation', 'plane'], ['plane', 'plane'], ['travel', 'plane'],
  ['box', 'archive'], ['package', 'archive'], ['gift', 'gift'],
  ['fire', 'fire'], ['bolt', 'bolt'], ['lightning', 'bolt'], ['energy', 'bolt'],
  ['sun', 'sun-o'], ['moon', 'moon-o'], ['coffee', 'coffee'],
  ['bug', 'bug'], ['lock', 'lock'], ['key', 'key'], ['eye', 'eye'],
  ['flag', 'flag'], ['bell', 'bell'], ['camera', 'camera'], ['phone', 'phone'],
  ['mail', 'envelope-o'], ['email', 'envelope-o'], ['location', 'map-marker'], ['pin', 'map-marker'],
  ['paint', 'paint-brush'], ['magic', 'magic'], ['cake', 'birthday-cake'], ['party', 'birthday-cake'],
  ['sketch', 'pencil'], ['edit', 'pencil'], ['pencil', 'pencil'],
  ['dog', 'paw'], ['cat', 'paw'], ['paw', 'paw'], ['husky', 'paw'],
];

// Map a Trello sticker name (sticker.image) to a similar Font Awesome icon:
// exact built-in name first, then a keyword/substring match for the named
// premium packs, then a generic note sticker for custom (image-only) stickers.
function trelloStickerToFa(name) {
  if (!name) return DEFAULT_STICKER_ICON;
  const n = String(name).toLowerCase();
  if (TRELLO_STICKER_TO_FA[n]) return TRELLO_STICKER_TO_FA[n];
  for (const [kw, icon] of STICKER_KEYWORD_TO_FA) {
    if (n.includes(kw)) return icon;
  }
  return DEFAULT_STICKER_ICON;
}

// Every Font Awesome icon the Trello sticker mapping can produce (exact map +
// keyword map + the default). A Trello "taco-*" sticker becomes that icon with
// the mascot (underline) highlight and a "pete-*" sticker with the computer
// (round) highlight, so offering each of these icons in both highlights makes
// the picker include every sticker an import can create — regardless of the
// original (possibly custom) Trello sticker name.
const ALL_MAP_ICONS = [
  ...new Set([
    ...Object.values(TRELLO_STICKER_TO_FA),
    ...STICKER_KEYWORD_TO_FA.map(([, icon]) => icon),
    DEFAULT_STICKER_ICON,
  ]),
];

// The in-app sticker picker: the plain icons, then the mascot (underlined) and
// computer (ringed) packs. Each entry is { icon, highlight?, name? }.
const STICKER_PICKER = [
  ...STICKER_ICONS.map(icon => ({ icon })),
  ...ALL_MAP_ICONS.map(icon => ({ icon, highlight: 'underline', name: `mascot ${icon}` })),
  ...ALL_MAP_ICONS.map(icon => ({ icon, highlight: 'round', name: `computer ${icon}` })),
];

export {
  STICKER_ICONS,
  STICKER_PICKER,
  TRELLO_STICKER_TO_FA,
  DEFAULT_STICKER_ICON,
  TRELLO_STICKER_PACK_NAME,
  TRELLO_STICKER_PACK_HIGHLIGHT,
  trelloStickerToFa,
  trelloStickerHighlight,
};
