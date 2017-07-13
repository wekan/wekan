Integrations = new Mongo.Collection('integrations');

Integrations.attachSchema(new SimpleSchema({
  enabled: {
    type: Boolean,
    defaultValue: true,
  },
  title: {
    type: String,
    optional: true,
  },
  type: {
    type: String,
  },
  url: { // URL validation regex (https://mathiasbynens.be/demo/url-regex)
    type: String,
  },
  token: {
    type: String,
    optional: true,
  },
  boardId: {
    type: String,
  },
  createdAt: {
    type: Date,
    denyUpdate: false,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert) {
        return new Date();
      } else {
        this.unset();
      }
    },
  },
  userId: {
    type: String,
    autoValue() { // eslint-disable-line consistent-return
      if (this.isInsert || this.isUpdate) {
        return this.userId;
      }
    },
  },
}));

Integrations.allow({
  insert(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  update(userId, doc) {
    return allowIsBoardAdmin(userId, Boards.findOne(doc.boardId));
  },
  fetch: ['boardId'],
});
