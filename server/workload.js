// Workload and capacity planning (docs/Features/Workload/Workload.md).
//
// The page asks for a REPORT - computed here by models/lib/workload.js - rather
// than subscribing to cards: a report over every board of a team would
// otherwise publish all of their cards. The rest are the writes the page makes,
// each with its own rule of who may make it:
//
//   capacity, absences   a person's own; an administrator's for anyone
//   public holidays      administrators
//   allocations          the board's admins (and administrators), for people
//                        who are active members of that board, or for a role
//
// Whose work a report shows: the active members of the boards the viewer is an
// active, non-assigned-only member of - the people they already work with -
// counting only the cards of those boards. Public boards are not included: a
// stranger's workload is not public because one of their boards is. An
// administrator may ask for every board.
//
// Absences of others are reported as dates only. Whether somebody is sick, and
// what they wrote about it, is theirs and the administrators' to see.
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import Cards from '/models/cards';
import TimeEntries from '/models/timeEntries';
import {
  WorkloadCapacities, WorkloadAbsences, WorkloadHolidays, WorkloadAllocations,
} from '/models/workload';
const {
  computeWorkload, normalizeCapacity, normalizeAbsence, normalizeHoliday, normalizeAllocation, capacityOf,
  parseDay, addDays, dayKey, weekStart, MAX_WEEKS,
} = require('/models/lib/workload');
const { DEFAULT_SCRUM_SETTINGS, getCardEstimate } = require('/models/lib/scrum');
const { isAssignedOnlyMember } = require('/models/lib/boardCardScope');
import { featureOnFor } from '/server/lib/assistGate';

const MAX_BOARDS = 500;
const MAX_PEOPLE = 500;
const MAX_CARDS = 20000;
const MAX_TIME_ENTRIES = 100000;

function denied() {
  throw new Meteor.Error('not-authorized', 'You may not do that');
}

// Every method: signed in, and the Workload feature on for this user (Admin
// Panel / Settings / Visibility / Features). Returns the user id.
async function signedIn(userId) {
  if (!userId) denied();
  if (!(await featureOnFor(userId, 'workload'))) throw new Meteor.Error('feature-disabled', 'Workload is turned off');
  return userId;
}

function invalid(error) {
  throw new Meteor.Error('invalid-input', (error && error.message) || 'Invalid input');
}

function validated(fn) {
  try { return fn(); } catch (e) { return invalid(e); }
}

async function siteAdmin(userId) {
  if (!userId) return false;
  const user = await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1 } });
  return !!(user && user.isAdmin === true && user.loginDisabled !== true);
}

function activeMember(board, userId) {
  return (board.members || []).some(m => m && m.userId === userId && m.isActive !== false);
}

function boardAdmin(board, userId) {
  return (board.members || []).some(m => m && m.userId === userId && m.isActive !== false && m.isAdmin === true);
}

// The boards a report may read, for this viewer.
async function reportBoards(userId, { allBoards, boardIds }, isAdmin) {
  const selector = { archived: { $ne: true }, type: { $nin: ['template-container'] } };
  if (!(allBoards && isAdmin)) selector.members = { $elemMatch: { userId, isActive: true } };
  if (boardIds && boardIds.length) selector._id = { $in: boardIds };
  const boards = await Boards.find(selector, {
    fields: { _id: 1, title: 1, slug: 1, members: 1, scrum: 1, archived: 1, type: 1 },
    limit: MAX_BOARDS,
  }).fetchAsync();
  // On a board where the viewer may only see the cards assigned to them, the
  // board's load is not theirs to see.
  return boards.filter(board => (allBoards && isAdmin) || !isAssignedOnlyMember(board, userId));
}

function pointsUnit(settings) {
  return String(settings.estimateUnit || 'points');
}

function isHoursUnit(unit) {
  return /^(h|hr|hrs|hour|hours|tunti|tuntia|tunnit|stunden|heures|horas|ore)$/i.test(String(unit).trim());
}

function displayName(user) {
  if (!user) return '';
  return (user.profile && user.profile.fullname) || user.username || '';
}

Meteor.methods({
  async workloadReport(params) {
    check(params, {
      from: String,
      weeks: Match.Integer,
      boardIds: Match.Optional([String]),
      userIds: Match.Optional([String]),
      allBoards: Match.Optional(Boolean),
    });
    const userId = await signedIn(this.userId);
    if (params.weeks < 1 || params.weeks > MAX_WEEKS) invalid(new Error(`Weeks must be between 1 and ${MAX_WEEKS}`));
    if ((params.boardIds || []).length > MAX_BOARDS || (params.userIds || []).length > MAX_PEOPLE) invalid(new Error('Too many'));
    // The report starts on the Monday of the day asked for, as computeWorkload does.
    const from = weekStart(validated(() => parseDay(params.from)));
    const isAdmin = await siteAdmin(userId);
    const boards = await reportBoards(userId, params, isAdmin);

    // People: the active members of those boards, or the ones asked for of them.
    const peopleIds = new Set();
    for (const board of boards) {
      for (const m of board.members || []) if (m && m.userId && m.isActive !== false) peopleIds.add(m.userId);
    }
    let ids = [...peopleIds];
    if (params.userIds && params.userIds.length) ids = ids.filter(id => params.userIds.includes(id));
    const truncatedPeople = ids.length > MAX_PEOPLE;
    ids = ids.slice(0, MAX_PEOPLE);

    const to = addDays(from, params.weeks * 7 - 1);
    const boardIds = boards.map(b => b._id);
    const users = await Meteor.users.find({ _id: { $in: ids } },
      { fields: { username: 1, 'profile.fullname': 1, 'profile.initials': 1, 'profile.avatarUrl': 1 } }).fetchAsync();
    const capacities = await WorkloadCapacities.find({ userId: { $in: ids } }).fetchAsync();
    const absences = await WorkloadAbsences.find({ userId: { $in: ids }, end: { $gte: from }, start: { $lte: to } }).fetchAsync();
    const holidays = await WorkloadHolidays.find({ date: { $gte: from, $lte: to } }).fetchAsync();
    const allocations = await WorkloadAllocations.find({ boardId: { $in: boardIds }, end: { $gte: from }, start: { $lte: to } }).fetchAsync();

    const cardScope = { boardId: { $in: boardIds }, archived: false, type: 'cardType-card', dueComplete: { $ne: true } };
    const cardOptions = {
      fields: {
        _id: 1, boardId: 1, title: 1, assignees: 1, members: 1, startAt: 1, receivedAt: 1, dueAt: 1, endAt: 1,
        dueComplete: 1, archived: 1, estimatedHours: 1, spentTime: 1, poker: 1, customFields: 1,
      },
      limit: MAX_CARDS + 1,
    };
    // The cards the report's people carry, and the ones nobody carries yet.
    const carried = await Cards.find({ ...cardScope, $or: [{ assignees: { $in: ids } }, { members: { $in: ids } }] }, cardOptions).fetchAsync();
    const unassigned = await Cards.find({ ...cardScope, 'assignees.0': { $exists: false }, 'members.0': { $exists: false } }, cardOptions).fetchAsync();
    const cards = [...carried, ...unassigned];
    const truncatedCards = carried.length > MAX_CARDS || unassigned.length > MAX_CARDS;

    const settingsByBoard = new Map(boards.map(b => [b._id, { ...DEFAULT_SCRUM_SETTINGS, ...(b.scrum || {}) }]));
    const units = new Set();
    const inputCards = cards.slice(0, MAX_CARDS).map(card => {
      const settings = settingsByBoard.get(card.boardId);
      let points = null;
      let estimatedHours = card.estimatedHours;
      if (settings && settings.enabled) {
        const estimate = getCardEstimate(card, settings);
        if (estimate !== null) {
          if (isHoursUnit(pointsUnit(settings))) {
            if (typeof estimatedHours !== 'number') estimatedHours = estimate;
          } else {
            points = estimate;
            units.add(pointsUnit(settings));
          }
        }
      }
      return { ...card, estimatedHours, points, customFields: undefined, poker: undefined };
    });

    // The time logged in the weeks, on these boards, for utilization; billable
    // unless its card is marked not billable.
    const logged = await TimeEntries.find({ boardId: { $in: boardIds }, userId: { $in: ids }, date: { $gte: from, $lte: to } },
      { fields: { userId: 1, cardId: 1, date: 1, hours: 1 }, limit: MAX_TIME_ENTRIES }).fetchAsync();
    const notBillable = new Set((await Cards.find({ _id: { $in: [...new Set(logged.map(e => e.cardId))] }, billable: false },
      { fields: { _id: 1 } }).fetchAsync()).map(c => c._id));
    const timeEntries = logged.map(e => ({ userId: e.userId, date: e.date, hours: e.hours, billable: !notBillable.has(e.cardId) }));

    const report = validated(() => computeWorkload({
      from,
      weeks: params.weeks,
      today: dayKey(new Date()),
      people: ids.map(id => ({ userId: id, capacity: capacities.find(c => c.userId === id) })),
      cards: inputCards,
      absences,
      holidays,
      allocations,
      timeEntries,
    }));

    const byId = new Map(users.map(u => [u._id, u]));
    const boardTitles = new Map(boards.map(b => [b._id, b.title || '']));
    const mayManage = new Set(boards.filter(b => isAdmin || boardAdmin(b, userId)).map(b => b._id));
    return {
      ...report,
      people: report.people.map(p => ({ ...p, name: displayName(byId.get(p.userId)), username: (byId.get(p.userId) || {}).username || '' })),
      boards: boards.map(b => ({
        _id: b._id, title: b.title || '', slug: b.slug || 'board', mayManage: mayManage.has(b._id),
        // The members an allocation may name, for the boards the viewer manages.
        members: mayManage.has(b._id) ? (b.members || []).filter(m => m && m.isActive !== false).map(m => m.userId) : [],
      })),
      allocations: allocations.map(a => ({
        _id: a._id, boardId: a.boardId, boardTitle: boardTitles.get(a.boardId) || '', userId: a.userId || null,
        roleName: a.roleName || '', start: a.start, end: a.end, percent: a.percent, headcount: a.headcount || 1,
        skill: a.skill || '', skillLevel: a.skillLevel || 1, mayRemove: mayManage.has(a.boardId),
      })),
      // Dates only, unless the absence is the viewer's own or the viewer is an administrator.
      absences: absences.map(a => (a.userId === userId || isAdmin
        ? { _id: a._id, userId: a.userId, start: a.start, end: a.end, type: a.type, note: a.note || '' }
        : { userId: a.userId, start: a.start, end: a.end })),
      holidays: holidays.map(h => ({ date: h.date, name: h.name || '' })),
      pointUnits: [...units],
      truncated: truncatedPeople || truncatedCards,
      isAdmin,
    };
  },

  // The viewer's own planning data: capacity, absences and the holidays.
  async workloadMine() {
    const userId = await signedIn(this.userId);
    const capacity = await WorkloadCapacities.findOneAsync({ userId });
    const today = dayKey(new Date());
    return {
      capacity: capacityOf(capacity),
      absences: (await WorkloadAbsences.find({ userId, end: { $gte: today } }, { sort: { start: 1 }, limit: 200 }).fetchAsync())
        .map(a => ({ _id: a._id, start: a.start, end: a.end, type: a.type, note: a.note || '' })),
      holidays: (await WorkloadHolidays.find({ date: { $gte: addDays(today, -366) } }, { sort: { date: 1 }, limit: 400 }).fetchAsync())
        .map(h => ({ _id: h._id, date: h.date, name: h.name || '' })),
      isAdmin: await siteAdmin(userId),
    };
  },

  async workloadSetCapacity(capacity, forUserId) {
    check(capacity, Object);
    check(forUserId, Match.Optional(String));
    const userId = await signedIn(this.userId);
    const target = forUserId || userId;
    if (target !== userId && !(await siteAdmin(userId))) denied();
    const value = validated(() => normalizeCapacity(capacity));
    const { utilizationTarget, ...rest } = value;
    const modifier = { $set: { userId: target, ...rest } };
    // No target is no field: the schema stores a number or nothing.
    if (utilizationTarget === null) modifier.$unset = { utilizationTarget: '' };
    else modifier.$set.utilizationTarget = utilizationTarget;
    await WorkloadCapacities.upsertAsync({ userId: target }, modifier);
    return value;
  },

  async workloadAddAbsence(absence, forUserId) {
    check(absence, Object);
    check(forUserId, Match.Optional(String));
    const userId = await signedIn(this.userId);
    const target = forUserId || userId;
    if (target !== userId && !(await siteAdmin(userId))) denied();
    const value = validated(() => normalizeAbsence(absence));
    if (await WorkloadAbsences.find({ userId: target }).countAsync() >= 1000) invalid(new Error('Too many absences'));
    return await WorkloadAbsences.insertAsync({ userId: target, ...value, createdBy: userId });
  },

  async workloadRemoveAbsence(absenceId) {
    check(absenceId, String);
    const userId = await signedIn(this.userId);
    const absence = await WorkloadAbsences.findOneAsync(absenceId);
    if (!absence) return false;
    if (absence.userId !== userId && !(await siteAdmin(userId))) denied();
    await WorkloadAbsences.removeAsync(absenceId);
    return true;
  },

  async workloadAddHoliday(holiday) {
    check(holiday, Object);
    await signedIn(this.userId);
    if (!(await siteAdmin(this.userId))) denied();
    const value = validated(() => normalizeHoliday(holiday));
    if (await WorkloadHolidays.findOneAsync({ date: value.date })) invalid(new Error('That day is already a holiday'));
    return await WorkloadHolidays.insertAsync({ ...value, createdBy: this.userId });
  },

  async workloadRemoveHoliday(holidayId) {
    check(holidayId, String);
    await signedIn(this.userId);
    if (!(await siteAdmin(this.userId))) denied();
    await WorkloadHolidays.removeAsync(holidayId);
    return true;
  },

  async workloadAddAllocation(boardId, allocation) {
    check(boardId, String);
    check(allocation, Object);
    const userId = await signedIn(this.userId);
    const board = await Boards.findOneAsync(boardId, { fields: { members: 1, archived: 1 } });
    if (!board || !(boardAdmin(board, userId) || await siteAdmin(userId))) denied();
    const value = validated(() => normalizeAllocation(allocation));
    // A named person must be one of the board's active members.
    if (value.userId && !activeMember(board, value.userId)) invalid(new Error('That person is not a member of this board'));
    if (await WorkloadAllocations.find({ boardId }).countAsync() >= 1000) invalid(new Error('Too many allocations'));
    return await WorkloadAllocations.insertAsync({ boardId, ...value, userId: value.userId || undefined, createdBy: userId });
  },

  async workloadRemoveAllocation(allocationId) {
    check(allocationId, String);
    const userId = await signedIn(this.userId);
    const allocation = await WorkloadAllocations.findOneAsync(allocationId);
    if (!allocation) return false;
    const board = await Boards.findOneAsync(allocation.boardId, { fields: { members: 1 } });
    if (!(board && boardAdmin(board, userId)) && !(await siteAdmin(userId))) denied();
    await WorkloadAllocations.removeAsync(allocationId);
    return true;
  },
});

// A report reads many cards: a few a minute per connection is plenty.
DDPRateLimiter.addRule({ type: 'method', name: 'workloadReport', connectionId() { return true; } }, 20, 60000);

// A deleted user's working time, absences and allocations go with them
// (models/lib/userDeletionCleanup.js is the rest of that cleanup).
async function removeWorkloadOf(userId) {
  if (typeof userId !== 'string' || !userId) return;
  await WorkloadCapacities.removeAsync({ userId });
  await WorkloadAbsences.removeAsync({ userId });
  await WorkloadAllocations.removeAsync({ userId });
}
if (Meteor.users.after && typeof Meteor.users.after.remove === 'function') {
  Meteor.users.after.remove(async (currentUserId, doc) => {
    try { await removeWorkloadOf(doc && doc._id); } catch (e) {
      console.error('[workload] Failed to remove the workload of a deleted user', doc && doc._id, e);
    }
  });
}

Meteor.startup(async () => {
  const { ensureIndex } = require('/server/lib/mongoStartup');
  await ensureIndex(WorkloadCapacities, { userId: 1 }, { unique: true });
  await ensureIndex(WorkloadAbsences, { userId: 1, end: 1 });
  await ensureIndex(WorkloadHolidays, { date: 1 });
  await ensureIndex(WorkloadAllocations, { boardId: 1, end: 1 });
});
