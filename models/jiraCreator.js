import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from './boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import {
  DEFAULT_DEPENDENCY_TYPE,
  normalizeDependency,
} from '/models/metadata/dependencies';

// Creates a WeKan board from a Jira export.
//
// Jira has no single "board JSON" like Trello. This importer accepts the JSON
// produced by the Jira Cloud REST search API (or a hand-assembled equivalent):
//
//   {
//     "board":   { "name": "..." },              // optional
//     "issues":  [ { "key": "PROJ-1", "fields": {
//                     "summary", "description", "status": { "name" },
//                     "labels": [], "assignee": { "accountId"|"name"|"emailAddress" },
//                     "duedate", "created", "updated" } } ],
//     "automationRules": [ { "title", "trigger": {...}, "action": {...} } ]  // optional
//   }
//
// Issue statuses become lists (the Jira workflow columns), each issue becomes a
// card, Jira labels become board labels, and recognizable automation rules are
// mapped to WeKan rules (best effort).
export class JiraCreator {
  constructor(data) {
    this._nowDate = new Date();
    this.members = data && data.membersMapping ? data.membersMapping : {};
    this.lists = {};
    this.swimlane = null;
    // #3392: Jira issue key -> new card id, for mapping issue links to
    // card-to-card dependencies ("Red Strings") after all cards are created.
    this.cardsByKey = {};
  }

  _now(dateString) {
    if (dateString) return new Date(dateString);
    if (!this._nowDate) this._nowDate = new Date();
    return this._nowDate;
  }

  _user(jiraUserId) {
    if (jiraUserId && this.members[jiraUserId]) return this.members[jiraUserId];
    return Meteor.userId();
  }

  _issues(data) {
    if (Array.isArray(data)) return data;
    return data.issues || [];
  }

  async createBoard(data) {
    const title =
      (data.board && data.board.name) ||
      (this._issues(data)[0] &&
        this._issues(data)[0].fields &&
        this._issues(data)[0].fields.project &&
        this._issues(data)[0].fields.project.name) ||
      `Imported Jira Board ${this._now()}`;

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

    // Jira labels => board labels.
    const labelNames = new Set();
    for (const issue of this._issues(data)) {
      const labels = (issue.fields && issue.fields.labels) || [];
      labels.forEach(l => labelNames.add(l));
    }
    for (const name of labelNames) {
      boardToCreate.labels.push({ _id: Random.id(6), color: 'black', name });
    }

    const boardId = await Boards.direct.insertAsync(boardToCreate);
    await Activities.direct.insertAsync({
      activityType: 'importBoard',
      boardId,
      createdAt: this._now(),
      source: { id: boardId, system: 'Jira' },
      userId: this._user(),
    });
    return boardId;
  }

  async createSwimlanes(boardId) {
    const swimlaneId = await Swimlanes.direct.insertAsync({
      archived: false,
      boardId,
      createdAt: this._now(),
      title: 'Default',
      sort: 1,
    });
    this.swimlane = swimlaneId;
  }

  async createLists(data, boardId) {
    let sort = 0;
    for (const issue of this._issues(data)) {
      const statusName =
        (issue.fields && issue.fields.status && issue.fields.status.name) ||
        'Imported';
      if (this.lists[statusName]) continue;
      const listId = await Lists.direct.insertAsync({
        archived: false,
        boardId,
        createdAt: this._now(),
        title: statusName,
        sort,
      });
      this.lists[statusName] = listId;
      sort += 1;
    }
  }

  async createCards(data, boardId) {
    const board = await ReactiveCache.getBoard(boardId);
    for (const issue of this._issues(data)) {
      const fields = issue.fields || {};
      const statusName = (fields.status && fields.status.name) || 'Imported';
      const titleParts = [];
      if (issue.key) titleParts.push(`[${issue.key}]`);
      if (fields.summary) titleParts.push(fields.summary);

      const cardToCreate = {
        archived: false,
        boardId,
        dateLastActivity: this._now(),
        description: typeof fields.description === 'string' ? fields.description : '',
        listId: this.lists[statusName],
        swimlaneId: this.swimlane,
        sort: -1,
        title: titleParts.join(' ') || 'Imported issue',
        userId: this._user(),
        labelIds: [],
      };
      if (fields.created) cardToCreate.createdAt = this._now(fields.created);
      if (fields.duedate) cardToCreate.dueAt = this._now(fields.duedate);
      if (fields.updated) cardToCreate.modifiedAt = this._now(fields.updated);

      // Labels.
      for (const labelName of fields.labels || []) {
        const label = board.getLabel(labelName, 'black');
        if (label) cardToCreate.labelIds.push(label._id);
      }
      // Assignee => member (when mapped).
      const assignee = fields.assignee;
      if (assignee) {
        const key = assignee.accountId || assignee.name || assignee.emailAddress;
        if (key && this.members[key]) {
          cardToCreate.members = [this.members[key]];
        }
      }
      const cardId = await Cards.direct.insertAsync(cardToCreate);
      if (issue.key) this.cardsByKey[issue.key] = cardId;
    }
  }

  // #3392: best-effort mapping of Jira issue links to card-to-card dependencies
  // ("Red Strings"). Jira link type names are matched loosely: "blocks" maps to
  // blocks / is-blocked-by depending on direction, everything else to related-to.
  async createDependencies(data) {
    for (const issue of this._issues(data)) {
      const fromId = this.cardsByKey[issue.key];
      if (!fromId) continue;
      const links = (issue.fields || {}).issuelinks || [];
      const deps = [];
      for (const link of links) {
        const typeName = ((link.type && link.type.name) || '').toLowerCase();
        let targetKey = null;
        let depType = DEFAULT_DEPENDENCY_TYPE;
        if (link.outwardIssue) {
          targetKey = link.outwardIssue.key;
          if (typeName.includes('block')) depType = 'blocks';
        } else if (link.inwardIssue) {
          targetKey = link.inwardIssue.key;
          if (typeName.includes('block')) depType = 'is-blocked-by';
        }
        if (!targetKey) continue;
        const toId = this.cardsByKey[targetKey];
        if (!toId || toId === fromId) continue;
        if (deps.find(d => d.cardId === toId)) continue;
        deps.push(normalizeDependency({ cardId: toId, type: depType }));
      }
      if (deps.length) {
        await Cards.direct.updateAsync(fromId, {
          $set: { cardDependencies: deps },
        });
      }
    }
  }

  // Best-effort: import automation rules that already use, or closely resemble,
  // the WeKan { title, trigger, action } shape. Jira's native automation export
  // is proprietary; rules that cannot be mapped are skipped.
  async createRules(data, boardId) {
    const rules = data.automationRules || [];
    let imported = 0;
    for (const r of rules) {
      if (!r || !r.trigger || !r.action) continue;
      const triggerId = await Triggers.insertAsync({ ...r.trigger, boardId });
      const actionId = await Actions.insertAsync({ ...r.action, boardId });
      await Rules.insertAsync({
        title: r.title || 'Imported Jira rule',
        triggerId,
        actionId,
        boardId,
      });
      imported += 1;
    }
    return imported;
  }

  async create(board, currentBoardId) {
    const isSandstorm =
      Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;
    if (isSandstorm && currentBoardId) {
      const currentBoard = await ReactiveCache.getBoard(currentBoardId);
      await currentBoard.archive();
    }
    const boardId = await this.createBoard(board);
    await this.createSwimlanes(boardId);
    await this.createLists(board, boardId);
    await this.createCards(board, boardId);
    await this.createDependencies(board);
    await this.createRules(board, boardId);
    return boardId;
  }
}
