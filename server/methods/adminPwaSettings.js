import { Meteor } from 'meteor/meteor';
import {
  setPwaAssetLinksForAdmin,
  setPwaHeadContentForAdmin,
  setPwaToggleForAdmin,
} from '/server/lib/adminPwaSettings';

Meteor.methods({
  async setAdminPwaToggle(field, enabled) {
    return setPwaToggleForAdmin(this.userId, field, enabled);
  },
  async setAdminPwaHeadContent(metaTags, linkTags, manifest) {
    return setPwaHeadContentForAdmin(this.userId, metaTags, linkTags, manifest);
  },
  async setAdminPwaAssetLinks(content) {
    return setPwaAssetLinksForAdmin(this.userId, content);
  },
});
