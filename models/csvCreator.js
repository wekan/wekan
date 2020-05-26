import Boards from './boards';

export class CsvCreator {
  constructor(data) {
    // date to be used for timestamps during import
    this._nowDate = new Date();
    // index to help keep track of what information a column stores
    // each row represents a card
    this.fieldIndex = {};
    this.lists = {};
    // Map of members using username => wekanid
    this.members = data.membersMapping ? data.membersMapping : {};
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

  /**
   * Map the header row titles to an index to help assign proper values to the cards' fields
   * Valid headers (name of card fields):
   * title, description, status, owner, member, label, due date, start date, finish date, created at, updated at
   * Some header aliases can also be accepted.
   * Headers are NOT case-sensitive.
   *
   * @param {Array} headerRow array from row of headers of imported CSV/TSV for cards
   */
  mapHeadertoCardFieldIndex(headerRow) {
    const index = {};
    index.customFields = [];
    for (let i = 0; i < headerRow.length; i++) {
      switch (headerRow[i].trim().toLowerCase()) {
        case 'title':
          index.title = i;
          break;
        case 'description':
          index.description = i;
          break;
        case 'stage':
        case 'status':
        case 'state':
          index.stage = i;
          break;
        case 'owner':
          index.owner = i;
          break;
        case 'members':
        case 'member':
          index.members = i;
          break;
        case 'labels':
        case 'label':
          index.labels = i;
          break;
        case 'due date':
        case 'deadline':
        case 'due at':
          index.dueAt = i;
          break;
        case 'start date':
        case 'start at':
          index.startAt = i;
          break;
        case 'finish date':
        case 'end at':
          index.endAt = i;
          break;
        case 'creation date':
        case 'created at':
          index.createdAt = i;
          break;
        case 'update date':
        case 'updated at':
        case 'modified at':
        case 'modified on':
          index.modifiedAt = i;
          break;
      }
      if (headerRow[i].toLowerCase().startsWith('customfield')) {
        if (headerRow[i].split('-')[2] === 'dropdown') {
          index.customFields.push({
            name: headerRow[i].split('-')[1],
            type: headerRow[i].split('-')[2],
            options: headerRow[i].split('-')[3].split('/'),
            position: i,
          });
        } else if (headerRow[i].split('-')[2] === 'currency') {
          index.customFields.push({
            name: headerRow[i].split('-')[1],
            type: headerRow[i].split('-')[2],
            currencyCode: headerRow[i].split('-')[3],
            position: i,
          });
        } else {
          index.customFields.push({
            name: headerRow[i].split('-')[1],
            type: headerRow[i].split('-')[2],
            position: i,
          });
        }
      }
    }
    this.fieldIndex = index;
  }
  createCustomFields(boardId) {
    this.fieldIndex.customFields.forEach(customField => {
      let settings = {};
      if (customField.type === 'dropdown') {
        settings = {
          dropdownItems: customField.options.map(option => {
            return { _id: Random.id(6), name: option };
          }),
        };
      } else if (customField.type === 'currency') {
        settings = {
          currencyCode: customField.currencyCode,
        };
      } else {
        settings = {};
      }
      const id = CustomFields.direct.insert({
        name: customField.name,
        type: customField.type,
        settings,
        showOnCard: false,
        automaticallyOnCard: false,
        showLabelOnMiniCard: false,
        boardIds: [boardId],
      });
      customField.id = id;
      customField.settings = settings;
    });
  }

  createBoard(csvData) {
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
      //default is private, should inform user.
      permission: 'private',
      slug: 'board',
      stars: 0,
      title: `Imported Board ${this._now()}`,
    };

    // create labels
    const labelsToCreate = new Set();
    for (let i = 1; i < csvData.length; i++) {
      if (csvData[i][this.fieldIndex.labels]) {
        for (const importedLabel of csvData[i][this.fieldIndex.labels].split(
          ' ',
        )) {
          if (importedLabel && importedLabel.length > 0) {
            labelsToCreate.add(importedLabel);
          }
        }
      }
    }
    for (const label of labelsToCreate) {
      let labelName, labelColor;
      if (label.indexOf('-') > -1) {
        labelName = label.split('-')[0];
        labelColor = label.split('-')[1];
      } else {
        labelName = label;
      }
      const labelToCreate = {
        _id: Random.id(6),
        color: labelColor ? labelColor : 'black',
        name: labelName,
      };
      boardToCreate.labels.push(labelToCreate);
    }

    const boardId = Boards.direct.insert(boardToCreate);
    Boards.direct.update(boardId, {
      $set: {
        modifiedAt: this._now(),
      },
    });
    // log activity
    Activities.direct.insert({
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

  createSwimlanes(boardId) {
    const swimlaneToCreate = {
      archived: false,
      boardId,
      createdAt: this._now(),
      title: 'Default',
      sort: 1,
    };
    const swimlaneId = Swimlanes.direct.insert(swimlaneToCreate);
    Swimlanes.direct.update(swimlaneId, { $set: { updatedAt: this._now() } });
    this.swimlane = swimlaneId;
  }

  createLists(csvData, boardId) {
    let numOfCreatedLists = 0;
    for (let i = 1; i < csvData.length; i++) {
      const listToCreate = {
        archived: false,
        boardId,
        createdAt: this._now(),
      };
      if (csvData[i][this.fieldIndex.stage]) {
        const existingList = Lists.find({
          title: csvData[i][this.fieldIndex.stage],
          boardId,
        }).fetch();
        if (existingList.length > 0) {
          continue;
        } else {
          listToCreate.title = csvData[i][this.fieldIndex.stage];
        }
      } else listToCreate.title = `Imported List ${this._now()}`;

      const listId = Lists.direct.insert(listToCreate);
      this.lists[csvData[i][this.fieldIndex.stage]] = listId;
      numOfCreatedLists++;
      Lists.direct.update(listId, {
        $set: {
          updatedAt: this._now(),
          sort: numOfCreatedLists,
        },
      });
    }
  }

  createCards(csvData, boardId) {
    for (let i = 1; i < csvData.length; i++) {
      const cardToCreate = {
        archived: false,
        boardId,
        createdAt:
          csvData[i][this.fieldIndex.createdAt] !== ' ' || ''
            ? this._now(new Date(csvData[i][this.fieldIndex.createdAt]))
            : null,
        dateLastActivity: this._now(),
        description: csvData[i][this.fieldIndex.description],
        listId: this.lists[csvData[i][this.fieldIndex.stage]],
        swimlaneId: this.swimlane,
        sort: -1,
        title: csvData[i][this.fieldIndex.title],
        userId: this._user(),
        startAt:
          csvData[i][this.fieldIndex.startAt] !== ' ' || ''
            ? this._now(new Date(csvData[i][this.fieldIndex.startAt]))
            : null,
        dueAt:
          csvData[i][this.fieldIndex.dueAt] !== ' ' || ''
            ? this._now(new Date(csvData[i][this.fieldIndex.dueAt]))
            : null,
        endAt:
          csvData[i][this.fieldIndex.endAt] !== ' ' || ''
            ? this._now(new Date(csvData[i][this.fieldIndex.endAt]))
            : null,
        spentTime: null,
        labelIds: [],
        modifiedAt:
          csvData[i][this.fieldIndex.modifiedAt] !== ' ' || ''
            ? this._now(new Date(csvData[i][this.fieldIndex.modifiedAt]))
            : null,
      };
      // add the labels
      if (csvData[i][this.fieldIndex.labels]) {
        const board = Boards.findOne(boardId);
        for (const importedLabel of csvData[i][this.fieldIndex.labels].split(
          ' ',
        )) {
          if (importedLabel && importedLabel.length > 0) {
            let labelToApply;
            if (importedLabel.indexOf('-') === -1) {
              labelToApply = board.getLabel(importedLabel, 'black');
            } else {
              labelToApply = board.getLabel(
                importedLabel.split('-')[0],
                importedLabel.split('-')[1],
              );
            }
            cardToCreate.labelIds.push(labelToApply._id);
          }
        }
      }
      // add the members
      if (csvData[i][this.fieldIndex.members]) {
        const wekanMembers = [];
        for (const importedMember of csvData[i][this.fieldIndex.members].split(
          ' ',
        )) {
          if (this.members[importedMember]) {
            const wekanId = this.members[importedMember];
            if (!wekanMembers.find(wId => wId === wekanId)) {
              wekanMembers.push(wekanId);
            }
          }
        }
        if (wekanMembers.length > 0) {
          cardToCreate.members = wekanMembers;
        }
      }
      // add the custom fields
      if (this.fieldIndex.customFields.length > 0) {
        const customFields = [];
        this.fieldIndex.customFields.forEach(customField => {
          if (csvData[i][customField.position] !== ' ') {
            if (customField.type === 'dropdown') {
              customFields.push({
                _id: customField.id,
                value: customField.settings.dropdownItems.find(
                  ({ name }) => name === csvData[i][customField.position],
                )._id,
              });
            } else {
              customFields.push({
                _id: customField.id,
                value: csvData[i][customField.position],
              });
            }
          }
          cardToCreate.customFields = customFields;
        });
        Cards.direct.insert(cardToCreate);
      }
    }
  }

  create(board, currentBoardId) {
    const isSandstorm =
      Meteor.settings &&
      Meteor.settings.public &&
      Meteor.settings.public.sandstorm;
    if (isSandstorm && currentBoardId) {
      const currentBoard = Boards.findOne(currentBoardId);
      currentBoard.archive();
    }
    this.mapHeadertoCardFieldIndex(board[0]);
    const boardId = this.createBoard(board);
    this.createLists(board, boardId);
    this.createSwimlanes(boardId);
    this.createCustomFields(boardId);
    this.createCards(board, boardId);
    return boardId;
  }
}
