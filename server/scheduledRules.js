import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { SyncedCron } from '/server/cron/syncedCron';
import { RulesHelper } from '/server/rulesHelper';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import Cards from '/models/cards';
import Activities from '/models/activities';

const DAY_MS = 24 * 60 * 60 * 1000;
const BOARD_LEVEL_ACTIONS = ['createCard', 'addSwimlane', 'moveAllCardsInList'];

function pad(n) {
  return String(n).padStart(2, '0');
}

// Has this calendar-scheduled trigger reached its day/date condition right now?
function calendarDue(trigger, now) {
  const dow = now.getDay(); // 0 = Sunday … 6 = Saturday
  const dom = now.getDate();
  switch (trigger.scheduleType) {
    case 'once': {
      const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(dom)}`;
      return trigger.onDate === today;
    }
    case 'daily':
      return true;
    case 'weekday':
      return dow >= 1 && dow <= 5;
    case 'weekly':
      return dow === Number(trigger.weekday);
    case 'monthly':
      return dom === Number(trigger.dayOfMonth);
    default:
      return false;
  }
}

// Days a card has spent in its current list, from the most recent move/create
// activity for that card (falls back to the card creation date).
async function daysInList(card) {
  const acts = await ReactiveCache.getActivities(
    { cardId: card._id, activityType: { $in: ['moveCard', 'createCard'] } },
    { sort: { createdAt: -1 }, limit: 1 },
  );
  const since = acts && acts.length ? acts[0].createdAt : card.createdAt;
  if (!since) return 0;
  return (Date.now() - new Date(since).getTime()) / DAY_MS;
}

// Resolve which cards a scheduled trigger should act on.
async function selectCards(trigger) {
  const selector = { boardId: trigger.boardId, archived: false };
  if (trigger.listName && trigger.listName !== '*') {
    const list = await ReactiveCache.getList({
      title: trigger.listName,
      boardId: trigger.boardId,
    });
    if (!list) return [];
    selector.listId = list._id;
  }
  let cards = await ReactiveCache.getCards(selector);

  if (trigger.scheduleKind === 'due') {
    const now = Date.now();
    const window = (Number(trigger.days) || 0) * DAY_MS;
    cards = cards.filter(c => {
      if (!c.dueAt) return false;
      const due = new Date(c.dueAt).getTime();
      if (trigger.dueCondition === 'set') return true;
      if (trigger.dueCondition === 'soon') return due >= now && due - now <= window;
      if (trigger.dueCondition === 'overdue') return now - due >= window;
      return false;
    });
  } else if (trigger.scheduleKind === 'aging') {
    const filtered = [];
    for (const c of cards) {
      // eslint-disable-next-line no-await-in-loop
      if ((await daysInList(c)) >= (Number(trigger.days) || 0)) {
        filtered.push(c);
      }
    }
    cards = filtered;
  }
  return cards;
}

async function runDueTrigger(trigger, slotKey, now) {
  const rule = await ReactiveCache.getRule({ triggerId: trigger._id });
  if (!rule) return;
  const action = await ReactiveCache.getAction(rule.actionId);
  if (!action) return;

  const board = await ReactiveCache.getBoard(trigger.boardId);
  const userId = board ? board.createdBy : undefined;
  const cards = await selectCards(trigger);

  if (cards.length === 0 && BOARD_LEVEL_ACTIONS.includes(action.actionType)) {
    await RulesHelper.performAction(
      { activityType: 'scheduledTrigger', boardId: trigger.boardId, userId },
      action,
    );
  } else {
    for (const card of cards) {
      // eslint-disable-next-line no-await-in-loop
      await RulesHelper.performAction(
        {
          activityType: 'scheduledTrigger',
          cardId: card._id,
          boardId: trigger.boardId,
          userId,
        },
        action,
      );
    }
  }
  await Triggers.updateAsync(trigger._id, {
    $set: { lastRunKey: slotKey, lastRunAt: now },
  });
}

// Evaluate every scheduled trigger once per minute.
export async function scanScheduledRules(now = new Date()) {
  const hhmm = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const slotKey = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )} ${hhmm}`;

  const triggers = await Triggers.find({
    activityType: 'scheduledTrigger',
  }).fetchAsync();

  for (const trigger of triggers) {
    try {
      if (trigger.lastRunKey === slotKey) continue; // already ran this minute
      if (trigger.atTime && trigger.atTime !== hhmm) continue; // not the chosen time
      if (trigger.scheduleKind === 'calendar' && !calendarDue(trigger, now)) continue;
      // 'due' and 'aging' fire daily at atTime; card-level filtering is in selectCards.
      // eslint-disable-next-line no-await-in-loop
      await runDueTrigger(trigger, slotKey, now);
    } catch (e) {
      // Never let one bad rule crash the cron job.
      // eslint-disable-next-line no-console
      console.error('scheduledRules: error running trigger', trigger._id, e);
    }
  }
}

Meteor.startup(() => {
  try {
    SyncedCron.add({
      name: 'wekan-scheduled-rules',
      schedule(parser) {
        return parser.text('every 1 minute');
      },
      job() {
        return scanScheduledRules(new Date());
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('scheduledRules: failed to register cron job', e);
  }
});
