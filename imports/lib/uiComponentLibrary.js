'use strict';

// Semantic icon names shared by Blaze/Jade and the server HTML4 renderer.
// HTML4 deliberately uses printable 7-bit ASCII: IBrowse maps Unicode back to
// Windows-1252 and cannot rely on Font Awesome or CSS generated content.
const UI_ICONS = Object.freeze({
  'caret-down': { ascii: 'v', html5: 'fa-caret-down' },
  'caret-right': { ascii: '>', html5: 'fa-caret-right' },
  'move-up': { ascii: '^', html5: 'fa-arrow-up' },
  'move-down': { ascii: 'v', html5: 'fa-arrow-down' },
  'move-left': { ascii: '<', html5: 'fa-arrow-left' },
  'move-right': { ascii: '>', html5: 'fa-arrow-right' },
  add: { ascii: '+', html5: 'fa-plus' },
  remove: { ascii: '-', html5: 'fa-minus' },
  menu: { ascii: '=', html5: 'fa-bars' },
  'select-off': { ascii: '[ ]', html5: 'fa-square-o' },
  'select-on': { ascii: '[x]', html5: 'fa-check-square-o' },
  previous: { ascii: '<', html5: 'fa-chevron-left' },
  next: { ascii: '>', html5: 'fa-chevron-right' },
});

function uiIcon(name, representation = 'html4') {
  const icon = UI_ICONS[name];
  if (!icon) return '';
  return representation === 'html5' ? icon.html5 : icon.ascii;
}

function uiControlLabel(iconName, label) {
  const icon = uiIcon(iconName, 'html4');
  const text = String(label == null ? '' : label).trim();
  return icon && text ? `${icon} ${text}` : icon || text;
}

function uiAction({ action, label, icon = 'caret-right', fields = {} }) {
  return { component: 'action', action, label, icon, fields };
}

function uiLink({ href, label, icon = 'caret-right' }) {
  return { component: 'link', href, label, icon };
}

module.exports = { UI_ICONS, uiAction, uiControlLabel, uiIcon, uiLink };

