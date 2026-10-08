import { adfPlainText } from './lib/externalParsers';
import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from './boards';
import Cards from '/models/cards';
import CustomFields from '/models/customFields';
const { jiraTimeTracking, JIRA_ESTIMATE_FIELDS } = require('./lib/jiraTimeTracking');
const { jiraScrumMetadata, jiraScrumListCategories } = require('./lib/jiraScrumMetadata');
const { validateJiraEstimateMapping, jiraEstimateValue } = require('./lib/jiraEstimateMapping');
const { jiraScrumPlanning } = require('./lib/jiraScrumPlanning');
const { normalizeScrumTransfer } = require('./lib/scrumTransfer');
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { plannedBoardFields, writeImportedEntity } from '/models/lib/importPipeline';
import {
  insertImportedChecklists,
  insertImportedComments,
  recordImportLosses,
} from '/models/lib/importedCardChildren';
import {
  importedChecklists,
  importedComment,
  importedCustomFieldValues,
  planImportedCustomFields,
} from '/models/lib/importedTaskPlan';
import { jiraIssueExtras, jiraPageWarnings } from '/models/lib/jiraIssueExtras';
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
    // Imported names are data, including names such as "constructor".
    this.lists = Object.create(null);
    this.swimlane = null;
    // #3392: Jira issue key -> new card id, for mapping issue links to
    // card-to-card dependencies ("Red Strings") after all cards are created.
    this.cardsByKey = Object.create(null);
    this.timeFields = {};
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

  // Comments, sub-tasks, parent, custom fields and extra labels of one issue
  // (models/lib/jiraIssueExtras.js), computed once per issue.
  _extras(data, issue) {
    if (!this.extras) this.extras = new Map();
    if (!this.extras.has(issue)) {
      const importedKeys = new Set(this._issues(data).map(i => i && i.key).filter(Boolean));
      const skipFields = [...(this.estimateMapping ? [this.estimateMapping.estimateFieldId] : []),
        ...(this.planning ? this.planning.skipFields : [])];
      this.extras.set(issue, jiraIssueExtras(issue, {
        names: (data && !Array.isArray(data) && data.names) || {}, importedKeys, skipFields,
      }));
    }
    return this.extras.get(issue);
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
      ...plannedBoardFields(this),
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

    // Jira labels, priorities, components and fix versions => board labels.
    const labelNames = new Set();
    for (const issue of this._issues(data)) {
      const labels = (issue.fields && issue.fields.labels) || [];
      labels.forEach(l => labelNames.add(l));
      this._extras(data, issue).tags.forEach(t => labelNames.add(t));
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
    const categories = jiraScrumListCategories(this._issues(data));
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
        ...(categories.has(statusName) ? { scrum: { category: categories.get(statusName) }, scrumRevision: 1 } : {}),
        sort,
      });
      this.lists[statusName] = listId;
      sort += 1;
    }
  }

  async createTimeFields(data, boardId) {
    if (this.estimateMapping) {
      const { estimateFieldId, estimateUnit } = this.estimateMapping;
      this.estimateFieldId = await CustomFields.direct.insertAsync({
        boardIds: [boardId], name: `Jira estimate (${estimateUnit})`, type: 'number',
        settings: { jiraEstimateFieldId: estimateFieldId, jiraEstimateUnit: estimateUnit },
        showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false, showLabelOnMiniCard: false,
      });
      await Boards.direct.updateAsync(boardId, { $set: { scrum: { estimateSource: 'customField',
        estimateCustomFieldId: this.estimateFieldId, estimateUnit }, scrumRevision: 1 } });
    }
    const values = this._issues(data).map(issue => jiraTimeTracking(issue.fields));
    for (const field of JIRA_ESTIMATE_FIELDS) {
      if (!values.some(value => value[field.key] !== undefined)) continue;
      this.timeFields[field.key] = await CustomFields.direct.insertAsync({
        boardIds: [boardId], name: field.name, type: 'number', settings: { jiraTimeField: field.key },
        showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false,
        showLabelOnMiniCard: false,
      });
    }
  }

  async createCards(data, boardId) {
    const board = await ReactiveCache.getBoard(boardId);
    const issues = this._issues(data);
    const extras = issues.map(issue => this._extras(data, issue));
    const fieldPlan = planImportedCustomFields(extras).fields;
    const fieldIds = {};
    for (const field of fieldPlan) {
      fieldIds[field.name] = await writeImportedEntity(CustomFields, {
        boardIds: [boardId], name: field.name, type: field.type, settings: {},
        showOnCard: false, automaticallyOnCard: false, alwaysOnCard: false,
        showLabelOnMiniCard: false, createdAt: this._now(),
      });
    }
    for (let index = 0; index < issues.length; index += 1) {
      const issue = issues[index];
      const extra = extras[index];
      const fields = issue.fields || {};
      const statusName = (fields.status && fields.status.name) || 'Imported';
      const titleParts = [];
      if (issue.key) titleParts.push(`[${issue.key}]`);
      if (fields.summary) titleParts.push(fields.summary);

      const cardToCreate = {
        archived: false,
        boardId,
        dateLastActivity: this._now(),
        description: adfPlainText(fields.description),
        listId: this.lists[statusName],
        swimlaneId: this.swimlane,
        // Search order, which is the JQL's ORDER BY.
        sort: index,
        title: titleParts.join(' ') || 'Imported issue',
        userId: this._user(),
        labelIds: [],
      };
      const time = jiraTimeTracking(fields);
      const { card: scrum } = jiraScrumMetadata(fields);
      if (Object.keys(scrum).length) {
        cardToCreate.scrum = scrum;
        cardToCreate.scrumRevision = 1;
      }
      if (time.spent !== undefined) cardToCreate.spentTime = time.spent;
      cardToCreate.customFields = JIRA_ESTIMATE_FIELDS
        .filter(field => time[field.key] !== undefined && this.timeFields[field.key])
        .map(field => ({ _id: this.timeFields[field.key], value: time[field.key] }));
      const estimate = jiraEstimateValue(fields, this.estimateMapping);
      if (estimate !== undefined) cardToCreate.customFields.push({ _id: this.estimateFieldId, value: estimate });
      importedCustomFieldValues(extra, fieldPlan)
        .forEach(({ name, value }) => cardToCreate.customFields.push({ _id: fieldIds[name], value }));
      // Jira's REPORTER is WeKan's "Requested By": the person who asked for the
      // work, as opposed to the assignee who does it. It is a free-text field
      // here, so it takes the display name rather than needing a mapped user -
      // which is what makes it survive an import from a Jira nobody on this
      // board has an account on.
      const reporter = fields.reporter;
      if (reporter) {
        cardToCreate.requestedBy = reporter.displayName || reporter.name
          || reporter.emailAddress || reporter.accountId || '';
      }
      if (fields.created) cardToCreate.createdAt = this._now(fields.created);
      if (fields.duedate) cardToCreate.dueAt = this._now(fields.duedate);
      if (fields.updated) cardToCreate.modifiedAt = this._now(fields.updated);

      // Labels.
      for (const labelName of [...(fields.labels || []), ...extra.tags]) {
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
      const cardId = await writeImportedEntity(Cards, cardToCreate);
      if (issue.key) this.cardsByKey[issue.key] = cardId;
      await insertImportedChecklists(importedChecklists(extra.checklists), { boardId, cardId, now: this._now() });
      const comments = extra.comments.map(c => importedComment(c, this.members)).filter(Boolean);
      await insertImportedComments(comments, { boardId, cardId, now: this._now(), importerId: this._user() });
    }
    // Sub-tasks and child issues imported together keep their parent; a
    // legacy Epic Link names the card's epic the same way.
    for (let index = 0; index < issues.length; index += 1) {
      const parentKey = extras[index].parentKey || (this.planning && this.planning.epicParents[issues[index].key]);
      const parentId = parentKey && this.cardsByKey[parentKey];
      const cardId = this.cardsByKey[issues[index].key];
      if (parentId && cardId && parentId !== cardId) {
        await Cards.direct.updateAsync(cardId, { $set: { parentId } });
      }
    }
  }

  // #3392: best-effort mapping of Jira issue links to card-to-card dependencies
  // ("Red Strings"). Jira link type names are matched loosely: "blocks" maps to
  // blocks / is-blocked-by; "Duplicate" maps to duplicates / is-duplicated-by.
  // Other configured link names retain the existing related-to fallback.
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
          else if (typeName === 'duplicate' || typeName === 'duplicates') depType = 'duplicates';
        } else if (link.inwardIssue) {
          targetKey = link.inwardIssue.key;
          if (typeName.includes('block')) depType = 'is-blocked-by';
          else if (typeName === 'duplicate' || typeName === 'duplicates') depType = 'is-duplicated-by';
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

  // The planning data, written as a native Scrum import is: sprints and
  // releases under new ids, each card's sprint, release and backlog rank, and
  // the board's Scrum settings (server/lib/scrumTransferImport.js).
  async createScrumPlanning(boardId) {
    if (!this.planning || !this.planning.transfer) return;
    const { importScrumTransfer } = require('/server/lib/scrumTransferImport');
    await importScrumTransfer({ cards: this.cardsByKey, lists: {}, swimlanes: {}, members: {},
      customFields: this.estimateFieldId ? { 'jira-estimate': this.estimateFieldId } : {} },
    { scrumTransfer: this.planning.transfer }, boardId);
  }

  async create(board, currentBoardId) {
    // Validate before archiving a Sandstorm board or creating any documents.
    try { this.estimateMapping = validateJiraEstimateMapping(board); }
    catch (error) { throw new Meteor.Error('invalid-jira-estimate', error.message); }
    try { jiraScrumListCategories(this._issues(board)); }
    catch (error) { throw new Meteor.Error('invalid-jira-scrum', error.message); }
    for (const issue of this._issues(board)) {
      try { jiraTimeTracking(issue.fields); }
      catch (error) { throw new Meteor.Error('invalid-jira-time', error.message); }
    }
    // Sprints, fix versions, rank and epic links (models/lib/jiraScrumPlanning.js),
    // checked as a native Scrum transfer before anything is written.
    try {
      this.planning = jiraScrumPlanning(board, { estimate: this.estimateMapping
        ? { sourceId: 'jira-estimate', unit: this.estimateMapping.estimateUnit } : null });
      if (this.planning.transfer) normalizeScrumTransfer(this.planning.transfer);
    } catch (error) { throw new Meteor.Error('invalid-jira-scrum', error.message); }
    const isSandstorm =
      Meteor.settings && Meteor.settings.public && Meteor.settings.public.sandstorm;
    if (isSandstorm && currentBoardId) {
      const currentBoard = await ReactiveCache.getBoard(currentBoardId);
      await currentBoard.archive();
    }
    const boardId = await this.createBoard(board);
    await this.createSwimlanes(boardId);
    await this.createLists(board, boardId);
    await this.createTimeFields(board, boardId);
    await this.createCards(board, boardId);
    await this.createDependencies(board);
    await this.createScrumPlanning(boardId);
    await this.createRules(board, boardId);
    const issues = this._issues(board);
    await recordImportLosses({
      source: 'jira',
      warnings: jiraPageWarnings(board),
      unsupported: [
        ...issues.flatMap(issue => this._extras(board, issue).unsupported),
        ...this.planning.losses,
        ...planImportedCustomFields(issues.map(issue => this._extras(board, issue))).unsupported,
      ],
      boardId,
      boardTitle: (board.board && board.board.name) || undefined,
      userId: Meteor.userId(),
    });
    return boardId;
  }
}
