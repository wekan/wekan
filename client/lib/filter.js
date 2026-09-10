import { Blaze } from 'meteor/blaze';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
import { 
  formatDateTime, 
  formatDate, 
  formatTime, 
  getISOWeek, 
  isValidDate, 
  isBefore, 
  isAfter, 
  isSame, 
  add, 
  subtract, 
  startOf, 
  endOf, 
  format, 
  parseDate, 
  now, 
  createDate, 
  fromNow, 
  calendar
} from '/imports/lib/dateUtils';
import {
  tokenizeAdvancedFilter,
  parseAdvancedFilterDate,
  buildDateValueSelector,
  advancedFilterCommandsToSelector,
} from '/imports/lib/advancedFilter';
import { weekRange } from '/models/lib/weekStart';
import { Session } from 'meteor/session';
import { boardScopedFilterSelector } from '/models/lib/boardScopedSelection';
// Sidebar is imported late to avoid circular dependency (sidebar.js needs its
// jade template loaded first, but router.js → filter.js would load it too early)
let _Sidebar;
function getSidebar() {
  if (!_Sidebar) {
    _Sidebar = require('/client/features/sidebar/service').getSidebarInstance;
  }
  return _Sidebar();
}

// Filtered view manager
// We define local filter objects for each different type of field (SetFilter,
// RangeFilter, dateFilter, etc.). We then define a global `Filter` object whose
// goal is to filter complete documents by using the local filters for each
// fields.
function showFilterSidebar() {
  getSidebar().setView('filter');
}

class DateFilter {
  constructor() {
    this._dep = new Tracker.Dependency();
    this.subField = ''; // Prevent name mangling in Filter
    this._filter = null;
    this._filterState = null;
  }

  _updateState(state) {
    this._filterState = state;
    showFilterSidebar();
    this._dep.changed();
  }

  // past builds a filter for all dates before now
  past() {
    if (this._filterState == 'past') {
      this.reset();
      return;
    }
    this._filter = { $lte: now() };
    this._updateState('past');
  }

  // today is a convenience method for calling relativeDay with 0
  today() {
    if (this._filterState == 'today') {
      this.reset();
      return;
    }
    this.relativeDay(0);
    this._updateState('today');
  }

  // tomorrow is a convenience method for calling relativeDay with 1
  tomorrow() {
    if (this._filterState == 'tomorrow') {
      this.reset();
      return;
    }
    this.relativeDay(1);
    this._updateState('tomorrow');
  }

  // thisWeek is a convenience method for calling relativeWeek with 1
  thisWeek() {
    this.relativeWeek(1, 'this')
  }

  // nextWeek is a convenience method for calling relativeWeek with 1
  nextWeek() {
    this.relativeWeek(1, 'next')
  }

  // relativeDay builds a filter starting from now and including all
  // days up to today +/- offset.
  relativeDay(offset) {
    if (this._filterState == 'day') {
      this.reset();
      return;
    }

    var startDay = startOf(now(), 'day'),
      endDay = endOf(add(now(), offset, 'day'), 'day');

    if (offset >= 0) {
      this._filter = { $gte: startDay, $lte: endDay };
    } else {
      this._filter = { $lte: startDay, $gte: endDay };
    }

    this._updateState('day');
  }

  // relativeWeek builds a filter starting from today (for this week)
  // or 7 days after (for next week) and including all
  // weeks up to today +/- offset. This considers the user's preferred
  // start of week day (as defined by Meteor).
  relativeWeek(offset, week) {
    // #4881: toggle per-week so clicking the same button again clears it, but
    // clicking the OTHER week switches to it instead of just resetting (the old
    // code reset on either state, so you could not go straight from "this week"
    // to "next week").
    const targetState = week === 'next' ? 'nextweek' : 'thisweek';
    if (this._filterState === targetState) {
      this.reset();
      return;
    }

    // #4881: the old window came from startOf(now(), 'week'), but native
    // dateUtils.startOf() has no 'week' case, so it returned "now" unchanged and
    // the window started at today + startDayOfWeek — i.e. it selected NEXT
    // week's cards for "this week" and ignored the configured start weekday.
    // weekRange() computes the correct window that CONTAINS today for the user's
    // configured start day of week (0=Sunday..6=Saturday, default Monday).
    const currentUser = ReactiveCache.getCurrentUser();
    const weekStartDay = currentUser ? currentUser.getStartDayOfWeek() : 1;
    const weekOffset = week === 'next' ? 1 : 0;
    const { start: WeekStart, end: WeekEnd } = weekRange(now(), weekStartDay, weekOffset);

    this._updateState(targetState);

    if (offset >= 0) {
      this._filter = { $gte: WeekStart, $lte: WeekEnd };
    } else {
      this._filter = { $lte: WeekStart, $gte: WeekEnd };
    }
  }

  // noDate builds a filter for items where date is not set
  noDate() {
    if (this._filterState == 'noDate') {
      this.reset();
      return;
    }
    this._filter = null;
    this._updateState('noDate');
  }

  reset() {
    this._filter = null;
    this._filterState = null;
    this._dep.changed();
  }

  isSelected(val) {
    this._dep.depend();
    return this._filterState == val;
  }

  _isActive() {
    this._dep.depend();
    return this._filterState !== null;
  }

  _getMongoSelector() {
    this._dep.depend();
    // #6483: cards with NO due/end/received date store the field as null — that
    // is exactly what the noDate filter matches ({dueAt: null}). A comparison
    // filter such as Overdue/"past" is `{$lte: now}`, and `$lte` MATCHES null
    // under FerretDB and minimongo (null sorts before dates; neither implements
    // MongoDB's type-bracketing), so "Overdue" listed every card that has no due
    // date at all. Require a real, non-null value for any comparison selector so
    // only actual dates match. The noDate filter (this._filter === null) returns
    // null unchanged and is unaffected.
    if (this._filter && typeof this._filter === 'object') {
      return { ...this._filter, $ne: null };
    }
    return this._filter;
  }

  _getEmptySelector() {
    this._dep.depend();
    return null;
  }
}

class StringFilter {
  constructor() {
    this._dep = new Tracker.Dependency();
    this.subField = ''; // Prevent name mangling in Filter
    this._filter = '';
  }

  set(str) {
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

  _getMongoSelector() {
    this._dep.depend();
    return {$regex : this._filter, $options: 'i'};
  }

  _getEmptySelector() {
    this._dep.depend();
    return {$regex : this._filter, $options: 'i'};
  }
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

  // #319: a reactive snapshot of the selected values, used to mirror the
  // filter's state into the URL query string as the user changes it (the
  // write direction of #4540's read-on-load `?assignee=`/`?member=`/`?label=`
  // support). Returns a copy so callers cannot mutate internal state.
  list() {
    this._dep.depend();
    return this._selectedElements.slice();
  }

  add(val) {
    if (this._indexOfVal(val) === -1) {
      this._selectedElements.push(val);
      this._dep.changed();
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
    return {
      $in: this._selectedElements,
    };
  }

  _getEmptySelector() {
    this._dep.depend();
    let includeEmpty = false;
    this._selectedElements.forEach(el => {
      if (el === undefined) {
        includeEmpty = true;
      }
    });
    return includeEmpty
      ? {
          $eq: [],
        }
      : null;
  }

  // #2886: the inverse of `_getMongoSelector` — matches documents whose
  // field does NOT contain any of the selected values, used to EXCLUDE
  // cards that carry a given label rather than requiring one.
  _getExcludedMongoSelector() {
    this._dep.depend();
    return {
      $nin: this._selectedElements,
    };
  }
}

// Advanced filter forms a MongoSelector from a users String.
// Build by: Ignatz 19.05.2018 (github feuerball11)
class AdvancedFilter {
  constructor() {
    this._dep = new Tracker.Dependency();
    this._filter = '';
    this._lastValide = {};
  }

  set(str) {
    this._filter = str;
    this._dep.changed();
  }

  reset() {
    this._filter = '';
    this._lastValide = {};
    this._dep.changed();
  }

  _isActive() {
    this._dep.depend();
    return this._filter !== '';
  }

  _filterToCommands() {
    // #2989: tokenizing lives in /imports/lib/advancedFilter.js so slashes
    // inside quoted values (dates like '06/04/2020') stay literal strings.
    return tokenizeAdvancedFilter(this._filter);
  }

  _fieldNameToId(field) {
    const found = ReactiveCache.getCustomField({
      name: field,
    });
    return found._id;
  }

  _fieldValueToId(field, value) {
    const found = ReactiveCache.getCustomField({
      name: field,
    });
    if (
      found.settings.dropdownItems &&
      found.settings.dropdownItems.length > 0
    ) {
      for (let i = 0; i < found.settings.dropdownItems.length; i++) {
        if (found.settings.dropdownItems[i].name === value) {
          return found.settings.dropdownItems[i]._id;
        }
      }
    }
    return value;
  }

  // #2989: date custom fields store Date objects (the date picker calls
  // card.setCustomField(id, date)), so comparing them against the typed
  // string / parseInt() number can never match. When the field is date-typed
  // and the value parses as a date, compare with a Date range instead.
  // Returns the operator document for 'customFields.value', or null to fall
  // back to the generic string/number selector.
  _customFieldDateSelector(field, str, op) {
    const found = ReactiveCache.getCustomField({
      name: field,
    });
    if (!found || found.type !== 'date') return null;
    // Disambiguate '06/04/2020' (both parts <= 12) with the user's date
    // format preference: day-first formats (DD/MM/YYYY, DD.MM.YYYY) read it
    // as 6 April, otherwise it is read month-first as 4 June.
    let dayFirst = false;
    try {
      const user = ReactiveCache.getCurrentUser();
      const dateFormat =
        user && typeof user.getDateFormat === 'function'
          ? user.getDateFormat()
          : 'YYYY-MM-DD';
      dayFirst = /^D/.test(dateFormat);
    } catch (error) {
      dayFirst = false;
    }
    const range = parseAdvancedFilterDate(str, { dayFirst });
    if (!range) return null;
    return buildDateValueSelector(op, range);
  }

  // #3092: the command-array -> Mongo selector algorithm (sub-expressions,
  // comparisons, and/or/not) now lives in /imports/lib/advancedFilter.js as
  // advancedFilterCommandsToSelector(), so the "card matches advanced filter"
  // rule trigger can reuse the exact same function server-side instead of a
  // parallel reimplementation. Only the three lookups that need live board
  // data stay here, bound to ReactiveCache.
  _arrayToSelector(commands) {
    try {
      const selector = advancedFilterCommandsToSelector(commands, {
        fieldNameToId: this._fieldNameToId.bind(this),
        fieldValueToId: this._fieldValueToId.bind(this),
        customFieldDateSelector: this._customFieldDateSelector.bind(this),
      });
      this._lastValide = selector;
      return selector;
    } catch (e) {
      return this._lastValide;
    }
  }

  _getMongoSelector() {
    this._dep.depend();
    const commands = this._filterToCommands();
    return this._arrayToSelector(commands);
  }
  getRegexSelector() {
    // generate a regex for filter list
    this._dep.depend();
    return new RegExp(
      `^.*${this._filter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*$`,
      'i',
    );
  }
}

// The global Filter object.
// XXX It would be possible to re-write this object more elegantly, and removing
// the need to provide a list of `_fields`. We also should move methods into the
// object prototype.
export const Filter = {
  // XXX I would like to rename this field into `labels` to be consistent with
  // the rest of the schema, but we need to set some migrations architecture
  // before changing the schema.
  labelIds: new SetFilter(),
  // #2886: labels the user clicked a THIRD time — cards carrying one of
  // these are excluded even if they also match `labelIds`. Kept as a
  // separate SetFilter (mirroring `labelIds`'s API/shape) rather than a
  // third value inside `labelIds` so the two remain independent reactive
  // sets and the existing `_fields` machinery for every other filter type
  // is untouched.
  excludedLabelIds: new SetFilter(),
  members: new SetFilter(),
  assignees: new SetFilter(),
  // #3681: filter cards by who created them. The card schema's author
  // field is `userId` (see models/cards.js), not `creatorId` — the
  // filter is keyed the same way so `_getMongoSelector()` below can map
  // `_fields` entries straight onto card document field names, the same
  // way `labelIds`/`members`/`assignees` already do. Same SetFilter
  // shape/API as every other id-set filter, so no new filtering engine
  // was needed.
  userId: new SetFilter(),
  archive: new SetFilter(),
  hideEmpty: new SetFilter(),
  dueAt: new DateFilter(),
  title: new StringFilter(),
  customFields: new SetFilter('_id'),
  // #3392: filter cards by their dependency ("Red Strings") relation type.
  cardDependencies: new SetFilter('type'),
  advanced: new AdvancedFilter(),
  lists: new AdvancedFilter(), // we need the ability to filter list by name as well

  _fields: [
    'labelIds',
    'members',
    'assignees',
    'userId',
    'archive',
    'hideEmpty',
    'dueAt',
    'title',
    'customFields',
    'cardDependencies',
  ],

  // We don't filter cards that have been added after the last filter change. To
  // implement this we keep the id of these cards in this `_exceptions` fields
  // and use a `$or` condition in the mongo selector we return.
  _exceptions: [],
  _exceptionsDep: new Tracker.Dependency(),

  isActive() {
    return (
      this._fields.some(fieldName => {
        return this[fieldName]._isActive();
      }) ||
      this.excludedLabelIds._isActive() ||
      this.advanced._isActive() ||
      this.lists._isActive()
    );
  },

  // #2886: clicking an unfiltered label filters FOR it, clicking it again
  // inverts the filter to EXCLUDE it, and a third click clears it — a
  // three-state cycle scoped to labels only (not members, due dates, etc.).
  toggleLabelFilter(labelId) {
    if (this.labelIds.isSelected(labelId)) {
      this.labelIds.remove(labelId);
      this.excludedLabelIds.add(labelId);
    } else if (this.excludedLabelIds.isSelected(labelId)) {
      this.excludedLabelIds.remove(labelId);
    } else {
      this.labelIds.add(labelId);
    }
  },

  _getMongoSelector() {
    if (!this.isActive()) return {};

    const filterSelector = {};
    const emptySelector = {};
    let includeEmptySelectors = false;
    let isFilterActive = false; // we don't want there is only Filter.lists
    this._fields.forEach(fieldName => {
      const filter = this[fieldName];
      if (filter._isActive()) {
        isFilterActive = true;
        if (filter.subField !== '') {
          filterSelector[
            `${fieldName}.${filter.subField}`
          ] = filter._getMongoSelector();
        } else {
          filterSelector[fieldName] = filter._getMongoSelector();
        }
        emptySelector[fieldName] = filter._getEmptySelector();
        if (emptySelector[fieldName] !== null) {
          includeEmptySelectors = true;
        }
      }
    });

    // #2886: merge the exclusion into the existing `labelIds` selector
    // (rather than a `filterSelector.excludedLabelIds` key nothing reads)
    // so a card matching `labelIds`'s $in but ALSO carrying an excluded
    // label is still filtered out — exclusion wins over inclusion.
    if (this.excludedLabelIds._isActive()) {
      isFilterActive = true;
      const excludedSelector = this.excludedLabelIds._getExcludedMongoSelector();
      filterSelector.labelIds = filterSelector.labelIds
        ? { ...filterSelector.labelIds, ...excludedSelector }
        : excludedSelector;
    }

    const exceptionsSelector = {
      _id: {
        $in: this._exceptions,
      },
    };
    this._exceptionsDep.depend();

    const selectors = [exceptionsSelector];

    if (
      this._fields.some(fieldName => {
        return this[fieldName]._isActive();
      }) ||
      this.excludedLabelIds._isActive()
    )
      selectors.push(filterSelector);
    if (includeEmptySelectors) selectors.push(emptySelector);
    if (this.advanced._isActive()) {
      isFilterActive = true;
      selectors.push(this.advanced._getMongoSelector());
    }

    if(isFilterActive) {
      return {
        $or: selectors,
      };
    }
    else {
      // we don't want there is only Filter.lists
      // otherwise no card will be displayed ...
      // selectors = [exceptionsSelector];
      // will return [{"_id":{"$in":[]}}]
      return {};
    }
  },

  mongoSelector(additionalSelector) {
    const filterSelector = this._getMongoSelector();
    if (additionalSelector === undefined) {
      // #2306: a call without an additional selector means "all cards
      // matching the filter" (e.g. the filter sidebar's "To selection"
      // button). The client cache may also hold cards from OTHER boards
      // (a board being navigated away from, linked-board subscriptions,
      // notifications, popup card data, ...), so scope the query to the
      // board currently being viewed. Callers that pass an additional
      // selector are already scoped to a list/swimlane/card of the current
      // board.
      return boardScopedFilterSelector(
        filterSelector,
        Session.get('currentBoard'),
      );
    }
    return {
      $and: [filterSelector, additionalSelector],
    };
  },

  reset() {
    this._fields.forEach(fieldName => {
      const filter = this[fieldName];
      filter.reset();
    });
    this.excludedLabelIds.reset();
    this.lists.reset();
    this.advanced.reset();
    this.resetExceptions();
  },

  // #1751 asked for filters to survive navigating from one board to
  // another instead of being wiped every time - the reporter's own use
  // case is "only show my user's cards", i.e. a `members`/`assignees`
  // filter by user id, which means the SAME thing on every board since
  // user ids are global. `labelIds`/`excludedLabelIds`/`customFields`/
  // `cardDependencies`/`lists`/`advanced`, by contrast, hold ids or text
  // that are scoped to the board the user is LEAVING (a label id from
  // board A means nothing, or the wrong thing, on board B), so those
  // still have to reset. `config/router.js`'s board route calls this
  // instead of `reset()` when the target board differs from the current
  // one, keeping the plain `reset()` behavior (e.g. the "Clear filters"
  // sidebar button, leaving to All Boards) exactly as it was everywhere
  // else - this only changes what happens on a board-to-board hop.
  resetBoardScoped() {
    const boardScopedFields = [
      'labelIds',
      'customFields',
      'cardDependencies',
    ];
    boardScopedFields.forEach(fieldName => {
      this[fieldName].reset();
    });
    this.excludedLabelIds.reset();
    this.lists.reset();
    this.advanced.reset();
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
