'use strict';

// Omitted deadlines stay unchanged. Null explicitly clears a deadline.
function parseDueAt(body) {
  if (!body || !Object.prototype.hasOwnProperty.call(body, 'dueAt')) return {};
  if (body.dueAt === null) return { dueAt: null };
  if (typeof body.dueAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(body.dueAt)) {
    return { error: 'dueAt must be an ISO 8601 date-time with timezone, or null' };
  }
  const date = new Date(body.dueAt);
  const day = body.dueAt.slice(0, 10);
  const calendarDate = new Date(`${day}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || !Number.isFinite(calendarDate.getTime()) || calendarDate.toISOString().slice(0, 10) !== day) {
    return { error: 'dueAt is not a valid date-time' };
  }
  return { dueAt: date };
}

async function checklistWithItems(checklist, cache) {
  const items = await cache.getChecklistItems({ checklistId: checklist._id, cardId: checklist.cardId }, { sort: ['sort'] });
  return { ...checklist, dueAt: checklist.dueAt || null, items: items.map(item => ({
    _id: item._id, title: item.title, isFinished: item.isFinished, dueAt: item.dueAt || null,
  })) };
}

async function cardWithChecklists(card, cache) {
  if (!card) return card;
  const checklists = await cache.getChecklists({ cardId: card._id }, { sort: ['sort'] });
  return { ...card, checklists: await Promise.all(checklists.map(checklist => checklistWithItems(checklist, cache))) };
}

module.exports = { parseDueAt, checklistWithItems, cardWithChecklists };
