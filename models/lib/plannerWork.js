'use strict';

const PLANNER_RANGES = [1, 3, 7];
const MIN_DURATION = 15;
const MAX_DURATION = 8 * 60;

function validDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

function toDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return validDate(date) ? date : null;
}

function normalizePlannerRange(value) {
  const numeric = Number(value);
  return PLANNER_RANGES.includes(numeric) ? numeric : 3;
}

function normalizeDuration(value, fallback = 60) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return fallback;
  return Math.min(MAX_DURATION, Math.max(MIN_DURATION, numeric));
}

function normalizeFocusBlock(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { error: 'invalid-payload' };
  }
  const title = typeof payload.title === 'string'
    ? payload.title.trim().slice(0, 200)
    : '';
  const startsAt = toDate(payload.startsAt);
  if (!title) return { error: 'planner-focus-title-required' };
  if (!startsAt) return { error: 'planner-invalid-start' };
  return {
    value: {
      title,
      startsAt,
      durationMinutes: normalizeDuration(payload.durationMinutes),
    },
  };
}

function normalizeCardSlot(startsAt, durationMinutes) {
  const normalizedStart = toDate(startsAt);
  if (!normalizedStart) return { error: 'planner-invalid-start' };
  return {
    value: {
      startsAt: normalizedStart,
      durationMinutes: normalizeDuration(durationMinutes),
    },
  };
}

function cardIsPlannerRelevant(card, userId) {
  if (!card || !userId) return false;
  const assigned = Array.isArray(card.assignees) && card.assignees.includes(userId);
  return assigned || Boolean(toDate(card.dueAt));
}

function startsWithinDay(value, day) {
  const date = toDate(value);
  const dayStart = toDate(day);
  if (!date || !dayStart) return false;
  dayStart.setHours(0, 0, 0, 0);
  const next = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  return date >= dayStart && date < next;
}

module.exports = {
  PLANNER_RANGES,
  normalizePlannerRange,
  normalizeDuration,
  normalizeFocusBlock,
  normalizeCardSlot,
  cardIsPlannerRelevant,
  startsWithinDay,
};
