import './scrumView.jade';
import './scrumView.css';
import './scrumDailyHistory';
import { invalidateScrumNames } from './scrumFields';
import { Template } from 'meteor/templating';
import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { ReactiveCache } from '/imports/reactiveCache';
const { DEFAULT_SCRUM_SETTINGS, getCardEstimate } = require('/models/lib/scrum');
const { sprintReport, velocityRows, reportChartGroups } = require('/models/lib/scrumReports');
const { compareScrumCards } = require('/models/lib/scrumCardOrder');
const current = () => Template.instance();
const data = () => current().dataState.get();
const selectedSprint = tpl => tpl.dataState.get()?.sprints.find(s => s._id === tpl.sprintId.get());
const selectedRelease = tpl => tpl.dataState.get()?.releases.find(r => r._id === tpl.releaseId.get());
const selectedEvent = tpl => tpl.dataState.get()?.events.find(e => e._id === tpl.eventId.get() && e.sprintId === tpl.sprintId.get());
const dateValue = value => value ? new Date(value).toISOString().slice(0, 10) : '';
const localDateTime = value => {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 23).replace(/:00\.000$/, '').replace(/\.000$/, '');
};
// Preserve the exact original instant (including ambiguous daylight-saving
// times) when an administrator edits notes without changing the date field.
const timestamp = (value, original) => !value ? null : value === localDateTime(original) ? original : new Date(value).toISOString();
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
  this.releaseId = new ReactiveVar(''); this.eventId = new ReactiveVar('');
  this.autorun(() => {
    Session.get('currentBoard'); Meteor.userId();
    this.dataState.set(null); this.sprintId.set('');
    this.releaseId.set(''); this.eventId.set('');
    void refresh(this);
  });
});
Template.scrumView.onDestroyed(function () { this.stopped = true; this.request += 1; });
Template.scrumView.helpers({
  accountabilityFields() {
    const settings = data()?.settings || DEFAULT_SCRUM_SETTINGS;
    const members = (Utils.getCurrentBoard()?.members || []).filter(member => member.isActive);
    return [['productOwnerId', 'scrum-product-owner'], ['scrumMasterId', 'scrum-master'], ['developerIds', 'scrum-developers']].map(([field, label]) => ({
      field, label: t(label), multiple: field === 'developerIds',
      options: members.map(member => {
        const user = ReactiveCache.getUser(member.userId);
        return { value: member.userId, label: user?.profile?.fullname || user?.username || member.userId,
          selected: field === 'developerIds' ? settings.developerIds.includes(member.userId) : settings[field] === member.userId };
      }),
    }));
  },
  workingDayOptions() {
    const selected = data()?.settings?.workingDays || DEFAULT_SCRUM_SETTINGS.workingDays;
    return ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((key, index) => ({ value: index + 1, label: t(key), selected: selected.includes(index + 1) }));
  },
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
  sprintNeedsCloseRecovery: () => selectedSprint(current())?.state === 'closed' && selectedSprint(current())?.rolloverPending,
  sprintActive: () => selectedSprint(current())?.state === 'active',
  sprintOpen: () => ['planned', 'active'].includes(selectedSprint(current())?.state),
  sprintStart: () => dateValue(selectedSprint(current())?.plannedStart),
  sprintEnd: () => dateValue(selectedSprint(current())?.plannedEnd),
  releases: () => (data()?.releases || []).map(r => ({ ...r, stateLabel: stateLabel(r.state), startLabel: dateValue(r.plannedStart), endLabel: dateValue(r.plannedEnd), releasedLabel: r.releasedAt ? new Date(r.releasedAt).toLocaleString() : '' })),
  selectedRelease: () => selectedRelease(current()),
  releaseOptions: () => (data()?.releases || []).map(r => ({ ...r, selected: r._id === current().releaseId.get() })),
  releaseStates: () => ['planned', 'released', 'cancelled'].map(value => ({ value, label: t(`scrum-state-${value}`), selected: value === (selectedRelease(current())?.state || 'planned') })),
  releaseStart: () => dateValue(selectedRelease(current())?.plannedStart),
  releaseEnd: () => dateValue(selectedRelease(current())?.plannedEnd),
  releaseDate: () => localDateTime(selectedRelease(current())?.releasedAt),
  selectedEvent: () => selectedEvent(current()),
  eventOptions: () => (data()?.events || []).filter(e => e.sprintId === current().sprintId.get()).map(e => ({ ...e, selected: e._id === current().eventId.get(), label: e.name || t(`scrum-event-${e.kind}`) })),
  eventStart: () => localDateTime(selectedEvent(current())?.startsAt),
  eventTimebox: () => selectedEvent(current())?.timeboxMinutes ?? 15,
  followUpCards: () => (data()?.cards || []).map(c => ({ ...c, selected: (selectedEvent(current())?.followUpCardIds || []).includes(c._id) })),
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
      .sort(compareScrumCards)
      .map(card => {
        const estimate = getCardEstimate(card, result.settings);
        return { ...card, estimateLabel: estimate === null ? t('scrum-unknown-estimate') : String(estimate),
          rankLabel: card.scrum?.backlogRank ?? '—',
          rankValue: card.scrum?.backlogRank ?? '',
          sprintName: result.sprints.find(s => s._id === card.scrum?.sprintId)?.name || t('scrum-product-backlog'),
          releaseName: result.releases.find(release => release._id === card.scrum?.releaseId)?.name || '—',
          cardReleaseOptions: result.releases.map(release => ({ ...release, selected: release._id === card.scrum?.releaseId })),
          cardUrl: FlowRouter.path('card', { boardId: board._id, slug: board.slug, cardId: card._id }),
          assignmentOptions: result.sprints.filter(s => ['planned', 'active'].includes(s.state)).map(s => ({ ...s, selected: s._id === card.scrum?.sprintId })) };
      });
  },
  events: () => (data()?.events || []).filter(e => e.sprintId === current().sprintId.get()).map(e => ({
    ...e, kindLabel: t(`scrum-event-${e.kind}`), dateLabel: new Date(e.startsAt).toLocaleString(),
    followUps: (data()?.cards || []).filter(c => (e.followUpCardIds || []).includes(c._id)).map(c => ({
      title: c.title, url: FlowRouter.path('card', { boardId: c.boardId, slug: Utils.getCurrentBoard()?.slug, cardId: c._id }),
    })),
  })),
  eventKinds: () => ['planning', 'daily', 'review', 'retrospective'].map(value => ({ value, label: t(`scrum-event-${value}`), selected: value === (selectedEvent(current())?.kind || 'planning') })),
});
Template.scrumReportTable.onCreated(function () { this.metric = new ReactiveVar('count'); });
Template.scrumReportTable.events({
  'change .js-scrum-chart-metric'(event, tpl) { tpl.metric.set(event.currentTarget.value); },
});
Template.scrumReportTable.helpers({
  workingDaysLabel() { return this.plannedWorkingDays ?? '—'; },
  chartGroups() {
    return reportChartGroups(Template.currentData().rows || [], current().metric.get(), Template.currentData().velocity)
      .map(group => ({ ...group, policyLabel: group.completionPolicy ? t(`scrum-policy-${group.completionPolicy}`) : '',
        sourceLabel: group.estimateSource ? t(`scrum-source-${group.estimateSource}`) : '',
        rows: group.rows.map(row => ({ ...row, series: row.series.map(series => ({ ...series, label: t(`scrum-${series.key}`) })) })),
      }));
  },
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
  'change .js-scrum-sprint'(event, tpl) { tpl.sprintId.set(event.currentTarget.value); tpl.eventId.set(''); },
  'change .js-scrum-release-select'(event, tpl) { tpl.releaseId.set(event.currentTarget.value); },
  'change .js-scrum-event-select'(event, tpl) { tpl.eventId.set(event.currentTarget.value); },
  'click .js-scrum-new'(event, tpl) { event.preventDefault(); tpl.sprintId.set(''); event.currentTarget.form.reset(); },
  async 'submit .js-scrum-settings'(event, tpl) {
    event.preventDefault(); const values = fields(event.currentTarget);
    const formData = new FormData(event.currentTarget);
    await mutate(tpl, 'scrum.configure', { enabled: values.enabled === 'on', productGoal: values.productGoal,
      definitionOfDone: values.definitionOfDone, estimateSource: values.estimateSource,
      estimateCustomFieldId: nullable(values.estimateCustomFieldId), estimateUnit: values.estimateUnit,
      completionPolicy: values.completionPolicy, productOwnerId: nullable(values.productOwnerId),
      scrumMasterId: nullable(values.scrumMasterId), developerIds: formData.getAll('developerIds'),
      workingDays: formData.getAll('workingDays').map(Number) }, tpl.dataState.get().settingsRevision);
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
  async 'click .js-scrum-resume-close'(event, tpl) {
    event.preventDefault(); const sprint = selectedSprint(tpl);
    if (sprint?.rolloverPending) await mutate(tpl, 'scrum.closeSprint', sprint._id,
      sprint.closedFromRevision, sprint.rolloverSprintId || null);
  },
  async 'click .js-scrum-cancel'(event, tpl) {
    event.preventDefault(); const sprint = selectedSprint(tpl);
    if (sprint && confirm(t('scrum-confirm-cancel'))) await mutate(tpl, 'scrum.cancelSprint', sprint._id, sprint.revision, tpl.find('.js-scrum-cancel-reason')?.value || '');
  },
  async 'submit .js-scrum-card'(event, tpl) {
    event.preventDefault(); const values = fields(event.currentTarget);
    const card = tpl.dataState.get()?.cards.find(c => c._id === event.currentTarget.dataset.cardId);
    if (card) await mutate(tpl, 'scrum.updateCard', card._id, { sprintId: nullable(values.sprintId), releaseId: nullable(values.releaseId), backlogRank: values.backlogRank === '' ? null : Number(values.backlogRank), issueType: values.issueType, acceptanceCriteria: values.acceptanceCriteria }, card.scrumRevision || 0);
  },
  async 'submit .js-scrum-release'(event, tpl) {
    event.preventDefault(); const form = event.currentTarget; const values = fields(form);
    const release = selectedRelease(tpl);
    if (await mutate(tpl, 'scrum.saveRelease', release?._id || null, {
      name: values.name, goal: values.goal, plannedStart: nullable(values.plannedStart),
      plannedEnd: nullable(values.plannedEnd), state: values.state, notes: values.notes,
      releasedAt: timestamp(values.releasedAt, release?.releasedAt),
    }, release?.revision ?? null)) { if (!release) form.reset(); }
  },
  async 'submit .js-scrum-event'(event, tpl) {
    event.preventDefault(); const form = event.currentTarget; const values = fields(form); const sprint = selectedSprint(tpl);
    const record = selectedEvent(tpl);
    if (sprint && await mutate(tpl, 'scrum.saveEvent', record?._id || null, {
      name: values.name, kind: values.kind, startsAt: timestamp(values.startsAt, record?.startsAt),
      timeboxMinutes: Number(values.timeboxMinutes), notes: values.notes, sprintId: sprint._id,
      followUpCardIds: new FormData(form).getAll('followUpCardIds'),
    }, record?.revision ?? null)) { if (!record) form.reset(); }
  },
});
