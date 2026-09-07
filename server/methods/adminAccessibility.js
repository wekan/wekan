import { Meteor } from 'meteor/meteor';
import {
  setAccessibilityContentForAdmin,
  setAccessibilityEnabledForAdmin,
} from '/server/lib/adminAccessibility';

Meteor.methods({
  async setAdminAccessibilityEnabled(enabled) {
    return setAccessibilityEnabledForAdmin(this.userId, enabled);
  },

  async setAdminAccessibilityContent(title, body) {
    return setAccessibilityContentForAdmin(this.userId, title, body);
  },
});
