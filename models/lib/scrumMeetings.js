'use strict';

// Two Scrum meeting helpers that need no AI and no network
// (docs/Features/Scrum/Meetings.md):
//
//   Daily standup timer   the board's people in a shuffled order, each with
//                         the same timebox; the one speaking, their time left
//                         (negative once over) and the meeting's total
//   Retrospective board   a new board with the lists Start doing, Stop doing,
//                         Keep doing and Action items, for one retrospective
//
// Each is turned off for one board in its Scrum settings (`standupTimer`,
// `retrospectiveBoard`, on unless turned off) and for the instance in Admin
// Panel / Settings / Visibility / Features ('standup-timer',
// 'retrospective-board'). Pure CommonJS: tests/scrumMeetings.test.cjs.

const STANDUP_MINUTES = Object.freeze({ min: 1, max: 15, default: 2 });
const RETRO_LISTS = Object.freeze([
  ['retro-start', 'Start doing'],
  ['retro-stop', 'Stop doing'],
  ['retro-continue', 'Keep doing'],
  ['action-items', 'Action items'],
]);

// A copy of `ids` in a random order (Fisher-Yates); `random` is injectable.
function shuffle(ids, random = Math.random) {
  const out = [...new Set((ids || []).filter(Boolean))];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function standupMinutes(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return STANDUP_MINUTES.default;
  return Math.min(STANDUP_MINUTES.max, Math.max(STANDUP_MINUTES.min, Math.round(n)));
}

// A standup starting now: everyone in `order` speaks for `minutes` each.
function startStandup(order, minutes, now) {
  const t = +now;
  return { order: [...order], index: 0, minutes: standupMinutes(minutes), startedAt: t, speakerStartedAt: t };
}

// The next person speaks; after the last, the standup is done.
function nextSpeaker(state, now) {
  if (!state || state.index >= state.order.length) return state;
  return { ...state, index: state.index + 1, speakerStartedAt: +now };
}

// What the timer shows at `now`.
function standupView(state, now) {
  if (!state) return null;
  const done = state.index >= state.order.length;
  const t = +now;
  const remaining = done ? 0 : state.minutes * 60 - Math.floor((t - state.speakerStartedAt) / 1000);
  return {
    done,
    speaker: done ? null : state.order[state.index],
    position: Math.min(state.index + 1, state.order.length),
    count: state.order.length,
    remainingSeconds: remaining,
    overtime: !done && remaining < 0,
    elapsedSeconds: Math.max(0, Math.floor((t - state.startedAt) / 1000)),
  };
}

// 125 -> "2:05", -7 -> "-0:07".
function clock(seconds) {
  const s = Math.abs(Math.trunc(seconds));
  return `${seconds < 0 ? '-' : ''}${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// The new retrospective board's title and lists, in the reader's language:
// `t(key, fallback, options)` translates.
function retrospectivePlan(boardTitle, date, t = (key, fallback) => fallback) {
  const day = new Date(date).toISOString().slice(0, 10);
  const title = t('retrospective-board-title', `${boardTitle} - retrospective ${day}`, { board: boardTitle, date: day });
  return { title: String(title).slice(0, 250), lists: RETRO_LISTS.map(([key, fallback]) => t(key, fallback)) };
}

module.exports = {
  STANDUP_MINUTES, RETRO_LISTS, shuffle, standupMinutes, startStandup, nextSpeaker, standupView, clock, retrospectivePlan,
};
