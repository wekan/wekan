import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { getScrumBoardData } from '/server/scrum';

// One-shot, permission-filtered snapshot, like the getBoardData method. Consumers
// explicitly refresh after edits; no live cursor can outlive its authorization.
Meteor.publish('boardScrum', async function(boardId) {
  check(boardId, String);
  try {
    const data = await getScrumBoardData(this.userId, boardId);
    for (const [collection, records] of [['scrumSprints', data.sprints], ['scrumReleases', data.releases], ['scrumEvents', data.events]]) {
      for (const record of records) {
        const { _id, ...fields } = record;
        this.added(collection, _id, fields);
      }
    }
    this.ready();
  } catch (error) {
    if (error.error === 'not-authorized') this.ready();
    else this.error(error);
  }
});
