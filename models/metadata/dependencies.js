// #3392: PI Program Board "Red Strings" — typed card-to-card dependencies.
//
// A dependency is stored on the SOURCE card as an object:
//   { cardId, type, color, icon }
// where:
//   - cardId : the target card's _id (must be on the same board to be drawn)
//   - type   : one of DEPENDENCY_TYPE_IDS (relation kind, also sets arrow direction)
//   - color  : the connection line / minicard badge color (any CSS color, hex)
//   - icon   : a FontAwesome 4.7 icon name (without the "fa-" prefix)
//
// This module is pure JS and imported on both client and server so the model,
// the SVG overlay, the REST API, import/export and the minicard badge all agree
// on the shape and defaults.

export const DEFAULT_DEPENDENCY_COLOR = '#eb144c';
export const DEFAULT_DEPENDENCY_ICON = 'link';
export const DEFAULT_DEPENDENCY_TYPE = 'related-to';

// `directed`: whether the connection line draws an arrowhead.
// `forward` : true  => arrow points from the source card to the target card;
//             false => arrow points from the target card back to the source
//             (used by the reverse relations "is-blocked-by" / "is-fixed-by").
// The i18n label for each type is the key `dependency-type-<id>`.
export const DEPENDENCY_TYPES = [
  { id: 'related-to', directed: false, forward: true },
  { id: 'blocks', directed: true, forward: true },
  { id: 'is-blocked-by', directed: true, forward: false },
  { id: 'fixes', directed: true, forward: true },
  { id: 'is-fixed-by', directed: true, forward: false },
];

export const DEPENDENCY_TYPE_IDS = DEPENDENCY_TYPES.map(t => t.id);

// A curated set of FontAwesome 4.7 icon names offered in the dependency icon
// pickers (card detail and the on-board line editor).
export const DEPENDENCY_ICON_CHOICES = [
  'link', 'chain-broken', 'arrow-right', 'long-arrow-right', 'ban', 'lock',
  'check', 'bug', 'bolt', 'exclamation-triangle', 'flag', 'random',
  'sitemap', 'share-alt', 'code-fork', 'tasks',
];

// The reverse of each relation, used when remapping a dependency onto the other
// card (e.g. when showing "blocks" as "is-blocked-by" from the target's side).
export const DEPENDENCY_TYPE_INVERSE = {
  'related-to': 'related-to',
  blocks: 'is-blocked-by',
  'is-blocked-by': 'blocks',
  fixes: 'is-fixed-by',
  'is-fixed-by': 'fixes',
};

export function dependencyTypeMeta(typeId) {
  return (
    DEPENDENCY_TYPES.find(t => t.id === typeId) ||
    DEPENDENCY_TYPES.find(t => t.id === DEFAULT_DEPENDENCY_TYPE)
  );
}

// Normalize a stored dependency entry into a complete { cardId, type, color,
// icon } object. Accepts a legacy bare-string card id, a partial object, or a
// full object, so older data and external imports stay valid. Returns null for
// entries that have no target card id.
export function normalizeDependency(dep) {
  if (!dep) return null;
  if (typeof dep === 'string') {
    return {
      cardId: dep,
      type: DEFAULT_DEPENDENCY_TYPE,
      color: DEFAULT_DEPENDENCY_COLOR,
      icon: DEFAULT_DEPENDENCY_ICON,
    };
  }
  if (!dep.cardId) return null;
  return {
    cardId: dep.cardId,
    type: DEPENDENCY_TYPE_IDS.includes(dep.type)
      ? dep.type
      : DEFAULT_DEPENDENCY_TYPE,
    color: dep.color || DEFAULT_DEPENDENCY_COLOR,
    icon: dep.icon || DEFAULT_DEPENDENCY_ICON,
  };
}

export function normalizeDependencies(deps) {
  return (deps || []).map(normalizeDependency).filter(Boolean);
}
