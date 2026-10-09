import { membersMode, membersMappingFor } from '/models/lib/importMembersMode';
import { Meteor } from 'meteor/meteor';
import { importedTableRows } from './lib/importedTableRows';
import { plannedBoardFields } from './lib/importPipeline';
import { DEFAULT_LIST_NAME, planCsvBoard, resolveCsvMapping } from './lib/csvImportMapping';
import { ReactiveCache } from '/imports/reactiveCache';
import Activities from '/models/activities';
import Boards from './boards';
import Cards from '/models/cards';
import CustomFields from '/models/customFields';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';

// Imports a CSV/TSV text or an Excel sheet - rows of cells, rows[0] the
// header. Which column is which field is the mapping the import page's
// mapping step sent (data.csvMapping), checked against the header, or else
// what the header names say (models/lib/csvImportMapping.js), which also
// decides what every row becomes. This class only writes that plan.
export class CsvCreator {
  // options.title - the board's title (an Excel sheet names its board);
  // options.headerNames - every language's export column names, for tests
  // and callers that have them already.
  constructor(data = {}, options = {}) {
    // date to be used for timestamps during import
    this._nowDate = new Date();
    this.lists = {};
    this.swimlanes = {};
    // Map of members using username => wekanid
    // Who the file's people become - chosen users, placeholders, or the
    // person importing - the same for every source (models/lib/importMembersMode.js).
    this.membersMode = membersMode(data);
    this.members = membersMappingFor(data, () => Meteor.userId());
    this.csvMapping = data.csvMapping;
    this.boardTitle = options.title || '';
    this.headerNames = options.headerNames || null;
    this.swimlane = null;
  }

  /**
   * If dateString is provided,
   * return the Date it represents.
   * If not, will return the date when it was first called.
   * This is useful for us, as we want all import operations to
   * have the exact same date for easier later retrieval.
   *
   * @param {String} dateString a properly formatted Date
   */
  _now(dateString) {
    if (dateString) {
      return new Date(dateString);
    }
    if (!this._nowDate) {
      this._nowDate = new Date();
    }
    return this._nowDate;
  }

  _user(wekanUserId) {
    if (wekanUserId && this.members[wekanUserId]) {
      return this.members[wekanUserId];
    }
    return Meteor.userId();
  }

  // A username of the file as a WeKan user id: the one the members mapping
  // gave it, or the importing user when the name is their own. A name nobody
  // mapped is not looked up among all users - that would put a stranger on
  // the board's cards.
  _userIdOf(username) {
    if (!username) return undefined;
    if (this.members[username]) return this.members[username];
    if (this._importer && this._importer.username === username) return this._importer._id;
    return undefined;
  }

  // The list every card without a list cell goes into, in the importing
  // user's language when the request did not name one.
  _defaultListName() {
    try {
      const { TAPi18n } = require('/imports/i18n');
      const language = (this._importer && this._importer.profile && this._importer.profile.language) || 'en';
      const name = TAPi18n.__('scrum-category-todo', {}, language);
      return name && name !== 'scrum-category-todo' ? name : DEFAULT_LIST_NAME;
    } catch (error) {
      return DEFAULT_LIST_NAME;
    }
  }

  async _headerNames() {
    if (this.headerNames) return this.headerNames;
    if (!Meteor.isServer) return {};
    return require('/server/lib/importHeaderNames').importHeaderNames();
  }

  async createBoard(plan) {
    const boardToCreate = {
      ...plannedBoardFields(this),
      archived: false,
      color: 'belize',
      createdAt: this._now(),
      labels: plan.labels.map(label => ({ _id: Random.id(6), color: label.color, name: label.name })),
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
      //default is private, should inform user.
      permission: 'private',
      slug: 'board',
      stars: 0,
      title: this.boardTitle || `Imported Board ${this._now()}`,
    };
    this.labelIds = {};
    boardToCreate.labels.forEach(label => { this.labelIds[`${label.name}\u0000${label.color}`] = label._id; });

    const boardId = await Boards.direct.insertAsync(boardToCreate);
    await Boards.direct.updateAsync(boardId, {
      $set: {
        modifiedAt: this._now(),
      },
    });
    // log activity
    await Activities.direct.insertAsync({
      activityType: 'importBoard',
      boardId,
      createdAt: this._now(),
      source: {
        id: boardId,
        system: 'CSV/TSV',
      },
      // We attribute the import to current user,
      // not the author from the original object.
      userId: this._user(),
    });
    return boardId;
  }

  async createSwimlanes(plan, boardId) {
    let sort = 0;
    for (const title of plan.swimlanes) {
      sort += 1;
      const swimlaneId = await Swimlanes.direct.insertAsync({
        archived: false,
        boardId,
        createdAt: this._now(),
        title,
        sort,
      });
      await Swimlanes.direct.updateAsync(swimlaneId, { $set: { updatedAt: this._now() } });
      this.swimlanes[title] = swimlaneId;
      if (!this.swimlane) this.swimlane = swimlaneId;
    }
  }

  // One list per list name the plan has - the list cells' values, or the one
  // list every card goes into when the file has no list column.
  async createLists(plan, boardId) {
    let sort = 0;
    for (const title of plan.lists) {
      sort += 1;
      const listId = await Lists.direct.insertAsync({
        archived: false,
        boardId,
        createdAt: this._now(),
        title,
      });
      this.lists[title] = listId;
      await Lists.direct.updateAsync(listId, {
        $set: {
          updatedAt: this._now(),
          sort,
        },
      });
    }
  }

  async createCustomFields(plan, boardId) {
    for (const customField of plan.customFields) {
      let settings = {};
      if (customField.type === 'dropdown' || customField.type === 'dropdownMultiSelect') {
        settings = {
          dropdownItems: customField.options.map(option => {
            return { _id: Random.id(6), name: option };
          }),
        };
      } else if (customField.type === 'currency') {
        settings = {
          currencyCode: customField.currencyCode,
        };
      }
      const id = await CustomFields.direct.insertAsync({
        name: customField.name,
        type: customField.type,
        settings,
        showOnCard: false,
        automaticallyOnCard: false,
        alwaysOnCard: false,
        showLabelOnMiniCard: false,
        boardIds: [boardId],
      });
      customField.id = id;
      customField.settings = settings;
    }
  }

  // A dropdown cell names its item; a multi-select names several, separated
  // by commas. A name the field does not have is left out rather than failing
  // the import.
  _customFieldValue(field, value) {
    if (field.type === 'dropdown') {
      const item = field.settings.dropdownItems.find(({ name }) => name === value);
      return item ? item._id : undefined;
    }
    if (field.type === 'dropdownMultiSelect') {
      const ids = String(value).split(/\s*,\s*/)
        .map(name => field.settings.dropdownItems.find(item => item.name === name))
        .filter(Boolean).map(item => item._id);
      return ids.length ? ids : undefined;
    }
    return value;
  }

  // People named in a "by" cell: the mapped usernames become the card's
  // requesters/assigners, the rest stays as the card's free text.
  _byField(names) {
    const ids = [];
    const text = [];
    names.forEach(name => {
      const id = this._userIdOf(name);
      if (id) { if (!ids.includes(id)) ids.push(id); } else text.push(name);
    });
    return { ids, text: text.join(', ') };
  }

  async createCards(plan, boardId) {
    const cardIdByTitle = {};
    const parents = [];
    for (const card of plan.cards) {
      const cardToCreate = {
        archived: !!card.archived,
        boardId,
        dateLastActivity: this._now(),
        listId: this.lists[card.list],
        swimlaneId: this.swimlanes[card.swimlane] || this.swimlane,
        sort: card.row,
        title: card.title,
        userId: this._userIdOf(card.owner) || this._user(),
        spentTime: card.spentTime === undefined ? null : card.spentTime,
        labelIds: card.labels.map(label => this.labelIds[`${label.name}\u0000${label.color}`]).filter(Boolean),
      };
      if (card.description !== undefined) cardToCreate.description = card.description;
      if (card.archived) cardToCreate.archivedAt = this._now();
      if (card.isOvertime) cardToCreate.isOvertime = true;
      for (const field of ['receivedAt', 'startAt', 'dueAt', 'endAt', 'createdAt', 'modifiedAt']) {
        if (card[field]) cardToCreate[field] = card[field];
      }
      const people = names => [...new Set(names.map(name => this._userIdOf(name)).filter(Boolean))];
      const members = people(card.members);
      if (members.length) cardToCreate.members = members;
      const assignees = people(card.assignees);
      if (assignees.length) cardToCreate.assignees = assignees;
      const requested = this._byField(card.requestedBy);
      if (requested.ids.length) cardToCreate.requesters = requested.ids;
      if (requested.text) cardToCreate.requestedBy = requested.text;
      const assigned = this._byField(card.assignedBy);
      if (assigned.ids.length) cardToCreate.assigners = assigned.ids;
      if (assigned.text) cardToCreate.assignedBy = assigned.text;
      if (plan.customFields.length > 0) {
        cardToCreate.customFields = [];
        for (const { fieldIndex, value } of card.customValues) {
          const field = plan.customFields[fieldIndex];
          const stored = value === undefined ? undefined : this._customFieldValue(field, value);
          if (stored !== undefined) cardToCreate.customFields.push({ _id: field.id, value: stored });
        }
      }
      const cardId = await Cards.direct.insertAsync(cardToCreate);
      if (cardToCreate.title && !cardIdByTitle[cardToCreate.title]) cardIdByTitle[cardToCreate.title] = cardId;
      if (card.parentTitle) parents.push({ cardId, parentTitle: card.parentTitle });
    }
    // The Excel table names a card's parent by title: linked once every card
    // of the board exists, to the first card with that title.
    for (const { cardId, parentTitle } of parents) {
      const parentId = cardIdByTitle[parentTitle];
      if (parentId && parentId !== cardId) {
        await Cards.direct.updateAsync(cardId, { $set: { parentId } });
      }
    }
  }

  async create(board, currentBoardId) {
    const rows = importedTableRows(board);
    if (!rows.length || !Array.isArray(rows[0])) {
      throw new Meteor.Error('error-csv-schema');
    }
    let mapping;
    try {
      mapping = resolveCsvMapping(rows[0], this.csvMapping, await this._headerNames());
    } catch (error) {
      throw new Meteor.Error('invalid-import-mapping', error.message);
    }
    this._importer = Meteor.userId() ? await ReactiveCache.getUser(Meteor.userId()) : null;
    const plan = planCsvBoard(rows, mapping, { defaultListName: this._defaultListName() });
    const isSandstorm =
      Meteor.settings &&
      Meteor.settings.public &&
      Meteor.settings.public.sandstorm;
    if (isSandstorm && currentBoardId) {
      const currentBoard = await ReactiveCache.getBoard(currentBoardId);
      await currentBoard.archive();
    }
    const boardId = await this.createBoard(plan);
    await this.createLists(plan, boardId);
    await this.createSwimlanes(plan, boardId);
    await this.createCustomFields(plan, boardId);
    await this.createCards(plan, boardId);
    return boardId;
  }
}
