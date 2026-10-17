import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Cards from '/models/cards';
import Attachments from '/models/attachments';
import { boardForCardHelper } from '/server/lib/assistGate';
import { canEditCardOrLinkedCard } from '/server/lib/linkedCardPermission';

// The whiteboard (docs/Features/Cards/Whiteboard.md): several people add lines
// to one drawing at once. Each line is ONE atomic $push into that drawing, so
// two people drawing at the same moment never write over each other, and the
// card's publication carries every line to everyone who has it open. Undo and
// Clear take away only the caller's own lines. Who may draw is who may edit
// the card (canEditCardOrLinkedCard), and the Board Settings / Card row
// "Whiteboard" and the Admin Panel's Card fields turn it off on the server too.
const { whiteboardStroke, lastStrokeOf, MAX_STROKES } = require('/models/lib/cardDrawing');

const ID = /^[A-Za-z0-9_-]{1,40}$/;

async function editableDrawing(userId, cardId, drawingId) {
  if (!userId || !ID.test(cardId) || !ID.test(drawingId)) throw new Meteor.Error('invalid', 'Invalid drawing');
  const card = await Cards.findOneAsync(cardId, { fields: { boardId: 1, listId: 1, assignees: 1, linkedId: 1, type: 1, drawings: 1 } });
  if (!card) throw new Meteor.Error('not-found', 'Card not found');
  const board = await boardForCardHelper(userId, card.boardId, 'whiteboard', 'allowsWhiteboardOnCard');
  if (!board || !(await canEditCardOrLinkedCard(userId, card, board))) {
    throw new Meteor.Error('not-authorized', 'You may not draw on this card');
  }
  const drawing = (card.drawings || []).find(d => d && d._id === drawingId);
  if (!drawing) throw new Meteor.Error('not-found', 'Drawing not found');
  return { card, drawing };
}

Meteor.methods({
  async 'cards.whiteboardAddStroke'(cardId, drawingId, input) {
    check(cardId, String);
    check(drawingId, String);
    check(input, Object);
    const { drawing } = await editableDrawing(this.userId, cardId, drawingId);
    const stroke = whiteboardStroke(input, this.userId, { width: drawing.width || 800, height: drawing.height || 500 });
    if (!stroke) throw new Meteor.Error('invalid', 'Invalid line');
    if ((drawing.strokes || []).length >= MAX_STROKES) throw new Meteor.Error('full', 'The drawing is full');
    await Cards.updateAsync(
      { _id: cardId, 'drawings._id': drawingId, 'drawings.strokes._id': { $ne: stroke._id } },
      { $push: { 'drawings.$.strokes': stroke }, $set: { 'drawings.$.updatedAt': new Date() } },
    );
    return stroke._id;
  },

  async 'cards.whiteboardUndo'(cardId, drawingId) {
    check(cardId, String);
    check(drawingId, String);
    const { drawing } = await editableDrawing(this.userId, cardId, drawingId);
    const last = lastStrokeOf(drawing.strokes, this.userId);
    if (!last) return null;
    await Cards.updateAsync(
      { _id: cardId, 'drawings._id': drawingId },
      { $pull: { 'drawings.$.strokes': { _id: last, userId: this.userId } }, $set: { 'drawings.$.updatedAt': new Date() } },
    );
    return last;
  },

  // Save picture: the PNG the client made of the board, as the drawing's
  // picture. Only that one field is written, so the lines other people are
  // adding at the same moment are kept.
  async 'cards.whiteboardSetPicture'(cardId, drawingId, attachmentId) {
    check(cardId, String);
    check(drawingId, String);
    check(attachmentId, String);
    await editableDrawing(this.userId, cardId, drawingId);
    const file = await Attachments.collection.findOneAsync({ _id: attachmentId, 'meta.cardId': cardId }, { fields: { _id: 1 } });
    if (!file) throw new Meteor.Error('not-found', 'Picture not found');
    await Cards.updateAsync(
      { _id: cardId, 'drawings._id': drawingId },
      { $set: { 'drawings.$.pngAttachmentId': attachmentId, 'drawings.$.updatedAt': new Date() } },
    );
    return true;
  },

  async 'cards.whiteboardClear'(cardId, drawingId) {
    check(cardId, String);
    check(drawingId, String);
    await editableDrawing(this.userId, cardId, drawingId);
    await Cards.updateAsync(
      { _id: cardId, 'drawings._id': drawingId },
      { $pull: { 'drawings.$.strokes': { userId: this.userId } }, $set: { 'drawings.$.updatedAt': new Date() } },
    );
    return true;
  },
});

// A line per pen lift: generous for drawing fast, bounded for a script.
DDPRateLimiter.addRule({ type: 'method', name: 'cards.whiteboardAddStroke', connectionId: () => true }, 60, 10000);
DDPRateLimiter.addRule({ type: 'method', name: 'cards.whiteboardUndo', connectionId: () => true }, 30, 10000);
DDPRateLimiter.addRule({ type: 'method', name: 'cards.whiteboardClear', connectionId: () => true }, 10, 10000);
DDPRateLimiter.addRule({ type: 'method', name: 'cards.whiteboardSetPicture', connectionId: () => true }, 10, 10000);
