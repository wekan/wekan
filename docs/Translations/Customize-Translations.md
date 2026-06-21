In WeKan v7.08 and newer.

## Description

WeKan has default translations from English to other languages at https://explore.transifex.com/wekan/wekan/

With this feature, you can override some default translation string with custom string, your modified new version of translation text, with GUI at Admin Panel, and changes are immediately in use in WeKan.

## To translators, about the word Custom

Custom means something modified, that is not the default.
For example, WeKan has other feature [Custom Fields](../API/Custom-Fields.md) ,
where is added new custom fields, that are not default.

## Admin Panel / Translation

- Language: [languages.js](../../imports/i18n/languages.js)
- Text, source string In English: [en.i18n.json](../../imports/i18n/data/en.i18n.json)
- Translation text: Your new translation custom string

## Source

- https://github.com/wekan/wekan/pull/5085
- https://github.com/wekan/wekan/issues/5065#issuecomment-1668259510

<img src="https://wekan.fi/custom-translation-string.png" width="100%" alt="Translation Custom String" />