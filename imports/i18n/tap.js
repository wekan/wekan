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
  // Return translation by key
  __(key, options, language) {
    this.current.dep.depend();
    const translation = this.i18n.t(key, {
      ...options,
      lng: language,
    });

    // If the selected language misses the key, fallback explicitly to English.
    if (translation === key) {
      const englishFallback = this.i18n.t(key, {
        ...options,
        lng: DEFAULT_LANGUAGE,
        fallbackLng: false,
      });

      if (englishFallback !== key) {
        return englishFallback;
      }
    }

    return translation;
  }
};
