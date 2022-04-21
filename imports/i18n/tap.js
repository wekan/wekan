import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
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
      debug: Meteor.isDevelopment,
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
  getSupportedLanguages() {
    return Object.values(languages).map(({ name, code, tag }) => ({ name, code, tag }));
  },
  getLanguage() {
    return this.current.get();
  },
  async loadLanguage(language) {
    if (language in languages && 'load' in languages[language]) {
      const data = await languages[language].load();
      this.i18n.addResourceBundle(language, DEFAULT_NAMESPACE, data);
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
