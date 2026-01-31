Translation = new Mongo.Collection('translation');

/**
 * A Organization User in wekan
 */
Translation.attachSchema(
  new SimpleSchema({
    language: {
      /**
       * the language
       */
      type: String,
      max: 5,
    },
    text: {
      /**
       * the text
       */
      type: String,
    },
    translationText: {
      /**
       * the translation text
       */
      type: String,
      optional: true,
    },
    createdAt: {
      /**
       * creation date of the translation custom string
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return { $setOnInsert: new Date() };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      type: Date,
      denyUpdate: false,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert || this.isUpsert || this.isUpdate) {
          return new Date();
        } else {
          this.unset();
        }
      },
    },
  }),
);

if (Meteor.isServer) {
  Translation.allow({
    async insert(userId, doc) {
      const user = await ReactiveCache.getUser(userId) || await ReactiveCache.getCurrentUser();
      if (user?.isAdmin)
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    async update(userId, doc) {
      const user = await ReactiveCache.getUser(userId) || await ReactiveCache.getCurrentUser();
      if (user?.isAdmin)
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    async remove(userId, doc) {
      const user = await ReactiveCache.getUser(userId) || await ReactiveCache.getCurrentUser();
      if (user?.isAdmin)
        return true;
      if (!user) {
        return false;
      }
      return doc._id === userId;
    },
    fetch: [],
  });

  Meteor.methods({
    async setCreateTranslation(
      language,
      text,
      translationText,
    ) {
      check(language, String);
      check(text, String);
      check(translationText, String);

      if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
        throw new Meteor.Error('not-authorized');
      }

      const nTexts = (await ReactiveCache.getTranslations({ language, text })).length;
      if (nTexts > 0) {
        throw new Meteor.Error('text-already-taken');
      } else {
        Translation.insert({
          language,
          text,
          translationText,
        });
      }
    },
    async setTranslationText(translation, translationText) {
      check(translation, Object);
      check(translationText, String);

      if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
        throw new Meteor.Error('not-authorized');
      }

      Translation.update(translation, {
        $set: { translationText: translationText },
      });
    },
    async deleteTranslation(translationId) {
      check(translationId, String);

      if (!(await ReactiveCache.getCurrentUser())?.isAdmin) {
        throw new Meteor.Error('not-authorized');
      }

      Translation.remove(translationId);
    },
  });
}

if (Meteor.isServer) {
  // Index for Organization User.
  Meteor.startup(async () => {
    await Translation._collection.createIndexAsync({ modifiedAt: -1 });
  });
}

export default Translation;
