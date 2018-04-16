// Anytime you change the schema of one of the collection in a non-backward
// compatible way you have to write a migration in this file using the following
// API:
//
//   Migrations.add(name, migrationCallback, optionalOrder);

// Note that we have extra migrations defined in `sandstorm.js` that are
// exclusive to Sandstorm and shouldn’t be executed in the general case.
// XXX I guess if we had ES6 modules we could
// `import { isSandstorm } from sandstorm.js` and define the migration here as
// well, but for now I want to avoid definied too many globals.

// In the context of migration functions we don't want to validate database
// mutation queries against the current (ie, latest) collection schema. Doing
// that would work at the time we write the migration but would break in the
// future when we'll update again the concerned collection schema.
//
// To prevent this bug we always have to disable the schema validation and
// argument transformations. We generally use the shorthandlers defined below.
const noValidate = {
  validate: false,
  filter: false,
  autoConvert: false,
  removeEmptyStrings: false,
  getAutoValues: false,
};
const noValidateMulti = { ...noValidate, multi: true };

Migrations.add('board-background-color', () => {
  const defaultColor = '#16A085';
  Boards.update({
    background: {
      $exists: false,
    },
  }, {
    $set: {
      background: {
        type: 'color',
        color: defaultColor,
      },
    },
  }, noValidateMulti);
});

Migrations.add('lowercase-board-permission', () => {
  ['Public', 'Private'].forEach((permission) => {
    Boards.update(
      { permission },
      { $set: { permission: permission.toLowerCase() } },
      noValidateMulti
    );
  });
});

// Security migration: see https://github.com/wekan/wekan/issues/99
Migrations.add('change-attachments-type-for-non-images', () => {
  const newTypeForNonImage = 'application/octet-stream';
  Attachments.find().forEach((file) => {
    if (!file.isImage()) {
      Attachments.update(file._id, {
        $set: {
          'original.type': newTypeForNonImage,
          'copies.attachments.type': newTypeForNonImage,
        },
      }, noValidate);
    }
  });
});

Migrations.add('card-covers', () => {
  Cards.find().forEach((card) => {
    const cover =  Attachments.findOne({ cardId: card._id, cover: true });
    if (cover) {
      Cards.update(card._id, {$set: {coverId: cover._id}}, noValidate);
    }
  });
  Attachments.update({}, {$unset: {cover: ''}}, noValidateMulti);
});

Migrations.add('use-css-class-for-boards-colors', () => {
  const associationTable = {
    '#27AE60': 'nephritis',
    '#C0392B': 'pomegranate',
    '#2980B9': 'belize',
    '#8E44AD': 'wisteria',
    '#2C3E50': 'midnight',
    '#E67E22': 'pumpkin',
  };
  Boards.find().forEach((board) => {
    const oldBoardColor = board.background.color;
    const newBoardColor = associationTable[oldBoardColor];
    Boards.update(board._id, {
      $set: { color: newBoardColor },
      $unset: { background: '' },
    }, noValidate);
  });
});

Migrations.add('denormalize-star-number-per-board', () => {
  Boards.find().forEach((board) => {
    const nStars = Users.find({'profile.starredBoards': board._id}).count();
    Boards.update(board._id, {$set: {stars: nStars}}, noValidate);
  });
});

// We want to keep a trace of former members so we can efficiently publish their
// infos in the general board publication.
Migrations.add('add-member-isactive-field', () => {
  Boards.find({}, {fields: {members: 1}}).forEach((board) => {
    const allUsersWithSomeActivity = _.chain(
      Activities.find({ boardId: board._id }, { fields:{ userId:1 }}).fetch())
      .pluck('userId')
      .uniq()
      .value();
    const currentUsers = _.pluck(board.members, 'userId');
    const formerUsers = _.difference(allUsersWithSomeActivity, currentUsers);

    const newMemberSet = [];
    board.members.forEach((member) => {
      member.isActive = true;
      newMemberSet.push(member);
    });
    formerUsers.forEach((userId) => {
      newMemberSet.push({
        userId,
        isAdmin: false,
        isActive: false,
      });
    });
    Boards.update(board._id, {$set: {members: newMemberSet}}, noValidate);
  });
});

Migrations.add('add-sort-checklists', () => {
  Checklists.find().forEach((checklist, index) => {
    if (!checklist.hasOwnProperty('sort')) {
      Checklists.direct.update(
        checklist._id,
        { $set: { sort: index } },
        noValidate
      );
    }
    checklist.items.forEach(function(item, index) {
      if (!item.hasOwnProperty('sort')) {
        Checklists.direct.update(
          { _id: checklist._id, 'items._id': item._id },
          { $set: { 'items.$.sort': index } },
          noValidate
        );
      }
    });
  });
});

Migrations.add('add-swimlanes', () => {
  Boards.find().forEach((board) => {
    const swimlane = Swimlanes.findOne({ boardId: board._id });
    let swimlaneId = '';
    if (swimlane)
      swimlaneId = swimlane._id;
    else
      swimlaneId = Swimlanes.direct.insert({
        boardId: board._id,
        title: 'Default',
      });

    Cards.find({ boardId: board._id }).forEach((card) => {
      if (!card.hasOwnProperty('swimlaneId')) {
        Cards.direct.update(
            { _id: card._id },
            { $set: { swimlaneId } },
            noValidate
        );
      }
    });
  });
});

Migrations.add('add-views', () => {
  Boards.find().forEach((board) => {
    if (!board.hasOwnProperty('view')) {
      Boards.direct.update(
          { _id: board._id },
          { $set: { view: 'board-view-swimlanes' } },
          noValidate
      );
    }
  });
});

Migrations.add('add-checklist-items', () => {
  Checklists.find().forEach((checklist) => {
    // Create new items
    _.sortBy(checklist.items, 'sort').forEach((item, index) => {
      ChecklistItems.direct.insert({
        title: item.title,
        sort: index,
        isFinished: item.isFinished,
        checklistId: checklist._id,
        cardId: checklist.cardId,
      });
    });

    // Delete old ones
    Checklists.direct.update({ _id: checklist._id },
      { $unset: { items : 1 } },
      noValidate
    );
  });
});

Migrations.add('add-profile-view', () => {
  Users.find().forEach((user) => {
    // Set default view
    Users.direct.update(
      { _id: user._id },
      { $set: { 'profile.boardView': 'board-view-lists' } },
      noValidate
    );
  });
});
