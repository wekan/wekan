// Anytime you change the schema of one of the collection in a non-backward
// compatible way you have to write a migration in this file using the following
// API:
//
//   Migrations.add(name, migrationCallback, optionalOrder);

// In the context of migration functions we don't want to validate database
// mutation queries against the current (ie, latest) collection schema. Doing
// that would work at the time we write the migration but would break in the
// future when we'll update again the concerned collection schema.
//
// To prevent this bug we always have to disable the schema validation and
// argument transformations. We generally use the shorthandlers defined below.
var noValidate = {
  validate: false,
  filter: false,
  autoConvert: false,
  removeEmptyStrings: false,
  getAutoValues: false
};
var noValidateMulti = _.extend(noValidate, { multi: true });

Migrations.add('board-background-color', function() {
  var defaultColor = '#16A085';
  Boards.update({
    background: {
      $exists: false
    }
  }, {
    $set: {
      background: {
        type: 'color',
        color: defaultColor
      }
    }
  }, noValidateMulti);
});

Migrations.add('lowercase-board-permission', function() {
  _.forEach(['Public', 'Private'], function(permission) {
    Boards.update(
      { permission: permission },
      { $set: { permission: permission.toLowerCase() } },
      noValidateMulti
    );
  });
});

// Security migration: see https://github.com/libreboard/libreboard/issues/99
Migrations.add('change-attachments-type-for-non-images', function() {
  var newTypeForNonImage = 'application/octet-stream';
  Attachments.find().forEach(function(file) {
    if (! file.isImage()) {
      Attachments.update(file._id, {
        $set: {
          'original.type': newTypeForNonImage,
          'copies.attachments.type': newTypeForNonImage
        }
      }, noValidate);
    }
  });
});

Migrations.add('card-covers', function() {
  Cards.find().forEach(function(card) {
    var cover =  Attachments.findOne({ cardId: card._id, cover: true });
    if (cover) {
      Cards.update(card._id, {$set: {coverId: cover._id}}, noValidate);
    }
  });
  Attachments.update({}, {$unset: {cover: ''}}, noValidateMulti);
});

Migrations.add('use-css-class-for-boards-colors', function() {
  var associationTable = {
    '#27AE60': 'nephritis',
    '#C0392B': 'pomegranate',
    '#2980B9': 'belize',
    '#8E44AD': 'wisteria',
    '#2C3E50': 'midnight',
    '#E67E22': 'pumpkin'
  };
  Boards.find().forEach(function(board) {
    var oldBoardColor = board.background.color;
    var newBoardColor = associationTable[oldBoardColor];
    Boards.update(board._id, {
      $set: { color: newBoardColor },
      $unset: { background: '' }
    }, noValidate);
  });
});

Migrations.add('denormalize-star-number-per-board', function() {
  Boards.find().forEach(function(board) {
    var nStars = Users.find({'profile.starredBoards': board._id}).count();
    Boards.update(board._id, {$set: {stars: nStars}}, noValidate);
  });
});

// We want to keep a trace of former members so we can efficiently publish their
// infos in the general board publication.
Migrations.add('add-member-isactive-field', function() {
  Boards.find({}, {fields: {members: 1}}).forEach(function(board) {
    var allUsersWithSomeActivity = _.chain(
      Activities.find({boardId: board._id}, {fields:{userId:1}}).fetch())
        .pluck('userId')
        .uniq()
        .value();
    var currentUsers = _.pluck(board.members, 'userId');
    var formerUsers = _.difference(allUsersWithSomeActivity, currentUsers);

    var newMemberSet = [];
    _.forEach(board.members, function(member) {
      member.isActive = true;
      newMemberSet.push(member);
    });
    _.forEach(formerUsers, function(userId) {
      newMemberSet.push({
        userId: userId,
        isAdmin: false,
        isActive: false
      });
    });
    Boards.update(board._id, {$set: {members: newMemberSet}}, noValidate);
  });
});
