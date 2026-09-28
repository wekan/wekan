import { weekRange } from './weekStart.js';

// Calendar periods in the viewer's timezone, not fixed 7/30-day durations.
export function dueDateShortcut(state, at, firstDay = 1) {
  if (!(at instanceof Date) || !Number.isFinite(at.getTime())) return null;
  if (state === 'previousweek') {
    const { start, end } = weekRange(at, firstDay, -1);
    return { $type: 9, $gte: start, $lte: end };
  }
  if (state === 'nextmonth') {
    const start = new Date(at.getTime()), end = new Date(at.getTime());
    start.setDate(1); start.setMonth(start.getMonth() + 1); start.setHours(0, 0, 0, 0);
    end.setDate(1); end.setMonth(end.getMonth() + 2); end.setHours(0, 0, 0, 0);
    return { $type: 9, $gte: start, $lt: end };
  }
  return null;
}
