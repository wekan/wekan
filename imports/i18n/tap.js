import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';
import languages from './languages';

const DEFAULT_NAMESPACE = 'translation';
const DEFAULT_LANGUAGE = 'en';
const getTranslationCollection = () => require('/models/translation').default;

// Base codes with no registered entry of their own resolve to a sensible default
// variant, so a browser reporting the bare code still gets that language, not English.
// 'zh' now has its own registered entry (generic Simplified Chinese, zh.i18n.json),
// so no alias is needed for it; 'wuu' (Wu Chinese) has only the wuu-Hans file, so a
// bare 'wuu' maps to it. Keys are compared case-insensitively (see resolveTag).
const LANGUAGE_ALIASES = { wuu: 'wuu-Hans' };

// Map a Wekan language tag (the key/`tag` from languages.js, e.g. 'zh-CN',
// 'zh-Hans', 'ar-DZ' or the legacy underscore form 'en_AU', 'af_ZA') to the
// code i18next actually stores and looks translations up under.
//
// Two transforms are required so that the bundle we register and the language
// we switch to (and that t() resolves against) always agree (#5756):
//  1. Underscores -> hyphens. i18next only understands BCP-47 hyphen separators;
//     with an underscore it cannot parse the subtags, so 'af_za' resolves
//     straight to the English fallback and the UI stays English.
//  2. formatLanguageCode (enabled by `cleanCode: true`). i18next normalises the
//     case of region/script subtags (e.g. region -> UPPER, script -> Titlecase)
//     when it resolves a language. If we register the resource bundle under the
//     raw tag but i18next looks it up under the formatted code, the bundle is
//     never found and it falls back to English.
// Keeping every i18next call (supportedLngs, addResourceBundle, changeLanguage,
// t) on the same normalised code makes storage and lookup consistent for ALL
// supported languages, not just the plain lowercase ones (de, fr, …).

// Carefully reproduced tap:i18n API
export const TAPi18n = {
  i18n: null,
  current: new ReactiveVar(DEFAULT_LANGUAGE),
  ready: new ReactiveVar(false),
  // Normalise a Wekan language tag to the code i18next stores/looks up under.
  // See the comment above for why both transforms are needed (#5756).
  toI18nCode(language) {
    if (!language) return language;
    const hyphenated = String(language).replace(/_/g, '-');
    const utils = this.i18n && this.i18n.services && this.i18n.services.languageUtils;
    return utils ? utils.formatLanguageCode(hyphenated) : hyphenated;
  },
  async init() {
    this.ready.set(false);
    this.i18n = i18next.createInstance().use(sprintf);
    await this.i18n.init({
      fallbackLng: DEFAULT_LANGUAGE,
      cleanCode: true,
      // Show translations debug messages only when DEBUG=true
      // OLD: debug: Meteor.isDevelopment,
      debug: process.env.DEBUG === 'true',
      // `this.i18n` is not fully initialised yet, so formatLanguageCode is not
      // available here. The tags in languages.js are already in i18next's
      // canonical case (e.g. 'zh-CN', 'zh-Hans', 'ar-DZ'); they only need the
      // underscore->hyphen conversion so i18next can parse the subtags. The
      // store/lookup side (loadLanguage/setLanguage/__) additionally runs them
      // through formatLanguageCode so any non-canonical casing still matches.
      supportedLngs: Object.values(languages).map(({ tag }) => tag.replace(/_/g, '-')),
      ns: DEFAULT_NAMESPACE,
      defaultNs: DEFAULT_NAMESPACE,
      postProcess: ["sprintf"],
      // Default values to match tap:i18n behaviour
      interpolation: {
        prefix: '__',
        suffix: '__',
        escapeValue: false,
      },
      resources: {},
    });
    // Load the current language data
    await TAPi18n.loadLanguage(DEFAULT_LANGUAGE);
    this.ready.set(true);
  },
  // Resolve an arbitrary language string to the canonical Wekan tag (a key in
  // languages.js), CASE-INSENSITIVELY (e.g. 'zh-hant' -> 'zh-Hant', 'JA-JP' -> 'ja-JP'),
  // applying LANGUAGE_ALIASES for bare base codes (e.g. 'zh' -> 'zh-Hans'). Returns the
  // canonical tag, or undefined when the language is not supported.
  resolveTag(language) {
    if (!language) return undefined;
    if (language in languages) return language; // fast path: exact canonical key
    // Case-insensitive AND underscore<->hyphen-insensitive, so a region/script tagged
    // language matches however the browser spells it (legacy 'af_ZA' vs browser 'af-ZA',
    // 'zh-hant' vs 'zh-Hant', 'JA-JP' vs 'ja-JP').
    const norm = String(language).toLowerCase().replace(/_/g, '-');
    for (const key of Object.keys(languages)) {
      if (key.toLowerCase().replace(/_/g, '-') === norm ||
          String(languages[key].tag).toLowerCase().replace(/_/g, '-') === norm) return key;
    }
    const alias = LANGUAGE_ALIASES[norm];
    if (alias && alias in languages) return alias;
    return undefined;
  },
  isLanguageSupported(language) {
    return this.resolveTag(language) !== undefined;
  },
  getSupportedLanguages() {
    return Object.values(languages).map(({ name, code, tag, rtl }) => ({ name, code, tag, rtl }));
  },
  getLanguage() {
    return this.current.get();
  },
  // Whether the given language (default: the current one) is written
  // right-to-left, from the `rtl` flag in languages.js. Reactive on the current
  // language so callers re-run when the user switches languages.
  isRTL(language = this.current.get()) {
    return Boolean(languages[language] && languages[language].rtl);
  },
  // 'rtl' or 'ltr' for the given/current language, suitable for the HTML `dir`
  // attribute.
  getLanguageDirection(language) {
    return this.isRTL(language) ? 'rtl' : 'ltr';
  },
  loadTranslation(language) {
    return new Promise((resolve, reject) => {
      if (Meteor.isClient) {
        const translationSubscription = Meteor.subscribe('translation', {language: language},  0, {
          onReady() {
            resolve(translationSubscription);
          },
          onError(error) {
            reject(error);
          }
        });
      } else {
        resolve();
      }
    });
  },
  async loadLanguage(language) {
    // Resolve to the canonical tag so a case-insensitive / aliased input (e.g. 'zh-hant',
    // 'zh') still finds the right file and registers under the code i18next looks up.
    const key = this.resolveTag(language);
    if (key && 'load' in languages[key]) {
      let data = await languages[key].load();
      // Dynamic `import()` of a JSON module can resolve to an ES-module
      // namespace ({ default: {...} }) rather than the bare object, depending on
      // the bundler/interop. Unwrap it so addResourceBundle receives the actual
      // translation map (#5756).
      //
      // NB: the translation data ITSELF contains a key literally named
      // "default" (value "Default"/"Standard"), so we must NOT unwrap on the
      // mere presence of a `default` property. Only unwrap a genuine ES-module
      // namespace, identified by its `__esModule` / Symbol.toStringTag marker
      // and a `default` that is the real (object) translation map.
      const isModuleNamespace =
        data &&
        typeof data === 'object' &&
        (data.__esModule === true || data[Symbol.toStringTag] === 'Module') &&
        data.default &&
        typeof data.default === 'object';
      if (isModuleNamespace) {
        data = data.default;
      }

      let custom_translations = [];
      await this.loadTranslation(key);
      const Translation = getTranslationCollection();
      const cursor = Translation.find(
        { language: key },
        { fields: { text: true, translationText: true } },
      );
      custom_translations =
        typeof cursor.fetchAsync === 'function' ? await cursor.fetchAsync() : cursor.fetch();

      if (custom_translations && custom_translations.length > 0) {
        data = custom_translations.reduce((acc, cur) => {
          const key = typeof cur?.text === 'string' ? cur.text.trim() : '';
          const value = typeof cur?.translationText === 'string' ? cur.translationText.trim() : '';

          // Ignore invalid overrides so built-in file translations stay visible.
          if (!key || !value || key === value) {
            return acc;
          }

          acc[key] = value;
          return acc;
        }, data);
      }

      // Register the bundle under the code i18next will actually look it up
      // under, so storage and lookup agree for region/script/underscore tags.
      this.i18n.addResourceBundle(this.toI18nCode(key), DEFAULT_NAMESPACE, data);
    } else {
      throw new Error(`Language ${language} is not supported`);
    }
  },
  async setLanguage(language) {
    // Resolve to the canonical tag first, so the loaded file, the i18next code and the
    // stored `current` all agree even for a case-insensitive / aliased input.
    const key = this.resolveTag(language) || language;
    await this.loadLanguage(key);
    // Switch i18next using the same normalised code the bundle is stored under.
    await this.i18n.changeLanguage(this.toI18nCode(key));
    // `current` keeps the canonical Wekan tag (used for the profile, the language
    // picker and the reactive UI), not the i18next-internal code.
    this.current.set(key);
  },
  // Make sure the resource bundle for `language` is available before a
  // synchronous __() call. On the server only the default (English) bundle is
  // loaded at startup, so translating to a user's language (e.g. notification
  // emails) otherwise silently fell back to English. See #5875.
  async ensureLanguageLoaded(language) {
    if (!language || !this.i18n) return;
    const key = this.resolveTag(language);
    if (!key) return;
    if (this.i18n.hasResourceBundle(this.toI18nCode(key), DEFAULT_NAMESPACE)) return;
    await this.loadLanguage(key);
  },
  // Return translation by key
  __(key, options, language) {
    this.current.dep.depend();

    // The global sprintf post-processor (`postProcess: ["sprintf"]`) throws when
    // a translation value contains a '%' sequence it cannot parse, e.g. the
    // literal "%{value}" used in some help texts. That would crash the caller
    // (the global Blaze '_' helper). Retry without sprintf so such strings
    // render literally instead of throwing.
    const translate = (lng, extra = {}) => {
      // Look the key up under the same normalised code the bundle is stored
      // under. `lng === undefined` means "use i18next's current language",
      // which setLanguage() already set to the normalised code.
      const opts = { ...options, ...extra, lng: lng === undefined ? undefined : this.toI18nCode(lng) };
      try {
        return this.i18n.t(key, opts);
      } catch (e) {
        try {
          return this.i18n.t(key, { ...opts, postProcess: false });
        } catch (e2) {
          return key;
        }
      }
    };

    const translation = translate(language);

    // If the selected language misses the key, fallback explicitly to English.
    if (translation === key) {
      const englishFallback = translate(DEFAULT_LANGUAGE, { fallbackLng: false });

      if (englishFallback !== key) {
        return englishFallback;
      }
    }

    return translation;
  }
};
