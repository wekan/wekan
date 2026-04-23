import { WebApp } from 'meteor/webapp';
import { WebAppInternals } from 'meteor/webapp';
import Settings from '/models/settings';

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

      // Only add custom head tags if enabled
      if (!setting || !setting.customHeadEnabled) {
        return data;
      }

      let injection = '';
      // Add custom link tags (except manifest if custom manifest is enabled)
      if (setting.customHeadLinkTags && setting.customHeadLinkTags.trim()) {
        let linkTags = setting.customHeadLinkTags;
        if (setting.customManifestEnabled) {
          // Remove any manifest links from custom link tags to avoid duplicates
          linkTags = linkTags.replace(/<link[^>]*rel=["\']?manifest["\']?[^>]*>/gi, '');
        }
        if (linkTags.trim()) {
          injection += linkTags + '\n';
        }
      }

      // Add manifest link if custom manifest is enabled
      if (setting.customManifestEnabled) {
        injection += '  <link rel="manifest" href="/site.webmanifest" crossorigin="use-credentials">\n';
      }

      if (injection.trim()) {
        // Append custom head content to the existing head
        data.head += injection;
      }

      return data;
    } catch (e) {
      console.error('[Custom Head] Error in boilerplate callback:', e.message, e.stack);
      return data;
    }
  });
});
