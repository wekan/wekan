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

function uiAction({ action, label, icon = 'caret-right', fields = {}, authPurpose = '',
  target = '' }) {
  return { component: 'action', action, label, icon, fields, authPurpose, target };
}

function uiAttachment({ name, type, size, actions = [] }) {
  return { component: 'attachment', name, type, size, actions };
}

function uiLink({ href, label, icon = 'caret-right' }) {
  return { component: 'link', href, label, icon };
}

function uiSearchForm({ action, label, value = '', fields = {} }) {
  return { component: 'search', action, label, value, fields };
}

function uiSelectForm({ action, label, name, value = '', options = [], fields = {}, submitLabel }) {
  return { component: 'select', action, label, name, value, options, fields, submitLabel };
}

function uiTextForm({ action, label, name, value = '', fields = {}, submitLabel,
  maxlength = 1000, id = '' }) {
  return { component: 'text', action, label, name, value, fields, submitLabel, maxlength, id };
}

function uiTextareaForm({ action, label, name, value = '', fields = {}, submitLabel, id = '' }) {
  return { component: 'textarea', action, label, name, value, fields, submitLabel, id };
}

function uiTextareaGroupForm({ action, legend, textareas = [], fields = {}, submitLabel,
  id = '' }) {
  return { component: 'textarea-group', action, legend, textareas, fields, submitLabel, id };
}

function uiFieldsetForm({ action, legend, inputs = [], fields = {}, submitLabel, id = '' }) {
  return { component: 'fieldset', action, legend, inputs, fields, submitLabel, id };
}

function uiFileForm({ action, label, name, accept = '', sections = [], fields = {}, submitLabel }) {
  return { component: 'file', action, label, name, accept, sections, fields, submitLabel };
}

function uiExportForm({ action, label, formats = [], sections = [], fields = {}, submitLabel }) {
  return { component: 'export', action, label, formats, sections, fields, submitLabel };
}

function uiCardDestinationForm({ action, titleLabel, titleName = 'cardTitle', titleValue = '',
  destinationLabel, destinationName = 'cardDestination', destinationValue = '',
  destinations = [], positionLabel, positionName = 'position', positionValue = 'below',
  positions = [], fields = {}, submitLabel }) {
  return {
    component: 'card-destination', action, titleLabel, titleName, titleValue,
    destinationLabel, destinationName, destinationValue, destinations,
    positionLabel, positionName, positionValue, positions, fields, submitLabel,
  };
}

function uiBoardCreateForm({ action, titleLabel, permissionLabel, permissions = [],
  fields = {}, submitLabel }) {
  return {
    component: 'board-create', action, titleLabel, permissionLabel, permissions,
    fields, submitLabel,
  };
}

module.exports = {
  UI_ICONS, uiAction, uiAttachment, uiBoardCreateForm, uiCardDestinationForm, uiControlLabel,
  uiExportForm, uiFieldsetForm, uiFileForm, uiIcon, uiLink, uiSearchForm, uiSelectForm,
  uiTextForm, uiTextareaForm, uiTextareaGroupForm,
};
