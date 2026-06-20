/* eslint-env mocha */
import { expect } from 'chai';
import { deleteActivityUserId } from '../attachmentActivityActor';

// Bug #5504: the 'deleteAttachment' activity must credit the user who actually
// deleted the attachment (the acting user), not the original uploader.
describe('attachmentActivityActor.deleteActivityUserId', function() {
  it('credits the acting user when an acting user is present', function() {
    const actingUserId = 'acting-user-deleter';
    const uploaderUserId = 'uploader-person-a';
    expect(deleteActivityUserId(actingUserId, uploaderUserId)).to.equal(
      actingUserId,
    );
  });

  it('falls back to the uploader when there is no acting user', function() {
    const uploaderUserId = 'uploader-person-a';
    expect(deleteActivityUserId(null, uploaderUserId)).to.equal(uploaderUserId);
    expect(deleteActivityUserId(undefined, uploaderUserId)).to.equal(
      uploaderUserId,
    );
    expect(deleteActivityUserId('', uploaderUserId)).to.equal(uploaderUserId);
  });
});
