import './scrumView.jade';
import './scrumView.css';
import { invalidateScrumNames } from './scrumFields';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
const { DEFAULT_SCRUM_SETTINGS, getCardEstimate } = require('/models/lib/scrum');
const { sprintReport, velocityRows } = require('/models/lib/scrumReports');
const current = () => Template.instance();
const data = () => current().dataState.get();
const selectedSprint = tpl => tpl.dataState.get()?.sprints.find(s => s._id === tpl.sprintId.get());
const dateValue = value => value ? new Date(value).toISOString().slice(0, 10) : '';
const t = (key, params) => TAPi18n.__(key, params);
const stateLabel = state => t(`scrum-state-${state}`);
const nullable = value => value || null;
const fields = form => Object.fromEntries(new FormData(form));

async function refresh(tpl) {
  const boardId = Session.get('currentBoard');
  const request = ++tpl.request;
  tpl.loading.set(true);
  try {
    const result = await Meteor.callAsync('scrum.getBoardData', boardId);
    if (tpl.stopped || request !== tpl.request || boardId !== Session.get('currentBoard')) return;
    tpl.dataState.set(result); tpl.error.set('');
  } catch (error) {
    if (!tpl.stopped && request === tpl.request) tpl.error.set(error.reason || error.message);
  } finally { if (!tpl.stopped && request === tpl.request) tpl.loading.set(false); }
}
async function mutate(tpl, method, ...args) {
  if (tpl.busy.get()) return false;
  tpl.busy.set(true); tpl.error.set('');
  try {
    await Meteor.callAsync(method, Session.get('currentBoard'), ...args);
    invalidateScrumNames();
    if (!tpl.stopped) await refresh(tpl);
    return true;
  } catch (error) {
    if (!tpl.stopped) tpl.error.set(error.reason || error.message);
    return false;
  } finally { if (!tpl.stopped) tpl.busy.set(false); }
}
Template.scrumView.onCreated(function () {
  this.dataState = new ReactiveVar(null); this.loading = new ReactiveVar(true);
  this.error = new ReactiveVar(''); this.busy = new ReactiveVar(false);
  this.sprintId = new ReactiveVar(''); this.request = 0; this.stopped = false;
  this.autorun(() => {
    Session.get('currentBoard'); Meteor.userId();
    this.dataState.set(null); this.sprintId.set('');
    void refresh(this);
  });
});
Template.scrumView.onDestroyed(function () { this.stopped = true; this.request += 1; });
Template.scrumView.helpers({
  data, loading: () => current().loading.get(), error: () => current().error.get(),
  busy: () => current().busy.get(), canAdmin: () => data()?.canAdmin,
  boardColor: () => Utils.getCurrentBoard()?.colorClass(),
  viewTitle: () => t(Utils.boardView()),
  isSprints: () => Utils.boardView() === 'board-view-sprints',
  isVelocity: () => Utils.boardView() === 'board-view-velocity',
  isSprintReport: () => Utils.boardView() === 'board-view-sprint-report',
  isReport: () => ['board-view-velocity', 'board-view-sprint-report'].includes(Utils.boardView()),
  chartKey: () => Utils.boardView() === 'board-view-velocity' ? 'scrumVelocity' : 'scrumSprint',
  reportOptions: () => JSON.stringify({ sprintId: current().sprintId.get() }),
  settingsOpen: () => Boolean(Session.get('scrumOpenSettings')),
  settings: () => ({ ...DEFAULT_SCRUM_SETTINGS, ...data()?.settings }),
  estimateSources() {
    return ['poker', 'customField'].map(value => ({ value, label: t(`scrum-source-${value}`), selected: (data()?.settings?.estimateSource || 'poker') === value }));
  },
  estimateFields: () => (data()?.customFields || []).map(field => ({ ...field, selected: data()?.settings?.estimateCustomFieldId === field._id })),
  completionPolicies() {
    return ['dueComplete', 'doneLists'].map(value => ({ value, label: t(`scrum-policy-${value}`), selected: (data()?.settings?.completionPolicy || 'dueComplete') === value }));
  },
  selectedSprint() { const sprint = selectedSprint(current()); return sprint && { ...sprint, stateLabel: stateLabel(sprint.state) }; },
  sprintOptions: () => (data()?.sprints || []).map(s => ({ ...s, selected: current().sprintId.get() === s._id, stateLabel: stateLabel(s.state) })),
  rolloverOptions: () => (data()?.sprints || []).filter(s => s.state === 'planned' && s._id !== current().sprintId.get()),
  sprintPlanned: () => selectedSprint(current())?.state === 'planned',
  sprintActive: () => selectedSprint(current())?.state === 'active',
  sprintOpen: () => ['planned', 'active'].includes(selectedSprint(current())?.state),
  sprintStart: () => dateValue(selectedSprint(current())?.plannedStart),
  sprintEnd: () => dateValue(selectedSprint(current())?.plannedEnd),
  releases: () => data()?.releases || [],
  velocity: () => velocityRows(data()?.sprints || []),
  sprintReportRows() {
    const sprint = selectedSprint(current());
    return sprint?.closeSnapshot ? [sprintReport(sprint)] : [];
  },
  cards() {
    const board = Utils.getCurrentBoard(); const result = data();
    if (!result || !board) return [];
    const sprintId = current().sprintId.get();
    const isSprints = Utils.boardView() === 'board-view-sprints';
    return result.cards.filter(card => !card.archived && (isSprints && sprintId ? card.scrum?.sprintId === sprintId : !card.scrum?.sprintId))
      .sort((a, b) => (a.scrum?.backlogRank ?? a.sort ?? 0) - (b.scrum?.backlogRank ?? b.sort ?? 0))
      .map(card => {
        const estimate = getCardEstimate(card, result.settings);
        return { ...card, estimateLabel: estimate === null ? t('scrum-unknown-estimate') : String(estimate),
          rankLabel: card.scrum?.backlogRank ?? card.sort ?? 0,
          sprintName: result.sprints.find(s => s._id === card.scrum?.sprintId)?.name || t('scrum-product-backlog'),
          cardUrl: FlowRouter.path('card', { boardId: board._id, slug: board.slug, cardId: card._id }),
          assignmentOptions: result.sprints.filter(s => ['planned', 'active'].includes(s.state)).map(s => ({ ...s, selected: s._id === card.scrum?.sprintId })) };
      });
  },
  events: () => (data()?.events || []).filter(e => e.sprintId === current().sprintId.get()).map(e => ({ ...e, kindLabel: t(`scrum-event-${e.kind}`), dateLabel: dateValue(e.startsAt) })),
  eventKinds: () => ['planning', 'daily', 'review', 'retrospective'].map(value => ({ value, label: t(`scrum-event-${value}`) })),
});
Template.scrumReportTable.helpers({
  formatTotal(value) { return value ? t('scrum-total', { count: value.count, estimate: value.estimate, unknown: value.unknown }) : ''; },
});
Template.scrumView.events({
  'click .js-scrum-history'(event) {
    event.preventDefault();
    Popup.open('history', { titleKey: 'history' })(event, {
      dataContextIfCurrentDataIsUndefined: { scope: 'board', scopeId: Session.get('currentBoard'), group: 'scrum' },
    });
  },
  'click .js-scrum-refresh'(event, tpl) { event.preventDefault(); void refresh(tpl); },
  'change .js-scrum-sprint'(event, tpl) { tpl.sprintId.set(event.currentTarget.value); },
  'click .js-scrum-new'(event, tpl) { event.preventDefault(); tpl.sprintId.set(''); event.currentTarget.form.reset(); },
  async 'submit .js-scrum-settings'(event, tpl) {
    event.preventDefault(); const values = fields(event.currentTarget);
    await mutate(tpl, 'scrum.configure', { enabled: values.enabled === 'on', productGoal: values.productGoal,
      definitionOfDone: values.definitionOfDone, estimateSource: values.estimateSource,
      estimateCustomFieldId: nullable(values.estimateCustomFieldId), estimateUnit: values.estimateUnit,
      completionPolicy: values.completionPolicy }, tpl.dataState.get().settingsRevision);
  },
  async 'submit .js-scrum-sprint-form'(event, tpl) {
    event.preventDefault(); const values = fields(event.currentTarget); const sprint = selectedSprint(tpl);
    await mutate(tpl, 'scrum.saveSprint', sprint?._id || null, { name: values.name, goal: values.goal,
      plannedStart: nullable(values.plannedStart), plannedEnd: nullable(values.plannedEnd),
      capacity: values.capacity === '' ? null : Number(values.capacity), capacityUnit: values.capacityUnit }, sprint?.revision ?? null);
  },
  async 'click .js-scrum-start'(event, tpl) {
    event.preventDefault(); const sprint = selectedSprint(tpl);
    if (sprint) await mutate(tpl, 'scrum.startSprint', sprint._id, sprint.revision);
  },
  async 'click .js-scrum-close'(event, tpl) {
    event.preventDefault(); const sprint = selectedSprint(tpl);
    if (sprint && confirm(t('scrum-confirm-close'))) await mutate(tpl, 'scrum.closeSprint', sprint._id, sprint.revision, nullable(tpl.find('.js-scrum-rollover')?.value));
  },
  async 'click .js-scrum-cancel'(event, tpl) {
    event.preventDefault(); const sprint = selectedSprint(tpl);
    if (sprint && confirm(t('scrum-confirm-cancel'))) await mutate(tpl, 'scrum.cancelSprint', sprint._id, sprint.revision, tpl.find('.js-scrum-cancel-reason')?.value || '');
  },
  async 'submit .js-scrum-card'(event, tpl) {
    event.preventDefault(); const values = fields(event.currentTarget);
    const card = tpl.dataState.get()?.cards.find(c => c._id === event.currentTarget.dataset.cardId);
    if (card) await mutate(tpl, 'scrum.updateCard', card._id, { sprintId: nullable(values.sprintId), backlogRank: Number(values.backlogRank), issueType: values.issueType, acceptanceCriteria: values.acceptanceCriteria }, card.scrumRevision || 0);
  },
  async 'submit .js-scrum-release'(event, tpl) {
    event.preventDefault(); const form = event.currentTarget; const values = fields(form);
    if (await mutate(tpl, 'scrum.saveRelease', null, { name: values.name, goal: values.goal, plannedEnd: nullable(values.plannedEnd), state: 'planned' }, null)) form.reset();
  },
  async 'submit .js-scrum-event'(event, tpl) {
    event.preventDefault(); const form = event.currentTarget; const values = fields(form); const sprint = selectedSprint(tpl);
    if (sprint && await mutate(tpl, 'scrum.saveEvent', null, { name: values.name, kind: values.kind, startsAt: values.startsAt, timeboxMinutes: Number(values.timeboxMinutes), notes: values.notes, sprintId: sprint._id, followUpCardIds: [] }, null)) form.reset();
  },
});
