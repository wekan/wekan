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
// use "subField" for searching inside object Fields.
// For instance '{ 'customFields._id': ['field1','field2']} (subField would be: _id)
class SetFilter {
  constructor(subField = '') {
    this._dep = new Tracker.Dependency();
    this._selectedElements = [];
    this.subField = subField;
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

  toggle(val) {
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

  _getEmptySelector() {
    this._dep.depend();
    let includeEmpty = false;
    this._selectedElements.forEach((el) => {
      if (el === undefined) {
        includeEmpty = true;
      }
    });
    return includeEmpty ? { $eq: [] } : null;
  }
}


// Advanced filter forms a MongoSelector from a users String.
// Build by: Ignatz 19.05.2018 (github feuerball11)
class AdvancedFilter {
  constructor() {
    this._dep = new Tracker.Dependency();
    this._filter = '';
  }

  set(str)
  {
    this._filter = str;
    this._dep.changed();
  }

  reset() {
    this._filter = '';
    this._dep.changed();
  }

  _isActive() {
    this._dep.depend();
    return this._filter !== '';
  }

  _filterToCommands(){
    const commands = [];
    let current = '';
    let string = false;
    let wasString = false;
    let ignore = false;
    for (let i = 0; i < this._filter.length; i++)
    {
      const char = this._filter.charAt(i);
      if (ignore)
      {
        ignore = false;
        continue;
      }
      if (char === '\'')
      {
        string = !string;
        if (string) wasString = true;
        continue;
      }
      if (char === '\\')
      {
        ignore = true;
        continue;
      }
      if (char === ' ' && !string)
      {
        commands.push({'cmd':current, 'string':wasString});
        wasString = false;
        current = '';
        continue;
      }
      current += char;
    }
    if (current !== '')
    {
      commands.push({'cmd':current, 'string':wasString});
    }
    return commands;
  }

  _fieldNameToId(field)
  {
    console.log("searching: "+field);
    const found = CustomFields.findOne({'name':field});
    console.log(found);
    return found._id;
  }

  _arrayToSelector(commands)
  {
    console.log(commands);
    try {
      //let changed = false;
      for (let i = 0; i < commands.length; i++)
      {
        if (!commands[i].string && commands[i].cmd)
        {
          switch (commands[i].cmd)
          {
          case '=':
          case '==':
          case '===':
          {
            const field = commands[i-1].cmd;
            const str = commands[i+1].cmd;
            commands[i] = {'customFields._id':this._fieldNameToId(field), 'customFields.value':str};
            commands.splice(i-1, 1);
            commands.splice(i, 1);
            //changed = true;
            i--;
            break;
          }

          }
        }
      }
    }
    catch (e){return { $in: [] };}
    return {$or: commands};
  }

  _getMongoSelector() {
    this._dep.depend();
    const commands = this._filterToCommands();
    return this._arrayToSelector(commands);
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
  customFields: new SetFilter('_id'),
  advanced: new AdvancedFilter(),

  _fields: ['labelIds', 'members', 'customFields'],

  // We don't filter cards that have been added after the last filter change. To
  // implement this we keep the id of these cards in this `_exceptions` fields
  // and use a `$or` condition in the mongo selector we return.
  _exceptions: [],
  _exceptionsDep: new Tracker.Dependency(),

  isActive() {
    return _.any(this._fields, (fieldName) => {
      return this[fieldName]._isActive();
    }) || this.advanced._isActive();
  },

  _getMongoSelector() {
    if (!this.isActive())
      return {};

    const filterSelector = {};
    const emptySelector = {};
    let includeEmptySelectors = false;
    this._fields.forEach((fieldName) => {
      const filter = this[fieldName];
      if (filter._isActive()) {
        if (filter.subField !== '')
        {
          filterSelector[`${fieldName}.${filter.subField}`] = filter._getMongoSelector();
        }
        else
        {
          filterSelector[fieldName] = filter._getMongoSelector();
        }
        emptySelector[fieldName] = filter._getEmptySelector();
        if (emptySelector[fieldName] !== null) {
          includeEmptySelectors = true;
        }
      }
    });

    const exceptionsSelector = {_id: {$in: this._exceptions}};
    this._exceptionsDep.depend();
    console.log(this.advanced._getMongoSelector());
    if (includeEmptySelectors)
      return {
        $or: [filterSelector, exceptionsSelector, this.advanced._getMongoSelector(), emptySelector],
      };
    else
      return {
        $or: [filterSelector, exceptionsSelector, this.advanced._getMongoSelector()],
      };
  },

  mongoSelector(additionalSelector) {
    const filterSelector = this._getMongoSelector();
    if (_.isUndefined(additionalSelector))
      return filterSelector;
    else
      return {$and: [filterSelector, additionalSelector]};
  },

  reset() {
    this._fields.forEach((fieldName) => {
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
