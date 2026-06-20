/* eslint-env mocha */
import { expect } from 'chai';
import { buildAttachmentAddedActivity } from '/models/attachments';

// #5905: when a new attachment is uploaded to a card, an 'addAttachment'
// activity must be created so that (a) the upload is recorded in the card
// history and (b) the generic Activities after.insert notification hook
// notifies card members and subscribers — exactly as it already does for the
// matching 'deleteAttachment' activity.
//
// buildAttachmentAddedActivity is a pure, side-effect-free helper that returns
// the activity document shape. These tests assert the shape so the activity is
// rendered and notified consistently with deleteAttachment.

describe('buildAttachmentAddedActivity (#5905)', function () {
  const fileObj = {
    _id: 'attach123',
    name: 'design.png',
    userId: 'userABC',
    meta: {
      boardId: 'board1',
      cardId: 'card1',
      listId: 'list1',
      swimlaneId: 'swim1',
    },
  };

  it("produces an activity of type 'addAttachment'", function () {
    const activity = buildAttachmentAddedActivity(fileObj);
    expect(activity.activityType).to.equal('addAttachment');
    expect(activity.type).to.equal('card');
  });

  it('carries the attachment identity and preserved name', function () {
    const activity = buildAttachmentAddedActivity(fileObj);
    expect(activity.attachmentId).to.equal('attach123');
    // name is preserved so notifications remain meaningful after removal
    expect(activity.attachmentName).to.equal('design.png');
  });

  it('carries the card/board context needed for notification + history', function () {
    const activity = buildAttachmentAddedActivity(fileObj);
    expect(activity.userId).to.equal('userABC');
    expect(activity.boardId).to.equal('board1');
    expect(activity.cardId).to.equal('card1');
    expect(activity.listId).to.equal('list1');
    expect(activity.swimlaneId).to.equal('swim1');
  });

  it('mirrors the field set used by deleteAttachment', function () {
    const activity = buildAttachmentAddedActivity(fileObj);
    // Same keys the deleteAttachment activity is built with, so the generic
    // notification hook and the card-history renderer treat both identically.
    expect(activity).to.have.all.keys(
      'userId',
      'type',
      'activityType',
      'attachmentId',
      'attachmentName',
      'boardId',
      'cardId',
      'listId',
      'swimlaneId',
    );
  });

  it('does not throw when meta is missing', function () {
    const activity = buildAttachmentAddedActivity({ _id: 'x', name: 'f.txt', userId: 'u' });
    expect(activity.activityType).to.equal('addAttachment');
    expect(activity.boardId).to.equal(undefined);
    expect(activity.cardId).to.equal(undefined);
  });
});
