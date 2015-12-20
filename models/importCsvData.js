// Exchange cards with excel TSV (tab separated values) or CSV (comma separated values).
// TSV can be directly copied/pasted in Excel, very convenient.
//
// Format of TSV/CSV:
// first row, headers, used to identify columns.
// other rows, each row is data of a card.
//
// Valid headers (name of fields):
// title, description, status, owner, member, label, manHour, dueDate, startDate, finishDate, createdAt, updatedAt
// Member and label columns can be more than one to contain max items.
// Some header aliases can also be accepted.
// Headers are case insensative.
//
// Column to card property mapping:
// title -> title
// description, desc -> description
// status, state, stage -> listId
// owner -> userId
// member -> members
// label, type, category, priority -> labelIds
// manHour -> manHour
// dueDate, deadLine -> dueDate
// startDate -> startDate
// finishDate -> finishDate
// createdAt -> createdAt
// updatedAt -> dateLastActivity
//
// If a row contains member username, label name or list title not existing on board,
// card still imported, with missing mapping ignored.

class CsvDataImporter {
  constructor() {
    this.list = null;
    this.board = null;
    this.mapName2Id = {};
    this.mapIndex = {};
  }

  // columns can be in arbitrary order, identified by headers
  findIndex(headers) {
    const index = {
      title: -1,
      description: -1,
      owner: -1,
      member: [],
      label: [],
      state: -1,
      manHour: -1,
      dueDate: -1,
      createdAt: -1,
      updatedAt: -1,
      startDate: -1,
      finishDate: -1,
    };
    for (let i=0; i<headers.length; i++) {
      switch (headers[i].trim().toLowerCase()) {
      case 'title':
        index.title = i;
        break;
      case 'description':
      case 'desc':
        index.description = i;
        break;
      case 'owner':
        index.owner = i;
        break;
      case 'member':
        index.member.push(i);
        break;
      case 'label':
      case 'type':
      case 'category':
      case 'priority':
        index.label.push(i);
        break;
      case 'state':
      case 'status':
      case 'stage':
        index.state = i;
        break;
      case 'manhour':
        index.manHour = i;
        break;
      case 'duedate':
      case 'deadline':
        index.dueDate = i;
        break;
      case 'createdat':
        index.createdAt = i;
        break;
      case 'updatedat':
        index.updatedAt = i;
        break;
      case 'startdate':
        index.startDate = i;
        break;
      case 'finishdate':
        index.finishDate = i;
        break;
      }
    }
    this.mapIndex = index;
  }

  insertRowAsCard(items, sort) {
    const index = this.mapIndex;
    const mapping = this.mapName2Id;
    const labels = this.board.labels;
    const now = new Date();
    const card = {
      userId: Meteor.userId(),
      title: '',
      archived: false,
      listId: this.list._id,
      boardId: this.board._id,
      createdAt: now,
      dateLastActivity: now,
      sort,
      members: [],
      labelIds: [],
    };
    for (let i=0; i<items.length; i++) {
      const item = items[i].trim();
      if (!item) continue;
      if (i === index.title) card.title = item;
      else if (i === index.description) card.description = item;
      else if (_.contains(index.member, i)) {
        // check the member id
        const userId = mapping[item];
        if (userId && (!_.contains(card.members, userId))) card.members.push(userId);
      } else if (_.contains(index.label, i)) {
        // convert label name to id
        const label = _.findWhere(labels, {name: item});
        if(label) card.labelIds.push(label._id);
      } else if (i === index.createdAt) {
        const d = new Date(item);
        if(!isNaN(d.getTime())) card.createdAt = d;
      } else if (i === index.updatedAt) {
        const d = new Date(item);
        if(!isNaN(d.getTime())) card.dateLastActivity = d;
      } else if (i === index.state) {
        const wantedList = Lists.findOne({
          boardId: this.board._id,
          archived: false,
          title: item,
        });
        if (wantedList) {
          card.listId = wantedList._id;
        }
      } else if (i === index.manHour) {
        const n = parseInt(item, 10);
        if(n > 0) card.manHour = n;
      } else if (i === index.dueDate) {
        const d = new Date(`${item} 12:00:00`);
        if(!isNaN(d.getTime())) card.dueDate = d;
      } else if (i === index.startDate) {
        const d = new Date(`${item} 12:00:00`);
        if(!isNaN(d.getTime())) card.startDate = d;
      } else if (i === index.finishDate) {
        const d = new Date(`${item} 12:00:00`);
        if(!isNaN(d.getTime())) card.finishDate = d;
      }
    }

    return card.title ? Cards.insert(card) : null;
  }

  importCards(rows, listId, sortIndex) {
    this.list = Lists.findOne(listId);
    this.board = this.list.board();
    this.board.memberUsers().forEach((user) => {
      this.mapName2Id[ user.username ] = user._id;
    });

    if (rows.length > 0) {
      this.findIndex(rows.shift());
      const index = this.mapIndex;
      if (index.title >= 0) {
        const cardIds = [];
        rows.forEach((row) => {
          const cardId = this.insertRowAsCard(row, sortIndex++);
          if (cardId) cardIds.push(cardId);
        });
        return cardIds;
      }
    }

    throw new Meteor.Error('error-json-schema');
  }

  exportCards(filter, boardId, tsv) {
    const cards = Cards.find(filter, { sort: ['listId', 'sort'] }).fetch();

    const separator = tsv ? '\t' : ',';
    const board = Boards.findOne(boardId);
    const users = board.memberUsers().fetch();
    const lists = board.lists().fetch();
    const mapuser = {};
    const maplist = {};
    const maplabel = {};
    users.forEach((user) => {
      mapuser[user._id] = user.username;
    });
    lists.forEach((list) => {
      maplist[list._id] = list.title;
    });
    board.labels.forEach((label) => {
      maplabel[label._id] = label.name || label.color;
    });

    let maxMembers = 1;
    let maxLabels = 1;
    cards.forEach((card) => {
      if(card.members && card.members.length > maxMembers) maxMembers = card.members.length;
      if(card.labelIds && card.labelIds.length > maxLabels) maxLabels = card.labelIds.length;
    });
    // create multiple columns of member & label to contain max items
    const hMembers = _.range(maxMembers).map(() => 'member');
    const hLabels = _.range(maxLabels).map(() => 'label');
    const headers = ['title', 'description', 'status', 'owner', ...hMembers, ...hLabels,
                     'manHour', 'dueDate', 'startDate', 'finishDate', 'createdAt', 'updatedAt'];
    const rows = [ headers.join(separator) ];

    cards.forEach((card) => {
      const usernames = (card.members) ? card.members.map((memberId) => mapuser[memberId]) : [];
      _.times(maxMembers - usernames.length, () => usernames.push(''));
      const labels = (card.labelIds) ? card.labelIds.map((labelId) => maplabel[labelId]) : [];
      _.times(maxLabels - labels.length, () => labels.push(''));
      const fields = [`"${card.title}"`,
                      `"${card.description || ''}"`,
                      maplist[card.listId],
                      mapuser[card.userId],
                      ...usernames,
                      ...labels,
                      card.manHour || '',
                      card.dueDate ? moment(card.dueDate).format('YYYY-MM-DD') : '',
                      card.startDate ? moment(card.startDate).format('YYYY-MM-DD') : '',
                      card.finishDate ? moment(card.finishDate).format('YYYY-MM-DD') : '',
                      card.createdAt ? moment(card.createdAt).format('YYYY-MM-DD HH:mm:ss') : '',
                      card.dateLastActivity ? moment(card.dateLastActivity).format('YYYY-MM-DD HH:mm:ss') : '',
                     ];
      rows.push( fields.join(separator) );
    });

    return rows.join('\n');
  }
}

Meteor.methods({
  importCsvData(rows, data) {
    try {
      // TSV/CSV already parsed into data grid of strings on client-side
      check(rows, [[String]]);
      check(data, {
        listId: String,
        sortIndex: Number,
      });
    } catch(e) {
      throw new Meteor.Error('error-json-schema');
    }
    return new CsvDataImporter().importCards(rows, data.listId, data.sortIndex);
  },
  exportCsvData(selector, boardId, tsv) {
    try {
      check(selector, Match.OneOf(Match.ObjectIncluding({ $and: Match.Any }), String, null));
      check(boardId, String);
      check(tsv, Boolean);
      if (!selector) selector = { boardId, archived:false };
      else if (typeof selector === 'string') selector = {listId:selector, boardId, archived:false };
    } catch(e) {
      throw new Meteor.Error('error-json-schema');
    }
    return new CsvDataImporter().exportCards(selector, boardId, tsv);
  },
});
