import { ReactiveCache } from '/imports/reactiveCache';
import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import Translation from '/models/translation';
import i18next from 'i18next';
import sprintf from 'i18next-sprintf-postprocessor';
import languages from './languages';

const DEFAULT_NAMESPACE = 'translation';
const DEFAULT_LANGUAGE = 'en';

// Carefully reproduced tap:i18n API
export const TAPi18n = {
  i18n: null,
  current: new ReactiveVar(DEFAULT_LANGUAGE),
  async init() {
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
  },
  isLanguageSupported(language) {
    return Object.values(languages).some(({ tag }) => tag === language);
  },
  getSupportedLanguages() {
    return Object.values(languages).map(({ name, code, tag }) => ({ name, code, tag }));
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
      custom_translations = ReactiveCache.getTranslations({language: language}, {fields: { text: true, translationText: true }});

      if (custom_translations && custom_translations.length > 0) {
        data = custom_translations.reduce((acc, cur) => (acc[cur.text]=cur.translationText, acc), data);
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
    return this.i18n.t(key, {
      ...options,
      lng: language,
    });
  }
};
