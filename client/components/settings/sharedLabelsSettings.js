import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import SharedLabels from '/models/sharedLabels';
import Org from '/models/org';
import Team from '/models/team';
import { LABEL_COLORS } from '/models/metadata/colors';

// Admin Panel / Settings / Labels (#2761, #4698): each row is one shared
// label and saves on its own; the last row adds one. Saving goes through the
// site-admin method, which also renames and recolours every board's copy.
const SCOPE_LABELS = {
  instance: 'shared-label-scope-instance',
  org: 'shared-label-scope-org',
  team: 'shared-label-scope-team',
};

Template.sharedLabelsSettings.onCreated(function () {
  this.edits = new ReactiveVar({});
  this.subscribe('sharedLabels');
  // The organizations and teams a label can belong to (admin-only publications).
  this.subscribe('org', {}, 1000);
  this.subscribe('team', {}, 1000);
});

function current(tpl, id) {
  const edit = tpl.edits.get()[id];
  if (edit) return edit;
  const saved = id === 'new' ? null : SharedLabels.findOne(id);
  return saved
    ? { name: saved.name || '', color: saved.color, scope: saved.scope, scopeId: saved.scopeId || '' }
    : { name: '', color: LABEL_COLORS[0], scope: 'instance', scopeId: '' };
}

function change(tpl, id, key, value) {
  tpl.edits.set({ ...tpl.edits.get(), [id]: { ...current(tpl, id), [key]: value } });
}

Template.sharedLabelsSettings.helpers({
  rows() {
    const tpl = Template.instance();
    const ids = SharedLabels.find({}, { sort: { sort: 1, name: 1 } }).map(l => l._id).concat(['new']);
    return ids.map(id => {
      const row = current(tpl, id);
      const scopeIds = row.scope === 'org'
        ? Org.find({}, { sort: { orgDisplayName: 1 } }).map(o => ({ value: o._id, label: o.orgDisplayName }))
        : Team.find({}, { sort: { teamDisplayName: 1 } }).map(t => ({ value: t._id, label: t.teamDisplayName }));
      return {
        id,
        isNew: id === 'new',
        name: row.name,
        color: row.color,
        colorOptions: LABEL_COLORS.map(value => ({ value, selected: value === row.color })),
        scopeOptions: Object.keys(SCOPE_LABELS).map(value => ({ value, labelKey: SCOPE_LABELS[value], selected: value === row.scope })),
        needsScopeId: row.scope !== 'instance',
        scopeIdOptions: scopeIds.map(o => ({ ...o, selected: o.value === row.scopeId })),
      };
    });
  },
});

const rowId = event => String($(event.currentTarget).closest('.shared-label-row').data('id'));

Template.sharedLabelsSettings.events({
  'input .js-shared-label-name'(event, tpl) { change(tpl, rowId(event), 'name', event.currentTarget.value); },
  'change .js-shared-label-color'(event, tpl) { change(tpl, rowId(event), 'color', event.currentTarget.value); },
  'change .js-shared-label-scope'(event, tpl) {
    change(tpl, rowId(event), 'scope', event.currentTarget.value);
    change(tpl, rowId(event), 'scopeId', '');
  },
  'change .js-shared-label-scope-id'(event, tpl) { change(tpl, rowId(event), 'scopeId', event.currentTarget.value); },
  'click .js-shared-label-save'(event, tpl) {
    event.preventDefault();
    const id = rowId(event);
    const row = current(tpl, id);
    // A first organization or team is the one the select shows when untouched.
    if (row.scope !== 'instance' && !row.scopeId) {
      row.scopeId = String(tpl.$(event.currentTarget).closest('.shared-label-row').find('.js-shared-label-scope-id').val() || '');
    }
    Meteor.call('sharedLabels.save', id === 'new' ? null : id, row, err => {
      if (err) { console.error('sharedLabels.save', err); return; }
      const edits = { ...tpl.edits.get() };
      delete edits[id];
      tpl.edits.set(edits);
    });
  },
  'click .js-shared-label-delete'(event) {
    event.preventDefault();
    Meteor.call('sharedLabels.remove', rowId(event), err => { if (err) console.error('sharedLabels.remove', err); });
  },
});
