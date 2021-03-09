import {
  OPERATOR_ASSIGNEE,
  OPERATOR_BOARD,
  OPERATOR_COMMENT,
  OPERATOR_LABEL,
  OPERATOR_LIST,
  OPERATOR_MEMBER,
  OPERATOR_SWIMLANE,
  OPERATOR_USER,
} from './search-const';
import Boards from '../models/boards';

export class QueryParams {
  text = '';

  constructor(params = {}) {
    this.params = params;
  }

  hasOperator(operator) {
    return this.params[operator];
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
    return this.params[operator][0];
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
    Object.entries(this._errors).forEach(([operator, errors]) => {
      errors.forEach(err => {
        errs.push(err);
      });
    });
    return errs;
  }

  errorMessages() {
    const messages = [];
    Object.entries(this._errors).forEach(([operator, errors]) => {
      errors.forEach(err => {
        messages.push(TAPi18n.__(err.tag, err.value));
      });
    });
    return messages;
  }
}

export class Query {
  params = {};
  selector = {};
  projection = {};

  constructor(selector, projection) {
    this._errors = new QueryErrors();
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

  errorMessages() {
    return this._errors.errorMessages();
  }
}
