import moment from 'moment/min/moment-with-locales';
import { TAPi18n } from '/imports/i18n';
import {
  OPERATOR_ASSIGNEE,
  OPERATOR_BOARD,
  OPERATOR_COMMENT,
  OPERATOR_CREATED_AT,
  OPERATOR_CREATOR,
  OPERATOR_DEBUG,
  OPERATOR_DUE,
  OPERATOR_HAS,
  OPERATOR_LABEL,
  OPERATOR_LIMIT,
  OPERATOR_LIST,
  OPERATOR_MEMBER,
  OPERATOR_MODIFIED_AT,
  OPERATOR_ORG,
  OPERATOR_SORT,
  OPERATOR_STATUS,
  OPERATOR_SWIMLANE,
  OPERATOR_TEAM,
  OPERATOR_UNKNOWN,
  OPERATOR_USER,
  ORDER_ASCENDING,
  ORDER_DESCENDING,
  PREDICATE_ALL,
  PREDICATE_ARCHIVED,
  PREDICATE_ASSIGNEES,
  PREDICATE_ATTACHMENT,
  PREDICATE_CHECKLIST,
  PREDICATE_CREATED_AT,
  PREDICATE_DESCRIPTION,
  PREDICATE_DUE_AT,
  PREDICATE_END_AT,
  PREDICATE_ENDED,
  PREDICATE_MEMBERS,
  PREDICATE_MODIFIED_AT,
  PREDICATE_MONTH,
  PREDICATE_OPEN,
  PREDICATE_OVERDUE,
  PREDICATE_PRIVATE,
  PREDICATE_PROJECTION,
  PREDICATE_PUBLIC,
  PREDICATE_QUARTER,
  PREDICATE_SELECTOR,
  PREDICATE_START_AT,
  PREDICATE_WEEK,
  PREDICATE_YEAR,
} from './search-const';
import Boards from '../models/boards';

export class QueryDebug {
  predicate = null;

  constructor(predicate) {
    if (predicate) {
      this.set(predicate)
    }
  }

  get() {
    return this.predicate;
  }

  set(predicate) {
    if ([PREDICATE_ALL, PREDICATE_SELECTOR, PREDICATE_PROJECTION].includes(
      predicate
    )) {
      this.predicate = predicate;
    } else {
      this.predicate = null;
    }
  }

  show() {
    return (this.predicate !== null);
  }

  showAll() {
    return (this.predicate === PREDICATE_ALL);
  }

  showSelector() {
    return (this.predicate === PREDICATE_ALL || this.predicate === PREDICATE_SELECTOR);
  }

  showProjection() {
    return (this.predicate === PREDICATE_ALL || this.predicate === PREDICATE_PROJECTION);
  }
}

export class QueryParams {
  text = '';

  constructor(params = {}, text = '') {
    this.params = params;
    this.text = text;
  }

  hasOperator(operator) {
    return (
      this.params[operator] !== undefined &&
      (this.params[operator].length === undefined ||
        this.params[operator].length > 0)
    );
  }

  addPredicate(operator, predicate) {
    if (!this.hasOperator(operator)) {
      this.params[operator] = [];
    }
    this.params[operator].push(predicate);
  }

  setPredicate(operator, predicate) {
    this.params[operator] = predicate;
  }

  getPredicate(operator) {
    if (this.hasOperator(operator)){
      if (typeof this.params[operator] === 'object') {
        return this.params[operator][0];
      } else {
        return this.params[operator];
      }
    }
    return null;
  }

  getPredicates(operator) {
    return this.params[operator];
  }

  getParams() {
    return this.params;
  }
}

export class QueryErrors {
  operatorTagMap = [
    [OPERATOR_BOARD, 'board-title-not-found'],
    [OPERATOR_SWIMLANE, 'swimlane-title-not-found'],
    [
      OPERATOR_LABEL,
      label => {
        if (Boards.labelColors().includes(label)) {
          return {
            tag: 'label-color-not-found',
            value: label,
            color: true,
          };
        } else {
          return {
            tag: 'label-not-found',
            value: label,
            color: false,
          };
        }
      },
    ],
    [OPERATOR_LIST, 'list-title-not-found'],
    [OPERATOR_COMMENT, 'comment-not-found'],
    [OPERATOR_USER, 'user-username-not-found'],
    [OPERATOR_ASSIGNEE, 'user-username-not-found'],
    [OPERATOR_MEMBER, 'user-username-not-found'],
    [OPERATOR_CREATOR, 'user-username-not-found'],
    [OPERATOR_ORG, 'org-name-not-found'],
    [OPERATOR_TEAM, 'team-name-not-found'],
  ];

  constructor() {
    this._errors = {};

    this.operatorTags = {};
    this.operatorTagMap.forEach(([operator, tag]) => {
      this.operatorTags[operator] = tag;
    });

    this.colorMap = Boards.colorMap();
  }

  addError(operator, error) {
    if (!this._errors[operator]) {
      this._errors[operator] = [];
    }
    this._errors[operator].push(error);
  }

  addNotFound(operator, value) {
    if (typeof this.operatorTags[operator] === 'function') {
      this.addError(operator, this.operatorTags[operator](value));
    } else {
      this.addError(operator, { tag: this.operatorTags[operator], value });
    }
  }

  hasErrors() {
    return Object.entries(this._errors).length > 0;
  }

  errors() {
    const errs = [];
    // eslint-disable-next-line no-unused-vars
    Object.entries(this._errors).forEach(([, errors]) => {
      errors.forEach(err => {
        errs.push(err);
      });
    });
    return errs;
  }

  errorMessages() {
    const messages = [];
    // eslint-disable-next-line no-unused-vars
    Object.entries(this._errors).forEach(([, errors]) => {
      errors.forEach(err => {
        messages.push(TAPi18n.__(err.tag, err.value));
      });
    });
    return messages;
  }
}

export class Query {
  selector = {};
  projection = {};

  constructor(selector, projection) {
    this._errors = new QueryErrors();
    this.queryParams = new QueryParams();
    this.colorMap = Boards.colorMap();

    if (selector) {
      this.selector = selector;
    }

    if (projection) {
      this.projection = projection;
    }
  }

  hasErrors() {
    return this._errors.hasErrors();
  }

  errors() {
    return this._errors.errors();
  }

  addError(operator, error) {
    this._errors.addError(operator, error)
  }

  errorMessages() {
    return this._errors.errorMessages();
  }

  getQueryParams() {
    return this.queryParams;
  }

  setQueryParams(queryParams) {
    this.queryParams = queryParams;
  }

  addPredicate(operator, predicate) {
    this.queryParams.addPredicate(operator, predicate);
  }

  buildParams(queryText) {
    this.queryParams = new QueryParams();

    queryText = queryText.trim();
    // eslint-disable-next-line no-console
    //console.log('query:', query);

    if (!queryText) {
      return;
    }

    const reOperator1 = new RegExp(
      '^((?<operator>[\\p{Letter}\\p{Mark}]+):|(?<abbrev>[#@]))(?<value>[\\p{Letter}\\p{Mark}]+)(\\s+|$)',
      'iu',
    );
    const reOperator2 = new RegExp(
      '^((?<operator>[\\p{Letter}\\p{Mark}]+):|(?<abbrev>[#@]))(?<quote>["\']*)(?<value>.*?)\\k<quote>(\\s+|$)',
      'iu',
    );
    const reText = new RegExp('^(?<text>\\S+)(\\s+|$)', 'u');
    const reQuotedText = new RegExp(
      '^(?<quote>["\'])(?<text>.*?)\\k<quote>(\\s+|$)',
      'u',
    );
    const reNegatedOperator = new RegExp('^-(?<operator>.*)$');

    const operators = {
      'operator-board': OPERATOR_BOARD,
      'operator-board-abbrev': OPERATOR_BOARD,
      'operator-swimlane': OPERATOR_SWIMLANE,
      'operator-swimlane-abbrev': OPERATOR_SWIMLANE,
      'operator-list': OPERATOR_LIST,
      'operator-list-abbrev': OPERATOR_LIST,
      'operator-label': OPERATOR_LABEL,
      'operator-label-abbrev': OPERATOR_LABEL,
      'operator-user': OPERATOR_USER,
      'operator-user-abbrev': OPERATOR_USER,
      'operator-member': OPERATOR_MEMBER,
      'operator-member-abbrev': OPERATOR_MEMBER,
      'operator-assignee': OPERATOR_ASSIGNEE,
      'operator-creator': OPERATOR_CREATOR,
      'operator-assignee-abbrev': OPERATOR_ASSIGNEE,
      'operator-status': OPERATOR_STATUS,
      'operator-due': OPERATOR_DUE,
      'operator-created': OPERATOR_CREATED_AT,
      'operator-modified': OPERATOR_MODIFIED_AT,
      'operator-comment': OPERATOR_COMMENT,
      'operator-has': OPERATOR_HAS,
      'operator-sort': OPERATOR_SORT,
      'operator-limit': OPERATOR_LIMIT,
      'operator-debug': OPERATOR_DEBUG,
      'operator-org': OPERATOR_ORG,
      'operator-team': OPERATOR_TEAM,
    };

    const predicates = {
      durations: {
        'predicate-week': PREDICATE_WEEK,
        'predicate-month': PREDICATE_MONTH,
        'predicate-quarter': PREDICATE_QUARTER,
        'predicate-year': PREDICATE_YEAR,
      },
    };
    predicates[OPERATOR_DUE] = {
      'predicate-overdue': PREDICATE_OVERDUE,
    };
    predicates[OPERATOR_STATUS] = {
      'predicate-archived': PREDICATE_ARCHIVED,
      'predicate-all': PREDICATE_ALL,
      'predicate-open': PREDICATE_OPEN,
      'predicate-ended': PREDICATE_ENDED,
      'predicate-public': PREDICATE_PUBLIC,
      'predicate-private': PREDICATE_PRIVATE,
    };
    predicates[OPERATOR_SORT] = {
      'predicate-due': PREDICATE_DUE_AT,
      'predicate-created': PREDICATE_CREATED_AT,
      'predicate-modified': PREDICATE_MODIFIED_AT,
    };
    predicates[OPERATOR_HAS] = {
      'predicate-description': PREDICATE_DESCRIPTION,
      'predicate-checklist': PREDICATE_CHECKLIST,
      'predicate-attachment': PREDICATE_ATTACHMENT,
      'predicate-start': PREDICATE_START_AT,
      'predicate-end': PREDICATE_END_AT,
      'predicate-due': PREDICATE_DUE_AT,
      'predicate-assignee': PREDICATE_ASSIGNEES,
      'predicate-member': PREDICATE_MEMBERS,
    };
    predicates[OPERATOR_DEBUG] = {
      'predicate-all': PREDICATE_ALL,
      'predicate-selector': PREDICATE_SELECTOR,
      'predicate-projection': PREDICATE_PROJECTION,
    };

    const predicateTranslations = {};
    Object.entries(predicates).forEach(([category, catPreds]) => {
      predicateTranslations[category] = {};
      Object.entries(catPreds).forEach(([tag, value]) => {
        predicateTranslations[category][TAPi18n.__(tag)] = value;
      });
    });
    // eslint-disable-next-line no-console
    // console.log('predicateTranslations:', predicateTranslations);

    const operatorMap = {};
    Object.entries(operators).forEach(([key, value]) => {
      operatorMap[TAPi18n.__(key).toLowerCase()] = value;
    });
    // eslint-disable-next-line no-console
    // console.log('operatorMap:', operatorMap);

    let text = '';
    while (queryText) {
      let m = queryText.match(reOperator1);
      if (!m) {
        m = queryText.match(reOperator2);
        if (m) {
          queryText = queryText.replace(reOperator2, '');
        }
      } else {
        queryText = queryText.replace(reOperator1, '');
      }
      if (m) {
        let op;
        if (m.groups.operator) {
          op = m.groups.operator.toLowerCase();
        } else {
          op = m.groups.abbrev.toLowerCase();
        }
        // eslint-disable-next-line no-prototype-builtins
        if (operatorMap.hasOwnProperty(op)) {
          const operator = operatorMap[op];
          let value = m.groups.value;
          if (operator === OPERATOR_LABEL) {
            if (value in this.colorMap) {
              value = this.colorMap[value];
              // console.log('found color:', value);
            }
          } else if (
            [OPERATOR_DUE, OPERATOR_CREATED_AT, OPERATOR_MODIFIED_AT].includes(
              operator,
            )
          ) {
            const days = parseInt(value, 10);
            let duration = null;
            if (isNaN(days)) {
              // duration was specified as text
              if (predicateTranslations.durations[value]) {
                duration = predicateTranslations.durations[value];
                let date = null;
                switch (duration) {
                  case PREDICATE_WEEK:
                    // eslint-disable-next-line no-case-declarations
                    const week = moment().week();
                    if (week === 52) {
                      date = moment(1, 'W');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(week + 1, 'W');
                    }
                    break;
                  case PREDICATE_MONTH:
                    // eslint-disable-next-line no-case-declarations
                    const month = moment().month();
                    // .month() is zero indexed
                    if (month === 11) {
                      date = moment(1, 'M');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(month + 2, 'M');
                    }
                    break;
                  case PREDICATE_QUARTER:
                    // eslint-disable-next-line no-case-declarations
                    const quarter = moment().quarter();
                    if (quarter === 4) {
                      date = moment(1, 'Q');
                      date.set('year', date.year() + 1);
                    } else {
                      date = moment(quarter + 1, 'Q');
                    }
                    break;
                  case PREDICATE_YEAR:
                    date = moment(moment().year() + 1, 'YYYY');
                    break;
                }
                if (date) {
                  value = {
                    operator: '$lt',
                    value: date.format('YYYY-MM-DD'),
                  };
                }
              } else if (
                operator === OPERATOR_DUE &&
                value === PREDICATE_OVERDUE
              ) {
                value = {
                  operator: '$lt',
                  value: moment().format('YYYY-MM-DD'),
                };
              } else {
                this.addError(OPERATOR_DUE, {
                  tag: 'operator-number-expected',
                  value: { operator: op, value },
                });
                continue;
              }
            } else if (operator === OPERATOR_DUE) {
              value = {
                operator: '$lt',
                value: moment(moment().format('YYYY-MM-DD'))
                  .add(days + 1, duration ? duration : 'days')
                  .format(),
              };
            } else {
              value = {
                operator: '$gte',
                value: moment(moment().format('YYYY-MM-DD'))
                  .subtract(days, duration ? duration : 'days')
                  .format(),
              };
            }
          } else if (operator === OPERATOR_SORT) {
            let negated = false;
            const m = value.match(reNegatedOperator);
            if (m) {
              value = m.groups.operator;
              negated = true;
            }
            if (!predicateTranslations[OPERATOR_SORT][value]) {
              this.addError(OPERATOR_SORT, {
                tag: 'operator-sort-invalid',
                value,
              });
              continue;
            } else {
              value = {
                name: predicateTranslations[OPERATOR_SORT][value],
                order: negated ? ORDER_DESCENDING : ORDER_ASCENDING,
              };
            }
          } else if (operator === OPERATOR_STATUS) {
            if (!predicateTranslations[OPERATOR_STATUS][value]) {
              this.addError(OPERATOR_STATUS, {
                tag: 'operator-status-invalid',
                value,
              });
              continue;
            } else {
              value = predicateTranslations[OPERATOR_STATUS][value];
            }
          } else if (operator === OPERATOR_HAS) {
            let negated = false;
            const m = value.match(reNegatedOperator);
            if (m) {
              value = m.groups.operator;
              negated = true;
            }
            if (!predicateTranslations[OPERATOR_HAS][value]) {
              this.addError(OPERATOR_HAS, {
                tag: 'operator-has-invalid',
                value,
              });
              continue;
            } else {
              value = {
                field: predicateTranslations[OPERATOR_HAS][value],
                exists: !negated,
              };
            }
          } else if (operator === OPERATOR_LIMIT) {
            const limit = parseInt(value, 10);
            if (isNaN(limit) || limit < 0) {
              this.addError(OPERATOR_LIMIT, {
                tag: 'operator-limit-invalid',
                value,
              });
              continue;
            } else if (limit == 0) {
              // no limit
              continue;
            } else {
              value = limit;
            }
          } else if (operator === OPERATOR_DEBUG) {
            if (!predicateTranslations[OPERATOR_DEBUG][value]) {
              this.addError(OPERATOR_DEBUG, {
                tag: 'operator-debug-invalid',
                value,
              });
              continue;
            } else {
              value = predicateTranslations[OPERATOR_DEBUG][value];
            }
          }

          this.queryParams.addPredicate(operator, value);
        } else {
          this.addError(OPERATOR_UNKNOWN, {
            tag: 'operator-unknown-error',
            value: op,
          });
        }
        continue;
      }

      m = queryText.match(reQuotedText);
      if (!m) {
        m = queryText.match(reText);
        if (m) {
          queryText = queryText.replace(reText, '');
        }
      } else {
        queryText = queryText.replace(reQuotedText, '');
      }
      if (m) {
        text += (text ? ' ' : '') + m.groups.text;
      }
    }

    this.queryParams.text = text;

    // eslint-disable-next-line no-console
    if (this.queryParams.hasOperator(OPERATOR_DEBUG)) {
      // eslint-disable-next-line no-console
      console.log('text:', this.queryParams.text);
      console.log('queryParams:', this.queryParams);
    }
  }
}
