// Load all useraccounts translations at once
import { Tracker } from 'meteor/tracker';
import { T9n } from 'meteor/useraccounts:core';
import { TAPi18n } from './tap';

T9n.setTracker({ Tracker });

T9n.map('ar', require('meteor-accounts-t9n/build/ar').ar);
T9n.map('ca', require('meteor-accounts-t9n/build/ca').ca);
T9n.map('cs', require('meteor-accounts-t9n/build/cs').cs);
T9n.map('da', require('meteor-accounts-t9n/build/da').da);
T9n.map('de', require('meteor-accounts-t9n/build/de').de);
T9n.map('el', require('meteor-accounts-t9n/build/el').el);
T9n.map('en', require('meteor-accounts-t9n/build/en').en);
T9n.map('es', require('meteor-accounts-t9n/build/es').es);
T9n.map('es-ES', require('meteor-accounts-t9n/build/es_ES').es_ES);
T9n.map('es-ES-formal', require('meteor-accounts-t9n/build/es_ES_formal').es_ES_formal);
T9n.map('es-formal', require('meteor-accounts-t9n/build/es_formal').es_formal);
T9n.map('et', require('meteor-accounts-t9n/build/et').et);
T9n.map('fa', require('meteor-accounts-t9n/build/fa').fa);
T9n.map('fi', require('meteor-accounts-t9n/build/fi').fi);
T9n.map('fr', require('meteor-accounts-t9n/build/fr').fr);
T9n.map('fr-CA', require('meteor-accounts-t9n/build/fr_CA').fr_CA);
T9n.map('he', require('meteor-accounts-t9n/build/he').he);
T9n.map('hr', require('meteor-accounts-t9n/build/hr').hr);
T9n.map('hu', require('meteor-accounts-t9n/build/hu').hu);
T9n.map('id', require('meteor-accounts-t9n/build/id').id);
T9n.map('it', require('meteor-accounts-t9n/build/it').it);
T9n.map('ja', require('meteor-accounts-t9n/build/ja').ja);
T9n.map('kh', require('meteor-accounts-t9n/build/kh').kh);
T9n.map('ko', require('meteor-accounts-t9n/build/ko').ko);
T9n.map('nl', require('meteor-accounts-t9n/build/nl').nl);
T9n.map('no-NB', require('meteor-accounts-t9n/build/no_NB').no_NB);
T9n.map('pl', require('meteor-accounts-t9n/build/pl').pl);
T9n.map('pt', require('meteor-accounts-t9n/build/pt').pt);
T9n.map('pt-PT', require('meteor-accounts-t9n/build/pt_PT').pt_PT);
T9n.map('ro', require('meteor-accounts-t9n/build/ro').ro);
T9n.map('ru', require('meteor-accounts-t9n/build/ru').ru);
T9n.map('sk', require('meteor-accounts-t9n/build/sk').sk);
T9n.map('sl', require('meteor-accounts-t9n/build/sl').sl);
T9n.map('sv', require('meteor-accounts-t9n/build/sv').sv);
T9n.map('th', require('meteor-accounts-t9n/build/th').th);
T9n.map('tr', require('meteor-accounts-t9n/build/tr').tr);
T9n.map('uk', require('meteor-accounts-t9n/build/uk').uk);
T9n.map('vi', require('meteor-accounts-t9n/build/vi').vi);
T9n.map('zh-CN', require('meteor-accounts-t9n/build/zh_CN').zh_CN);
T9n.map('zh-HK', require('meteor-accounts-t9n/build/zh_HK').zh_HK);
T9n.map('zh-TW', require('meteor-accounts-t9n/build/zh_TW').zh_TW);

// Reactively adjust useraccounts:core translations
Tracker.autorun(() => {
  const language = TAPi18n.getLanguage();
  try {
    T9n.setLanguage(language);
  } catch (err) {
    // Try to extract & set the language part only (e.g. "en" instead of "en-UK")
    try {
      T9n.setLanguage(language.split('-')[0]);
    } catch (err) {
      console.error(err);
    }
  }
});
