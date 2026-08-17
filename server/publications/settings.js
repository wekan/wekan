import { ReactiveCache } from '/imports/reactiveCache';
import Settings from '/models/settings';
import Integrations from '/models/integrations';
import { tenantForConnection, tenancyEnabled } from '/server/lib/tenantResolver';

import * as tenants from '/models/lib/tenants';

Meteor.publish('globalwebhooks', async function() {
  if (!this.userId) {
    return this.ready();
  }

  const user = await ReactiveCache.getCurrentUser();
  if (!user || !user.isAdmin) {
    return this.ready();
  }

  const boardId = Integrations.Const.GLOBAL_WEBHOOK_ID;
  const ret = await ReactiveCache.getIntegrations(
    {
      boardId,
    },
    {
      fields: {
        token: 0,
      },
    },
    true,
  );
  return ret;
});
// Multitenancy option D (docs/Design/Multitenancy/Multitenancy.md, D.9): per-tenant
// branding is the instance settings document with this Organization's own
// `org`-prefixed fields written over it. Doing the override HERE is what let
// per-tenant branding ship without touching a single template - the client reads the
// same `currentSetting` fields it always did, and only what is published differs per
// host.
const SETTING_FIELDS = {
  disableRegistration: 1,
  disableForgotPassword: 1,
  renderLinksAsPlainText: 1,
  alwaysShowCodeAsText: 1,
  disableActivities: 1,
  disableNotifications: 1,
  disableWatch: 1,
  // Admin Panel / Problems / Delete reads this field back after writing it.
  // Without publishing it, the optimistic checkmark is immediately redrawn from
  // `undefined` even though the server saved the new value.
  enablePermanentDelete: 1,
  disableAllExport: 1,
  disableAllImport: 1,
  disableExportAvatars: 1,
  disableImportAvatars: 1,
  anonymizeExportUsers: 1,
  anonymizeImportUsers: 1,
  productName: 1,
  // The site theme (docs/Theme/Theme.md, layer 2). On a multitenancy host the
  // Organization's own value is published in its place.
  themeColor: 1,
  themeCustomColors: 1,
  hideLogo: 1,
  hideCardCounterList: 1,
  hideBoardMemberList: 1,
  cardsLoading: 1,
  customLoginLogoImageUrl: 1,
  customLoginLogoLinkUrl: 1,
  customHelpLinkUrl: 1,
  textBelowCustomLoginLogo: 1,
  automaticLinkedUrlSchemes: 1,
  customTopLeftCornerLogoImageUrl: 1,
  customTopLeftCornerLogoLinkUrl: 1,
  customTopLeftCornerLogoHeight: 1,
  customHTMLafterBodyStart: 1,
  customHTMLbeforeBodyEnd: 1,
  displayAuthenticationMethod: 1,
  defaultAuthenticationMethod: 1,
  spinnerName: 1,
  oidcBtnText: 1,
  mailDomainName: 1,
  legalNotice: 1,
  customHeadEnabled: 1,
  customHeadMetaTags: 1,
  customHeadLinkTags: 1,
  customManifestEnabled: 1,
  customManifestContent: 1,
  customAssetLinksEnabled: 1,
  customAssetLinksContent: 1,
  accessibilityPageEnabled: 1,
  accessibilityTitle: 1,
  accessibilityContent: 1,
  // The Support page and its text. NOT publishing these was a real bug, not an
  // omission of convenience: Admin Panel / Settings / Visibility renders the
  // "Support page enabled" checkbox from `currentSetting.supportPageEnabled`, so
  // with the field absent the box drew unchecked, ticking it wrote the setting -
  // and the next re-render drew it unchecked again. The setting was saved and the
  // checkbox said it was not, which reads as "I cannot tick this".
  supportPageEnabled: 1,
  supportPagePublic: 1,
  supportTitle: 1,
  supportPageText: 1,
  supportPopupText: 1,
  // Same story: the All Boards group's "Board activities" checkbox.
  hideBoardActivitiesOnAllBoards: 1,
  // …and the two board-member restrictions shown in Admin Panel / People /
  // Organizations and / Teams.
  boardMembersFromSameOrgOnly: 1,
  boardMembersFromSameTeamOnly: 1,
};

Meteor.publish('setting', async function() {
  const org = tenancyEnabled() ? tenantForConnection(this.connection) : null;
  // No tenancy, or a host no Organization claims: byte-for-byte what it always was,
  // a plain reactive cursor.
  if (!org) {
    return Settings.find({}, { fields: SETTING_FIELDS });
  }

  // A tenant host: the same document, published through this connection with the
  // org's branding applied. observeChanges keeps it reactive, so an admin editing
  // the instance settings still updates every tenant's page - with each tenant's own
  // overrides still on top.
  const overrides = tenants.tenantBrandingOverrides(org);
  const applyOverrides = doc => {
    const out = { ...doc };
    Object.keys(overrides).forEach(field => {
      out[field] = overrides[field];
    });
    return out;
  };
  const handle = await Settings.find({}, { fields: SETTING_FIELDS }).observeChanges({
    added: (id, doc) => {
      this.added('settings', id, applyOverrides(doc));
    },
    changed: (id, doc) => {
      // `doc` carries only the fields that changed. An overridden field must not be
      // allowed back through: the tenant's value wins whatever the instance sets.
      const patch = { ...doc };
      Object.keys(patch).forEach(field => {
        if (overrides[field] !== undefined) patch[field] = overrides[field];
      });
      this.changed('settings', id, patch);
    },
    removed: id => {
      this.removed('settings', id);
    },
  });
  this.ready();
  this.onStop(() => handle.stop());
  return undefined;
});

Meteor.publish('mailServer', async function() {
  const user = await ReactiveCache.getCurrentUser();

  let ret = []
  if (user && user.isAdmin) {
    ret = Settings.find(
      {},
      {
        fields: {
          'mailServer.host': 1,
          'mailServer.port': 1,
          'mailServer.username': 1,
          'mailServer.enableTLS': 1,
          'mailServer.from': 1,
        },
      },
    );
  }
  return ret;
});
