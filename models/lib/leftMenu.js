// Pure helpers behind the shared left menu (docs/Features/Page/Left-Menu.md).
//
// Every Admin Panel page — Settings, People, Features, Attachments, Problems,
// Translation, Info — has the same menu beside its content: a list of entries,
// each an icon and a label, with the current one highlighted. That markup was
// retyped 44 times across seven templates. It is now built from a plain item
// list, here, so a menu is data rather than markup.
//
// An item is:
//   { id, icon, labelKey, cls }     a normal entry
//   { separator: true }             a horizontal rule between groups
//   { heading: true, labelKey }     a group title: text only, NOT clickable
//
// `id` is what the page's click handler reads from data-id; `icon` is the Font
// Awesome class; `labelKey` is an i18n key.

// Normalize a menu definition into what the template iterates. `activeId` marks
// exactly one entry active — the page tells us which, so the menu never has to
// know how the page stores its state.
export function buildMenuItems(items, activeId, jsClass = '') {
  const list = Array.isArray(items) ? items : [];
  return list
    // A page may build its list with conditional entries (`isSandstorm ? null :
    // {...}`); drop the holes instead of rendering an empty <li>.
    .filter(Boolean)
    .map(item => {
      if (item.separator) {
        return { separator: true };
      }
      // A group title. It has no id and no handler class on purpose: it names the
      // entries below it and must not look or behave like a row you can open. It
      // can never be the active row either, so `paneTitle()` cannot pick it.
      if (item.heading) {
        return {
          heading: true,
          labelKey: item.labelKey || '',
          label: item.label || '',
        };
      }
      return {
        id: item.id || '',
        icon: item.icon || '',
        labelKey: item.labelKey || '',
        // A literal label, for the rare entry that is a proper noun rather than a
        // translated string (Admin Panel / Attachments -> Sandstorm).
        label: item.label || '',
        // Only one entry can be active. Compared as strings so a page storing its
        // active id as a number still highlights the right row.
        active: !!item.id && String(item.id) === String(activeId),
        // The page's own handler class, kept alongside the shared one so an
        // existing `click a.js-<page>-menu` handler goes on working.
        jsClass: item.jsClass || jsClass || '',
        cls: item.cls || '',
        // Icon shape, reproducing exactly what each page already rendered so a
        // conversion changes no pixel. See leftMenu.jade.
        emoji: !!item.emoji,
        iconWrapCls: item.iconWrapCls || '',
      };
    });
}

// The data context the shared template expects, which is NOT a bare array.
// leftMenu.jade iterates `each items`, so handing it the array directly makes
// Spacebars look `items` up ON the array, find nothing, and render an empty menu -
// which is exactly what every Admin Panel page did: Settings, People, Features,
// Attachments, Version and Problems all showed a blank panel where the menu belongs.
// Every page builds its context through here, so the shape is stated once instead of
// being retyped - and got wrong - at each call site.
export function leftMenuData(items, activeId, jsClass = '') {
  return { items: buildMenuItems(items, activeId, jsClass) };
}

// The title of the pane beside the menu: the ACTIVE entry's own label.
//
// Every Admin Panel page shows one heading at the top of its content, and it is
// the same words, in the same style, as the menu row that opened it - so the pane
// always says what it is. Deriving it from the menu instead of writing a heading
// into each pane is what keeps them identical: a pane cannot end up with a title
// of a different size, or with none at all, and renaming a menu entry renames its
// pane title with it.
//
// Returns { titleKey, label } - a translation key or a literal label, the same two
// forms a menu entry has - or an empty object when nothing is active, so a page
// with no selection renders no heading rather than an empty one.
export function paneTitle(items, activeId) {
  const active = buildMenuItems(items, activeId).find(item => item.active);
  if (!active) {
    return {};
  }
  return { titleKey: active.labelKey || '', label: active.label || '' };
}

// True when exactly one entry is active. Used by the test to prove a menu can
// never highlight two rows at once, which is what happens when each page keeps
// its own `isXActive` helper per entry.
export function activeCount(items) {
  return (Array.isArray(items) ? items : []).filter(i => i && i.active).length;
}
