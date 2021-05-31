ImpersonatedUsers = new Mongo.Collection('impersonatedUsers');

/**
 * A Impersonated User in wekan
 */
ImpersonatedUsers.attachSchema(
  new SimpleSchema({
    adminId: {
      /**
       * the admin userid that impersonates
       */
      type: String,
      optional: true,
    },
    userId: {
      /**
       * the userId that is impersonated
       */
      type: String,
      optional: true,
    },
    boardId: {
      /**
       * the boardId that was exported by anyone that has sometime impersonated
       */
      type: String,
      optional: true,
    },
    attachmentId: {
      /**
       * the attachmentId that was exported by anyone that has sometime impersonated
       */
      type: String,
      optional: true,
    },
    reason: {
      /**
       * the reason why impersonated, like exportJSON
       */
      type: String,
      optional: true,
    },
    createdAt: {
      /**
       * creation date of the impersonation
       */
      type: Date,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert) {
          return new Date();
        } else if (this.isUpsert) {
          return {
            $setOnInsert: new Date(),
          };
        } else {
          this.unset();
        }
      },
    },
    modifiedAt: {
      /**
       * modified date of the impersonation
       */
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

export default ImpersonatedUsers;
