import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { ALLOWED_WAIT_SPINNERS } from '/config/const';
import LockoutSettings from '/models/lockoutSettings';
import AccessibilitySettings from '/models/accessibilitySettings';
import AccountSettings from '/models/accountSettings';
import Announcements from '/models/announcements';
import Settings from '/models/settings';
import { resolveDefaultAuthenticationMethod } from '/models/lib/authenticationMethod';
import TableVisibilityModeSettings from '/models/tableVisibilityModeSettings';
// import {
//   cronMigrationProgress,
//   cronMigrationStatus,
//   cronMigrationCurrentStep,
//   cronMigrationSteps,
//   cronIsMigrating,
//   cronJobs,
//   cronMigrationCurrentStepNum,
//   cronMigrationTotalSteps,
//   cronMigrationCurrentAction,
//   cronMigrationJobProgress,
//   cronMigrationJobStepNum,
//   cronMigrationJobTotalSteps,
//   cronMigrationEtaSeconds,
//   cronMigrationElapsedSeconds,
//   cronMigrationCurrentNumber,
//   cronMigrationCurrentName,
// } from '/imports/cronMigrationClient';
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
  this.generalSetting = new ReactiveVar(true);
  this.emailSetting = new ReactiveVar(false);
  this.accountSetting = new ReactiveVar(false);
  this.tableVisibilityModeSetting = new ReactiveVar(false);
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
  // this.cronSettings = new ReactiveVar(false);
  // this.migrationErrorsList = new ReactiveVar([]);

  Meteor.subscribe('setting');
  Meteor.subscribe('mailServer');
  Meteor.subscribe('accountSettings');
  Meteor.subscribe('tableVisibilityModeSettings');
  Meteor.subscribe('announcements');
  Meteor.subscribe('accessibilitySettings');
  Meteor.subscribe('globalwebhooks');
  Meteor.subscribe('lockoutSettings');
  Meteor.subscribe('attachmentStorageSettings');

  // Poll for migration errors
  // this.errorPollInterval = Meteor.setInterval(() => {
  //   if (this.cronSettings.get()) {
  //     Meteor.call('cron.getAllMigrationErrors', 50, (error, result) => {
  //       if (!error && result) {
  //         this.migrationErrorsList.set(result);
  //       }
  //     });
  //   }
  // }, 5000); // Poll every 5 seconds
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

Template.setting.helpers({
  isGeneralSetting() {
    const inst = Template.instance();
    return inst.generalSetting && inst.generalSetting.get();
  },
  isEmailSetting() {
    const inst = Template.instance();
    return inst.emailSetting && inst.emailSetting.get();
  },
  isAccountSetting() {
    const inst = Template.instance();
    return inst.accountSetting && inst.accountSetting.get();
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
  // isCronSettings() {
  //   const inst = Template.instance();
  //   return inst.cronSettings && inst.cronSettings.get();
  // },
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

  // Cron settings helpers
  // migrationStatus() {
  //   return cronMigrationStatus.get() || TAPi18n.__('idle');
  // },
  //
  // migrationProgress() {
  //   return cronMigrationProgress.get() || 0;
  // },
  //
  // migrationCurrentStep() {
  //   return cronMigrationCurrentStep.get() || '';
  // },
  //
  // isMigrating() {
  //   return cronIsMigrating.get() || false;
  // },
  //
  // migrationSteps() {
  //   return cronMigrationSteps.get() || [];
  // },
  //
  // migrationStepsWithIndex() {
  //   const steps = cronMigrationSteps.get() || [];
  //   return steps.map((step, idx) => ({
  //     ...step,
  //     index: idx + 1,
  //   }));
  // },
  //
  // cronJobs() {
  //   return cronJobs.get() || [];
  // },
  //
  // isCronJobPaused(status) {
  //   return status === 'paused';
  // },
  //
  // migrationCurrentStepNum() {
  //   return cronMigrationCurrentStepNum.get() || 0;
  // },
  //
  // migrationTotalSteps() {
  //   return cronMigrationTotalSteps.get() || 0;
  // },
  //
  // migrationCurrentAction() {
  //   return cronMigrationCurrentAction.get() || '';
  // },
  //
  // migrationJobProgress() {
  //   return cronMigrationJobProgress.get() || 0;
  // },
  //
  // migrationJobStepNum() {
  //   return cronMigrationJobStepNum.get() || 0;
  // },
  //
  // migrationJobTotalSteps() {
  //   return cronMigrationJobTotalSteps.get() || 0;
  // },
  //
  // migrationEtaSeconds() {
  //   return cronMigrationEtaSeconds.get();
  // },
  //
  // migrationElapsedSeconds() {
  //   return cronMigrationElapsedSeconds.get();
  // },
  //
  // migrationNumber() {
  //   return cronMigrationCurrentNumber.get();
  // },
  //
  // migrationName() {
  //   return cronMigrationCurrentName.get() || '';
  // },
  //
  // migrationStatusLine() {
  //   const number = cronMigrationCurrentNumber.get();
  //   const name = cronMigrationCurrentName.get();
  //   if (number && name) {
  //     return `${number} - ${name}`;
  //   }
  //   return cronMigrationStatus.get() || TAPi18n.__('idle');
  // },
  //
  // isUpdatingMigrationDropdown() {
  //   const status = cronMigrationStatus.get() || TAPi18n.__('idle');
  //   return (
  //     status && status.startsWith('Updating Select Migration dropdown menu')
  //   );
  // },
  //
  // migrationErrors() {
  //   return Template.instance().migrationErrorsList ? Template.instance().migrationErrorsList.get() : [];
  // },
  //
  // hasErrors() {
  //   const inst = Template.instance();
  //   const errors = inst.migrationErrorsList ? inst.migrationErrorsList.get() : [];
  //   return errors && errors.length > 0;
  // },
  //
  // formatDateTime(date) {
  //   if (!date) return '';
  //   return format(date, 'YYYY-MM-DD HH:mm:ss');
  // },
  //
  // formatDurationSeconds(seconds) {
  //   if (seconds === null || seconds === undefined) return '';
  //   const total = Math.max(0, Math.floor(seconds));
  //   const hrs = Math.floor(total / 3600);
  //   const mins = Math.floor((total % 3600) / 60);
  //   const secs = total % 60;
  //   const parts = [];
  //   if (hrs > 0) parts.push(String(hrs).padStart(2, '0'));
  //   parts.push(String(mins).padStart(2, '0'));
  //   parts.push(String(secs).padStart(2, '0'));
  //   return parts.join(':');
  // },

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
  'click a.js-toggle-board-members-same-org-team'(event, tpl) {
    // #6116: toggle the global "add board members from same Org/Team only" setting.
    tpl.loading.set(true);
    const current =
      ReactiveCache.getCurrentSetting().boardMembersFromSameOrgOrTeamOnly;
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { boardMembersFromSameOrgOrTeamOnly: !current },
    });
    tpl.loading.set(false);
  },
  'click a.js-toggle-tls'() {
    $('#mail-server-tls').toggleClass('is-checked');
  },
  'click a.js-toggle-hide-logo'() {
    $('#hide-logo').toggleClass('is-checked');
  },
  'click a.js-toggle-hide-card-counter-list'() {
    $('#hide-card-counter-list').toggleClass('is-checked');
  },
  'click a.js-toggle-hide-board-member-list'() {
    $('#hide-board-member-list').toggleClass('is-checked');
  },
  'click a.js-toggle-display-authentication-method'() {
    $('#display-authentication-method').toggleClass('is-checked');
  },
  'click a.js-setting-menu'(event, tpl) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');

      // Reset all settings to false
      tpl.forgotPasswordSetting.set(false);
      tpl.generalSetting.set(false);
      tpl.emailSetting.set(false);
      tpl.accountSetting.set(false);
      tpl.tableVisibilityModeSetting.set(false);
      tpl.announcementSetting.set(false);
      tpl.accessibilitySetting.set(false);
      tpl.layoutSetting.set(false);
      tpl.webhookSetting.set(false);
      tpl.attachmentSettings.set(false);
      // tpl.cronSettings.set(false);

      // Set the selected setting to true
      if (targetID === 'registration-setting') {
        tpl.generalSetting.set(true);
      } else if (targetID === 'email-setting') {
        tpl.emailSetting.set(true);
      } else if (targetID === 'account-setting') {
        tpl.accountSetting.set(true);
      } else if (targetID === 'tableVisibilityMode-setting') {
        tpl.tableVisibilityModeSetting.set(true);
      } else if (targetID === 'announcement-setting') {
        tpl.announcementSetting.set(true);
      } else if (targetID === 'accessibility-setting') {
        tpl.accessibilitySetting.set(true);
      } else if (targetID === 'layout-setting') {
        tpl.layoutSetting.set(true);
      } else if (targetID === 'webhook-setting') {
        tpl.webhookSetting.set(true);
      } else if (targetID === 'attachment-settings') {
        tpl.attachmentSettings.set(true);
        refreshAttachmentStorageSettings(tpl, true);
        // Set default sub-menu state for attachment settings
        console.log('Initializing attachment sub-menu');
      } // else if (targetID === 'cron-settings') {
      //   tpl.cronSettings.set(true);
      //   console.log('Initializing cron sub-menu');
      // }
    }
  },
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
  'click button.js-save'(event, tpl) {
    tpl.loading.set(true);
    $('li').removeClass('has-error');

    try {
      const host = checkField('#mail-server-host');
      const port = checkField('#mail-server-port');
      const username = $('#mail-server-username').val().trim();
      const password = $('#mail-server-password').val().trim();
      const from = checkField('#mail-server-from');
      const tls = $('#mail-server-tls.is-checked').length > 0;
      Settings.update(ReactiveCache.getCurrentSetting()._id, {
        $set: {
          'mailServer.host': host,
          'mailServer.port': port,
          'mailServer.username': username,
          'mailServer.password': password,
          'mailServer.enableTLS': tls,
          'mailServer.from': from,
        },
      });
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
  'click button.js-save-layout'(event, tpl) {
    tpl.loading.set(true);
    $('li').removeClass('has-error');

    const productName = ($('#product-name').val() || '').trim();
    const customLoginLogoImageUrl = (
      $('#custom-login-logo-image-url').val() || ''
    ).trim();
    const customLoginLogoLinkUrl = (
      $('#custom-login-logo-link-url').val() || ''
    ).trim();
    const customHelpLinkUrl = ($('#custom-help-link-url').val() || '').trim();
    const textBelowCustomLoginLogo = (
      $('#text-below-custom-login-logo').val() || ''
    ).trim();
    const automaticLinkedUrlSchemes = (
      $('#automatic-linked-url-schemes').val() || ''
    ).trim();
    const customTopLeftCornerLogoImageUrl = (
      $('#custom-top-left-corner-logo-image-url').val() || ''
    ).trim();
    const customTopLeftCornerLogoLinkUrl = (
      $('#custom-top-left-corner-logo-link-url').val() || ''
    ).trim();
    const customTopLeftCornerLogoHeight = (
      $('#custom-top-left-corner-logo-height').val() || ''
    ).trim();

    const oidcBtnText = ($('#oidcBtnTextvalue').val() || '').trim();
    const mailDomainName = ($('#mailDomainNamevalue').val() || '').trim();
    const legalNotice = ($('#legalNoticevalue').val() || '').trim();
    const hideLogoChange = $('input[name=hideLogo]:checked').val() === 'true';
    const hideCardCounterListChange =
      $('input[name=hideCardCounterList]:checked').val() === 'true';
    const hideBoardMemberListChange =
      $('input[name=hideBoardMemberList]:checked').val() === 'true';
    const displayAuthenticationMethod =
      $('input[name=displayAuthenticationMethod]:checked').val() === 'true';
    // #5879: the <select> options are populated by an async Meteor.call, so its
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
    const spinnerName = ($('#spinnerName').val() || '').trim();

    try {
      Settings.update(ReactiveCache.getCurrentSetting()._id, {
        $set: {
          productName,
          hideLogo: hideLogoChange,
          hideCardCounterList: hideCardCounterListChange,
          hideBoardMemberList: hideBoardMemberListChange,
          customLoginLogoImageUrl,
          customLoginLogoLinkUrl,
          customHelpLinkUrl,
          textBelowCustomLoginLogo,
          customTopLeftCornerLogoImageUrl,
          customTopLeftCornerLogoLinkUrl,
          customTopLeftCornerLogoHeight,
          displayAuthenticationMethod,
          defaultAuthenticationMethod,
          automaticLinkedUrlSchemes,
          spinnerName,
          oidcBtnText,
          mailDomainName,
          legalNotice,
        },
      });
    } catch (e) {
      return;
    } finally {
      tpl.loading.set(false);
    }

    document.title = productName;
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
  'click button.js-support-save'(event, tpl) {
    tpl.loading.set(true);
    const supportTitle = ($('#support-title').val() || '').trim();
    const supportPageText = ($('#support-page-text').val() || '').trim();
    try {
      Settings.update(Settings.findOne()._id, {
        $set: {
          supportTitle,
          supportPageText,
        },
      });
    } catch (e) {
      return;
    } finally {
      tpl.loading.set(false);
    }
  },
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

  // Event handlers for cron settings
  // 'click button.js-start-migration'(event, tpl) {
  //   event.preventDefault();
  //   tpl.loading.set(true);
  //   cronIsMigrating.set(true);
  //   cronMigrationStatus.set(TAPi18n.__('migration-starting'));
  //   cronMigrationCurrentAction.set('');
  //   cronMigrationJobProgress.set(0);
  //   cronMigrationJobStepNum.set(0);
  //   cronMigrationJobTotalSteps.set(0);
  //   const selectedIndex = parseInt($('.js-migration-select').val() || '0', 10);
  //
  //   if (selectedIndex === 0) {
  //     // Run all migrations
  //     Meteor.call('cron.startAllMigrations', (error, result) => {
  //       tpl.loading.set(false);
  //       if (error) {
  //         alert(TAPi18n.__('migration-start-failed') + ': ' + error.reason);
  //       } else {
  //         alert(TAPi18n.__('migration-started'));
  //       }
  //     });
  //   } else {
  //     // Run specific migration
  //     Meteor.call(
  //       'cron.startSpecificMigration',
  //       selectedIndex - 1,
  //       (error, result) => {
  //         tpl.loading.set(false);
  //         if (error) {
  //           alert(TAPi18n.__('migration-start-failed') + ': ' + error.reason);
  //         } else if (result && result.skipped) {
  //           cronIsMigrating.set(false);
  //           cronMigrationStatus.set(TAPi18n.__('migration-not-needed'));
  //           alert(TAPi18n.__('migration-not-needed'));
  //         } else {
  //           alert(TAPi18n.__('migration-started'));
  //         }
  //       },
  //     );
  //   }
  // },
  //
  // 'click button.js-start-all-migrations'(event, tpl) {
  //   event.preventDefault();
  //   tpl.loading.set(true);
  //   Meteor.call('cron.startAllMigrations', (error) => {
  //     tpl.loading.set(false);
  //     if (error) {
  //       alert(TAPi18n.__('migration-start-failed') + ': ' + error.reason);
  //     } else {
  //       alert(TAPi18n.__('migration-started'));
  //     }
  //   });
  // },
  //
  // 'click button.js-pause-all-migrations'(event, tpl) {
  //   event.preventDefault();
  //   tpl.loading.set(true);
  //   Meteor.call('cron.pauseAllMigrations', (error) => {
  //     tpl.loading.set(false);
  //     if (error) {
  //       alert(TAPi18n.__('migration-pause-failed') + ': ' + error.reason);
  //     } else {
  //       alert(TAPi18n.__('migration-paused'));
  //     }
  //   });
  // },
  //
  // 'click button.js-stop-all-migrations'(event, tpl) {
  //   event.preventDefault();
  //   if (confirm(TAPi18n.__('migration-stop-confirm'))) {
  //     tpl.loading.set(true);
  //     Meteor.call('cron.stopAllMigrations', (error) => {
  //       tpl.loading.set(false);
  //       if (error) {
  //         alert(TAPi18n.__('migration-stop-failed') + ': ' + error.reason);
  //       } else {
  //         alert(TAPi18n.__('migration-stopped'));
  //       }
  //     });
  //   }
  // },
  //
  // 'click button.js-pause-migration'(event, tpl) {
  //   event.preventDefault();
  //   tpl.loading.set(true);
  //   cronIsMigrating.set(false);
  //   cronMigrationStatus.set(TAPi18n.__('migration-pausing'));
  //   Meteor.call('cron.pauseAllMigrations', (error, result) => {
  //     tpl.loading.set(false);
  //     if (error) {
  //       alert(TAPi18n.__('migration-pause-failed') + ': ' + error.reason);
  //     } else {
  //       alert(TAPi18n.__('migration-paused'));
  //     }
  //   });
  // },
  //
  // 'click button.js-stop-migration'(event, tpl) {
  //   event.preventDefault();
  //   if (confirm(TAPi18n.__('migration-stop-confirm'))) {
  //     tpl.loading.set(true);
  //     cronIsMigrating.set(false);
  //     cronMigrationStatus.set(TAPi18n.__('migration-stopping'));
  //     cronMigrationCurrentAction.set('');
  //     cronMigrationJobProgress.set(0);
  //     cronMigrationJobStepNum.set(0);
  //     cronMigrationJobTotalSteps.set(0);
  //     Meteor.call('cron.stopAllMigrations', (error, result) => {
  //       tpl.loading.set(false);
  //       if (error) {
  //         alert(TAPi18n.__('migration-stop-failed') + ': ' + error.reason);
  //       } else {
  //         alert(TAPi18n.__('migration-stopped'));
  //       }
  //     });
  //   }
  // },
  //
  // 'click button.js-start-job'(event, tpl) {
  //   event.preventDefault();
  //   const jobName = $(event.target).data('job-name');
  //   tpl.loading.set(true);
  //   Meteor.call('cron.startJob', jobName, (error) => {
  //     tpl.loading.set(false);
  //     if (error) {
  //       alert(TAPi18n.__('cron-job-start-failed') + ': ' + error.reason);
  //     } else {
  //       alert(TAPi18n.__('cron-job-started'));
  //     }
  //   });
  // },
  //
  // 'click button.js-pause-job'(event, tpl) {
  //   event.preventDefault();
  //   const jobName = $(event.target).data('job-name');
  //   tpl.loading.set(true);
  //   Meteor.call('cron.pauseJob', jobName, (error) => {
  //     tpl.loading.set(false);
  //     if (error) {
  //       alert(TAPi18n.__('cron-job-pause-failed') + ': ' + error.reason);
  //     } else {
  //       alert(TAPi18n.__('cron-job-paused'));
  //     }
  //   });
  // },
  //
  // 'click button.js-resume-job'(event, tpl) {
  //   event.preventDefault();
  //   const jobName = $(event.target).data('job-name');
  //   tpl.loading.set(true);
  //   Meteor.call('cron.resumeJob', jobName, (error) => {
  //     tpl.loading.set(false);
  //     if (error) {
  //       alert(TAPi18n.__('cron-job-resume-failed') + ': ' + error.reason);
  //     } else {
  //       alert(TAPi18n.__('cron-job-resumed'));
  //     }
  //   });
  // },
  //
  // 'click button.js-delete-job'(event, tpl) {
  //   event.preventDefault();
  //   const jobName = $(event.target).data('job-name');
  //   if (confirm(TAPi18n.__('cron-job-delete-confirm'))) {
  //     tpl.loading.set(true);
  //     Meteor.call('cron.removeJob', jobName, (error) => {
  //       tpl.loading.set(false);
  //       if (error) {
  //         alert(TAPi18n.__('cron-job-delete-failed') + ': ' + error.reason);
  //       } else {
  //         alert(TAPi18n.__('cron-job-deleted'));
  //       }
  //     });
  //   }
  // },
  //
  // 'click button.js-add-cron-job'(event) {
  //   event.preventDefault();
  //   // Placeholder for adding a new cron job (e.g., open a modal)
  //   alert(TAPi18n.__('add-cron-job-placeholder'));
  // },
});

Template.accountSettings.helpers({
  allowEmailChange() {
    return (
      AccountSettings.findOne('accounts-allowEmailChange')?.booleanValue ||
      false
    );
  },

  allowUserNameChange() {
    return (
      AccountSettings.findOne('accounts-allowUserNameChange')?.booleanValue ||
      false
    );
  },

  allowUserDelete() {
    return (
      AccountSettings.findOne('accounts-allowUserDelete')?.booleanValue || false
    );
  },
});

Template.accountSettings.events({
  'click button.js-accounts-save'() {
    const allowEmailChange =
      $('input[name=allowEmailChange]:checked').val() === 'true';
    const allowUserNameChange =
      $('input[name=allowUserNameChange]:checked').val() === 'true';
    const allowUserDelete =
      $('input[name=allowUserDelete]:checked').val() === 'true';
    AccountSettings.update('accounts-allowEmailChange', {
      $set: { booleanValue: allowEmailChange },
    });
    AccountSettings.update('accounts-allowUserNameChange', {
      $set: { booleanValue: allowUserNameChange },
    });
    AccountSettings.update('accounts-allowUserDelete', {
      $set: { booleanValue: allowUserDelete },
    });
  },
  'click button.js-all-boards-hide-activities'() {
    Meteor.call('setAllBoardsHideActivities', (err, ret) => {
      if (!err && ret) {
        if (ret === true) {
          const message = `${TAPi18n.__(
            'now-activities-of-all-boards-are-hidden',
          )}`;
          alert(message);
        }
      } else {
        const reason = err.reason || '';
        const message = `${TAPi18n.__(err.error)}\n${reason}`;
        alert(message);
      }
    });
  },
});

Template.tableVisibilityModeSettings.helpers({
  allowPrivateOnly() {
    return TableVisibilityModeSettings.findOne(
      'tableVisibilityMode-allowPrivateOnly',
    ).booleanValue;
  },
});

Template.tableVisibilityModeSettings.events({
  'click button.js-tableVisibilityMode-save'() {
    const allowPrivateOnly =
      $('input[name=allowPrivateOnly]:checked').val() === 'true';
    TableVisibilityModeSettings.update('tableVisibilityMode-allowPrivateOnly', {
      $set: { booleanValue: allowPrivateOnly },
    });
  },
  'click button.js-all-boards-hide-activities'() {
    Meteor.call('setAllBoardsHideActivities', (err, ret) => {
      if (!err && ret) {
        if (ret === true) {
          const message = `${TAPi18n.__(
            'now-activities-of-all-boards-are-hidden',
          )}`;
          alert(message);
        }
      } else {
        const reason = err.reason || '';
        const message = `${TAPi18n.__(err.error)}\n${reason}`;
        alert(message);
      }
    });
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

Template.selectSpinnerName.helpers({
  spinners() {
    return ALLOWED_WAIT_SPINNERS;
  },
  isSelected(match) {
    return Template.instance().data.spinnerName === match;
  },
});
