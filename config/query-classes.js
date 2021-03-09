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
  constructor() {
    this.errors = {};

    this.colorMap = Boards.colorMap();
  }

  addError(operator, value) {
    if (!this.errors[operator]) {
      this.errors[operator] = [];
    }
    this.errors[operator].push(value)
  }

  hasErrors() {
    return Object.entries(this.errors).length > 0;
  }

  errorMessages() {
    const messages = [];

    const operatorTags = {};
    operatorTags[OPERATOR_BOARD] = 'board-title-not-found';
    operatorTags[OPERATOR_SWIMLANE] = 'swimlane-title-not-found';
    operatorTags[OPERATOR_LABEL] = label => {
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
    };
    operatorTags[OPERATOR_LIST] = 'list-title-not-found';
    operatorTags[OPERATOR_COMMENT] = 'comment-not-found';
    operatorTags[OPERATOR_USER] = 'user-username-not-found';
    operatorTags[OPERATOR_ASSIGNEE] = 'user-username-not-found';
    operatorTags[OPERATOR_MEMBER] = 'user-username-not-found';

    Object.entries(this.errors, ([operator, value]) => {
      if (typeof operatorTags[operator] === 'function') {
        messages.push(operatorTags[operator](value));
      } else {
        messages.push({ tag: operatorTags[operator], value: value });
      }
    });

    return messages;
  }
}

export class Query {
  params = {};
  selector = {};
  projection = {};
  errors = new QueryErrors();

  constructor(selector, projection) {
    if (selector) {
      this.selector = selector;
    }

    if (projection) {
      this.projection = projection;
    }
  }
}
