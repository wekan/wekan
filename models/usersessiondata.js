SessionData = new Mongo.Collection('sessiondata');

/**
 * A UserSessionData in Wekan. Organization in Trello.
 */
SessionData.attachSchema(
  new SimpleSchema({
    _id: {
      /**
       * the organization id
       */
      type: Number,
      optional: true,
      // eslint-disable-next-line consistent-return
      autoValue() {
        if (this.isInsert && !this.isSet) {
          return incrementCounter('counters', 'orgId', 1);
        }
      },
    },
    userId: {
      /**
       * userId of the user
       */
      type: String,
      optional: false,
    },
    sessionId: {
      /**
       * unique session ID
       */
      type: String,
      optional: false,
    },
    totalHits: {
      /**
       * total number of hits in the last report query
       */
      type: Number,
      optional: true,
    },
    resultsCount: {
      /**
       * number of results returned
       */
      type: Number,
      optional: true,
    },
    lastHit: {
      /**
       * the last hit returned from a report query
       */
      type: Number,
      optional: true,
    },
    cards: {
      type: [String],
      optional: true,
    },
    selector: {
      type: String,
      optional: true,
      blackbox: true,
    },
    projection: {
      type: String,
      optional: true,
      blackbox: true,
      defaultValue: {},
    },
    errorMessages: {
      type: [String],
      optional: true,
    },
    errors: {
      type: [Object],
      optional: true,
      defaultValue: [],
    },
    'errors.$': {
      type: new SimpleSchema({
        tag: {
          /**
           * i18n tag
           */
          type: String,
          optional: false,
        },
        value: {
          /**
           * value for the tag
           */
          type: String,
          optional: true,
          defaultValue: null,
        },
        color: {
          type: Boolean,
          optional: true,
          defaultValue: false,
        },
      }),
    },
    createdAt: {
      /**
       * creation date of the team
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

SessionData.helpers({
  getSelector() {
    return SessionData.unpickle(this.selector);
  },
  getProjection() {
    return SessionData.unpickle(this.projection);
  },
});

SessionData.unpickle = pickle => {
  return JSON.parse(pickle, (key, value) => {
    return unpickleValue(value);
  });
};

function unpickleValue(value) {
  if (value === null) {
    return null;
  } else if (typeof value === 'object') {
    // eslint-disable-next-line no-prototype-builtins
    if (value.hasOwnProperty('$$class')) {
      switch (value.$$class) {
        case 'RegExp':
          return new RegExp(value.source, value.flags);
        case 'Date':
          return new Date(value.stringValue);
        case 'Object':
          return unpickleObject(value);
      }
    }
  }
  return value;
}

function unpickleObject(obj) {
  const newObject = {};
  Object.entries(obj).forEach(([key, value]) => {
    newObject[key] = unpickleValue(value);
  });
  return newObject;
}

SessionData.pickle = value => {
  return JSON.stringify(value, (key, value) => {
    return pickleValue(value);
  });
};

function pickleValue(value) {
  if (value === null) {
    return null;
  } else if (typeof value === 'object') {
    switch (value.constructor.name) {
      case 'RegExp':
        return {
          $$class: 'RegExp',
          source: value.source,
          flags: value.flags,
        };
      case 'Date':
        return {
          $$class: 'Date',
          stringValue: String(value),
        };
      case 'Object':
        return pickleObject(value);
    }
  }
  return value;
}

function pickleObject(obj) {
  const newObject = {};
  Object.entries(obj).forEach(([key, value]) => {
    newObject[key] = pickleValue(value);
  });
  return newObject;
}

if (!Meteor.isServer) {
  SessionData.getSessionId = () => {
    let sessionId = Session.get('sessionId');
    if (!sessionId) {
      sessionId = `${String(Meteor.userId())}-${String(Math.random())}`;
      Session.set('sessionId', sessionId);
    }

    return sessionId;
  };
}

export default SessionData;
