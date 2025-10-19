import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import Cards from '../../models/cards';
import SessionData from '../../models/usersessiondata';
import {QueryDebug} from "../../config/query-classes";
import {OPERATOR_DEBUG} from "../../config/search-const";

export class CardSearchPagedComponent extends BlazeComponent {
  onCreated() {
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
        if (process.env.DEBUG === 'true') {
          console.log('Subscription ready, getting results...');
          console.log('Subscription ready - sessionId:', that.sessionId);
        }
        
        // Wait for session data to be available (with timeout)
        let waitCount = 0;
        const maxWaitCount = 50; // 10 seconds max wait
        
        const waitForSessionData = () => {
          waitCount++;
          const sessionData = that.getSessionData();
          if (process.env.DEBUG === 'true') {
            console.log('waitForSessionData - attempt', waitCount, 'session data:', sessionData);
          }
          
          if (sessionData) {
            const results = that.getResults();
            if (process.env.DEBUG === 'true') {
              console.log('Search results count:', results ? results.length : 0);
            }
            
            // If no results and this is a due cards search, try to retry
            if ((!results || results.length === 0) && that.searchRetryCount !== undefined && that.searchRetryCount < that.maxRetries) {
              if (process.env.DEBUG === 'true') {
                console.log('No results found, retrying search...');
              }
              that.searchRetryCount++;
              Meteor.setTimeout(() => {
                if (that.performSearch) {
                  that.performSearch();
                }
              }, 500);
              return;
            }
            
            that.searching.set(false);
            that.hasResults.set(true);
            that.serverError.set(false);
             } else if (waitCount < maxWaitCount) {
               // Session data not available yet, wait a bit more
               if (process.env.DEBUG === 'true') {
                 console.log('Session data not available yet, waiting... (attempt', waitCount, 'of', maxWaitCount, ')');
               }
               Meteor.setTimeout(waitForSessionData, 200);
             } else {
               // Timeout reached, try fallback search
               if (process.env.DEBUG === 'true') {
                 console.log('Timeout reached waiting for session data, trying fallback search');
               }
               const results = that.getResults();
               if (process.env.DEBUG === 'true') {
                 console.log('Fallback search results count:', results ? results.length : 0);
               }
               
               if (results && results.length > 0) {
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
        if (process.env.DEBUG === 'true') {
          console.log('Subscription error:', error);
          console.log('Error.reason:', error.reason);
          console.log('Error.message:', error.message);
          console.log('Error.stack:', error.stack);
        }
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
    if (process.env.DEBUG === 'true') {
      console.log('getSessionData - looking for sessionId:', sessionIdToUse);
    }
    
    // Try using the raw SessionData collection instead of ReactiveCache
    const sessionData = SessionData.findOne({
      sessionId: sessionIdToUse,
    });
    if (process.env.DEBUG === 'true') {
      console.log('getSessionData - found session data (raw):', sessionData);
    }
    
    // Also try ReactiveCache for comparison
    const reactiveSessionData = ReactiveCache.getSessionData({
      sessionId: sessionIdToUse,
    });
    if (process.env.DEBUG === 'true') {
      console.log('getSessionData - found session data (reactive):', reactiveSessionData);
    }
    
    return sessionData || reactiveSessionData;
  }

  getResults() {
    // eslint-disable-next-line no-console
    // console.log('getting results');
    this.sessionData = this.getSessionData();
    // eslint-disable-next-line no-console
    if (process.env.DEBUG === 'true') {
      console.log('getResults - sessionId:', this.sessionId);
      console.log('getResults - session data:', this.sessionData);
    }
    const cards = [];
    
    if (this.sessionData && this.sessionData.cards) {
      if (process.env.DEBUG === 'true') {
        console.log('getResults - cards array length:', this.sessionData.cards.length);
      }
      this.sessionData.cards.forEach(cardId => {
        const card = ReactiveCache.getCard(cardId);
        if (process.env.DEBUG === 'true') {
          console.log('getResults - card:', cardId, card);
        }
        cards.push(card);
      });
      this.queryErrors = this.sessionData.errors || [];
    } else {
      if (process.env.DEBUG === 'true') {
        console.log('getResults - no sessionData or no cards array, trying direct card search');
      }
      // Fallback: try to get cards directly from the client-side collection
      const selector = {
        type: 'cardType-card',
        dueAt: { $exists: true, $nin: [null, ''] }
      };
      const allCards = Cards.find(selector).fetch();
      if (process.env.DEBUG === 'true') {
        console.log('getResults - direct card search found:', allCards ? allCards.length : 0, 'cards');
      }
      
      if (allCards && allCards.length > 0) {
        allCards.forEach(card => {
          if (card && card._id) {
            if (process.env.DEBUG === 'true') {
              console.log('getResults - direct card:', card._id, card.title);
            }
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
    if (process.env.DEBUG === 'true') {
      console.log('debug:', this.debug.get().get());
      console.log('debug.show():', this.debug.get().show());
      console.log('debug.showSelector():', this.debug.get().showSelector());
    }

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
    if (process.env.DEBUG === 'true') {
      console.log('Subscribing to globalSearch with:', {
        sessionId: this.sessionId,
        params: queryParams.params,
        text: queryParams.text
      });
    }

    // Subscribe to both globalSearch and sessionData
    const globalSearchHandle = Meteor.subscribe(
      'globalSearch',
      this.sessionId,
      queryParams.params,
      queryParams.text,
      this.subscriptionCallbacks,
    );
    
    const sessionDataHandle = Meteor.subscribe('sessionData', this.sessionId);
    if (process.env.DEBUG === 'true') {
      console.log('Subscribed to sessionData with sessionId:', this.sessionId);
    }

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

  events() {
    return [
      {
        'click .js-next-page'(evt) {
          evt.preventDefault();
          this.nextPage();
        },
        'click .js-previous-page'(evt) {
          evt.preventDefault();
          this.previousPage();
        },
      },
    ];
  }
}
