import { ReactiveDict } from 'meteor/reactive-dict';
import { TAPi18n } from '/imports/i18n';
import { Meteor } from 'meteor/meteor';
// NOT moment: it was removed from WeKan and replaced with native Date helpers
// (see imports/i18n/moment.js). The import this line replaces was the only one
// left in the tree, and it broke the client build outright - moment is not a
// dependency at all, so nothing resolved it. No source-reading test could have
// caught that; the build did, first time.
import { formatDateTime } from '/imports/lib/dateUtils';

// THE History view — one implementation for every scope
// (docs/Features/Reports/History/History.md §7a). The card-group menu, the whole
// card, Member settings, Board settings and the swimlane/list menus all render
// this same template with a different data context; there is no second copy of
// the table, the search, the pagination or the restore anywhere.
//
// All state lives in a ReactiveDict on the template instance and NOT on the
// Blaze data context. #6479: a re-render drops fields written onto a data
// context, and the symptom is a search box that empties itself while you type.

const PAGE_SIZE = 25;

/*
 * A group is labelled with the word the card details view already uses for that
 * section, so History speaks the same language as the card it describes - and
 * so this needed no new translations in 197 files. A group with no existing word
 * (a position change, a create/delete) shows no label rather than an untranslated
 * key: the change type beside it already says what happened.
 */
const GROUP_KEYS = {
  title: 'title',
  description: 'description',
  labels: 'labels',
  members: 'members',
  assignees: 'assignees',
  dates: 'date',
  checklists: 'checklists',
  subtasks: 'subtasks',
  attachments: 'attachments',
  comments: 'comments',
  customFields: 'custom-fields',
  position: 'sort',
};

/* 'Added' the app already had; the other four were added for this. */
function changeTypeKey(changeType) {
  return changeType === 'added' ? 'added' : `history-change-${changeType}`;
}

Template.historyTable.onCreated(function () {
  const data = Template.currentData() || {};
  this.state = new ReactiveDict();
  this.state.set('search', '');
  this.state.set('page', 1);
  this.state.set('userId', data.userId || null);
  this.state.set('loading', true);
  this.state.set('result', { rows: [], total: 0, page: 1, contributors: [] });
  // A Set would be lost on the ReactiveDict's EJSON clone, so the selection is
  // kept as a plain array of row ids.
  this.state.set('selected', []);

  this.fetch = () => {
    const context = Template.currentData() || {};
    this.state.set('loading', true);
    Meteor.call('changeHistory.page', {
      scope: context.scope || null,
      scopeId: context.scopeId || null,
      group: context.group || null,
      userId: this.state.get('userId') || null,
      search: this.state.get('search') || '',
      page: this.state.get('page') || 1,
      pageSize: PAGE_SIZE,
    }, (error, result) => {
      this.state.set('loading', false);
      if (error) {
        this.state.set('result', { rows: [], total: 0, page: 1, contributors: [] });
        return;
      }
      this.state.set('result', result);
    });
  };

  this.autorun(() => {
    // Re-read when the filter, the search or the page changes.
    this.state.get('userId');
    this.state.get('search');
    this.state.get('page');
    this.fetch();
  });
});

/*
 * One line describing what a change contains (History.md §1: "content of
 * change"). The stored content is a blackbox, so this renders the shapes the
 * write side actually produces - `{ field, value }` from the field diff, a
 * position from a move, a whole document from a create/delete - and falls back
 * to something readable rather than "[object Object]" for anything else.
 */
function summarise(row) {
  const content = row.newContent || row.previousContent;
  if (!content) return '';
  if (typeof content.value === 'string') return content.value;
  // An emptied field has no text to show; an em dash reads as "nothing here" in
  // every language, which a translated word would have needed 197 files to do.
  if (content.value === null) return '—';
  if (Array.isArray(content.value)) return content.value.join(', ');
  if (content.isDate) return formatDateTime(content.value);
  if (typeof content.value === 'number' || typeof content.value === 'boolean') {
    return String(content.value);
  }
  if (content.document && content.document.title) return content.document.title;
  if (content.document && content.document.text) return content.document.text;
  if (content.deleted !== undefined) {
    return TAPi18n.__(content.deleted ? 'history-change-removed' : 'history-change-restored');
  }
  try {
    return JSON.stringify(content.value !== undefined ? content.value : content);
  } catch {
    return '';
  }
}

Template.historyTable.helpers({
  loading() { return Template.instance().state.get('loading'); },
  searchTerm() { return Template.instance().state.get('search'); },
  activeUserId() { return Template.instance().state.get('userId'); },

  rows() {
    const result = Template.instance().state.get('result') || {};
    const selected = Template.instance().state.get('selected') || [];
    return (result.rows || []).map(row => ({
      ...row,
      changeTypeKey: changeTypeKey(row.changeType),
      groupKey: GROUP_KEYS[row.group] || null,
      contentSummary: summarise(row),
      prettyWhen: formatDateTime(row.createdAt),
      isSelected: selected.includes(row._id),
    }));
  },
  hasRows() {
    const result = Template.instance().state.get('result') || {};
    return (result.rows || []).length > 0;
  },
  hasSelection() {
    return (Template.instance().state.get('selected') || []).length > 0;
  },

  // The left pane exists only where a scope can span several people; the Member
  // view is already one user (History.md §7a).
  showContributors() {
    const data = Template.currentData() || {};
    return !data.userId;
  },
  contributors() {
    const instance = Template.instance();
    const result = instance.state.get('result') || {};
    const active = instance.state.get('userId');
    return (result.contributors || []).map(c => ({ ...c, isActive: c.userId === active }));
  },

  page() { return (Template.instance().state.get('result') || {}).page || 1; },
  totalPages() {
    const result = Template.instance().state.get('result') || {};
    return Math.max(1, Math.ceil((result.total || 0) / PAGE_SIZE));
  },
  hasPrev() { return ((Template.instance().state.get('result') || {}).page || 1) > 1; },
  hasNext() {
    const result = Template.instance().state.get('result') || {};
    return ((result.page || 1) * PAGE_SIZE) < (result.total || 0);
  },

  isRtl() {
    return document.dir === 'rtl' || document.documentElement.dir === 'rtl';
  },
});

Template.historyTable.events({
  'input .js-history-search'(event, instance) {
    instance.state.set('search', event.currentTarget.value);
    instance.state.set('page', 1);
  },
  'click .js-history-prev'(event, instance) {
    event.preventDefault();
    const page = instance.state.get('page') || 1;
    if (page > 1) instance.state.set('page', page - 1);
  },
  'click .js-history-next'(event, instance) {
    event.preventDefault();
    const result = instance.state.get('result') || {};
    if (((result.page || 1) * PAGE_SIZE) < (result.total || 0)) {
      instance.state.set('page', (instance.state.get('page') || 1) + 1);
    }
  },
  'click .js-history-all'(event, instance) {
    event.preventDefault();
    instance.state.set('userId', null);
    instance.state.set('page', 1);
  },
  // Clicking an avatar narrows the CURRENT scope to that person, rather than
  // replacing it — "that user's changes within this scope" (History.md §7a).
  'click .js-history-contributor'(event, instance) {
    event.preventDefault();
    instance.state.set('userId', event.currentTarget.dataset.userId || null);
    instance.state.set('page', 1);
  },
  // A click, not a change: the control is a .materialCheckBox div (WeKan hides
  // real checkboxes app-wide and draws its own), so it has no checked state of
  // its own to read - the selection here is the state, and `is-checked` is
  // rendered from it.
  'click .js-history-select'(event, instance) {
    event.preventDefault();
    const id = event.currentTarget.dataset.id;
    if (!id) return;
    const selected = [...(instance.state.get('selected') || [])];
    const at = selected.indexOf(id);
    if (at === -1) selected.push(id);
    else selected.splice(at, 1);
    instance.state.set('selected', selected);
  },
  'click .js-history-restore'(event, instance) {
    event.preventDefault();
    const selected = instance.state.get('selected') || [];
    if (selected.length === 0) return;
    Meteor.call('changeHistory.restore', selected, () => {
      instance.state.set('selected', []);
      instance.fetch();
    });
  },
});

// The popup wrapper: it only carries the scope through, so that a menu item is
// the whole cost of adding History to a new menu.
Template.historyPopup.helpers({
  scope() { return (Template.currentData() || {}).scope; },
  scopeId() { return (Template.currentData() || {}).scopeId; },
  group() { return (Template.currentData() || {}).group; },
  userId() { return (Template.currentData() || {}).userId; },
});
