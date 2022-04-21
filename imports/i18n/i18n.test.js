import { Tracker } from 'meteor/tracker';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import { TAPi18n } from './tap';

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

describe('TAPi18n', () => {

  beforeEach(() => {
    sinon.stub(console, 'log');
  });

  afterEach(() => {
    sinon.restore();
  });

  if (Meteor.isClient) {
    it('extra languages are not loaded initially', () => {
      // Using function here to prevent Meteor from including the file
      // during building time
      function path(language) {
        return `./data/${language}.i18n.json`;
      }
      expect(() => require(path('de'))).to.throw('Cannot find module');
    });
  }

  describe('.init', () => {

    it('has default language translation loaded', async () => {
      sinon.spy(TAPi18n, 'loadLanguage');
      await TAPi18n.init();
      expect(TAPi18n.loadLanguage).to.be.calledWith('en');
      expect(TAPi18n.getLanguage()).to.be.equal('en');
      expect(TAPi18n.__('accept')).to.be.equal('Accept');
    });

  });

  describe('.getSupportedLanguages', () => {

    it('returns an array of objects with expected structure', () => {
      const languages = TAPi18n.getSupportedLanguages();
      expect(languages).to.be.an('array');
      for (const language of languages) {
        expect(language).to.have.keys('name', 'code', 'tag');
      }
    });

  });

  describe('.getLanguage', () => {

    it('is reactive', async () => {
      const tracked = [];
      Tracker.autorun(() => {
        tracked.push(TAPi18n.getLanguage());
      });
      expect(tracked).to.have.members(['en']);
      await TAPi18n.setLanguage('de');
      Tracker.flush();
      expect(tracked).to.have.members(['en', 'de']);
    });

  });

  describe('.loadLanguage', () => {

    beforeEach(() => {
      sinon.stub(TAPi18n.i18n, 'addResourceBundle');
    });

    it('actually loads the language data', async () => {
      await TAPi18n.loadLanguage('fr');
      expect(TAPi18n.i18n.addResourceBundle).to.be.calledOnceWith('fr');
      expect(TAPi18n.i18n.addResourceBundle.firstCall.args[2]).to.have.property('accept');
    });

    it('throws error if language is missing', async () => {
      await expect(TAPi18n.loadLanguage('miss')).to.be.rejectedWith('not supported');
      expect(TAPi18n.i18n.addResourceBundle).to.not.be.called;
    });

  });

  describe('.__', () => {

    beforeEach(async () => {
      await TAPi18n.init();
      TAPi18n.i18n.addResourceBundle('fr', 'translation', {
        'simple': 'Hello',
        'positional': 'Hello, %s! How is your %s?',
        'named': 'Hello, __whom__! How is your __what__?',
      });
      TAPi18n.i18n.changeLanguage('fr');
    });

    it('works with simple keys', () => {
      const result = TAPi18n.__('simple');
      expect(result).to.be.equal('Hello');
    });

    it('works with simple keys and custom language', async () => {
      TAPi18n.i18n.addResourceBundle('de', 'translation', {
        'simple': 'Hola',
      });
      const result = TAPi18n.__('simple', null, 'de');
      expect(result).to.be.equal('Hola');
    });

    it('works with positional parameters', () => {
      const result = TAPi18n.__('positional', {
        sprintf: ['Josh', 'life']
      });
      expect(result).to.be.equal('Hello, Josh! How is your life?');
    });

    it('works with named parameters', () => {
      const result = TAPi18n.__('named', {
        whom: 'Annie',
        what: 'job'
      });
      expect(result).to.be.equal('Hello, Annie! How is your job?');
    });

  });

});
