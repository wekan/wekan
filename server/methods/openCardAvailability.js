import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { readableCard } from '/server/lib/openCardAccess';

// #6808: before an opened card's window closes because the card left
// Minimongo, the client asks here whether it is really gone - the same rule
// as the 'card' publication, on the board the window was opened on. Only a
// yes or a no: nothing of the card is returned.
Meteor.methods({
  async 'cards.openCardAvailable'(cardId, boardId) {
    check(cardId, String);
    check(boardId, String);
    const card = await readableCard(this.userId, cardId);
    return Boolean(card && card.boardId === boardId);
  },
});

DDPRateLimiter.addRule({ type: 'method', name: 'cards.openCardAvailable', connectionId: () => true }, 30, 10000);
