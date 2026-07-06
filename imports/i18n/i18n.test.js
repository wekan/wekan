import { Tracker } from 'meteor/tracker';
import { use, expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import { TAPi18n } from './tap';

// sinon-chai and chai-as-promised are ESM-only (chai 6.x); require() would hand
// chai.use() the module namespace ({ default: fn }) instead of the plugin
// function and throw "fn is not a function". Import the default export directly.
use(sinonChai);
use(chaiAsPromised);

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
        expect(language).to.include.keys('name', 'code', 'tag');
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

    // Start each test from a FRESH i18next instance, then stub addResourceBundle
    // on it. Two things made this suite flakily report "1 failing":
    //   - stubbing the shared TAPi18n.i18n left state to leak between tests, so
    //     the stub could end up on a different instance than loadLanguage() used
    //     (its captured call count then read 0 -> "called exactly once" failure);
    //   - asserting via sinon-chai (`expect(spy).to.be.calledOnceWith(...)`) runs
    //     through chai-as-promised, which could evaluate the matcher AFTER the
    //     outer afterEach ran `sinon.restore()` (-> "is not a spy").
    // init() gives a clean instance (mirrors the reliable .setLanguage suite
    // below), and sinon.assert.* is synchronous and never routed through
    // chai-as-promised, so the checks are deterministic. init() calls
    // addResourceBundle once for the default language, so we stub AFTER it.
    let addResourceBundle;
    beforeEach(async () => {
      await TAPi18n.init();
      addResourceBundle = sinon.stub(TAPi18n.i18n, 'addResourceBundle');
    });

    it('actually loads the language data', async () => {
      await TAPi18n.loadLanguage('fr');
      sinon.assert.calledOnceWithMatch(addResourceBundle, 'fr');
      expect(addResourceBundle.firstCall.args[2]).to.have.property('accept');
    });

    it('throws error if language is missing', async () => {
      await expect(TAPi18n.loadLanguage('miss')).to.be.rejectedWith('not supported');
      sinon.assert.notCalled(addResourceBundle);
    });

    // #5756: region/script-tagged and legacy underscore languages must register
    // their bundle under the SAME code i18next will later look up, otherwise the
    // bundle is never found and the UI silently falls back to English.
    it('registers region-tagged languages (zh-CN) under the i18next lookup code', async () => {
      await TAPi18n.loadLanguage('zh-CN');
      const code = TAPi18n.toI18nCode('zh-CN');
      sinon.assert.calledOnceWithMatch(addResourceBundle, code);
      // The actual translation map (not an ES-module namespace) is registered.
      expect(addResourceBundle.firstCall.args[2]).to.have.property('accept');
    });

    it('registers script-tagged languages (zh-Hans) under the i18next lookup code', async () => {
      await TAPi18n.loadLanguage('zh-Hans');
      sinon.assert.calledOnceWithMatch(addResourceBundle, TAPi18n.toI18nCode('zh-Hans'));
      expect(addResourceBundle.firstCall.args[2]).to.have.property('accept');
    });

    it('converts legacy underscore tags (af_ZA) to a hyphenated i18next code', async () => {
      await TAPi18n.loadLanguage('af_ZA');
      const code = TAPi18n.toI18nCode('af_ZA');
      expect(code).to.not.contain('_');
      sinon.assert.calledOnceWithMatch(addResourceBundle, code);
    });

    it('does not unwrap the "default" translation key as an ES-module export', async () => {
      // The data files contain a key literally named "default" ("Default"),
      // which must survive loading and not be mistaken for an ESM namespace.
      await TAPi18n.loadLanguage('de');
      const data = addResourceBundle.firstCall.args[2];
      expect(data).to.have.property('accept');
      expect(data.default).to.be.a('string');
    });

  });

  // #5756: end-to-end — selecting a language must actually translate, and the
  // i18next storage/lookup codes must agree.
  describe('.setLanguage (#5756 region/script tags)', () => {

    beforeEach(async () => {
      await TAPi18n.init();
    });

    it('applies a region-tagged language (zh-CN) instead of English fallback', async () => {
      await TAPi18n.setLanguage('zh-CN');
      // Public current keeps the original Wekan tag.
      expect(TAPi18n.getLanguage()).to.be.equal('zh-CN');
      // The bundle is reachable under i18next's normalised code.
      expect(TAPi18n.i18n.hasResourceBundle(TAPi18n.toI18nCode('zh-CN'), 'translation')).to.be.true;
      // t() returns the Chinese value, not the English 'Accept'.
      const translated = TAPi18n.__('accept');
      expect(translated).to.not.be.equal('Accept');
      expect(translated).to.not.be.equal('accept');
    });

    it('applies a script-tagged language (zh-Hans)', async () => {
      await TAPi18n.setLanguage('zh-Hans');
      expect(TAPi18n.getLanguage()).to.be.equal('zh-Hans');
      expect(TAPi18n.__('accept')).to.not.be.equal('Accept');
    });

    it('applies an RTL region-tagged language (ar-DZ)', async () => {
      await TAPi18n.setLanguage('ar-DZ');
      expect(TAPi18n.getLanguage()).to.be.equal('ar-DZ');
      expect(TAPi18n.__('accept')).to.not.be.equal('Accept');
    });

    it('still applies a simple language (de) — regression guard', async () => {
      await TAPi18n.setLanguage('de');
      expect(TAPi18n.getLanguage()).to.be.equal('de');
      expect(TAPi18n.__('accept')).to.be.equal('Akzeptieren');
    });

    it('falls back to English cleanly for an untranslated key', async () => {
      await TAPi18n.setLanguage('zh-CN');
      // A key that does not exist in any bundle returns the key itself, not a throw.
      expect(TAPi18n.__('this-key-does-not-exist-anywhere')).to.be.equal(
        'this-key-does-not-exist-anywhere',
      );
    });

    it('rejects (and does not switch) for an unsupported/garbage language', async () => {
      await TAPi18n.setLanguage('de');
      await expect(TAPi18n.setLanguage('not-a-real-lang')).to.be.rejectedWith('not supported');
      // A failed load surfaces an error rather than silently leaving English,
      // and the previously selected language is untouched.
      expect(TAPi18n.getLanguage()).to.be.equal('de');
    });

  });

  describe('.ensureLanguageLoaded (#5875)', () => {

    beforeEach(async () => {
      await TAPi18n.init();
    });

    it('loads a supported non-English language on demand', async () => {
      const code = TAPi18n.toI18nCode('zh-CN');
      expect(TAPi18n.i18n.hasResourceBundle(code, 'translation')).to.be.false;
      await TAPi18n.ensureLanguageLoaded('zh-CN');
      expect(TAPi18n.i18n.hasResourceBundle(code, 'translation')).to.be.true;
      // A later explicit-language __() is translated, not English.
      expect(TAPi18n.__('accept', null, 'zh-CN')).to.not.be.equal('Accept');
    });

    it('is a safe no-op for an unsupported language (no throw, no bundle)', async () => {
      await TAPi18n.ensureLanguageLoaded('not-a-real-lang');
      expect(TAPi18n.i18n.hasResourceBundle('not-a-real-lang', 'translation')).to.be.false;
    });

    it('is a safe no-op for empty/garbage input (no throw)', async () => {
      await TAPi18n.ensureLanguageLoaded('');
      await TAPi18n.ensureLanguageLoaded(undefined);
      await TAPi18n.ensureLanguageLoaded(null);
      // Nothing to assert beyond "did not throw".
    });

    it('does not reload a language that is already loaded', async () => {
      await TAPi18n.ensureLanguageLoaded('zh-CN');
      sinon.spy(TAPi18n, 'loadLanguage');
      await TAPi18n.ensureLanguageLoaded('zh-CN');
      expect(TAPi18n.loadLanguage).to.not.be.called;
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
