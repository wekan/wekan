// Filtered view manager
// We define local filter objects for each different type of field (SetFilter,
// RangeFilter, dateFilter, etc.). We then define a global `Filter` object whose
// goal is to filter complete documents by using the local filters for each
// fields.

function showFilterSidebar() {
  Sidebar.setView('filter');
}

// Use a "set" filter for a field that is a set of documents uniquely
// identified. For instance `{ labels: ['labelA', 'labelC', 'labelD'] }`.
class SetFilter {
  constructor() {
    this._dep = new Tracker.Dependency();
    this._selectedElements = [];
  }

  isSelected(val) {
    this._dep.depend();
    return this._selectedElements.indexOf(val) > -1;
  }

  add(val) {
    if (this._indexOfVal(val) === -1) {
      this._selectedElements.push(val);
      this._dep.changed();
      showFilterSidebar();
    }
  }

  remove(val) {
    const indexOfVal = this._indexOfVal(val);
    if (this._indexOfVal(val) !== -1) {
      this._selectedElements.splice(indexOfVal, 1);
      this._dep.changed();
    }
  }

  toogle(val) {
    if (this._indexOfVal(val) === -1) {
      this.add(val);
    } else {
      this.remove(val);
    }
  }

  reset() {
    this._selectedElements = [];
    this._dep.changed();
  }

  _indexOfVal(val) {
    return this._selectedElements.indexOf(val);
  }

  _isActive() {
    this._dep.depend();
    return this._selectedElements.length !== 0;
  }

  _getMongoSelector() {
    this._dep.depend();
    return { $in: this._selectedElements };
  }
}

// The global Filter object.
// XXX It would be possible to re-write this object more elegantly, and removing
// the need to provide a list of `_fields`. We also should move methods into the
// object prototype.
Filter = {
  // XXX I would like to rename this field into `labels` to be consistent with
  // the rest of the schema, but we need to set some migrations architecture
  // before changing the schema.
  labelIds: new SetFilter(),
  members: new SetFilter(),

  _fields: ['labelIds', 'members'],

  // We don't filter cards that have been added after the last filter change. To
  // implement this we keep the id of these cards in this `_exceptions` fields
  // and use a `$or` condition in the mongo selector we return.
  _exceptions: [],
  _exceptionsDep: new Tracker.Dependency(),

  isActive() {
    return _.any(this._fields, (fieldName) => {
      return this[fieldName]._isActive();
    });
  },

  _getMongoSelector() {
    if (!this.isActive())
      return {};

    const filterSelector = {};
    _.forEach(this._fields, (fieldName) => {
      const filter = this[fieldName];
      if (filter._isActive())
        filterSelector[fieldName] = filter._getMongoSelector();
    });

    const exceptionsSelector = {_id: {$in: this._exceptions}};
    this._exceptionsDep.depend();

    return {$or: [filterSelector, exceptionsSelector]};
  },

  mongoSelector(additionalSelector) {
    const filterSelector = this._getMongoSelector();
    if (_.isUndefined(additionalSelector))
      return filterSelector;
    else
      return {$and: [filterSelector, additionalSelector]};
  },

  reset() {
    _.forEach(this._fields, (fieldName) => {
      const filter = this[fieldName];
      filter.reset();
    });
    this.resetExceptions();
  },

  addException(_id) {
    if (this.isActive()) {
      this._exceptions.push(_id);
      this._exceptionsDep.changed();
      Tracker.flush();
    }
  },

  resetExceptions() {
    this._exceptions = [];
    this._exceptionsDep.changed();
  },
};

Blaze.registerHelper('Filter', Filter);
