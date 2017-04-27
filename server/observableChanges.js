class Message {
  constructor(userId, type, method, doc, selector, fieldNames, modifier) {
    this.userId = userId;
    this.type = type;
    this.method = method;
    this.doc = doc;
    this.selector;
    this.fieldNames = fieldNames;
    this.modifier = modifier;
  }

}

//------------- CARDS --------------------
Cards.before.update(function (userId, doc, fieldNames, modifier, options) {
  Winston.log('info', new Message(userId, 'card', 'update', doc, null, fieldNames, modifier));
});

Cards.before.remove(function (userId, doc) {
  Winston.log('info', new Message(userId, 'card', 'remove', doc));
});

Cards.before.insert(function (userId, doc) {
  Winston.log('info', new Message(userId, 'card', 'insert', doc));
});

Cards.before.upsert(function (userId, selector, modifier, options) {
  Winston.log('info', new Message(userId, 'card', 'update', null, selector, null, modifier));
});


//------------- BOARDS --------------------
Boards.before.update(function (userId, doc, fieldNames, modifier, options) {
  Winston.log('info', new Message(userId, 'board', 'update', doc, null, fieldNames, modifier));
});

Boards.before.remove(function (userId, doc) {
  Winston.log('info', new Message(userId, 'board', 'remove', doc));
});

Boards.before.insert(function (userId, doc) {
  Winston.log('info', new Message(userId, 'board', 'insert', doc));
});

Boards.before.upsert(function (userId, selector, modifier, options) {
  Winston.log('info', new Message(userId, 'board', 'update', null, selector, null, modifier));
});

//------------- LISTS --------------------
Lists.before.update(function (userId, doc, fieldNames, modifier, options) {
  Winston.log('info', new Message(userId, 'list', 'update', doc, null, fieldNames, modifier));
});

Lists.before.remove(function (userId, doc) {
  Winston.log('info', new Message(userId, 'list', 'remove', doc));
});

Lists.before.insert(function (userId, doc) {
  Winston.log('info', new Message(userId, 'list', 'insert', doc));
});

Lists.before.upsert(function (userId, selector, modifier, options) {
  Winston.log('info', new Message(userId, 'list', 'update', null, selector, null, modifier));
});


//------------- CARD COMMENTS --------------------
CardComments.before.update(function (userId, doc, fieldNames, modifier, options) {
  Winston.log('info', new Message(userId, 'card-comments', 'update', doc, null, fieldNames, modifier));
});

CardComments.before.remove(function (userId, doc) {
  Winston.log('info', new Message(userId, 'card-comments', 'remove', doc));
});

CardComments.before.insert(function (userId, doc) {
  Winston.log('info', new Message(userId, 'card-comments', 'insert', doc));
});

CardComments.before.upsert(function (userId, selector, modifier, options) {
  Winston.log('info', new Message(userId, 'card-comments', 'update', null, selector, null, modifier));
});


//------------- USERS --------------------
Users.before.update(function (userId, doc, fieldNames, modifier, options) {
  Winston.log('info', new Message(userId, 'user', 'update', doc, null, fieldNames, modifier));
});

Users.before.remove(function (userId, doc) {
  Winston.log('info', new Message(userId, 'user', 'remove', doc));
});

Users.before.insert(function (userId, doc) {
  Winston.log('info', new Message(userId, 'user', 'insert', doc));
});

Users.before.upsert(function (userId, selector, modifier, options) {
  Winston.log('info', new Message(userId, 'user', 'update', null, selector, null, modifier));
});
