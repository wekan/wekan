import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from './boards';
import CardComments from '/models/cardComments';
import Cards from '/models/cards';
import ChecklistItems from '/models/checklistItems';
import Checklists from '/models/checklists';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import { CARD_COLORS } from '/models/metadata/colors';
import { planImportedTask } from '/models/lib/importedTaskPlan';

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
  constructor(data) {
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
    for (const task of this._tasks(data)) {
      const columnName = task.column_name || task.column || this._columnNames(data)[0];
      const swimlaneName = task.swimlane_name || task.swimlane || 'Default';
      const plan = planImportedTask(task, { members: this.members, allowedColors: CARD_COLORS });
      const cardToCreate = {
        ...plan.card,
        boardId,
        dateLastActivity: this._now(),
        listId: this.lists[columnName] || Object.values(this.lists)[0],
        swimlaneId: this.swimlanes[swimlaneName] || firstSwimlane,
        sort: 0,
        userId: this._user(),
        labelIds: [],
      };
      if (cardToCreate.archived) cardToCreate.archivedAt = this._now();
      for (const t of task.tags || []) {
        const name = typeof t === 'string' ? t : t.name;
        const label = name && board.getLabel(name, 'black');
        if (label) cardToCreate.labelIds.push(label._id);
      }
      if (plan.memberId) cardToCreate.members = [plan.memberId];
      const cardId = await Cards.direct.insertAsync(cardToCreate);
      await this.createChecklists(plan.checklists, boardId, cardId);
      await this.createComments(plan.comments, boardId, cardId);
    }
  }

  // Kanboard subtasks, Asana subtasks, Jira sub-tasks and the like arrive as
  // checklists; .direct inserts bypass the hooks that would derive boardId.
  async createChecklists(checklists, boardId, cardId) {
    for (const checklist of checklists) {
      const checklistId = await Checklists.direct.insertAsync({
        boardId,
        cardId,
        title: checklist.title,
        sort: checklist.sort,
        createdAt: this._now(),
      });
      for (const item of checklist.items) {
        await ChecklistItems.direct.insertAsync({
          boardId,
          cardId,
          checklistId,
          title: item.title,
          sort: item.sort,
          isFinished: item.isFinished,
        });
      }
    }
  }

  async createComments(comments, boardId, cardId) {
    for (const comment of comments) {
      const createdAt = comment.createdAt || this._now();
      const userId = comment.userId || this._user();
      const commentId = await CardComments.direct.insertAsync({
        boardId, cardId, createdAt, text: comment.text, userId,
      });
      // The activity feed and comment counters read addComment activities.
      await Activities.direct.insertAsync({
        activityType: 'addComment', boardId, cardId, commentId, createdAt, userId,
      });
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
    return boardId;
  }
}
