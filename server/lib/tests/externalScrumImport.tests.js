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
import RecoveryEvents from '/models/recoveryEvents';
import { KanboardCreator } from '/models/kanboardCreator';
import { parseGitlab, parseOpenProject } from '/models/lib/externalParsers';

// GitLab iterations and milestones, and OpenProject versions, sprints and
// story points, become WeKan Scrum planning data through a real import
// (models/lib/externalScrumPlanning.js, written by the shared journaled stage
// server/lib/scrumTransferImport.js). Pure coverage:
// tests/externalScrumPlanning.test.cjs.
describe('Scrum planning from GitLab and OpenProject imports', function () {
  this.timeout(30000);
  async function withActor(run) {
    const actor = Random.id();
    const context = { userId: actor, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
    const boardIds = [];
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `ext-scrum-${actor}`, isAdmin: true });
      await run(async (source, parsed) => {
        const boardId = await DDP._CurrentMethodInvocation.withValue(context,
          () => new KanboardCreator({}, source).create(parsed));
        boardIds.push(boardId);
        return boardId;
      });
    } finally {
      for (const boardId of boardIds) {
        for (const model of [Cards, Lists, Swimlanes, ScrumSprints, ScrumReleases]) {
          await model.rawCollection().deleteMany({ boardId });
        }
        await CustomFields.rawCollection().deleteMany({ boardIds: boardId });
        await Boards.rawCollection().deleteMany({ _id: boardId });
        await RecoveryEvents.rawCollection().deleteMany({ boardIds: boardId });
      }
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  }

  it('imports a GitLab iteration as a sprint and a milestone as a release, and reports a closed iteration', async function () {
    if (!Meteor.isAppTest) this.skip();
    await withActor(async create => {
      const boardId = await create('gitlab', parseGitlab([
        { id: 1, iid: 1, title: 'Pump', state: 'opened',
          iteration: { id: 90, title: 'Sprint 12', state: 1, start_date: '2026-10-05', due_date: '2026-10-16' },
          milestone: { id: 11, title: 'v3.0', state: 'active', due_date: '2026-10-30' } },
        { id: 2, iid: 2, title: 'Old', state: 'closed', iteration: { id: 89, title: 'Sprint 11', state: 3 } },
      ]));
      const sprints = await ScrumSprints.rawCollection().find({ boardId }).toArray();
      assert.deepEqual(sprints.map(s => [s.name, s.state, s.provenance.system, s.provenance.recordId]),
        [['Sprint 12', 'planned', 'gitlab', '90']], 'the closed iteration is not invented');
      assert.equal(sprints[0].plannedEnd.toISOString().slice(0, 10), '2026-10-16');
      assert.equal(sprints[0].scrumImportPending, undefined, 'the import finished');
      const releases = await ScrumReleases.rawCollection().find({ boardId }).toArray();
      assert.deepEqual(releases.map(r => [r.name, r.state]), [['v3.0', 'planned']]);
      const pump = await Cards.rawCollection().findOne({ boardId, title: 'Pump' });
      assert.deepEqual([pump.scrum.sprintId, pump.scrum.releaseId], [sprints[0]._id, releases[0]._id]);
      const old = await Cards.rawCollection().findOne({ boardId, title: 'Old' });
      assert.equal(old.scrum, undefined, 'a card of an unimported iteration stays in the backlog');
      const board = await Boards.rawCollection().findOne({ _id: boardId });
      assert.equal(board.scrum.enabled, true);
      const report = JSON.stringify(await RecoveryEvents.rawCollection().find({ boardIds: boardId }).toArray());
      assert.ok(report.includes('closed iteration \\"Sprint 11\\" is not imported'), report.slice(0, 600));
    });
  });

  it('imports OpenProject versions, sprints, position and story points as the estimate field', async function () {
    if (!Meteor.isAppTest) this.skip();
    await withActor(async create => {
      const boardId = await create('openproject', parseOpenProject({ _embedded: {
        versions: [{ id: 3, name: '1.0', status: 'open', endDate: '2026-11-01' }],
        sprints: [{ id: 7, name: 'Sprint 11', startDate: '2026-10-05', finishDate: '2026-10-16',
          _links: { status: { href: 'urn:openproject-org:api:v3:sprints:status:in_planning' } } }],
        elements: [
          { id: 1, subject: 'A', position: 2, storyPoints: 5, _links: { status: { title: 'New' },
            version: { href: '/api/v3/versions/3', title: '1.0' }, sprint: { href: '/api/v3/sprints/7', title: 'Sprint 11' } } },
          { id: 2, subject: 'B', position: 1, storyPoints: 3, _links: { status: { title: 'New' } } },
        ],
      } }));
      const field = await CustomFields.rawCollection().findOne({ boardIds: boardId, name: 'Story points' });
      assert.equal(field.type, 'number');
      const board = await Boards.rawCollection().findOne({ _id: boardId });
      assert.deepEqual([board.scrum.estimateSource, board.scrum.estimateCustomFieldId, board.scrum.estimateUnit],
        ['customField', field._id, 'points']);
      const a = await Cards.rawCollection().findOne({ boardId, title: 'A' });
      const b = await Cards.rawCollection().findOne({ boardId, title: 'B' });
      const [sprint] = await ScrumSprints.rawCollection().find({ boardId }).toArray();
      const [release] = await ScrumReleases.rawCollection().find({ boardId }).toArray();
      assert.deepEqual([a.scrum.sprintId, a.scrum.releaseId, a.scrum.backlogRank, b.scrum.backlogRank],
        [sprint._id, release._id, 2, 1]);
    });
  });
});
