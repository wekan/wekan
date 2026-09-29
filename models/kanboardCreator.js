import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from './boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { CARD_COLORS } from '/models/metadata/colors';
import {
  importedCustomFieldValues,
  planImportedCustomFields,
  planImportedLinks,
  planImportedTask,
} from '/models/lib/importedTaskPlan';
import { normalizeDependency } from '/models/metadata/dependencies';
import CustomFields from '/models/customFields';
import { writeImportedEntity } from '/models/lib/importPipeline';
import {
  insertImportedChecklists,
  insertImportedComments,
  recordImportLosses,
} from '/models/lib/importedCardChildren';

// Creates a WeKan board from a Kanboard export.
//
// Kanboard's JSON-RPC API (getBoard / getAllTasks) or a hand-assembled object of
// the shape below is accepted. Kanboard "columns" become WeKan lists, "tasks"
// become cards, swimlanes are preserved, task tags become board labels and the
// task owner becomes the card member (when mapped):
//
//   {
//     "board":     { "name": "..." },                         // optional
//     "columns":   [ { "title": "Backlog" }, ... ],           // optional (derived from tasks if absent)
//     "swimlanes": [ { "name": "Default" }, ... ],            // optional
//     "tasks": [ { "title", "description", "column_name", "swimlane_name",
//                  "date_due", "owner_id"|"owner_name"|"owner_username",
//                  "tags": [ ... ],
//                  "date_started", "date_end", "archived", "color", "spent_hours",
//                  "checklists": [ { "title", "items": [ { "title", "done" } ] } ],
//                  "comments": [ { "text", "author", "date" } ] }, ... ]
//   }
//
// What each task becomes is decided by models/lib/importedTaskPlan.js, which
// plain-Node tests exercise; this class only performs the inserts.
export class KanboardCreator {
  constructor(data, source = 'kanboard') {
    this.source = source;
    // Parser and planner losses, recorded once the board exists.
    this.losses = [];
    this._nowDate = new Date();
    this.members = data && data.membersMapping ? data.membersMapping : {};
    this.lists = {};
    this.swimlanes = {};
  }

  _now(dateString) {
    if (dateString) {
      // Kanboard often uses unix timestamps (seconds) for dates.
      if (/^\d+$/.test(String(dateString))) {
        return new Date(parseInt(dateString, 10) * 1000);
      }
      return new Date(dateString);
    }
    if (!this._nowDate) this._nowDate = new Date();
    return this._nowDate;
  }

  _user(key) {
    if (key && this.members[key]) return this.members[key];
    return Meteor.userId();
  }

  _tasks(data) {
    if (Array.isArray(data)) return data;
    return data.tasks || [];
  }

  _columnNames(data) {
    if (data.columns && data.columns.length) {
      return data.columns.map(c => c.title || c.name).filter(Boolean);
    }
    // Derive the column order from the tasks.
    const names = [];
    for (const task of this._tasks(data)) {
      const name = task.column_name || task.column || 'Imported';
      if (!names.includes(name)) names.push(name);
    }
    return names.length ? names : ['Imported'];
  }

  _swimlaneNames(data) {
    if (data.swimlanes && data.swimlanes.length) {
      return data.swimlanes.map(s => s.name || s.title).filter(Boolean);
    }
    const names = [];
    for (const task of this._tasks(data)) {
      const name = task.swimlane_name || task.swimlane || 'Default';
      if (!names.includes(name)) names.push(name);
    }
    return names.length ? names : ['Default'];
  }

  async createBoard(data) {
    const title =
      (data.board && (data.board.name || data.board.title)) ||
      `Imported Kanboard Board ${this._now()}`;
    const boardToCreate = {
      archived: false,
      color: 'belize',
      createdAt: this._now(),
      labels: [],
      members: [
        {
          userId: Meteor.userId(),
          wekanId: Meteor.userId(),
          isActive: true,
          isAdmin: true,
          isNoComments: false,
          isCommentOnly: false,
          swimlaneId: false,
        },
      ],
      modifiedAt: this._now(),
      permission: 'private',
      slug: 'board',
      stars: 0,
      title,
    };
    // Tags -> board labels.
    const tagNames = new Set();
    for (const task of this._tasks(data)) {
      (task.tags || []).forEach(t => tagNames.add(typeof t === 'string' ? t : t.name));
    }
    for (const name of tagNames) {
      if (name) boardToCreate.labels.push({ _id: Random.id(6), color: 'black', name });
    }

    const boardId = await Boards.direct.insertAsync(boardToCreate);
    await Activities.direct.insertAsync({
      activityType: 'importBoard',
      boardId,
      createdAt: this._now(),
      source: { id: boardId, system: 'Kanboard' },
      userId: this._user(),
    });
    return boardId;
  }

  async createSwimlanes(data, boardId) {
    let sort = 0;
    for (const name of this._swimlaneNames(data)) {
      const swimlaneId = await Swimlanes.direct.insertAsync({
        archived: false,
        boardId,
        createdAt: this._now(),
        title: name,
        sort,
      });
      this.swimlanes[name] = swimlaneId;
      sort += 1;
    }
  }

  async createLists(data, boardId) {
    let sort = 0;
    for (const name of this._columnNames(data)) {
      const listId = await Lists.direct.insertAsync({
        archived: false,
        boardId,
        createdAt: this._now(),
        title: name,
        sort,
      });
      this.lists[name] = listId;
      sort += 1;
    }
  }

  async createCards(data, boardId) {
    const board = await ReactiveCache.getBoard(boardId);
    const firstSwimlane = Object.values(this.swimlanes)[0];
    const tasks = this._tasks(data);
    const fieldIds = await this.createCustomFields(tasks, boardId);
    const cardIds = [];
    for (let index = 0; index < tasks.length; index += 1) {
      const task = tasks[index];
      const columnName = task.column_name || task.column || this._columnNames(data)[0];
      const swimlaneName = task.swimlane_name || task.swimlane || 'Default';
      const plan = planImportedTask(task, { members: this.members, allowedColors: CARD_COLORS,
        boardMemberIds: (board.members || []).filter(m => m.isActive !== false).map(m => m.userId) });
      const cardToCreate = {
        ...plan.card,
        boardId,
        dateLastActivity: this._now(),
        listId: this.lists[columnName] || Object.values(this.lists)[0],
        swimlaneId: this.swimlanes[swimlaneName] || firstSwimlane,
        // Source order: parsers emit tasks in the order the source shows them.
        sort: index,
        userId: this._user(),
        labelIds: [],
      };
      if (cardToCreate.archived) cardToCreate.archivedAt = this._now();
      for (const t of task.tags || []) {
        const name = typeof t === 'string' ? t : t.name;
        const label = name && board.getLabel(name, 'black');
        if (label) cardToCreate.labelIds.push(label._id);
      }
      if (plan.memberIds.length) cardToCreate.members = plan.memberIds;
      if (plan.watcherIds.length) cardToCreate.watchers = plan.watcherIds;
      if (plan.unwatchedCount) {
        this.losses.push({ path: `/tasks/${index}/watchers`,
          reason: `${plan.unwatchedCount} watcher(s) are not members of this board and do not watch the card` });
      }
      const values = importedCustomFieldValues(task, this.customFieldPlan)
        .map(({ name, value }) => ({ _id: fieldIds[name], value }));
      if (values.length) cardToCreate.customFields = values;
      const cardId = await writeImportedEntity(Cards, cardToCreate);
      cardIds[index] = cardId;
      // Subtasks of many sources arrive as checklists.
      await insertImportedChecklists(plan.checklists, { boardId, cardId, now: this._now() });
      await insertImportedComments(plan.comments, { boardId, cardId, now: this._now(), importerId: this._user() });
    }
    await this.createLinks(tasks, cardIds);
  }

  // One board custom field per source field name (see planImportedCustomFields).
  async createCustomFields(tasks, boardId) {
    const customFieldPlan = planImportedCustomFields(tasks);
    this.customFieldPlan = customFieldPlan.fields;
    this.losses.push(...customFieldPlan.unsupported);
    const ids = {};
    for (const field of this.customFieldPlan) {
      ids[field.name] = await writeImportedEntity(CustomFields, {
        boardIds: [boardId], name: field.name, type: field.type, settings: {},
        showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false,
        showLabelOnMiniCard: false, createdAt: this._now(),
      });
    }
    return ids;
  }

  // Parents and dependencies point at cards of this import, so they are set
  // once every card exists.
  async createLinks(tasks, cardIds) {
    const { parents, dependencies, unsupported } = planImportedLinks(tasks);
    this.losses.push(...unsupported);
    for (const { index, parent } of parents) {
      await Cards.direct.updateAsync(cardIds[index], { $set: { parentId: cardIds[parent] } });
    }
    for (const { index, deps } of dependencies) {
      await Cards.direct.updateAsync(cardIds[index], { $set: {
        cardDependencies: deps.map(dep => normalizeDependency({ cardId: cardIds[dep.target], type: dep.type })),
      } });
    }
  }

  async create(board, currentBoardId) {
    const isSandstorm =
      Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;
    if (isSandstorm && currentBoardId) {
      const currentBoard = await ReactiveCache.getBoard(currentBoardId);
      await currentBoard.archive();
    }
    const boardId = await this.createBoard(board);
    await this.createSwimlanes(board, boardId);
    await this.createLists(board, boardId);
    await this.createCards(board, boardId);
    await recordImportLosses({
      source: this.source,
      warnings: board.warnings,
      unsupported: [...(Array.isArray(board.unsupported) ? board.unsupported : []), ...this.losses],
      boardId,
      boardTitle: board.board && (board.board.name || board.board.title),
      userId: Meteor.userId(),
    });
    return boardId;
  }
}
