import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';
import languages from './languages';

const DEFAULT_NAMESPACE = 'translation';
const DEFAULT_LANGUAGE = 'en';
const getTranslationCollection = () => require('/models/translation').default;

// Carefully reproduced tap:i18n API
export const TAPi18n = {
  i18n: null,
  current: new ReactiveVar(DEFAULT_LANGUAGE),
  ready: new ReactiveVar(false),
  async init() {
    this.ready.set(false);
    this.i18n = i18next.createInstance().use(sprintf);
    await this.i18n.init({
      fallbackLng: DEFAULT_LANGUAGE,
      cleanCode: true,
      // Show translations debug messages only when DEBUG=true
      // OLD: debug: Meteor.isDevelopment,
      debug: process.env.DEBUG === 'true',
      supportedLngs: Object.values(languages).map(({ tag }) => tag),
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
  isLanguageSupported(language) {
    return Object.values(languages).some(({ tag }) => tag === language);
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
    if (language in languages && 'load' in languages[language]) {
      let data = await languages[language].load();

      let custom_translations = [];
      await this.loadTranslation(language);
      const Translation = getTranslationCollection();
      const cursor = Translation.find(
        { language },
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

      this.i18n.addResourceBundle(language, DEFAULT_NAMESPACE, data);
    } else {
      throw new Error(`Language ${language} is not supported`);
    }
  },
  async setLanguage(language) {
    await this.loadLanguage(language);
    await this.i18n.changeLanguage(language);
    this.current.set(language);
  },
  // Make sure the resource bundle for `language` is available before a
  // synchronous __() call. On the server only the default (English) bundle is
  // loaded at startup, so translating to a user's language (e.g. notification
  // emails) otherwise silently fell back to English. See #5875.
  async ensureLanguageLoaded(language) {
    if (!language || !this.i18n) return;
    if (!this.isLanguageSupported(language)) return;
    if (this.i18n.hasResourceBundle(language, DEFAULT_NAMESPACE)) return;
    await this.loadLanguage(language);
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
      const opts = { ...options, ...extra, lng };
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
