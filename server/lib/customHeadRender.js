import { WebApp } from 'meteor/webapp';
import { WebAppInternals } from 'meteor/webapp';
import Settings from '/models/settings';
import { customHeadMarkup } from '/server/lib/customHeadValidation';

// Cache the setting since the boilerplate callback is synchronous
let cachedSetting = null;

Meteor.startup(async () => {
  // Load initial setting
  cachedSetting = await Settings.findOneAsync();

  // Keep cache updated reactively
  Settings.find().observeChanges({
    added() { Settings.findOneAsync().then(s => { cachedSetting = s; }); },
    changed() { Settings.findOneAsync().then(s => { cachedSetting = s; }); },
    removed() { Settings.findOneAsync().then(s => { cachedSetting = s; }); },
  });

  // Use Meteor's official API to modify the HTML boilerplate
  WebAppInternals.registerBoilerplateDataCallback('wekan-custom-head', (request, data) => {
    try {
      const setting = cachedSetting;

      // Initialize head array if it doesn't exist
      if (!data.head) {
        data.head = '';
      }

      // Always set title tag based on productName
      const productName = (setting && setting.productName) ? setting.productName : 'Wekan';
      data.head += `\n  <title>${productName}</title>\n`;

      // #6419: ensure a responsive viewport meta tag. Without it, mobile browsers
      // lay the page out at their default ~980px virtual width and scale it down,
      // so the whole UI looks tiny ("icons too small to tap"), window.innerWidth
      // reports 980 on a 390px phone, and the `@media (max-width: 800px)` rules
      // never match. Declaring width=device-width makes WeKan responsive on phones.
      // User zoom is left enabled (no user-scalable=no) for accessibility.
      if (!/name=["']?viewport/i.test(data.head)) {
        data.head +=
          '  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';
      }

      // Only add custom head tags if enabled
      if (!setting || !setting.customHeadEnabled) {
        return data;
      }

      const injection = customHeadMarkup(setting);

      if (injection.trim()) {
        // Append custom head content to the existing head
        data.head += `${injection}\n`;
      }

      return data;
    } catch (e) {
      console.error('[Custom Head] Error in boilerplate callback:', e.message, e.stack);
      return data;
    }
  });
});
