import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import {
  templateContainersSelector,
  planTemplateContainerCleanup,
} from '/models/lib/unusedTemplateContainers';

// Remove the "Templates" container boards that were created for accounts which
// never used them.
//
// Before v10.00 every new account got one at signup whether or not the person
// ever saved a template (#2339, #5850 made it lazy). Nothing ever removed the
// ones already made, and on an instance that provisions accounts automatically
// they come to dominate the boards collection: one reported instance has 14490
// boards of which 13404 are template containers, for 9264 accounts of which 478
// have ever logged in. Every query that touches boards carries that, and under
// polling reactivity that is every poll.
//
// TWO THINGS THIS IS CAREFUL ABOUT, because it deletes boards.
//
// It only ever removes an EMPTY container: nothing saved into it, nothing put in
// it directly, one member, not renamed, not starred, not archived by hand. If
// somebody used it, it is theirs and it stays. The rule lives in
// models/lib/unusedTemplateContainers.js, on its own, so it can be read and
// tested without this file.
//
// And it does NOTHING unless asked twice. The default is a dry run that reports
// what would go; `apply: true` is what deletes. An admin can therefore look at
// the list first, which for thirteen thousand boards is the difference between a
// cleanup and an accident.

const DEFAULT_TITLES = ['Templates', 'templates', 'Template Container'];

async function collectContainers(limit) {
  const boards = await Boards.find(templateContainersSelector(), {
    fields: { _id: 1, title: 1, type: 1, members: 1, archived: 1, starred: 1 },
    ...(limit ? { limit } : {}),
  }).fetchAsync();

  const entries = [];
  for (const board of boards) {
    // Counted rather than fetched: the question is only "is there anything in
    // it", and these collections are the large ones.
    const [templateCount, listCount, swimlaneCount, cardCount] = await Promise.all([
      Boards.find({
        type: { $in: ['template-board', 'template-list', 'template-card',
                      'template-swimlane'] },
        'members.userId': { $exists: true },
        _id: { $ne: board._id },
        parentId: board._id,
      }).countAsync(),
      Lists.find({ boardId: board._id }).countAsync(),
      Swimlanes.find({ boardId: board._id }).countAsync(),
      Cards.find({ boardId: board._id }).countAsync(),
    ]);
    entries.push({
      board,
      counts: { templateCount, listCount, swimlaneCount, cardCount },
      options: { defaultTitles: DEFAULT_TITLES },
    });
  }
  return entries;
}

Meteor.methods({
  // options: { apply: false, limit: 0 }
  async cleanupUnusedTemplateContainers(options = {}) {
    check(options, Match.Optional(Object));
    const apply = options.apply === true;
    const limit = Number.isInteger(options.limit) && options.limit > 0
      ? options.limit
      : 0;

    if (!this.userId || !(await ReactiveCache.getUser(this.userId))?.isAdmin) {
      throw new Meteor.Error('not-authorized', 'You must be an admin.');
    }

    const entries = await collectContainers(limit);
    const plan = planTemplateContainerCleanup(entries);

    if (!apply) {
      return {
        applied: false,
        scanned: entries.length,
        wouldRemove: plan.remove.length,
        kept: plan.keep.length,
        // A sample rather than thirteen thousand rows, and the reasons the kept
        // ones were kept - which is what tells an admin the rule is doing what
        // they think it is.
        removeSample: plan.remove.slice(0, 25),
        keepSample: plan.keep.slice(0, 25),
      };
    }

    let removed = 0;
    const failed = [];
    for (const entry of plan.remove) {
      try {
        await Boards.removeAsync(entry.boardId);
        // The pointer on the user profile goes with it, or the next
        // ensureTemplatesBoard finds a board that is not there.
        await Meteor.users.updateAsync(
          { 'profile.templatesBoardId': entry.boardId },
          { $unset: { 'profile.templatesBoardId': '' } },
          { multi: true },
        );
        removed += 1;
      } catch (error) {
        failed.push({ boardId: entry.boardId, error: String(error && error.message) });
      }
    }

    return {
      applied: true,
      scanned: entries.length,
      removed,
      kept: plan.keep.length,
      failed,
    };
  },
});
