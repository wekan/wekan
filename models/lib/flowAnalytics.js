'use strict';

// Pure, bounded calculations shared by the report method and both exports.
const DAY = 86400000;
const FLOW_CHART_KEYS = ['agingWip', 'blockerAnalysis', 'monteCarlo', 'processBehavior', 'sizeCycleTime'];
const ms = value => value == null || value === '' ? NaN : new Date(value).getTime();
const day = value => new Date(value).toISOString().slice(0, 10);
const round = value => Math.round(value * 100) / 100;
const done = card => card.endAt || card.archivedAt;
const open = card => !card.archived && !card.deletedAt && !done(card);
const mean = values => values.reduce((a, b) => a + b, 0) / values.length;
function quantile(values, probability) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(probability * sorted.length) - 1)];
}

function flowOptions(input = {}, now = new Date()) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid report options');
  function integer(key, fallback, min, max) {
    const raw = input[key];
    if (raw === undefined || raw === '') return fallback;
    if (!['string', 'number'].includes(typeof raw)) throw new Error(`Invalid ${key}`);
    const value = Number(raw);
    if (!Number.isInteger(value) || value < min || value > max) throw new Error(`Invalid ${key}`);
    return value;
  }
  const today = ms(day(now));
  const targetDate = input.targetDate === undefined || input.targetDate === ''
    ? day(today + 30 * DAY) : input.targetDate;
  if (typeof targetDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)
    || !Number.isFinite(ms(targetDate)) || day(targetDate) !== targetDate
    || ms(targetDate) < today || ms(targetDate) > today + 3650 * DAY) throw new Error('Invalid targetDate');
  const sizeField = input.sizeField || 'poker';
  if (typeof sizeField !== 'string' || sizeField.length > 100) throw new Error('Invalid sizeField');
  return {
    targetCount: integer('targetCount', 10, 1, 10000),
    historyDays: integer('historyDays', 90, 7, 365),
    targetDate, sizeField,
  };
}

function stageHistory(cards, lists, events, now) {
  const listMap = new Map(lists.map(list => [list._id, list.title]));
  const entries = new Map();
  const samples = new Map();
  const sorted = events.filter(e => Number.isFinite(ms(e.createdAt)) && ms(e.createdAt) <= ms(now))
    .sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
  for (const event of sorted) {
    const previous = entries.get(event.cardId);
    if (event.activityType === 'archivedCard' || event.activityType === 'moveCardBoard') {
      entries.delete(event.cardId);
      continue;
    }
    if (!['createCard', 'moveCard', 'restoredCard'].includes(event.activityType)) continue;
    // Moving between swimlanes in the SAME list must not reset stage age.
    if (event.activityType === 'moveCard' && event.oldListId === event.listId) continue;
    if (previous && previous.listId === event.listId) continue;
    if (previous && event.activityType === 'moveCard' && event.oldListId === previous.listId) {
      const days = (ms(event.createdAt) - previous.at) / DAY;
      const values = samples.get(previous.listId) || [];
      values.push(days);
      samples.set(previous.listId, values);
    }
    entries.set(event.cardId, { listId: event.listId, at: ms(event.createdAt) });
  }
  return cards.filter(card => open(card) && listMap.has(card.listId)).map(card => {
    const entry = entries.get(card._id);
    const ageDays = entry && entry.listId === card.listId && entry.at >= ms(card.createdAt)
      ? (ms(now) - entry.at) / DAY : null;
    const values = samples.get(card.listId) || [];
    const threshold = values.length >= 5 ? quantile(values, 0.85) : null;
    return {
      cardId: card._id, title: card.title, list: listMap.get(card.listId), listId: card.listId,
      ageDays, threshold, samples: values.length,
      unusual: ageDays !== null && threshold !== null && ageDays > threshold,
    };
  }).sort((a, b) => (b.ageDays ?? -1) - (a.ageDays ?? -1));
}

function blockerGroups(cards, stages) {
  const cardMap = new Map(cards.map(card => [card._id, card]));
  const stageMap = new Map(stages.map(row => [row.cardId, row]));
  const groups = new Map();
  for (const source of cards) {
    for (const dep of source.cardDependencies || []) {
      if (!dep || !['blocks', 'is-blocked-by'].includes(dep.type)) continue;
      const target = cardMap.get(dep.cardId);
      if (!target || source._id === target._id) continue;
      const [cause, affected] = dep.type === 'blocks' ? [source, target] : [target, source];
      if (!open(cause) || !open(affected)) continue;
      const group = groups.get(cause._id) || { cardId: cause._id, title: cause.title, affected: new Map() };
      group.affected.set(affected._id, { title: affected.title, stage: stageMap.get(affected._id) });
      groups.set(cause._id, group);
    }
  }
  return [...groups.values()].map(group => {
    const affected = [...group.affected.values()];
    const ages = affected.map(row => row.stage?.ageDays).filter(value => value != null);
    return {
      cardId: group.cardId, title: group.title, count: affected.length,
      cards: affected.map(row => row.title).join(', '),
      lists: [...new Set(affected.map(row => row.stage?.list).filter(Boolean))].join(', '),
      meanAge: ages.length ? mean(ages) : null, maxAge: ages.length ? Math.max(...ages) : null,
    };
  }).sort((a, b) => b.count - a.count || (b.maxAge || 0) - (a.maxAge || 0));
}

// Replay the EXISTING universal history. Rewind current values first, then
// apply every immutable row (including undo/restore rows) in time order.
// Missing starts stay unknown; never infer blocked duration from card age.
function blockerEpisodes(cards, history, now) {
  const states = new Map(cards.map(card => [card._id, { ...card }]));
  const relevant = new Set(['cardDependencies', 'endAt', 'archivedAt', 'archived', 'deletedAt']);
  const rows = history.filter(row => row.entityType === 'card' && states.has(row.entityId)
    && Number.isFinite(ms(row.createdAt)) && ms(row.createdAt) <= ms(now)
    && (row.group === 'position' || relevant.has(row.newContent?.field || row.previousContent?.field)))
    .sort((a, b) => ms(a.createdAt) - ms(b.createdAt));
  function apply(row, content) {
    const state = states.get(row.entityId);
    if (row.group === 'position') {
      if (content?.listId) state.listId = content.listId;
      if (content?.boardId) state.boardId = content.boardId;
    } else {
      const field = row.newContent?.field || row.previousContent?.field;
      state[field] = content?.isDate ? new Date(content.value) : content?.value;
    }
  }
  for (const row of [...rows].reverse()) apply(row, row.previousContent);
  function edges() {
    const result = new Map();
    for (const source of states.values()) {
      for (const dep of source.cardDependencies || []) {
        if (!dep || !['blocks', 'is-blocked-by'].includes(dep.type)) continue;
        const target = states.get(dep.cardId);
        if (!target || target._id === source._id || target.boardId !== source.boardId) continue;
        const [cause, card] = dep.type === 'blocks' ? [source, target] : [target, source];
        if (!open(cause) || !open(card) || cause.deletedAt || card.deletedAt) continue;
        const key = JSON.stringify([cause._id, card._id, card.listId]);
        result.set(key, { blockerId: cause._id, blocker: cause.title, cardId: card._id,
          title: card.title, listId: card.listId });
      }
    }
    return result;
  }
  let active = new Map([...edges()].map(([key, value]) => [key, { ...value, startAt: null }]));
  const episodes = [];
  for (const row of rows) {
    apply(row, row.newContent);
    const next = edges();
    for (const [key, episode] of active) {
      if (!next.has(key)) {
        episodes.push({ ...episode, endAt: new Date(row.createdAt) });
        active.delete(key);
      }
    }
    for (const [key, edge] of next) {
      if (!active.has(key)) active.set(key, { ...edge, startAt: new Date(row.createdAt) });
    }
  }
  episodes.push(...[...active.values()].map(episode => ({ ...episode, endAt: null })));
  return episodes.map(episode => ({ ...episode, days: episode.startAt
    ? Math.max(0, (ms(episode.endAt || now) - ms(episode.startAt)) / DAY) : null }));
}

function historicalBlockerGroups(episodes, lists) {
  const names = new Map(lists.map(list => [list._id, list.title]));
  const groups = new Map();
  for (const episode of episodes) {
    const group = groups.get(episode.blockerId) || { title: episode.blocker, cardId: episode.blockerId,
      cards: new Set(), lists: new Set(), count: 0, days: 0, unknown: 0, active: 0 };
    group.cards.add(episode.title);
    group.lists.add(names.get(episode.listId) || episode.listId);
    group.count += 1;
    group.active += episode.endAt ? 0 : 1;
    if (episode.days === null) group.unknown += 1;
    else group.days += episode.days;
    groups.set(episode.blockerId, group);
  }
  return [...groups.values()].map(group => ({ ...group, cards: [...group.cards].join(', '),
    lists: [...group.lists].join(', ') })).sort((a, b) => b.days - a.days || b.count - a.count);
}

function cyclePoints(cards, now) {
  return cards.map(card => {
    const end = ms(done(card));
    const start = ms(card.startAt || card.createdAt);
    if (!Number.isFinite(end) || !Number.isFinite(start) || end < start || end > ms(now)) return null;
    return { cardId: card._id, title: card.title, completedAt: new Date(end), cycleDays: (end - start) / DAY };
  }).filter(Boolean).sort((a, b) => a.completedAt - b.completedAt || a.cardId.localeCompare(b.cardId));
}

function processBehavior(points) {
  if (points.length < 2) return { points: [], limits: null };
  const ranges = points.slice(1).map((point, index) => Math.abs(point.cycleDays - points[index].cycleDays));
  const average = mean(points.map(point => point.cycleDays));
  const mr = mean(ranges);
  // Individuals limits: NIST e-Handbook 6.3.2.2, d2 = 1.128.
  // Moving-range (n=2) limits: D3=0, D4=3.267. Keep the calculated
  // negative X lower limit; clipping it would change the statistical limit.
  const limits = { average, lower: average - 3 * mr / 1.128, upper: average + 3 * mr / 1.128,
    mrAverage: mr, mrLower: 0, mrUpper: 3.267 * mr };
  return {
    limits,
    points: points.map((point, index) => ({ ...point, movingRange: index ? ranges[index - 1] : null,
      signal: point.cycleDays < limits.lower || point.cycleDays > limits.upper
        || (index > 0 && ranges[index - 1] > limits.mrUpper) })),
  };
}

function monteCarlo(cards, options, now) {
  // Full UTC calendar days, including zero-throughput days. Exclude today
  // (an incomplete observation) and days before the board's first card.
  const today = ms(day(now));
  const created = cards.map(card => ms(card.createdAt)).filter(t => Number.isFinite(t) && t <= today);
  if (!created.length) return { series: [], forecasts: [], history: [] };
  const first = created.reduce((a, b) => Math.min(a, b));
  const from = Math.max(ms(day(first)), today - options.historyDays * DAY);
  const history = [];
  for (let at = from; at < today; at += DAY) history.push({ day: day(at), count: 0 });
  for (const card of cards) {
    const at = ms(done(card));
    if (Number.isFinite(at) && at >= from && at < today && at >= ms(card.createdAt)) {
      history[Math.floor((at - from) / DAY)].count += 1;
    }
  }
  if (!history.length || !history.some(row => row.count)) return { series: [], forecasts: [], history };
  // Reproducible bootstrap: identical data/options on a UTC day produce
  // identical screen and export results. The seed is not a security token.
  let seed = 2166136261;
  const signature = JSON.stringify([history, options.targetCount, options.targetDate]);
  for (let i = 0; i < signature.length; i += 1) seed = Math.imul(seed ^ signature.charCodeAt(i), 16777619) >>> 0;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const horizon = Math.round((ms(options.targetDate) - today) / DAY);
  const trials = 2000;
  const finish = [];
  const capacity = [];
  for (let trial = 0; trial < trials; trial += 1) {
    let total = 0;
    let finished = Infinity;
    let byDate = 0;
    for (let elapsed = 1; elapsed <= 3650; elapsed += 1) {
      total += history[Math.floor(random() * history.length)].count;
      if (elapsed === horizon) byDate = total;
      if (finished === Infinity && total >= options.targetCount) finished = elapsed;
      if (elapsed >= horizon && finished !== Infinity) break;
    }
    finish.push(finished);
    capacity.push(byDate);
  }
  const forecasts = [0.5, 0.7, 0.85, 0.95].map(probability => {
    const days = quantile(finish, probability);
    // A capacity commitment uses the LOWER tail: 85% confidence means at
    // least this many items in 85% of trials, not the optimistic 85th percentile.
    const sorted = [...capacity].sort((a, b) => a - b);
    const count = sorted[Math.floor((1 - probability) * trials)];
    return { probability: probability * 100, days: Number.isFinite(days) ? days : null,
      date: Number.isFinite(days) ? day(today + days * DAY) : null, count };
  });
  return { forecasts, history, trials, series: forecasts.map(row => ({ label: `${row.probability}%`, value: row.days })) };
}

function computeFlowAnalytics(chartKey, cards, lists, events, fields, input, now = new Date(), history = []) {
  const options = flowOptions(input, now);
  const base = { options };
  if (chartKey === 'agingWip') return { ...base, points: stageHistory(cards, lists, events, now) };
  if (chartKey === 'blockerAnalysis') {
    const episodes = blockerEpisodes(cards, history, now);
    const names = new Map(lists.map(list => [list._id, list.title]));
    episodes.forEach(episode => { episode.list = names.get(episode.listId) || episode.listId; });
    return { ...base, episodes, groups: historicalBlockerGroups(episodes, lists) };
  }
  if (chartKey === 'monteCarlo') return { ...base, ...monteCarlo(cards, options, now) };
  const points = cyclePoints(cards, now);
  if (chartKey === 'processBehavior') return { ...base, ...processBehavior(points) };
  if (chartKey === 'sizeCycleTime') {
    const sizeFields = fields.filter(field => field.type === 'number').map(field => ({ _id: field._id, name: field.name }));
    if (options.sizeField !== 'poker' && !sizeFields.some(field => field._id === options.sizeField)) throw new Error('Invalid sizeField');
    const byId = new Map(cards.map(card => [card._id, card]));
    return { ...base, sizeFields, points: points.map(point => {
      const card = byId.get(point.cardId);
      const value = options.sizeField === 'poker' ? card.poker?.estimation
        : (card.customFields || []).find(field => field._id === options.sizeField)?.value;
      if (value === '' || value == null || !['number', 'string'].includes(typeof value)) return null;
      const size = Number(value);
      return Number.isFinite(size) && size >= 0 ? { ...point, size } : null;
    }).filter(Boolean) };
  }
  throw new Error('Unknown chart');
}

module.exports = { FLOW_CHART_KEYS, flowOptions, computeFlowAnalytics, stageHistory, blockerGroups,
  cyclePoints, processBehavior, monteCarlo, quantile, round, blockerEpisodes, historicalBlockerGroups };
