import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import CustomFields from '/models/customFields';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import { JiraCreator } from '/models/jiraCreator';
import RecoveryEvents from '/models/recoveryEvents';

// Jira sprints, fix versions, rank and epic links become WeKan Scrum planning
// data through a real import (models/lib/jiraScrumPlanning.js).
describe('Jira import of Scrum planning data', function () {
  this.timeout(30000);
  it('imports open sprints, releases, rank and epics, and reports what it cannot keep', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id();
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const data = {
      board: { name: `Jira Scrum ${actor}` },
      schema: { customfield_10020: { custom: 'com.pyxis.greenhopper.jira:gh-sprint' } },
      names: { customfield_10014: 'Epic Link', customfield_10020: 'Sprint', customfield_10019: 'Rank' },
      issues: [
        { key: 'P-1', fields: { summary: 'Epic', status: { name: 'To Do' }, issuetype: { name: 'Epic' },
          customfield_10019: '0|i0000r:' } },
        { key: 'P-2', fields: { summary: 'Story', status: { name: 'To Do' }, issuetype: { name: 'Story' },
          customfield_10014: 'P-1', customfield_10019: '0|i0000f:',
          customfield_10020: [{ id: 8, name: 'Sprint 8', state: 'closed' },
            { id: 9, name: 'Sprint 9', state: 'active', goal: 'Pumps', startDate: '2026-08-15T09:00:00.000Z',
              endDate: '2026-08-28T17:00:00.000Z' }],
          fixVersions: [{ id: '100', name: '1.0', released: true, releaseDate: '2026-08-30' },
            { id: '101', name: '1.1', released: false }] } },
      ],
    };
    let boardId;
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `jira-scrum-${actor}`, isAdmin: true });
      boardId = await DDP._CurrentMethodInvocation.withValue(context, () => new JiraCreator(data).create(data));
      const sprints = await ScrumSprints.rawCollection().find({ boardId }).toArray();
      assert.deepEqual(sprints.map(s => [s.name, s.state, s.goal, s.provenance.system, s.provenance.recordId]),
        [['Sprint 9', 'planned', 'Pumps', 'jira', '9']], 'the active sprint, planned; the closed one not invented');
      assert.equal(sprints[0].scrumImportPending, undefined, 'the import finished');
      const releases = (await ScrumReleases.rawCollection().find({ boardId }).toArray())
        .sort((a, b) => a.name.localeCompare(b.name));
      assert.deepEqual(releases.map(r => [r.name, r.state]), [['1.0', 'released'], ['1.1', 'planned']]);
      const cards = await Cards.rawCollection().find({ boardId }).toArray();
      const byTitle = Object.fromEntries(cards.map(c => [c.title, c]));
      const story = byTitle['[P-2] Story'], epic = byTitle['[P-1] Epic'];
      assert.deepEqual([story.scrum.sprintId, story.scrum.releaseId, story.scrum.backlogRank, story.scrum.issueType],
        [sprints[0]._id, releases[0]._id, 1, 'Story']);
      // Every fix version is one of its releases, remapped to this board's ids.
      assert.deepEqual(story.scrum.releaseIds, [releases[0]._id, releases[1]._id]);
      assert.equal(epic.scrum.backlogRank, 2);
      assert.equal(story.parentId, epic._id, 'the Epic Link is the parent');
      // The planning fields are not also imported as text custom fields.
      const fields = await CustomFields.rawCollection().find({ boardIds: boardId }).toArray();
      assert.ok(!fields.some(f => ['Sprint', 'Rank', 'Epic Link'].includes(f.name)), fields.map(f => f.name).join(','));
      const board = await Boards.rawCollection().findOne({ _id: boardId });
      assert.equal(board.scrum.enabled, true);
      // Reported: the closed sprint and the active one's missing snapshot.
      const report = JSON.stringify(await RecoveryEvents.rawCollection().find({ boardIds: boardId }).toArray());
      assert.ok(report.includes('closed sprint \\"Sprint 8\\" is not imported'), report.slice(0, 600));
      assert.ok(report.includes('active sprint \\"Sprint 9\\" is imported as planned'));
    } finally {
      if (boardId) {
        for (const model of [Cards, Lists, Swimlanes, ScrumSprints, ScrumReleases]) {
          await model.rawCollection().deleteMany({ boardId });
        }
        await CustomFields.rawCollection().deleteMany({ boardIds: boardId });
        await Boards.rawCollection().deleteMany({ _id: boardId });
        await RecoveryEvents.rawCollection().deleteMany({ boardIds: boardId });
      }
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
