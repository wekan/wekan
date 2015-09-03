Meteor.subscribe('unsaved-edits');

// `UnsavedEdits` is a global key-value store used to save drafts of user
// inputs. We used to have the notion of a `cachedValue` that was local to a
// component but the global store has multiple advantages:
// 1. When the component is unmounted (ie, destroyed) the draft isn't lost
// 2. The drafts are synced across multiple computers
// 3. The drafts are synced across multiple browser tabs
//    XXX This currently doesn't work in purely offline mode since the sync is
//    handled with the DDP connection to the server. To solve this, we could use
//    something like GroundDB that syncs using localstorage.
//
// The key is a dictionary composed of two fields:
// * a `fieldName` which identifies the particular field. Since this is a global
//   identifier a good practice would be to compose it with the collection name
//   and the document field, eg. `boardTitle`, `cardDescription`.
// * a `docId` which identifies the appropriate document. In general we use
//   MongoDB `_id` field.
//
// The value is a string containing the draft.

UnsavedEdits = {
  // XXX Wanted to have the collection has an instance variable, but
  // unfortunately the collection isn't defined yet at this point. We need ES6
  // modules to solve the file order issue!
  //
  // _collection: UnsavedEditCollection,

  get({ fieldName, docId }, defaultTo = '') {
    const unsavedValue = this._getCollectionDocument(fieldName, docId);
    if (unsavedValue) {
      return unsavedValue.value;
    } else {
      return defaultTo;
    }
  },

  has({ fieldName, docId }) {
    return Boolean(this.get({fieldName, docId}));
  },

  set({ fieldName, docId }, value) {
    const currentDoc = this._getCollectionDocument(fieldName, docId);
    if (currentDoc) {
      UnsavedEditCollection.update(currentDoc._id, { $set: { value }});
    } else {
      UnsavedEditCollection.insert({
        fieldName,
        docId,
        value,
      });
    }
  },

  reset({ fieldName, docId }) {
    const currentDoc = this._getCollectionDocument(fieldName, docId);
    if (currentDoc) {
      UnsavedEditCollection.remove(currentDoc._id);
    }
  },

  _getCollectionDocument(fieldName, docId) {
    return UnsavedEditCollection.findOne({fieldName, docId});
  },
};

Blaze.registerHelper('getUnsavedValue', (fieldName, docId, defaultTo) => {
  // Workaround some blaze feature that ass a list of keywords arguments as the
  // last parameter (even if the caller didn't specify any).
  if (!_.isString(defaultTo)) {
    defaultTo = '';
  }
  return UnsavedEdits.get({ fieldName, docId }, defaultTo);
});

Blaze.registerHelper('hasUnsavedValue', (fieldName, docId) => {
  return UnsavedEdits.has({ fieldName, docId });
});
