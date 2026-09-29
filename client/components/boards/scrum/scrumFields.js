import './scrumFields.jade';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
const definitions = {
  card: [['Sprint', 'sprintId', 'scrum-sprint'], ['PastSprints', 'pastSprintIds', 'scrum-past-sprints'], ['Release', 'releaseId', 'scrum-release'], ['IssueType', 'issueType', 'scrum-issue-type'], ['AcceptanceCriteria', 'acceptanceCriteria', 'scrum-acceptance-criteria'], ['BacklogRank', 'backlogRank', 'scrum-backlog-rank']],
  // The issue type is not a Scrum minicard field any more: the minicard shows
  // it as a badge with an icon on every board (models/lib/issueTypeIcon.js).
  minicard: [['Sprint', 'sprintId', 'scrum-sprint'], ['Release', 'releaseId', 'scrum-release'], ['BacklogRank', 'backlogRank', 'scrum-backlog-rank']],
  list: [['Category', 'category', 'scrum-list-category']],
  swimlane: [['Sprint', 'sprintId', 'scrum-sprint'], ['Release', 'releaseId', 'scrum-release'], ['Purpose', 'purpose', 'scrum-swimlane-purpose']],
};
import { TAPi18n } from '/imports/i18n';
const t = key => TAPi18n.__(key);
const names = new ReactiveVar({});
const requestTimes = new Map();
let generation = 0;
export function invalidateScrumNames() { generation += 1; requestTimes.clear(); names.set({}); }
Meteor.startup(() => Tracker.autorun(() => {
  Meteor.userId(); Session.get('currentBoard');
  invalidateScrumNames();
}));
function loadNames(board) {
  const key = JSON.stringify([board._id, Meteor.userId(), board.members, board.scrumRevision]);
  if (Date.now() - (requestTimes.get(key) || 0) < 30000) return;
  requestTimes.set(key, Date.now());
  const requestedGeneration = generation;
  Meteor.call('scrum.getBoardData', board._id, (error, result) => {
    if (requestedGeneration !== generation || error) return;
    // Only retain names and editability here, not whole historical snapshots.
    const state = { key, canWrite: result.canWrite,
      sprints: result.sprints.map(({ _id, name, state }) => ({ _id, name, state })),
      releases: result.releases.map(({ _id, name }) => ({ _id, name })),
      cards: result.cards.map(({ _id, canWrite }) => ({ _id, canWrite })) };
    names.set({ ...names.get(), [key]: state });
  });
}
const boardFor = context => ReactiveCache.getBoard(context?.record?.boardId || Session.get('currentBoard'));
function visibleFields(context) {
  const board = boardFor(context);
  return (definitions[context?.kind] || []).filter(([suffix]) => board?.scrum?.visibility?.[`${context.kind}${suffix}`] === true);
}
Template.scrumFieldSettings.onCreated(function () { this.error = new ReactiveVar(''); this.busy = new ReactiveVar(false); });
Template.scrumFieldSettings.helpers({
  canAdmin: () => ReactiveCache.getCurrentUser()?.isBoardAdmin(),
  error: () => Template.instance().error.get(), busy: () => Template.instance().busy.get(),
  fields() {
    const context = Template.currentData(); const board = boardFor(context);
    return (definitions[context.kind] || []).map(([suffix, field, label]) => ({ key: `${context.kind}${suffix}`, label: t(label), checked: board?.scrum?.visibility?.[`${context.kind}${suffix}`] === true }));
  },
});
Template.scrumFieldSettings.events({
  async 'change .js-scrum-visibility'(event, tpl) {
    const board = boardFor(Template.currentData()); const input = event.currentTarget;
    tpl.busy.set(true); tpl.error.set('');
    try {
      await Meteor.callAsync('scrum.configure', board._id, { visibility: { [input.dataset.key]: input.checked } }, board.scrumRevision || 0);
      invalidateScrumNames();
    } catch (error) { tpl.error.set(error.reason || error.message); input.checked = !input.checked; }
    finally { tpl.busy.set(false); }
  },
});
Template.scrumMetadata.onCreated(function () {
  this.error = new ReactiveVar(''); this.busy = new ReactiveVar(false);
  this.autorun(() => {
    names.get();
    const context = Template.currentData(); const board = boardFor(context);
    if (board && visibleFields(context).length) loadNames(board);
  });
});
function safeNames(context) {
  const board = boardFor(context); const values = names.get();
  const key = board && JSON.stringify([board._id, Meteor.userId(), board.members, board.scrumRevision]);
  return values[key] || null;
}
function fieldRows(context, editing = false) {
  const state = safeNames(context); const metadata = context.record?.scrum || {};
  return visibleFields(context).filter(([, field]) => !editing || field !== 'pastSprintIds').map(([, field, label]) => {
    const raw = metadata[field]; let value = raw ?? '';
    let options;
    if (['sprintId', 'releaseId', 'pastSprintIds'].includes(field)) {
      const records = field === 'releaseId' ? state?.releases : state?.sprints;
      value = field === 'pastSprintIds' ? (raw || []).map(id => records?.find(row => row._id === id)?.name || '').filter(Boolean).join(', ') : records?.find(row => row._id === raw)?.name || '';
      options = [{ value: '', label: '—', selected: !raw }, ...(records || []).filter(row => field === 'releaseId' || ['planned', 'active'].includes(row.state) || row._id === raw).map(row => ({ value: row._id, label: row.name, selected: row._id === raw }))];
    } else if (field === 'category') {
      value = raw ? t(`scrum-category-${raw}`) : '';
      options = ['backlog', 'todo', 'doing', 'done'].map(category => ({ value: category, label: t(`scrum-category-${category}`), selected: raw === category }));
    }
    return { field, label: t(label), value, options, number: field === 'backlogRank' };
  });
}
Template.scrumMetadata.helpers({
  visible: () => visibleFields(Template.currentData()).length > 0,
  compact: () => Template.currentData().kind === 'minicard',
  rows: () => fieldRows(Template.currentData()), editors: () => fieldRows(Template.currentData(), true),
  error: () => Template.instance().error.get(), busy: () => Template.instance().busy.get(),
  canWrite() {
    const context = Template.currentData(); const state = safeNames(context);
    return context.kind === 'card' ? state?.cards.find(c => c._id === context.record?._id)?.canWrite : state?.canWrite;
  },
});
Template.scrumMetadata.events({
  'click .scrum-metadata'(event) { event.stopPropagation(); },
  async 'submit .js-scrum-metadata'(event, tpl) {
    event.preventDefault(); event.stopPropagation();
    const context = Template.currentData(); const record = context.record;
    const metadata = Object.fromEntries(new FormData(event.currentTarget));
    for (const key of ['sprintId', 'releaseId']) if (key in metadata) metadata[key] = metadata[key] || null;
    if ('backlogRank' in metadata) metadata.backlogRank = metadata.backlogRank === '' ? null : Number(metadata.backlogRank);
    const method = { card: 'Card', list: 'List', swimlane: 'Swimlane' }[context.kind];
    if (!method || tpl.busy.get()) return;
    tpl.busy.set(true); tpl.error.set('');
    try {
      await Meteor.callAsync(`scrum.update${method}`, record.boardId, record._id, metadata, record.scrumRevision || 0);
      invalidateScrumNames(); loadNames(boardFor(context));
    } catch (error) { tpl.error.set(error.reason || error.message); }
    finally { tpl.busy.set(false); }
  },
});
