import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Cards from '/models/cards';
import { boardForCardHelper } from '/server/lib/assistGate';

// Forecast done date (docs/Features/Cards/Dates/Forecast.md). The board's
// cycle times, once per board: how long each card finished in the last 180
// days took, as numbers - no title, no id, nothing else of any card. The
// opened card and the minicards compute their own forecast from them
// (models/lib/cardForecast.js), so a board of 500 cards asks once, not 500
// times. An assigned-only member gets the times of their own cards only.
const { cycleTimes, WINDOW_DAYS } = require('/models/lib/cardForecast');
const { assignedOnlyCardScope, mergeCardScope } = require('/models/lib/boardCardScope');

const MAX_CARDS = 5000;
const FIELDS = { startAt: 1, createdAt: 1, endAt: 1, archived: 1, archivedAt: 1, dueComplete: 1, modifiedAt: 1, dateLastActivity: 1 };

Meteor.methods({
  async 'boards.cycleTimes'(boardId) {
    check(boardId, String);
    const board = await boardForCardHelper(this.userId, boardId, 'forecast', 'allowsForecastOnCard')
      || await boardForCardHelper(this.userId, boardId, 'forecast', 'allowsForecastOnMinicard');
    if (!board) return [];
    const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const finished = await Cards.find(
      mergeCardScope(
        { boardId, $or: [{ endAt: { $gte: since } }, { archivedAt: { $gte: since } }, { dueComplete: true, modifiedAt: { $gte: since } }] },
        assignedOnlyCardScope(board, this.userId),
      ),
      { fields: FIELDS, limit: MAX_CARDS, sort: { modifiedAt: -1 } },
    ).fetchAsync();
    return cycleTimes(finished);
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'boards.cycleTimes', connectionId: () => true }, 20, 10000);
