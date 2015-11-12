// we can also copy & paste excel data for batch task
// header: (specify the index of fields)
// title description dueDate member member member label label label
// accepted header alias:
// desc -> description
// owner -> member
// type, category, priority -> label

class RedmineImporter {
  constructor() {
    this.list = null;
    this.board = null;
    this.mapName2Id = {};
    this.mapIndex = {};
  }
  
  findIndex(headers) {
    const index = {
      title: -1,
      desc: -1,
      member: [],
      label: [],
      state: -1,
      manHour: -1,
      dueDate: -1,
      createAt: -1,
      updateAt: -1,
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
        index.desc = i;
        break;
      case 'member':
      case 'owner':
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
        index.state = i;
        break;
      case 'manhour':
        index.manHour = i;
        break;
      case 'duedate':
      case 'deadline':
        index.dueDate = i;
        break;
      case 'createat':
        index.createAt = i;
        break;
      case 'updateat':
        index.updateAt = i;
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
      else if (i === index.desc) card.description = item;
      else if (_.contains(index.member, i)) {
        // check the member id
        const userId = mapping[item];
        if (userId && (!_.contains(card.members, userId))) card.members.push(userId);
      } else if (_.contains(index.label, i)) {
        // convert label name to id
        const label = _.findWhere(labels, {name: item});
        if(label) card.labelIds.push(label._id);
      } else if (i === index.createAt) {
        const d = new Date(item);
        if(!isNaN(d.getTime())) card.createAt = d;
      } else if (i === index.updateAt) {
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
}

Meteor.methods({
  importRedmine(rows, data) {
    try {
      check(rows, [[String]]);
      check(data, {
        listId: String,
        sortIndex: Number,
      });
    } catch(e) {
      throw new Meteor.Error('error-json-schema');
    }

    return new RedmineImporter().importCards(rows, data.listId, data.sortIndex);
  },
});
