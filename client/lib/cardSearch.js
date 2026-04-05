import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Cards from '../../models/cards';
import SessionData from '../../models/usersessiondata';
import {QueryDebug} from "../../config/query-classes";
import {OPERATOR_DEBUG} from "../../config/search-const";

// Plain helper class for search pages with pagination.
// Not a BlazeComponent; instantiated in each template's onCreated.
export class CardSearchPaged {
  constructor(templateInstance) {
    this.tpl = templateInstance;
    this.searching = new ReactiveVar(false);
    this.hasResults = new ReactiveVar(false);
    this.hasQueryErrors = new ReactiveVar(false);
    this.query = new ReactiveVar('');
    this.resultsHeading = new ReactiveVar('');
    this.searchLink = new ReactiveVar(null);
    this.results = new ReactiveVar([]);
    this.hasNextPage = new ReactiveVar(false);
    this.hasPreviousPage = new ReactiveVar(false);
    this.resultsCount = 0;
    this.totalHits = 0;
    this.queryErrors = null;
    this.resultsPerPage = 25;
    this.sessionId = SessionData.getSessionId();
    this.subscriptionHandle = null;
    this.serverError = new ReactiveVar(false);
    this.sessionData = null;
    this.debug = new ReactiveVar(new QueryDebug());

    const that = this;
    this.subscriptionCallbacks = {
      onReady() {
        const cardsInCollection = Cards.find().count();

        // Wait for session data to be available (with timeout)
        let waitCount = 0;
        const maxWaitCount = 50; // 10 seconds max wait

        const waitForSessionData = () => {
          waitCount++;
          const sessionData = that.getSessionData();

          if (sessionData) {
            const results = that.getResults();

            // If no results and this is a due cards search, try to retry
            if ((!results || results.length === 0) && that.searchRetryCount !== undefined && that.searchRetryCount < that.maxRetries) {
              that.searchRetryCount++;
              Meteor.setTimeout(() => {
                if (that.performSearch) {
                  that.performSearch();
                }
              }, 500);
              return;
            }

            // Set the results in the ReactiveVar so they display in the template
            that.results.set(results);
            that.resultsHeading.set(that.getResultsHeading());
            that.searching.set(false);
            that.hasResults.set(true);
            that.serverError.set(false);
          } else if (waitCount < maxWaitCount) {
            // Session data not available yet, wait a bit more
            Meteor.setTimeout(waitForSessionData, 200);
          } else {
            // Timeout reached, try fallback search
            const results = that.getResults();

            if (results && results.length > 0) {
              that.results.set(results);
              that.resultsHeading.set(that.getResultsHeading());
              that.searching.set(false);
              that.hasResults.set(true);
              that.serverError.set(false);
            } else {
              that.searching.set(false);
              that.hasResults.set(false);
              that.serverError.set(true);
            }
          }
        };

        // Start waiting for session data
        Meteor.setTimeout(waitForSessionData, 100);
      },
      onError(error) {
        that.searching.set(false);
        that.hasResults.set(false);
        that.serverError.set(true);
      },
    };
  }

  resetSearch() {
    this.searching.set(false);
    this.results.set([]);
    this.hasResults.set(false);
    this.hasQueryErrors.set(false);
    this.resultsHeading.set('');
    this.serverError.set(false);
    this.resultsCount = 0;
    this.totalHits = 0;
    this.queryErrors = null;
    this.debug.set(new QueryDebug());
  }

  getSessionData(sessionId) {
    const sessionIdToUse = sessionId || SessionData.getSessionId();

    // Use SessionData.findOne() directly - it's synchronous on the client
    const sessionData = SessionData.findOne({
      userId: Meteor.userId(),
      sessionId: sessionIdToUse,
    });

    return sessionData;
  }

  getResults() {
    this.sessionData = this.getSessionData();
    const cards = [];

    if (this.sessionData && this.sessionData.cards) {
      this.sessionData.cards.forEach(cardId => {
        const card = ReactiveCache.getCard(cardId);
        if (card && card._id) {
          cards.push(card);
        }
      });

      // Fallback: if no cards found, try fetching directly from Cards collection
      if (cards.length === 0 && this.sessionData.cards && this.sessionData.cards.length > 0) {
        if (directCards && directCards.length > 0) {
          directCards.forEach(card => {
            if (card && card._id) {
              cards.push(card);
            }
          });
        }
      }

      this.queryErrors = this.sessionData.errors || [];
    } else {
      // Fallback: try to get cards directly from the client-side collection
      // Use a more efficient query with limit and sort
      const selector = {
        type: 'cardType-card',
        dueAt: { $exists: true, $nin: [null, ''] }
      };
      const options = {
        sort: { dueAt: 1 }, // Sort by due date ascending (oldest first)
        limit: 100 // Limit to 100 cards for performance
      };
      const allCards = Cards.find(selector, options).fetch();

      if (allCards && allCards.length > 0) {
        allCards.forEach(card => {
          if (card && card._id) {
            cards.push(card);
          }
        });
      }

      this.queryErrors = [];
    }
    if (this.queryErrors.length) {
      // console.log('queryErrors:', this.queryErrorMessages());
      this.hasQueryErrors.set(true);
      // return null;
    }
    this.debug.set(new QueryDebug(this.sessionData ? this.sessionData.debug : null));

    if (cards) {
      if (this.sessionData) {
        this.totalHits = this.sessionData.totalHits || 0;
        this.resultsCount = cards.length;
        this.resultsStart = this.sessionData.lastHit - this.resultsCount + 1;
        this.resultsEnd = this.sessionData.lastHit;
        this.resultsHeading.set(this.getResultsHeading());
        this.results.set(cards);
        this.hasNextPage.set(this.sessionData.lastHit < this.sessionData.totalHits);
        this.hasPreviousPage.set(
          this.sessionData.lastHit - this.sessionData.resultsCount > 0,
        );
      } else {
        this.totalHits = cards.length;
        this.resultsCount = cards.length;
        this.resultsStart = 1;
        this.resultsEnd = cards.length;
        this.resultsHeading.set(this.getResultsHeading());
        this.results.set(cards);
        this.hasNextPage.set(false);
        this.hasPreviousPage.set(false);
      }
      return cards;
    }

    this.resultsCount = 0;
    return null;
  }

  stopSubscription() {
    if (this.subscriptionHandle) {
      this.subscriptionHandle.stop();
    }
  }

  getSubscription(queryParams) {
    // Subscribe to globalSearch which includes sessionData as the 11th cursor
    const globalSearchHandle = Meteor.subscribe(
      'globalSearch',
      this.sessionId,
      queryParams.params,
      queryParams.text,
      this.subscriptionCallbacks,
    );

    return globalSearchHandle;
  }

  runGlobalSearch(queryParams) {
    this.searching.set(true);
    this.debug.set(new QueryDebug());
    this.stopSubscription();
    this.subscriptionHandle = this.getSubscription(queryParams);
  }

  queryErrorMessages() {
    const messages = [];

    this.queryErrors.forEach(err => {
      let value = err.color ? TAPi18n.__(`color-${err.value}`) : err.value;
      if (!value) {
        value = err.value;
      }
      messages.push(TAPi18n.__(err.tag, value));
    });

    return messages;
  }

  nextPage() {
    this.searching.set(true);
    this.stopSubscription();
    this.subscriptionHandle = Meteor.subscribe(
      'nextPage',
      this.sessionId,
      this.subscriptionCallbacks,
    );
  }

  previousPage() {
    this.searching.set(true);
    this.stopSubscription();
    this.subscriptionHandle = Meteor.subscribe(
      'previousPage',
      this.sessionId,
      this.subscriptionCallbacks,
    );
  }

  getResultsHeading() {
    if (this.resultsCount === 0) {
      return TAPi18n.__('no-cards-found');
    } else if (this.resultsCount === 1) {
      return TAPi18n.__('one-card-found');
    } else if (this.resultsCount === this.totalHits) {
      return TAPi18n.__('n-cards-found', {sprintf: [this.resultsCount]});
    }

    return TAPi18n.__('n-n-of-n-cards-found', {
      start: this.resultsStart,
      end: this.resultsEnd,
      total: this.totalHits,
    });
  }

  getSearchHref() {
    const baseUrl = window.location.href.replace(/([?#].*$|\s*$)/, '');
    return `${baseUrl}?q=${encodeURIComponent(this.query.get())}`;
  }
}
