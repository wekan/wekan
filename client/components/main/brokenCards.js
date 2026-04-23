import { CardSearchPaged } from '../../lib/cardSearch';

Template.brokenCards.onCreated(function () {
  const search = new CardSearchPaged(this);
  this.search = search;

  Meteor.subscribe('brokenCards', search.sessionId);
});

Template.brokenCards.helpers({
  userId() {
    return Meteor.userId();
  },

  // Return ReactiveVars so jade can use .get pattern
  searching() {
    return Template.instance().search.searching;
  },
  hasResults() {
    return Template.instance().search.hasResults;
  },
  hasQueryErrors() {
    return Template.instance().search.hasQueryErrors;
  },
  errorMessages() {
    return Template.instance().search.queryErrorMessages();
  },
  resultsCount() {
    return Template.instance().search.resultsCount;
  },
  resultsHeading() {
    return Template.instance().search.resultsHeading;
  },
  results() {
    return Template.instance().search.results;
  },
  getSearchHref() {
    return Template.instance().search.getSearchHref();
  },
  hasPreviousPage() {
    return Template.instance().search.hasPreviousPage;
  },
  hasNextPage() {
    return Template.instance().search.hasNextPage;
  },
});

Template.brokenCards.events({
  'click .js-next-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.nextPage();
  },
  'click .js-previous-page'(evt, tpl) {
    evt.preventDefault();
    tpl.search.previousPage();
  },
});
