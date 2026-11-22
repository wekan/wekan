// Workload page (docs/Features/Workload/Workload.md). It asks the server for a
// report (Meteor method workloadReport, server/workload.js) and draws it; the
// planning forms below the table write through the other workload* methods.
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { ReactiveDict } from 'meteor/reactive-dict';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
import { TAPi18n } from '/imports/i18n';
const { workloadCell, hoursLabel, isoWeekNumber } = require('/models/lib/workloadView');
const { weekStart, dayKey, ABSENCE_TYPES, parseSkills, skillsText } = require('/models/lib/workload');

// The page state, shared by the sidebar controls and the page itself.
const state = new ReactiveDict('workload');
state.setDefault({
  from: weekStart(dayKey(new Date())),
  weeks: 8,
  unit: 'hours',
  allBoards: false,
  reloadAt: 0,
});

const WEEK_CHOICES = [4, 8, 12, 26];

function t(key, options) {
  return TAPi18n.__(key, options);
}

function errorText(error) {
  if (!error) return '';
  return (error.reason || error.message || String(error));
}

function reload() {
  state.set('reloadAt', Date.now());
}

Template.workloadControls.helpers({
  fromDay: () => state.get('from'),
  weeks: () => state.get('weeks'),
  weekChoices: () => WEEK_CHOICES,
  unit: () => state.get('unit'),
  allBoards: () => state.get('allBoards'),
  reportIsAdmin: () => state.get('isAdmin') === true,
});

Template.workloadControls.events({
  'change .js-workload-from'(evt) {
    const value = evt.currentTarget.value;
    if (/^\d{4}-\d\d-\d\d$/.test(value)) state.set('from', weekStart(value));
  },
  'change .js-workload-weeks'(evt) {
    const value = parseInt(evt.currentTarget.value, 10);
    if (WEEK_CHOICES.includes(value)) state.set('weeks', value);
  },
  'change .js-workload-unit'(evt) {
    state.set('unit', evt.currentTarget.value === 'points' ? 'points' : 'hours');
  },
  'change .js-workload-all-boards'(evt) {
    state.set('allBoards', evt.currentTarget.checked === true);
  },
});

Template.workload.onCreated(function () {
  this.report = new ReactiveVar(null);
  this.loading = new ReactiveVar(true);
  this.error = new ReactiveVar('');
  this.open = new ReactiveVar(null); // { userId, week }
  this.autorun(() => {
    const params = {
      from: state.get('from'),
      weeks: state.get('weeks'),
      allBoards: state.get('allBoards') === true,
    };
    state.get('reloadAt');
    this.loading.set(true);
    Meteor.callAsync('workloadReport', params).then(report => {
      this.report.set(report);
      state.set('isAdmin', report && report.isAdmin === true);
      this.error.set('');
    }).catch(error => {
      this.error.set(errorText(error));
    }).finally(() => this.loading.set(false));
  });
});

function report() {
  return Template.instance().report.get();
}

function boardOf(boardId) {
  const r = report();
  return (r && r.boards || []).find(b => b._id === boardId);
}

function cardUrl(card) {
  const board = boardOf(card.boardId);
  return FlowRouter.path('card', { boardId: card.boardId, slug: (board && board.slug) || 'board', cardId: card.cardId });
}

Template.workload.helpers({
  // The spinner only until the first report: a refresh after a save keeps the
  // page, because the spinner replaces the planning form under it - which
  // lost its "saved" note and anything still typed there.
  loading() {
    const tpl = Template.instance();
    return tpl.loading.get() && !tpl.report.get();
  },
  error: () => Template.instance().error.get(),
  report: () => report(),
  truncated: () => !!(report() && report().truncated),
  people: () => (report() ? report().people : []),
  placeholders() {
    const r = report();
    if (!r) return [];
    return r.placeholders.map(p => ({ ...p, boardTitle: (boardOf(p.boardId) || {}).title || '' }));
  },
  weekHeaders() {
    const r = report();
    if (!r) return [];
    return r.weeks.map(day => ({ number: isoWeekNumber(day), label: day.slice(5).split('-').reverse().join('.') }));
  },
  columnCount() {
    const r = report();
    return r ? r.weeks.length + 2 : 2;
  },
  isNumber: value => typeof value === 'number',
  utilizationPercent: person => (typeof person.billablePercent === 'number' ? person.billablePercent : 0),
  candidatesLabel(holder) {
    const r = report();
    const names = new Map((r ? r.people : []).map(p => [p.userId, p.name || p.username || p.userId]));
    return holder.candidates.map(c => `${names.get(c.userId) || c.userId} (${c.level}, ${hoursLabel(c.freeHours, t('workload-hours-short'))})`).join(', ');
  },
  capacityLabel(person) {
    const c = person.capacity;
    return t('workload-capacity-label', { hours: c.hoursPerWeek, percent: c.workPercent });
  },
  hoursLabel(hours) {
    return hoursLabel(hours, t('workload-hours-short'));
  },
  cells(person) {
    const unit = state.get('unit');
    const words = { hours: t('workload-hours-short'), points: t('workload-points-short') };
    return person.weeks.map((week, index) => {
      const cell = workloadCell(week, unit, words);
      const parts = [cell.value];
      if (cell.percentLabel) parts.push(cell.percentLabel);
      if (week.overloaded) parts.push(t('workload-overloaded'));
      return { ...cell, index, title: parts.join(' · ') };
    });
  },
  isOpen(userId) {
    const open = Template.instance().open.get();
    return !!(open && open.userId === userId);
  },
  openCards() {
    const open = Template.instance().open.get();
    const person = open && (report() ? report().people : []).find(p => p.userId === open.userId);
    const week = person && person.weeks[open.week];
    if (!week) return [];
    const unit = state.get('unit');
    return week.cards.map(card => ({
      ...card,
      url: cardUrl(card),
      label: unit === 'points' ? `${card.points} ${t('workload-points-short')}` : hoursLabel(card.hours, t('workload-hours-short')),
    }));
  },
  hasUnassigned() {
    const r = report();
    return !!(r && (r.unassigned.unscheduledHours || r.unassigned.weeks.some(w => w.loadHours || w.loadPoints)));
  },
  unassignedCells() {
    const r = report();
    const unit = state.get('unit');
    if (!r) return [];
    return r.unassigned.weeks.map(w => ({
      value: unit === 'points' ? `${w.loadPoints} ${t('workload-points-short')}` : hoursLabel(w.loadHours, t('workload-hours-short')),
    }));
  },
  unassignedUnscheduled() {
    const r = report();
    return r && r.unassigned.unscheduledHours ? hoursLabel(r.unassigned.unscheduledHours, t('workload-hours-short')) : '';
  },
});

Template.workload.events({
  'click .js-workload-cell'(evt, tpl) {
    evt.preventDefault();
    const userId = evt.currentTarget.getAttribute('data-user');
    const week = parseInt(evt.currentTarget.getAttribute('data-week'), 10);
    const open = tpl.open.get();
    tpl.open.set(open && open.userId === userId && open.week === week ? null : { userId, week });
  },
});

// ---------------------------------------------------------------- planning

Template.workloadPlanning.onCreated(function () {
  this.mine = new ReactiveVar(null);
  this.saved = new ReactiveVar(false);
  this.error = new ReactiveVar('');
  this.allocationBoard = new ReactiveVar(null);
  this.loadMine = () => Meteor.callAsync('workloadMine').then(mine => this.mine.set(mine))
    .catch(error => this.error.set(errorText(error)));
  this.loadMine();
  this.done = promise => promise.then(() => {
    this.error.set('');
    this.loadMine();
    reload();
  }).catch(error => this.error.set(errorText(error)));
});

function mine() {
  return Template.instance().mine.get();
}

Template.workloadPlanning.helpers({
  capacity: () => (mine() ? mine().capacity : { hoursPerWeek: 37.5, workPercent: 100, workingDays: [1, 2, 3, 4, 5] }),
  skillsText: () => skillsText(mine() ? mine().capacity.skills : []),
  capacitySaved: () => Template.instance().saved.get(),
  weekdays() {
    const days = mine() ? mine().capacity.workingDays : [1, 2, 3, 4, 5];
    // 2024-01-01 was a Monday: the names come from the browser, in its language.
    const lang = TAPi18n.getLanguage ? TAPi18n.getLanguage() : undefined;
    return [1, 2, 3, 4, 5, 6, 7].map(value => {
      let label = String(value);
      try { label = new Date(Date.UTC(2024, 0, value)).toLocaleDateString(lang, { weekday: 'short', timeZone: 'UTC' }); } catch (e) { /* keep the number */ }
      return { value, label, checked: days.includes(value) };
    });
  },
  myAbsences: () => (mine() ? mine().absences : []),
  absenceTypes: () => ABSENCE_TYPES.map(value => ({ value, label: t(`workload-absence-${value}`) })),
  absenceTypeLabel: type => t(`workload-absence-${type}`),
  holidays: () => (mine() ? mine().holidays : []),
  isAdmin: () => !!(mine() && mine().isAdmin),
  managedBoards() {
    const r = Template.currentData().report;
    return r ? r.boards.filter(b => b.mayManage) : [];
  },
  allocations() {
    const r = Template.currentData().report;
    return r ? r.allocations : [];
  },
  allocationMembers() {
    const r = Template.currentData().report;
    if (!r) return [];
    const boards = r.boards.filter(b => b.mayManage);
    const chosen = Template.instance().allocationBoard.get();
    const board = boards.find(b => b._id === chosen) || boards[0];
    if (!board) return [];
    const names = new Map(r.people.map(p => [p.userId, p.name || p.username || p.userId]));
    return board.members.map(userId => ({ userId, name: names.get(userId) || userId }));
  },
  allocationWho(allocation) {
    if (allocation.userId) {
      const r = Template.currentData().report;
      const person = r && r.people.find(p => p.userId === allocation.userId);
      return person ? (person.name || person.username) : allocation.userId;
    }
    return `${allocation.roleName} × ${allocation.headcount}`;
  },
  planningError: () => Template.instance().error.get(),
});

function formValue(form, name) {
  const field = form.elements[name];
  return field ? String(field.value).trim() : '';
}

Template.workloadPlanning.events({
  'submit .js-workload-capacity'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const workingDays = [...form.querySelectorAll('input[name="workingDays"]:checked')].map(i => parseInt(i.value, 10));
    tpl.saved.set(false);
    const capacity = {
      hoursPerWeek: parseFloat(formValue(form, 'hoursPerWeek')),
      workPercent: parseFloat(formValue(form, 'workPercent')),
      workingDays,
      skills: parseSkills(formValue(form, 'skills')),
    };
    if (formValue(form, 'utilizationTarget')) capacity.utilizationTarget = parseFloat(formValue(form, 'utilizationTarget'));
    tpl.done(Meteor.callAsync('workloadSetCapacity', capacity).then(() => tpl.saved.set(true)));
  },
  'submit .js-workload-absence'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    tpl.done(Meteor.callAsync('workloadAddAbsence', {
      start: formValue(form, 'start'),
      end: formValue(form, 'end') || formValue(form, 'start'),
      type: formValue(form, 'type'),
      note: formValue(form, 'note'),
    }).then(() => form.reset()));
  },
  'click .js-workload-remove-absence'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('workloadRemoveAbsence', evt.currentTarget.getAttribute('data-id')));
  },
  'change .js-workload-allocation-board'(evt, tpl) {
    tpl.allocationBoard.set(evt.currentTarget.value);
  },
  'submit .js-workload-allocation'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    const userId = formValue(form, 'userId');
    const allocation = {
      start: formValue(form, 'start'),
      end: formValue(form, 'end'),
      percent: parseFloat(formValue(form, 'percent')),
    };
    if (userId) allocation.userId = userId;
    else {
      allocation.roleName = formValue(form, 'roleName');
      allocation.headcount = parseInt(formValue(form, 'headcount'), 10) || 1;
    }
    if (formValue(form, 'skill')) {
      allocation.skill = formValue(form, 'skill');
      allocation.skillLevel = parseInt(formValue(form, 'skillLevel'), 10) || 1;
    }
    tpl.done(Meteor.callAsync('workloadAddAllocation', formValue(form, 'boardId'), allocation));
  },
  'click .js-workload-remove-allocation'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('workloadRemoveAllocation', evt.currentTarget.getAttribute('data-id')));
  },
  'submit .js-workload-holiday'(evt, tpl) {
    evt.preventDefault();
    const form = evt.currentTarget;
    tpl.done(Meteor.callAsync('workloadAddHoliday', { date: formValue(form, 'date'), name: formValue(form, 'name') })
      .then(() => form.reset()));
  },
  'click .js-workload-remove-holiday'(evt, tpl) {
    evt.preventDefault();
    tpl.done(Meteor.callAsync('workloadRemoveHoliday', evt.currentTarget.getAttribute('data-id')));
  },
});
