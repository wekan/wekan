import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';

// Keep external or inline custom CSS from admin settings applied to the document head
Meteor.startup(() => {
  const head = document.head || document.getElementsByTagName('head')[0];
  let customCssLink = null;
  let customInlineStyle = null;

  Meteor.subscribe('setting');

  Tracker.autorun(() => {
    const setting = ReactiveCache.getCurrentSetting();
    if (!setting) return;

    const cssUrl = (setting.customCssUrl || '').trim();
    const inlineCss = (setting.customCss || '').trim();

    if (cssUrl) {
      if (!customCssLink) {
        customCssLink = document.createElement('link');
        customCssLink.rel = 'stylesheet';
        customCssLink.id = 'wekan-custom-css-url';
        head.appendChild(customCssLink);
      }
      customCssLink.href = cssUrl;
    } else if (customCssLink) {
      customCssLink.remove();
      customCssLink = null;
    }

    if (inlineCss) {
      if (!customInlineStyle) {
        customInlineStyle = document.createElement('style');
        customInlineStyle.id = 'wekan-custom-inline-css';
        head.appendChild(customInlineStyle);
      }
      customInlineStyle.textContent = inlineCss;
    } else if (customInlineStyle) {
      customInlineStyle.remove();
      customInlineStyle = null;
    }
  });
});
