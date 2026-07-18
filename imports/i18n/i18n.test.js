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
      // Stop the computation at the end: a leaked autorun keeps depending on
      // TAPi18n.current and re-runs during every later test that switches
      // language, which is exactly the kind of cross-test state that made this
      // shared-singleton suite flaky.
      const computation = Tracker.autorun(() => {
        tracked.push(TAPi18n.getLanguage());
      });
      try {
        expect(tracked).to.have.members(['en']);
        await TAPi18n.setLanguage('de');
        Tracker.flush();
        expect(tracked).to.have.members(['en', 'de']);
      } finally {
        computation.stop();
      }
    });

  });

  describe('.loadLanguage', () => {

    // Assert on OBSERVABLE i18next state (is the bundle registered, under which
    // code, with what data) rather than on a sinon stub of addResourceBundle.
    // Stubbing a method on the SHARED TAPi18n.i18n singleton made this suite
    // flakily report "1 failing": if any cross-test operation replaced
    // TAPi18n.i18n between the stub install and the assertion, loadLanguage()
    // registered the bundle on a different instance than the one the stub was
    // watching, so the recorded count read 0 ("expected addResourceBundle to be
    // called once"). Reading the resulting bundle back is instance-agnostic and
    // deterministic, and mirrors the reliable .setLanguage suite below. init()
    // gives each test a clean instance with only the default language loaded.
    beforeEach(async () => {
      await TAPi18n.init();
    });

    // The translation map i18next stored for `language`, under the same
    // normalised code loadLanguage() registers (and t() later looks up) it under.
    const bundleFor = (language) =>
      TAPi18n.i18n.getResourceBundle(TAPi18n.toI18nCode(language), 'translation');

    it('actually loads the language data', async () => {
      await TAPi18n.loadLanguage('fr');
      expect(TAPi18n.i18n.hasResourceBundle(TAPi18n.toI18nCode('fr'), 'translation')).to.be.true;
      expect(bundleFor('fr')).to.have.property('accept');
    });

    it('throws error if language is missing', async () => {
      await expect(TAPi18n.loadLanguage('miss')).to.be.rejectedWith('not supported');
      expect(TAPi18n.i18n.hasResourceBundle('miss', 'translation')).to.be.false;
    });

    // #5756: region/script-tagged and legacy underscore languages must register
    // their bundle under the SAME code i18next will later look up, otherwise the
    // bundle is never found and the UI silently falls back to English.
    it('registers region-tagged languages (zh-CN) under the i18next lookup code', async () => {
      await TAPi18n.loadLanguage('zh-CN');
      const code = TAPi18n.toI18nCode('zh-CN');
      expect(TAPi18n.i18n.hasResourceBundle(code, 'translation')).to.be.true;
      // The actual translation map (not an ES-module namespace) is registered.
      expect(bundleFor('zh-CN')).to.have.property('accept');
    });

    it('registers script-tagged languages (zh-Hans) under the i18next lookup code', async () => {
      await TAPi18n.loadLanguage('zh-Hans');
      expect(TAPi18n.i18n.hasResourceBundle(TAPi18n.toI18nCode('zh-Hans'), 'translation')).to.be.true;
      expect(bundleFor('zh-Hans')).to.have.property('accept');
    });

    it('converts legacy underscore tags (af_ZA) to a hyphenated i18next code', async () => {
      await TAPi18n.loadLanguage('af_ZA');
      const code = TAPi18n.toI18nCode('af_ZA');
      expect(code).to.not.contain('_');
      // Registered under the hyphenated code, never under the raw underscore tag.
      expect(TAPi18n.i18n.hasResourceBundle(code, 'translation')).to.be.true;
      expect(TAPi18n.i18n.hasResourceBundle('af_ZA', 'translation')).to.be.false;
    });

    it('does not unwrap the "default" translation key as an ES-module export', async () => {
      // The data files contain a key literally named "default" ("Default"),
      // which must survive loading and not be mistaken for an ESM namespace.
      await TAPi18n.loadLanguage('de');
      const data = bundleFor('de');
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

  describe('.resolveTag / case-insensitive detection (Japanese & Chinese variants)', () => {

    beforeEach(async () => {
      await TAPi18n.init();
    });

    it('resolveTag returns the canonical tag, case-insensitively', () => {
      expect(TAPi18n.resolveTag('ja')).to.equal('ja');
      expect(TAPi18n.resolveTag('ja-JP')).to.equal('ja-JP');
      expect(TAPi18n.resolveTag('ja-jp')).to.equal('ja-JP');      // lowercase region
      expect(TAPi18n.resolveTag('JA')).to.equal('ja');            // uppercase language
      expect(TAPi18n.resolveTag('zh-Hant')).to.equal('zh-Hant');
      expect(TAPi18n.resolveTag('zh-hant')).to.equal('zh-Hant');  // lowercase script
      expect(TAPi18n.resolveTag('zh-CN')).to.equal('zh-CN');
      // legacy underscore key matched from a browser hyphen tag (and vice versa)
      expect(TAPi18n.resolveTag('af-ZA')).to.equal('af_ZA');
      expect(TAPi18n.resolveTag('af_ZA')).to.equal('af_ZA');
    });

    it('resolveTag maps bare Chinese "zh" to its own registered (Simplified) entry', () => {
      // 'zh' is now a registered language of its own (generic Simplified Chinese),
      // so it resolves to itself rather than aliasing to 'zh-Hans'.
      expect(TAPi18n.resolveTag('zh')).to.equal('zh');
      expect(TAPi18n.resolveTag('ZH')).to.equal('zh');
    });

    it('resolveTag returns undefined for an unsupported language', () => {
      expect(TAPi18n.resolveTag('not-a-real-lang')).to.equal(undefined);
      expect(TAPi18n.resolveTag('')).to.equal(undefined);
    });

    it('isLanguageSupported is case-insensitive (and knows the registered zh entry)', () => {
      expect(TAPi18n.isLanguageSupported('ja-jp')).to.be.true;
      expect(TAPi18n.isLanguageSupported('ZH-HANT')).to.be.true;
      expect(TAPi18n.isLanguageSupported('de')).to.be.true;
      expect(TAPi18n.isLanguageSupported('zh')).to.be.true;
      expect(TAPi18n.isLanguageSupported('xx-nope')).to.be.false;
    });

    it('each Japanese variant loads its own file under its own i18next code', async () => {
      const has = (t) => TAPi18n.i18n.hasResourceBundle(TAPi18n.toI18nCode(t), 'translation');
      await TAPi18n.setLanguage('ja');
      expect(TAPi18n.getLanguage()).to.equal('ja');
      expect(has('ja')).to.be.true;
      await TAPi18n.setLanguage('ja-JP');
      expect(TAPi18n.getLanguage()).to.equal('ja-JP');
      expect(has('ja-JP')).to.be.true;
      await TAPi18n.setLanguage('ja-Hira');
      expect(TAPi18n.getLanguage()).to.equal('ja-Hira');
      expect(has('ja-Hira')).to.be.true;
    });

    it('setLanguage normalises a case-insensitive tag to the canonical one', async () => {
      await TAPi18n.setLanguage('ja-jp');
      expect(TAPi18n.getLanguage()).to.equal('ja-JP');
      await TAPi18n.setLanguage('zh-hant');
      expect(TAPi18n.getLanguage()).to.equal('zh-Hant');
    });

    it('setLanguage("zh") selects generic (Simplified) Chinese, not English', async () => {
      await TAPi18n.setLanguage('zh');
      expect(TAPi18n.getLanguage()).to.equal('zh');
      expect(TAPi18n.i18n.hasResourceBundle(TAPi18n.toI18nCode('zh'), 'translation')).to.be.true;
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
