// One source of truth for the keyboard-shortcut reference. The HTML5 Jade
// helper translates action keys; Legacy HTML4 renders the same rows as text.
const KEYBOARD_SHORTCUT_MAPPINGS = Object.freeze([
  { keys: ['w'], action: 'shortcut-toggle-sidebar' },
  { keys: ['q'], action: 'shortcut-filter-my-cards' },
  { keys: ['a'], action: 'shortcut-filter-my-assigned-cards' },
  { keys: ['n'], action: 'add-card-to-bottom-of-list' },
  { keys: ['f'], action: 'shortcut-toggle-filterbar' },
  { keys: ['/'], action: 'shortcut-toggle-searchbar' },
  { keys: ['x'], action: 'shortcut-clear-filters' },
  { keys: ['?'], action: 'shortcut-show-shortcuts' },
  { keys: ['ESC'], action: 'shortcut-close-dialog' },
  { keys: ['@'], action: 'shortcut-autocomplete-members' },
  { keys: ['SPACE'], action: 'shortcut-add-self' },
  { keys: ['m'], action: 'shortcut-assign-self' },
  { keys: ['c'], action: 'archive-card' },
  { keys: ['number keys 1-9'], action: 'toggle-labels' },
  { keys: ['shift + number keys 1-9'], action: 'remove-labels-multiselect' },
  { keys: ['ctrl + alt + number keys 1-9'], action: 'toggle-assignees' },
]);

module.exports = { KEYBOARD_SHORTCUT_MAPPINGS };
