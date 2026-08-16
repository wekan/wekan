import { ReactiveCache } from '/imports/reactiveCache';
import { Session } from 'meteor/session';
import { leftMenuData, paneTitle } from '/models/lib/leftMenu';
import { TAPi18n } from '/imports/i18n';
import { ALLOWED_WAIT_SPINNERS } from '/config/const';
import LockoutSettings from '/models/lockoutSettings';
import AccessibilitySettings from '/models/accessibilitySettings';
import AccountSettings from '/models/accountSettings';
import Announcements from '/models/announcements';
import Settings from '/models/settings';
// Multitenancy option D: the per-tenant Global Admin rules, shared with the server
// (docs/Design/Multitenancy/Multitenancy.md).
import * as tenantAdmin from '/models/lib/tenantAdmin';
import { resolveDefaultAuthenticationMethod } from '/models/lib/authenticationMethod';
import { FlowRouter } from 'meteor/ostrio:flow-router-extra';
// The per-pane URLs of the Admin Panel. docs/Features/Page/Admin-Panel-URLs.md
import { adminPath } from '/models/lib/adminUrls';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
import { format } from '/imports/lib/dateUtils';

// Helper functions shared across the template
function checkField(selector) {
  const value = $(selector).val();
  if (!value || value.trim() === '') {
    $(selector).parents('li.smtp-form').addClass('has-error');
    throw Error('blank field');
  } else {
    return value;
  }
}

function cleanAndValidateJSON(content) {
  if (!content || !content.trim()) {
    return { json: content };
  }

  try {
    // Try to parse as-is
    const parsed = JSON.parse(content);
    return { json: JSON.stringify(parsed, null, 2) };
  } catch (e) {
    const errorMsg = e.message;

    // If error is "unexpected non-whitespace character after JSON data"
    if (
      errorMsg.includes('unexpected non-whitespace character after JSON data')
    ) {
      try {
        // Try to find and extract valid JSON by finding matching braces/brackets
        const trimmed = content.trim();
        let depth = 0;
        let endPos = -1;
        let inString = false;
        let escapeNext = false;

        for (let i = 0; i < trimmed.length; i++) {
          const char = trimmed[i];

          if (escapeNext) {
            escapeNext = false;
            continue;
          }

          if (char === '\\') {
            escapeNext = true;
            continue;
          }

          if (char === '"' && !escapeNext) {
            inString = !inString;
            continue;
          }

          if (inString) continue;

          if (char === '{' || char === '[') {
            depth++;
          } else if (char === '}' || char === ']') {
            depth--;
            if (depth === 0) {
              endPos = i + 1;
              break;
            }
          }
        }

        if (endPos > 0) {
          const cleanedContent = trimmed.substring(0, endPos);
          const parsed = JSON.parse(cleanedContent);
          return { json: JSON.stringify(parsed, null, 2) };
        }
      } catch (fixError) {
        // If fix attempt fails, return original error
      }
    }

    // Remove trailing commas (common error)
    if (errorMsg.includes('Unexpected token')) {
      try {
        const fixed = content.replace(/,(\s*[}\]])/g, '$1');
        const parsed = JSON.parse(fixed);
        return { json: JSON.stringify(parsed, null, 2) };
      } catch (fixError) {
        // Continue to error return
      }
    }

    return { error: errorMsg };
  }
}

const LIMIT_UNIT_FACTORS = {
  bytes: 1,
  mb: 1024 * 1024,
  gb: 1024 * 1024 * 1024,
};

const DEFAULT_LIMIT_SETTINGS = {
  attachmentsUploadMaxBytes: 0,
  attachmentsDownloadMaxBytes: 0,
  apiUploadMaxBytes: 50 * 1024 * 1024,
  apiDownloadMaxBytes: 20 * 1024 * 1024,
};

function toNonNegativeInteger(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

function normalizeLimitSettings(settingsDoc) {
  const fromDoc = settingsDoc?.limitSettings || {};
  const legacyUpload = settingsDoc?.uploadSettings?.maxFileSize;

  const attachmentsUploadMaxBytes = Number.isFinite(fromDoc.attachmentsUploadMaxBytes)
    ? toNonNegativeInteger(fromDoc.attachmentsUploadMaxBytes, DEFAULT_LIMIT_SETTINGS.attachmentsUploadMaxBytes)
    : (Number.isFinite(legacyUpload)
      ? toNonNegativeInteger(legacyUpload, DEFAULT_LIMIT_SETTINGS.attachmentsUploadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.attachmentsUploadMaxBytes);

  return {
    attachmentsUploadMaxBytes,
    attachmentsDownloadMaxBytes: Number.isFinite(fromDoc.attachmentsDownloadMaxBytes)
      ? toNonNegativeInteger(fromDoc.attachmentsDownloadMaxBytes, DEFAULT_LIMIT_SETTINGS.attachmentsDownloadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.attachmentsDownloadMaxBytes,
    apiUploadMaxBytes: Number.isFinite(fromDoc.apiUploadMaxBytes)
      ? toNonNegativeInteger(fromDoc.apiUploadMaxBytes, DEFAULT_LIMIT_SETTINGS.apiUploadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.apiUploadMaxBytes,
    apiDownloadMaxBytes: Number.isFinite(fromDoc.apiDownloadMaxBytes)
      ? toNonNegativeInteger(fromDoc.apiDownloadMaxBytes, DEFAULT_LIMIT_SETTINGS.apiDownloadMaxBytes)
      : DEFAULT_LIMIT_SETTINGS.apiDownloadMaxBytes,
  };
}

function pickUnitForBytes(bytes) {
  const safeBytes = toNonNegativeInteger(bytes, 0);
  if (safeBytes > 0 && safeBytes % LIMIT_UNIT_FACTORS.gb === 0) {
    return 'gb';
  }
  if (safeBytes > 0 && safeBytes % LIMIT_UNIT_FACTORS.mb === 0) {
    return 'mb';
  }
  return 'bytes';
}

function toDisplayValue(bytes, unit) {
  const safeBytes = toNonNegativeInteger(bytes, 0);
  const factor = LIMIT_UNIT_FACTORS[unit] || LIMIT_UNIT_FACTORS.bytes;
  return safeBytes / factor;
}

function toBytes(value, unit) {
  const numericValue = Number.parseFloat(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null;
  }
  const factor = LIMIT_UNIT_FACTORS[unit] || LIMIT_UNIT_FACTORS.bytes;
  return Math.round(numericValue * factor);
}

function refreshAttachmentStorageSettings(tpl, showLoading = false) {
  if (!tpl) {
    return;
  }

  if (showLoading) {
    tpl.loading.set(true);
  }

  Meteor.call('getAttachmentStorageSettings', (error, settings) => {
    if (showLoading) {
      tpl.loading.set(false);
    }

    if (error || !settings) {
      if (process.env.DEBUG === 'true') {
        console.warn('Failed to load attachment storage settings:', error);
      }
      return;
    }

    const normalizedLimits = normalizeLimitSettings(settings);
    tpl.attachmentStorageSettings.set({
      ...settings,
      limitSettings: normalizedLimits,
    });

    tpl.attachmentLimitUnits.set({
      attachmentsUploadMaxBytes: pickUnitForBytes(normalizedLimits.attachmentsUploadMaxBytes),
      attachmentsDownloadMaxBytes: pickUnitForBytes(normalizedLimits.attachmentsDownloadMaxBytes),
      apiUploadMaxBytes: pickUnitForBytes(normalizedLimits.apiUploadMaxBytes),
      apiDownloadMaxBytes: pickUnitForBytes(normalizedLimits.apiDownloadMaxBytes),
    });

    tpl.attachmentLimitEnabled.set({
      attachmentsUploadMaxBytes: normalizedLimits.attachmentsUploadMaxBytes > 0,
      attachmentsDownloadMaxBytes: normalizedLimits.attachmentsDownloadMaxBytes > 0,
      apiUploadMaxBytes: normalizedLimits.apiUploadMaxBytes > 0,
      apiDownloadMaxBytes: normalizedLimits.apiDownloadMaxBytes > 0,
    });
  });
}

function getLimitUnitOptions(selectedUnit) {
  return [
    { value: 'gb', labelKey: 'attachment-limit-unit-gb', selected: selectedUnit === 'gb' },
    { value: 'mb', labelKey: 'attachment-limit-unit-mb', selected: selectedUnit === 'mb' },
    { value: 'bytes', labelKey: 'attachment-limit-unit-bytes', selected: selectedUnit === 'bytes' },
  ];
}

Template.setting.onCreated(function () {
  this.error = new ReactiveVar('');
  this.loading = new ReactiveVar(false);
  this.forgotPasswordSetting = new ReactiveVar(false);
  // Version is the FIRST pane, and the one that opens with the page: Admin Panel
  // opens on Settings, so what an admin sees first is now the version, database
  // and system information they are usually here to read or to paste into an
  // issue - not a settings form they did not ask for.
  this.versionSetting = new ReactiveVar(true);
  this.tableVisibilityModeSetting = new ReactiveVar(false);
  // Multitenancy option D: an Organization's own admin has no Version pane, so the
  // page opens on the one pane they do have - Visibility.
  //
  // This is decided in an autorun, NOT here: at onCreated the user document has
  // often not arrived yet, and `getCurrentUser()` is null. Reading it here made
  // "is this the site admin?" false for EVERYONE for a moment, so the page opened
  // on Visibility even for the site admin - which is what the Version-page test
  // caught. The default is what it always was, and it is corrected once - and only
  // once - when the user is actually known.
  this.openPaneDecided = false;
  this.autorun(() => {
    const user = ReactiveCache.getCurrentUser();
    if (!user || this.openPaneDecided) return;
    this.openPaneDecided = true;
    if (!tenantAdmin.isSiteAdmin(user)) {
      this.versionSetting.set(false);
      this.tableVisibilityModeSetting.set(true);
    }
  });
  this.translationSetting = new ReactiveVar(false);
  this.announcementSetting = new ReactiveVar(false);
  this.accessibilitySetting = new ReactiveVar(false);
  this.layoutSetting = new ReactiveVar(false);
  this.webhookSetting = new ReactiveVar(false);
  this.attachmentSettings = new ReactiveVar(false);
  this.attachmentStorageSettings = new ReactiveVar(null);
  // #6473: real storage paths come from the server (WRITABLE_PATH does not
  // exist in the browser's process.env, which always showed "/data").
  this.storagePaths = new ReactiveVar(null);
  Meteor.call('getAttachmentStoragePaths', (err, paths) => {
    if (!err && paths) {
      this.storagePaths.set(paths);
    }
  });
  this.attachmentLimitUnits = new ReactiveVar({
    attachmentsUploadMaxBytes: 'mb',
    attachmentsDownloadMaxBytes: 'mb',
    apiUploadMaxBytes: 'mb',
    apiDownloadMaxBytes: 'mb',
  });
  this.attachmentLimitEnabled = new ReactiveVar({
    attachmentsUploadMaxBytes: false,
    attachmentsDownloadMaxBytes: false,
    apiUploadMaxBytes: false,
    apiDownloadMaxBytes: false,
  });
  // The pane the URL asks for. `/settings/global-webhooks` opens Global
  // Webhooks; the bare `/settings` opens the default, which the route resolved
  // for us, so this is always a real pane id. Reactive, so following a link to
  // another pane while this page is already open switches to it - the route
  // action runs again without re-creating the template.
  //
  // It replaces the one-shot `settingsOpenPane` the old page URLs used to hand
  // over: those - /information, /translation - redirect to a slug now, and the
  // pane is in the address rather than in a Session value consumed once.
  this.autorun(() => {
    const paneId = Session.get('settingsOpenPane');
    if (!paneId) return;
    if (openSettingsPane(this, paneId)) {
      // A URL is an explicit choice, so it wins over the "which pane does this
      // user open on" default that the site-admin autorun above applies.
      this.openPaneDecided = true;
    }
  });
  Meteor.subscribe('setting');
  Meteor.subscribe('mailServer');
  Meteor.subscribe('accountSettings');
  Meteor.subscribe('tableVisibilityModeSettings');
  Meteor.subscribe('announcements');
  Meteor.subscribe('accessibilitySettings');
  Meteor.subscribe('globalwebhooks');
  Meteor.subscribe('lockoutSettings');
  Meteor.subscribe('attachmentStorageSettings');

});

Template.setting.onDestroyed(function () {
  // if (this.errorPollInterval) {
  //   Meteor.clearInterval(this.errorPollInterval);
  // }
});

Template.setting.onRendered(function () {
  this.previousAttachmentLimitEnabled = null;

  this.autorun(() => {
    const enabledMap = this.attachmentLimitEnabled?.get() || {};
    const previousMap = this.previousAttachmentLimitEnabled || {};
    const fields = [
      'attachmentsUploadMaxBytes',
      'attachmentsDownloadMaxBytes',
      'apiUploadMaxBytes',
      'apiDownloadMaxBytes',
    ];

    fields.forEach((fieldName) => {
      const row = this.$(`.attachment-limit-row[data-field="${fieldName}"]`);
      if (!row.length) {
        return;
      }

      const isEnabled = enabledMap[fieldName] === true;
      const wasEnabled = previousMap[fieldName];

      if (typeof wasEnabled === 'undefined') {
        if (isEnabled) {
          row.show();
        } else {
          row.hide();
        }
        return;
      }

      if (isEnabled === wasEnabled) {
        return;
      }

      if (isEnabled) {
        row.stop(true, true).hide().slideDown();
      } else {
        row.stop(true, true).slideUp();
      }
    });

    this.previousAttachmentLimitEnabled = { ...enabledMap };
  });
});



// Open exactly one pane. The URL and the menu click both come through here, so
// "which ReactiveVar is this pane" is answered once instead of in two places
// that can disagree. docs/Features/Page/Admin-Panel-URLs.md
const SETTINGS_PANE_VARS = {
  'version-setting': 'versionSetting',
  'tableVisibilityMode-setting': 'tableVisibilityModeSetting',
  'announcement-setting': 'announcementSetting',
  'accessibility-setting': 'accessibilitySetting',
  'translation-setting': 'translationSetting',
  'layout-setting': 'layoutSetting',
  'webhook-setting': 'webhookSetting',
  // Reachable from Admin Panel / Attachments rather than from this menu, but it
  // is one of this template's panes and has to be cleared with the rest.
  'attachment-settings': 'attachmentSettings',
  // NOT registration-setting / email-setting: the Login and E-mail panes moved
  // to Admin Panel / People, and naming them here would put them back in the
  // one place that decides what this page can open.
};

function openSettingsPane(tpl, paneId) {
  for (const varName of Object.values(SETTINGS_PANE_VARS)) {
    if (tpl[varName]) tpl[varName].set(false);
  }
  const varName = SETTINGS_PANE_VARS[paneId];
  if (varName && tpl[varName]) tpl[varName].set(true);
  return !!varName;
}

// The Settings side menu, as data (docs/Features/Page/Left-Menu.md). Each entry
// used to be six lines of markup; the pane it opens is its `id`.
// `emoji: true` reproduces the empty span.emoji-icon this page always rendered
// before the icon, so the conversion changes no pixel.
function settingsMenu(user) {
  const items = [
    // First, and open by default - see Template.setting.onCreated.
    { id: 'version-setting', icon: 'fa-info-circle', labelKey: 'info', emoji: true },
    // Labelled just 'Visibility' now. The pane id and the tableVisibilityMode
    // key are unchanged, so the 141 translations of the pane's own contents are
    // untouched; only the menu label points at the new key.
    { id: 'tableVisibilityMode-setting', icon: 'fa-eye', labelKey: 'visibility', emoji: true },
    { id: 'announcement-setting', icon: 'fa-bullhorn', labelKey: 'admin-announcement', emoji: true },
    { id: 'accessibility-setting', icon: 'fa-universal-access', labelKey: 'accessibility', emoji: true },
    // PWA is an acronym, not a translated string - a literal label, like the
    // Sandstorm entry in Admin Panel / Attachments.
    { id: 'translation-setting', icon: 'fa-globe', labelKey: 'translation', emoji: true },
    { id: 'layout-setting', icon: 'fa-mobile', label: 'PWA', emoji: true },
    { id: 'webhook-setting', icon: 'fa-globe', labelKey: 'global-webhook', emoji: true },
  ];
  // Multitenancy option D (docs/Design/Multitenancy/Multitenancy.md, D.7/D.9): an
  // Organization's own admin has ONE pane here - Visibility, for its "Change color"
  // section, which is that Organization's site theme. Every other pane, and every
  // other section of Visibility, is instance-wide and site-admin only.
  if (user !== undefined && !tenantAdmin.isSiteAdmin(user)) {
    return tenantAdmin.tenantAdminSettingsMenu(items, user);
  }
  return items;
}

// Which pane is open. This page keeps one ReactiveVar per pane rather than an
// active id, so derive the id from them - no behaviour change, and the menu can
// still highlight exactly one row.
function activeSettingId(inst) {
  const panes = [
    ['versionSetting', 'version-setting'],
    ['tableVisibilityModeSetting', 'tableVisibilityMode-setting'],
    ['announcementSetting', 'announcement-setting'],
    ['accessibilitySetting', 'accessibility-setting'],
    ['translationSetting', 'translation-setting'],
    ['layoutSetting', 'layout-setting'],
    ['webhookSetting', 'webhook-setting'],
  ];
  for (const [varName, id] of panes) {
    if (inst[varName] && inst[varName].get()) return id;
  }
  return '';
}

Template.setting.helpers({
  menuItems() {
    const inst = Template.instance();
    return leftMenuData(settingsMenu(ReactiveCache.getCurrentUser()),
      activeSettingId(inst), 'js-setting-menu');
  },
  // The heading above the pane: the open menu entry's own label
  // (docs/Features/Page/Left-Menu.md), so every pane on this page has a title, and
  // the same one the menu row that opened it carries.
  paneTitleData() {
    const inst = Template.instance();
    return paneTitle(settingsMenu(ReactiveCache.getCurrentUser()),
      activeSettingId(inst));
  },
  isVersionSetting() {
    const inst = Template.instance();
    return inst.versionSetting && inst.versionSetting.get();
  },
  isTranslationSetting() {
    const inst = Template.instance();
    return inst.translationSetting && inst.translationSetting.get();
  },
  isTableVisibilityModeSetting() {
    const inst = Template.instance();
    return (
      inst.tableVisibilityModeSetting && inst.tableVisibilityModeSetting.get()
    );
  },
  isAnnouncementSetting() {
    const inst = Template.instance();
    return inst.announcementSetting && inst.announcementSetting.get();
  },
  isAccessibilitySetting() {
    const inst = Template.instance();
    return inst.accessibilitySetting && inst.accessibilitySetting.get();
  },
  isLayoutSetting() {
    const inst = Template.instance();
    return inst.layoutSetting && inst.layoutSetting.get();
  },
  isWebhookSetting() {
    const inst = Template.instance();
    return inst.webhookSetting && inst.webhookSetting.get();
  },
  isAttachmentSettings() {
    const inst = Template.instance();
    return inst.attachmentSettings && inst.attachmentSettings.get();
  },
  isLoading() {
    const inst = Template.instance();
    return inst.loading && inst.loading.get();
  },

  // Attachment settings helpers
  // #6473: these come from the getAttachmentStoragePaths server method —
  // WRITABLE_PATH is a server-side environment variable, so reading
  // process.env here in the browser always produced the misleading "/data".
  filesystemPath() {
    const paths = Template.instance().storagePaths.get();
    return paths ? paths.writablePath : '';
  },

  attachmentsPath() {
    const paths = Template.instance().storagePaths.get();
    return paths ? paths.attachments : '';
  },

  avatarsPath() {
    const paths = Template.instance().storagePaths.get();
    return paths ? paths.avatars : '';
  },

  gridfsEnabled() {
    return process.env.GRIDFS_ENABLED === 'true';
  },

  s3Enabled() {
    return process.env.S3_ENABLED === 'true';
  },

  s3Endpoint() {
    return process.env.S3_ENDPOINT || '';
  },

  s3Bucket() {
    return process.env.S3_BUCKET || '';
  },

  s3Region() {
    return process.env.S3_REGION || '';
  },

  s3SslEnabled() {
    return process.env.S3_SSL_ENABLED === 'true';
  },

  s3Port() {
    return process.env.S3_PORT || 443;
  },

  attachmentTransferLimitValue(fieldName) {
    const tpl = Template.instance();
    const settingsDoc = tpl.attachmentStorageSettings.get();
    const units = tpl.attachmentLimitUnits.get() || {};
    const limits = normalizeLimitSettings(settingsDoc);
    const unit = units[fieldName] || 'bytes';
    return toDisplayValue(limits[fieldName], unit);
  },

  attachmentTransferLimitUnitOptions(fieldName) {
    const tpl = Template.instance();
    const units = tpl.attachmentLimitUnits.get() || {};
    const selectedUnit = units[fieldName] || 'bytes';
    return getLimitUnitOptions(selectedUnit);
  },

  isAttachmentLimitEnabled(fieldName) {
    const tpl = Template.instance();
    const enabledMap = tpl.attachmentLimitEnabled.get() || {};
    return enabledMap[fieldName] === true;
  },

  boards() {
    const ret = ReactiveCache.getBoards(
      {
        archived: false,
        'members.userId': Meteor.userId(),
        'members.isAdmin': true,
      },
      {
        sort: { sort: 1 /* boards default sorting */ },
      },
    );
    return ret;
  },
});

Template.setting.events({
  'click a.js-toggle-hide-logo'() {
    $('#hide-logo').toggleClass('is-checked');
  },
  'click a.js-toggle-hide-card-counter-list'() {
    $('#hide-card-counter-list').toggleClass('is-checked');
  },
  'click a.js-toggle-hide-board-member-list'() {
    $('#hide-board-member-list').toggleClass('is-checked');
  },
  'click a.js-setting-menu'(event, tpl) {
    const target = $(event.target);
    if (target.hasClass('active')) return;
    $('.side-menu li.active').removeClass('active');
    target.parent().addClass('active');
    const targetID = target.data('id');
    openSettingsPane(tpl, targetID);
    if (targetID === 'attachment-settings') {
      refreshAttachmentStorageSettings(tpl, true);
    }
    // ...and put it in the address bar, so the pane can be linked, bookmarked
    // and reached with the back button. Replacing rather than pushing would
    // make Back leave the Admin Panel instead of returning to the previous
    // pane. docs/Features/Page/Admin-Panel-URLs.md
    const path = adminPath('settings', targetID);
    if (path && FlowRouter.current().path !== path) FlowRouter.go(path);
  },


  'click a.js-toggle-support'(event, tpl) {
    tpl.loading.set(true);
    const supportPageEnabled = !$(
      '.js-toggle-support .materialCheckBox',
    ).hasClass('is-checked');
    $('.js-toggle-support .materialCheckBox').toggleClass('is-checked');
    $('.support-content').toggleClass('hide');
    Settings.update(Settings.findOne()._id, {
      $set: { supportPageEnabled },
    });
    tpl.loading.set(false);
  },
  'click a.js-toggle-support-public'(event, tpl) {
    tpl.loading.set(true);
    const supportPagePublic = !$(
      '.js-toggle-support-public .materialCheckBox',
    ).hasClass('is-checked');
    $('.js-toggle-support-public .materialCheckBox').toggleClass('is-checked');
    Settings.update(Settings.findOne()._id, {
      $set: { supportPagePublic },
    });
    tpl.loading.set(false);
  },
  // The Support page's title and text are saved by the URL section's Save now
  // (Template.tableVisibilityModeSettings): every section of the Visibility pane
  // ends with one Save, and a second button inside a section was one of the three
  // that made the pane look like it saved in pieces.
  'click a.js-toggle-custom-head'(event, tpl) {
    tpl.loading.set(true);
    const customHeadEnabled = !$(
      '.js-toggle-custom-head .materialCheckBox',
    ).hasClass('is-checked');
    $('.js-toggle-custom-head .materialCheckBox').toggleClass('is-checked');
    $('.custom-head-settings').toggleClass('hide');
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { customHeadEnabled },
    });
    tpl.loading.set(false);
  },
  'click a.js-toggle-custom-manifest'(event, tpl) {
    tpl.loading.set(true);
    const customManifestEnabled = !$(
      '.js-toggle-custom-manifest .materialCheckBox',
    ).hasClass('is-checked');
    $('.js-toggle-custom-manifest .materialCheckBox').toggleClass('is-checked');
    $('.custom-manifest-settings').toggleClass('hide');
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { customManifestEnabled },
    });
    tpl.loading.set(false);
  },
  'click button.js-custom-head-save'(event, tpl) {
    tpl.loading.set(true);
    const customHeadMetaTags = $('#custom-head-meta').val() || '';
    let customManifestContent = $('#custom-manifest-content').val() || '';

    // Validate and clean JSON if present
    if (customManifestContent.trim()) {
      const cleanResult = cleanAndValidateJSON(customManifestContent);
      if (cleanResult.error) {
        tpl.loading.set(false);
        alert(`Invalid manifest JSON: ${cleanResult.error}`);
        return;
      }
      customManifestContent = cleanResult.json;
      // Update the textarea with cleaned version
      $('#custom-manifest-content').val(customManifestContent);
    }

    const customHeadLinkTags = $('#custom-head-links').val() || '';

    try {
      Settings.update(ReactiveCache.getCurrentSetting()._id, {
        $set: {
          customHeadMetaTags,
          customHeadLinkTags,
          customManifestContent,
        },
      });
    } catch (e) {
      return;
    } finally {
      tpl.loading.set(false);
    }
  },
  'click a.js-toggle-custom-assetlinks'(event, tpl) {
    tpl.loading.set(true);
    const customAssetLinksEnabled = !$(
      '.js-toggle-custom-assetlinks .materialCheckBox',
    ).hasClass('is-checked');
    $('.js-toggle-custom-assetlinks .materialCheckBox').toggleClass(
      'is-checked',
    );
    $('.custom-assetlinks-settings').toggleClass('hide');
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { customAssetLinksEnabled },
    });
    tpl.loading.set(false);
  },
  'click button.js-custom-assetlinks-save'(event, tpl) {
    tpl.loading.set(true);
    let customAssetLinksContent = $('#custom-assetlinks-content').val() || '';

    // Validate and clean JSON if present
    if (customAssetLinksContent.trim()) {
      const cleanResult = cleanAndValidateJSON(customAssetLinksContent);
      if (cleanResult.error) {
        tpl.loading.set(false);
        alert(`Invalid assetlinks JSON: ${cleanResult.error}`);
        return;
      }
      customAssetLinksContent = cleanResult.json;
      // Update the textarea with cleaned version
      $('#custom-assetlinks-content').val(customAssetLinksContent);
    }

    try {
      Settings.update(ReactiveCache.getCurrentSetting()._id, {
        $set: {
          customAssetLinksContent,
        },
      });
    } catch (e) {
      return;
    } finally {
      tpl.loading.set(false);
    }
  },

  // Event handlers for attachment settings
  'click button.js-test-s3-connection'(event) {
    event.preventDefault();
    const secretKey = $('#s3-secret-key').val();
    if (!secretKey) {
      alert(TAPi18n.__('s3-secret-key-required'));
      return;
    }

    Meteor.call('testS3Connection', { secretKey }, (error, result) => {
      if (error) {
        alert(TAPi18n.__('s3-connection-failed') + ': ' + error.reason);
      } else {
        alert(TAPi18n.__('s3-connection-success'));
      }
    });
  },

  'click button.js-save-s3-settings'(event) {
    event.preventDefault();
    const secretKey = $('#s3-secret-key').val();
    if (!secretKey) {
      alert(TAPi18n.__('s3-secret-key-required'));
      return;
    }

    Meteor.call('saveS3Settings', { secretKey }, (error, result) => {
      if (error) {
        alert(TAPi18n.__('s3-settings-save-failed') + ': ' + error.reason);
      } else {
        alert(TAPi18n.__('s3-settings-saved'));
        $('#s3-secret-key').val(''); // Clear the password field
      }
    });
  },

  'change select.js-attachment-limit-unit'(event, tpl) {
    const fieldName = event.currentTarget.dataset.field;
    const selectedUnit = event.currentTarget.value;
    if (!fieldName || !selectedUnit) {
      return;
    }

    const current = tpl.attachmentLimitUnits.get() || {};
    tpl.attachmentLimitUnits.set({
      ...current,
      [fieldName]: selectedUnit,
    });
  },

  'click a.js-toggle-attachment-limit'(event, tpl) {
    event.preventDefault();
    const fieldName = event.currentTarget.dataset.field;
    if (!fieldName) {
      return;
    }

    const current = tpl.attachmentLimitEnabled.get() || {};
    tpl.attachmentLimitEnabled.set({
      ...current,
      [fieldName]: !current[fieldName],
    });
  },

  'click button.js-save-attachment-transfer-limits'(event, tpl) {
    event.preventDefault();

    const currentSettings = tpl.attachmentStorageSettings.get();
    if (!currentSettings) {
      alert(TAPi18n.__('attachment-transfer-limits-save-failed'));
      return;
    }

    const currentUnits = tpl.attachmentLimitUnits.get() || {};
    const enabledMap = tpl.attachmentLimitEnabled.get() || {};
    const fieldConfig = [
      { fieldName: 'attachmentsUploadMaxBytes', inputId: '#attachments-upload-limit-value' },
      { fieldName: 'attachmentsDownloadMaxBytes', inputId: '#attachments-download-limit-value' },
      { fieldName: 'apiUploadMaxBytes', inputId: '#api-upload-limit-value' },
      { fieldName: 'apiDownloadMaxBytes', inputId: '#api-download-limit-value' },
    ];

    const nextLimitSettings = {};
    for (const field of fieldConfig) {
      if (!enabledMap[field.fieldName]) {
        nextLimitSettings[field.fieldName] = 0;
        continue;
      }

      const unit = currentUnits[field.fieldName] || 'bytes';
      const value = $(field.inputId).val();
      const bytesValue = toBytes(value, unit);
      if (bytesValue === null || bytesValue <= 0) {
        alert(TAPi18n.__('attachment-transfer-limits-invalid-value'));
        return;
      }
      nextLimitSettings[field.fieldName] = bytesValue;
    }

    const nextSettings = {
      ...currentSettings,
      uploadSettings: {
        ...(currentSettings.uploadSettings || {}),
        // Keep legacy field in sync for backward compatibility.
        maxFileSize: nextLimitSettings.attachmentsUploadMaxBytes,
      },
      limitSettings: {
        ...(currentSettings.limitSettings || {}),
        ...nextLimitSettings,
      },
    };

    Meteor.call('updateAttachmentStorageSettings', nextSettings, (error) => {
      if (error) {
        alert(`${TAPi18n.__('attachment-transfer-limits-save-failed')}: ${error.reason || error.message}`);
        return;
      }

      alert(TAPi18n.__('attachment-transfer-limits-saved'));
      refreshAttachmentStorageSettings(tpl, false);
    });
  },

});

// These three settings moved out of the Accounts pane: allowEmailChange to
// Email, the other two to Login. The helpers move with them - a radio bound to
// a helper the host template does not have renders unchecked, i.e. silently
// shows the wrong value.
const accountAccessHelpers = {
  allowEmailChange() {
    return AccountSettings.findOne('accounts-allowEmailChange')?.booleanValue || false;
  },
  allowUserNameChange() {
    return AccountSettings.findOne('accounts-allowUserNameChange')?.booleanValue || false;
  },
  allowUserDelete() {
    return AccountSettings.findOne('accounts-allowUserDelete')?.booleanValue || false;
  },
};
// Both panes show account-access settings, so both need these helpers.
Template.general.helpers(accountAccessHelpers);
Template.email.helpers(accountAccessHelpers);
Template.setting.helpers(accountAccessHelpers);

// The accountSettings TEMPLATE was removed when its three settings moved to Email
// and Login, but this handler was left registered on it. Template.accountSettings
// is undefined, so the module threw at load - and because it threw, the rest of
// the client module graph never ran: passwordInput.jade was never registered and
// the password fields vanished from /sign-in and /sign-up.
//
// The button lives in the Login pane, which Template.setting renders, so the
// handler belongs there.
Template.setting.events({

});

Template.tableVisibilityModeSettings.helpers({
  // Multitenancy option D: every group of this pane except "Change color" writes
  // the INSTANCE settings, so only the site admin is shown them.
  isSiteAdmin() {
    return tenantAdmin.isSiteAdmin(ReactiveCache.getCurrentUser());
  },
  allowPrivateOnly() {
    return TableVisibilityModeSettings.findOne(
      'tableVisibilityMode-allowPrivateOnly',
    ).booleanValue;
  },
});

// Admin Panel / Settings / Visibility saves per SECTION: All Boards, URL, Product
// name, Logo each end with their own Save, above the rule that closes the section.
// Every handler writes only its own fields, so saving one group can never carry
// half-finished edits from another - which is what one Save for the whole pane did.
//
// Each field is written only when its input is actually RENDERED (`$(sel).length`,
// `!== undefined` for a radio). That guard is not decoration: a read of an absent
// input returns '' or undefined, and writing that would blank a stored setting or
// silently turn it off. It is the bug this pane hit every time a field moved here.
const visibilityText = sel => ($(sel).val() || '').trim();

// Collect the text/textarea fields of a section that are on screen.
function visibilityTextFields(pairs) {
  const $set = {};
  for (const [sel, key] of pairs) {
    if ($(sel).length) {
      $set[key] = visibilityText(sel);
    }
  }
  return $set;
}

function saveVisibilitySettings($set) {
  if (Object.keys($set).length) {
    Settings.update(ReactiveCache.getCurrentSetting()._id, { $set });
  }
}

Template.tableVisibilityModeSettings.events({
  // ── All Boards ────────────────────────────────────────────────────────────
  // Boards visibility, board activities, the two All Boards lists and the spinner.
  //
  // 'hide board activities' used to be a button that bulk updated
  // showActivities:false on EVERY board document - which could not be undone (the
  // per-board values were overwritten and gone) and did nothing for boards created
  // later. It is one global setting, read once by the activity feed, so turning it
  // off restores every board's own value.
  // Tick a box without saving: the group's own Save writes them together, the way
  // the Yes/No pairs these replace behaved.
  'click a.js-toggle-all-boards-hide, click a.js-toggle-hide-logo'(event) {
    event.preventDefault();
    $(event.currentTarget).find('.materialCheckBox').toggleClass('is-checked');
  },

  'click button.js-visibility-all-boards-save'() {
    // Boards visibility lives in its own collection, so it is a separate write.
    // Each setting is one checkbox now: ticked = hidden. A checkbox that is not on
    // screen is left alone rather than written as false - the same guard the rest of
    // this pane uses, and the reason a pane that hid a field never blanked it.
    if ($('#accounts-allowPrivateOnly').length) {
      TableVisibilityModeSettings.update('tableVisibilityMode-allowPrivateOnly', {
        $set: { booleanValue: $('#accounts-allowPrivateOnly').hasClass('is-checked') },
      });
    }
    const $set = {};
    for (const [selector, key] of [
      ['#hide-board-activities', 'hideBoardActivitiesOnAllBoards'],
      ['#hide-card-counter-list', 'hideCardCounterList'],
      ['#hide-board-member-list', 'hideBoardMemberList'],
    ]) {
      if ($(selector).length) {
        $set[key] = $(selector).hasClass('is-checked');
      }
    }
    if ($('#spinnerName').length) {
      $set.spinnerName = visibilityText('#spinnerName');
    }
    saveVisibilitySettings($set);
  },

  // ── URL ───────────────────────────────────────────────────────────────────
  // The Support page's title and text (its two checkboxes save on click, above),
  // the help link, the legal notice and the URL schemes that are auto-linked.
  'click button.js-visibility-url-save'() {
    saveVisibilitySettings(visibilityTextFields([
      ['#support-title', 'supportTitle'],
      ['#support-page-text', 'supportPageText'],
      ['#custom-help-link-url', 'customHelpLinkUrl'],
      ['#legalNoticevalue', 'legalNotice'],
      ['#automatic-linked-url-schemes', 'automaticLinkedUrlSchemes'],
    ]));
  },

  // ── Product name ──────────────────────────────────────────────────────────
  'click button.js-visibility-product-name-save'() {
    if (!$('#product-name').length) {
      return;
    }
    const productName = visibilityText('#product-name');
    // The browser tab says the product name, so it changes with the setting rather
    // than at the next full page load.
    document.title = productName;
    saveVisibilitySettings({ productName });
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
  'click button.js-visibility-logo-save'() {
    const $set = visibilityTextFields([
      ['#custom-login-logo-image-url', 'customLoginLogoImageUrl'],
      ['#custom-login-logo-link-url', 'customLoginLogoLinkUrl'],
      ['#text-below-custom-login-logo', 'textBelowCustomLoginLogo'],
      ['#custom-top-left-corner-logo-image-url', 'customTopLeftCornerLogoImageUrl'],
      ['#custom-top-left-corner-logo-link-url', 'customTopLeftCornerLogoLinkUrl'],
      ['#custom-top-left-corner-logo-height', 'customTopLeftCornerLogoHeight'],
    ]);
    // One checkbox now: ticked = hidden. Skipped when it is not on screen, so a
    // pane that does not render it can never blank the stored value.
    if ($('#hide-logo').length) {
      $set.hideLogo = $('#hide-logo').hasClass('is-checked');
    }
    saveVisibilitySettings($set);
  },
});

Template.announcementSettings.onCreated(function () {
  this.loading = new ReactiveVar(false);
});

Template.announcementSettings.helpers({
  currentAnnouncements() {
    return Announcements.findOne();
  },
});

Template.announcementSettings.events({
  async 'click a.js-toggle-activemessage'(event, tpl) {
    event.preventDefault();
    tpl.loading.set(true);
    const announcements = Announcements.findOne();
    if (!announcements) {
      tpl.loading.set(false);
      return;
    }
    const isActive = announcements.enabled;
    try {
      await Announcements.updateAsync(announcements._id, {
        $set: { enabled: !isActive },
      });
      if (isActive) {
        $('.admin-announcement').slideUp();
      } else {
        $('.admin-announcement').slideDown();
      }
    } catch (error) {
      alert(error?.reason || error?.message || 'Failed to update announcement setting');
    } finally {
      tpl.loading.set(false);
    }
  },
  async 'click button.js-announcement-save'(event) {
    event.preventDefault();
    const message = $('#admin-announcement').val().trim();
    const announcement = Announcements.findOne();
    if (!announcement) {
      return;
    }
    try {
      await Announcements.updateAsync(announcement._id, {
        $set: { body: message },
      });
    } catch (error) {
      alert(error?.reason || error?.message || 'Failed to save announcement');
    }
  },
});

Template.accessibilitySettings.onCreated(function () {
  this.loading = new ReactiveVar(false);
});

Template.accessibilitySettings.helpers({
  currentAccessibility() {
    return AccessibilitySettings.findOne();
  },
});

Template.accessibilitySettings.events({
  'click a.js-toggle-accessibility'(event, tpl) {
    tpl.loading.set(true);
    const accessibilitySetting = AccessibilitySettings.findOne();
    const isActive = accessibilitySetting.enabled;
    AccessibilitySettings.update(accessibilitySetting._id, {
      $set: { enabled: !isActive },
    });
    tpl.loading.set(false);
    if (isActive) {
      $('.accessibility-content').slideUp();
    } else {
      $('.accessibility-content').slideDown();
    }
  },
  'click button.js-accessibility-save'(event, tpl) {
    tpl.loading.set(true);
    const title = $('#admin-accessibility-title').val().trim();
    const content = $('#admin-accessibility-content').val().trim();

    try {
      AccessibilitySettings.update(AccessibilitySettings.findOne()._id, {
        $set: {
          title: title,
          body: content,
        },
      });
    } catch (e) {
      console.error('Error saving accessibility settings:', e);
      return;
    } finally {
      tpl.loading.set(false);
    }
  },
});

Template.selectAuthenticationMethod.onCreated(function () {
  this.authenticationMethods = new ReactiveVar([]);

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([
        { value: 'password' },
        // Gets only the authentication methods availables
        ...Object.entries(result)
          .filter((e) => e[1])
          .map((e) => ({ value: e[0] })),
      ]);
    }
  });
});

Template.selectAuthenticationMethod.helpers({
  authentications() {
    return Template.instance().authenticationMethods.get();
  },
  isSelected(match) {
    return Template.instance().data.authenticationMethod === match;
  },
});

Template.selectSpinnerName.onCreated(function () {
  // What the PREVIEW shows. Kept separate from the `selected` attribute of the
  // options - which still comes from the saved setting - so changing the dropdown
  // re-renders only the preview, not the option list under the pointer.
  this.previewName = new ReactiveVar(
    (this.data && this.data.spinnerName) || ALLOWED_WAIT_SPINNERS[0]);
});

Template.selectSpinnerName.helpers({
  spinners() {
    return ALLOWED_WAIT_SPINNERS;
  },
  isSelected(match) {
    return Template.instance().data.spinnerName === match;
  },
  // 'Cube-Grid' -> 'spinnerCubeGrid'. The same mapping client/lib/spinner.js uses
  // for the real thing, so the preview is the spinner that will actually run.
  previewTemplate() {
    const name = String(Template.instance().previewName.get() || '');
    return `spinner${name.replace(/-/g, '')}`;
  },
});

Template.selectSpinnerName.events({
  'change #spinnerName'(event, templateInstance) {
    templateInstance.previewName.set(event.currentTarget.value);
  },
});

// The Login pane's own behaviour. These handlers were registered on
// Template.setting, which is fine only while Settings renders the pane. Admin Panel /
// People renders it now, and Blaze delivers an event to the handlers of the template
// the element is IN - so on Template.setting they would simply never fire. A pane
// owning its own handlers works wherever the pane is rendered.
// The Login pane's handlers below flip a setting and show the pane's spinner while
// they do it. They were moved onto this template from Template.setting when Admin
// Panel / People started rendering the pane - but the state they poke, `loading`,
// stayed behind on Template.setting, so every one of them threw
//   TypeError: can't access property "set", tpl.loading is undefined
// and the click did nothing at all. A handler's state has to live on the template
// the handler is registered on: Blaze hands it THAT template's instance.
Template.general.onCreated(function () {
  this.loading = new ReactiveVar(false);
});

Template.general.events({
  'click a.js-toggle-forgot-password'(event, tpl) {
    tpl.loading.set(true);
    const forgotPasswordClosed =
      ReactiveCache.getCurrentSetting().disableForgotPassword;
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { disableForgotPassword: !forgotPasswordClosed },
    });
    tpl.loading.set(false);
  },
  'click a.js-toggle-registration'(event, tpl) {
    tpl.loading.set(true);
    const registrationClosed =
      ReactiveCache.getCurrentSetting().disableRegistration;
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { disableRegistration: !registrationClosed },
    });
    tpl.loading.set(false);
    if (registrationClosed) {
      $('.invite-people').slideUp();
    } else {
      $('.invite-people').slideDown();
    }
  },
  // The three settings that were Yes/No radios saved by the button at the bottom of
  // the pane. They are checkboxes in the "Login: Allow" group now, and a checkbox
  // that has to be confirmed by a Save button somewhere below it is a checkbox you
  // think you have already set - so each writes on click, like the two above.
  'click a.js-toggle-username-change'(event, tpl) {
    tpl.loading.set(true);
    const allowed =
      AccountSettings.findOne('accounts-allowUserNameChange')?.booleanValue || false;
    AccountSettings.update('accounts-allowUserNameChange', {
      $set: { booleanValue: !allowed },
    });
    tpl.loading.set(false);
  },
  'click a.js-toggle-user-delete'(event, tpl) {
    tpl.loading.set(true);
    const allowed =
      AccountSettings.findOne('accounts-allowUserDelete')?.booleanValue || false;
    AccountSettings.update('accounts-allowUserDelete', {
      $set: { booleanValue: !allowed },
    });
    tpl.loading.set(false);
  },
  'click a.js-toggle-display-authentication-method'(event, tpl) {
    tpl.loading.set(true);
    const shown = ReactiveCache.getCurrentSetting().displayAuthenticationMethod;
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { displayAuthenticationMethod: !shown },
    });
    tpl.loading.set(false);
  },
  // #6116's "add board members from the same Org/Team only" is two settings now,
  // one per kind, each shown in the pane it is about - Admin Panel / People /
  // Organizations and / Teams. Their handlers live there, with the checkboxes.
  'click a.js-toggle-board-choose'(event) {
    let target = $(event.target);
    if (!target.hasClass('js-toggle-board-choose')) {
      target = target.parent();
    }
    const checkboxId = target.attr('id');
    $(`#${checkboxId} .materialCheckBox`).toggleClass('is-checked');
    $(`#${checkboxId}`).toggleClass('is-checked');
  },
  'click button.js-email-invite'(event, tpl) {
    const emails = $('#email-to-invite')
      .val()
      .toLowerCase()
      .trim()
      .split('\n')
      .join(',')
      .split(',');
    const boardsToInvite = [];
    $('.js-toggle-board-choose .materialCheckBox.is-checked').each(function () {
      boardsToInvite.push($(this).data('id'));
    });
    const validEmails = [];
    emails.forEach((email) => {
      if (email && /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(email.trim())) {
        validEmails.push(email.trim());
      }
    });
    if (validEmails.length) {
      tpl.loading.set(true);
      Meteor.call('sendInvitation', validEmails, boardsToInvite, () => {
        // if (!err) {
        //   TODO - show more info to user
        // }
        tpl.loading.set(false);
      });
    }
  },
  // Login pane: the two FIELDS at the bottom - the default authentication method and
  // the OIDC button text. The five allow-toggles above save on click, so this button
  // no longer reads them: it used to read three Yes/No radios that no longer exist.
  'click button.js-account-access-save'() {
    // Each is written only when its input is actually on screen.
    const $settings = {};
    if ($('#defaultAuthenticationMethod').length) {
      // value can still be '' / null when Save is clicked. Saving that empty value
      // over the required `defaultAuthenticationMethod` string silently failed
      // validation, so the Layout save looked like it hung / did nothing. Fall back
      // to the currently stored method so a real value is never overwritten by ''.
      const currentDefaultAuthenticationMethod =
        ReactiveCache.getCurrentSetting()?.defaultAuthenticationMethod;
      const defaultAuthenticationMethod = resolveDefaultAuthenticationMethod(
        $('#defaultAuthenticationMethod').val(),
        currentDefaultAuthenticationMethod,
      );
      $settings.defaultAuthenticationMethod = defaultAuthenticationMethod;
    }
    if ($('#oidcBtnTextvalue').length) {
      $settings.oidcBtnText = ($('#oidcBtnTextvalue').val() || '').trim();
    }
    if (Object.keys($settings).length) {
      Settings.update(ReactiveCache.getCurrentSetting()._id, { $set: $settings });
    }
  },
});
// The E-mail pane's own behaviour. These handlers were registered on
// Template.setting, which is fine only while Settings renders the pane. Admin Panel /
// People renders it now, and Blaze delivers an event to the handlers of the template
// the element is IN - so on Template.setting they would simply never fire. A pane
// owning its own handlers works wherever the pane is rendered.
// Same for the E-mail pane: its Save reports progress through `loading`.
Template.email.onCreated(function () {
  this.loading = new ReactiveVar(false);
});

Template.email.events({
  // Tick the box without saving: Save below writes it, together with the invite
  // domain above, the way the Yes/No pair it replaces behaved.
  'click a.js-toggle-allow-email-change'(event) {
    event.preventDefault();
    $('#accounts-allowEmailChange').toggleClass('is-checked');
  },
  'click a.js-toggle-tls'() {
    $('#mail-server-tls').toggleClass('is-checked');
  },
  // The pane's one Save, below both settings it writes: the invite domain and the
  // allow-email-change Yes/No.
  //
  // It wrote NEITHER before. The SMTP fields above are commented out of this pane's
  // markup, `checkField()` THROWS on an input that is not there, and the throw was
  // caught and swallowed - so the handler returned before its Settings.update and
  // pressing Save silently did nothing at all. Each field is written only when its
  // input is actually rendered, which is the same guard every other pane here uses.
  'click button.js-save'(event, tpl) {
    tpl.loading.set(true);
    $('li').removeClass('has-error');

    try {
      const $set = {};
      // Only when the SMTP block is rendered (it is commented out at the moment).
      // checkField marks a blank required field and throws, which is what should
      // abort the save - but only when the field is on screen to be blank.
      if ($('#mail-server-host').length) {
        $set['mailServer.host'] = checkField('#mail-server-host');
        $set['mailServer.port'] = checkField('#mail-server-port');
        $set['mailServer.from'] = checkField('#mail-server-from');
        $set['mailServer.username'] = ($('#mail-server-username').val() || '').trim();
        $set['mailServer.password'] = ($('#mail-server-password').val() || '').trim();
        $set['mailServer.enableTLS'] = $('#mail-server-tls.is-checked').length > 0;
      }
      // Moved here with its input: the Layout save used to read
      // #mailDomainNamevalue, which is not in that pane any more - so saving
      // Layout would have written an empty domain over the stored one.
      if ($('#mailDomainNamevalue').length) {
        $set.mailDomainName = ($('#mailDomainNamevalue').val() || '').trim();
      }
      if (Object.keys($set).length) {
        Settings.update(ReactiveCache.getCurrentSetting()._id, { $set });
      }
      // Allow e-mail change lives in AccountSettings, so it is a second write - and
      // nothing wrote it at all until this pane took it over. It is one checkbox
      // now, so the value is whether the box is ticked, and it is only written when
      // the checkbox is actually on screen.
      if ($('#accounts-allowEmailChange').length) {
        AccountSettings.update('accounts-allowEmailChange', {
          $set: { booleanValue: $('#accounts-allowEmailChange').hasClass('is-checked') },
        });
      }
    } catch (e) {
      return;
    } finally {
      tpl.loading.set(false);
    }
  },
  'click button.js-send-smtp-test-email'() {
    Meteor.call('sendSMTPTestEmail', (err, ret) => {
      if (!err && ret) {
        const message = `${TAPi18n.__(ret.message)}: ${ret.email}`;
        alert(message);
      } else {
        const reason = err.reason || '';
        const message = `${TAPi18n.__(err.error)}\n${reason}`;
        alert(message);
      }
    });
  },
});
