'use strict';

const MY_WORK_FILTERS = [
  'all',
  'overdue',
  'today',
  'upcoming',
  'assigned',
  'watching',
];

function validDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function nullableDate(value) {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return validDate(date) ? date : undefined;
}

function normalizeChecklistWorkMetadata(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'invalid-payload' };
  }

  const rawAssignee = payload.assigneeId;
  const assigneeId = rawAssignee === null || rawAssignee === undefined
    ? null
    : typeof rawAssignee === 'string'
      ? rawAssignee.trim() || null
      : undefined;
  const dueAt = nullableDate(payload.dueAt);
  const remindAt = nullableDate(payload.remindAt);

  if (assigneeId === undefined || dueAt === undefined || remindAt === undefined) {
    return { error: 'invalid-payload' };
  }
  if (remindAt && !dueAt) return { error: 'reminder-requires-due-date' };
  if (remindAt && dueAt && remindAt.getTime() > dueAt.getTime()) {
    return { error: 'reminder-after-due-date' };
  }

  return { value: { assigneeId, dueAt, remindAt } };
}

function startOfDay(value) {
  const date = validDate(value) ? new Date(value) : new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function myWorkDueBucket(value, now = new Date()) {
  const dueAt = nullableDate(value);
  if (!dueAt) return 'none';
  const today = startOfDay(now);
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  if (dueAt.getTime() < today.getTime()) return 'overdue';
  if (dueAt.getTime() < tomorrow.getTime()) return 'today';
  return 'upcoming';
}

function normalizeMyWorkFilter(value) {
  return MY_WORK_FILTERS.includes(value) ? value : 'all';
}

function isAssignedTo(entry, userId) {
  if (!entry || !userId) return false;
  if (entry.assigneeId === userId) return true;
  return Array.isArray(entry.assignees) && entry.assignees.includes(userId);
}

function isWatchedBy(entry, userId) {
  return Boolean(
    entry && userId && Array.isArray(entry.watchers) && entry.watchers.includes(userId),
  );
}

function matchesMyWorkFilter(entry, filter, userId, now = new Date()) {
  const normalized = normalizeMyWorkFilter(filter);
  if (normalized === 'all') return true;
  if (normalized === 'assigned') return isAssignedTo(entry, userId);
  if (normalized === 'watching') return isWatchedBy(entry, userId);
  return myWorkDueBucket(entry && entry.dueAt, now) === normalized;
}

module.exports = {
  MY_WORK_FILTERS,
  normalizeChecklistWorkMetadata,
  myWorkDueBucket,
  normalizeMyWorkFilter,
  isAssignedTo,
  isWatchedBy,
  matchesMyWorkFilter,
};
