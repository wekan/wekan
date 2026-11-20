'use strict';

// Kanboard's task recurrence and estimate, shared by the import
// (externalParsers.js parseKanboard) and the export
// (externalExportFormatters.js kanboard). Kanboard repeats a task every
// recurrence_factor of recurrence_timeframe (0 days, 1 months, 2 years); WeKan's
// card recurrence (models/lib/cardRecurrenceSchedule.js), which was modelled on
// it, is every 1 day, 7 days or 1 month.

import { RECURRENCES } from './recurrenceMap.js';

export const KANBOARD_ESTIMATE_FIELD = 'Time estimate (hours)';

export function kanboardRecurrence(task) {
  if (!task || !Number(task.recurrence_status)) return null;
  const factor = Number(task.recurrence_factor);
  const timeframe = Number(task.recurrence_timeframe) || 0;
  const found = timeframe === 0 && factor === 1 ? 'daily' : timeframe === 0 && factor === 7 ? 'weekly'
    : timeframe === 1 && factor === 1 ? 'monthly' : null;
  return RECURRENCES.includes(found) ? found : null;
}

// [recurrence_factor, recurrence_timeframe], or null.
export function kanboardRecurrenceOf(recurrence) {
  return { daily: [1, 0], weekly: [7, 0], monthly: [1, 1] }[recurrence] || null;
}

// Kanboard's color_id as a WeKan card color, and back (the first Kanboard
// color that maps to it).
export const KANBOARD_COLORS = {
  yellow: 'yellow', blue: 'blue', green: 'green', purple: 'purple', red: 'red',
  orange: 'orange', grey: 'gray', brown: 'saddlebrown', deep_orange: 'crimson',
  dark_grey: 'black', pink: 'pink', teal: 'paleturquoise', cyan: 'sky',
  lime: 'lime', light_green: 'darkgreen', amber: 'gold',
};

export function kanboardColorId(color) {
  const found = Object.entries(KANBOARD_COLORS).find(([, wekan]) => wekan === color);
  return found ? found[0] : undefined;
}
