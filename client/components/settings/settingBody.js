import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { ALLOWED_WAIT_SPINNERS } from '/config/const';
import LockoutSettings from '/models/lockoutSettings';
import { 
  cronMigrationProgress, 
  cronMigrationStatus, 
  cronMigrationCurrentStep, 
  cronMigrationSteps, 
  cronIsMigrating, 
  cronJobs,
  cronMigrationCurrentStepNum,
  cronMigrationTotalSteps
} from '/imports/cronMigrationClient';


BlazeComponent.extendComponent({
  onCreated() {
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
    this.cronSettings = new ReactiveVar(false);
    this.migrationErrorsList = new ReactiveVar([]);

    Meteor.subscribe('setting');
    Meteor.subscribe('mailServer');
    Meteor.subscribe('accountSettings');
    Meteor.subscribe('tableVisibilityModeSettings');
    Meteor.subscribe('announcements');
    Meteor.subscribe('accessibilitySettings');
    Meteor.subscribe('globalwebhooks');
    Meteor.subscribe('lockoutSettings');
    
    // Poll for migration errors
    this.errorPollInterval = Meteor.setInterval(() => {
      if (this.cronSettings.get()) {
        Meteor.call('cron.getAllMigrationErrors', 50, (error, result) => {
          if (!error && result) {
            this.migrationErrorsList.set(result);
          }
        });
      }
    }, 5000); // Poll every 5 seconds
  },

  onDestroyed() {
    if (this.errorPollInterval) {
      Meteor.clearInterval(this.errorPollInterval);
    }
  },


  setError(error) {
    this.error.set(error);
  },
  
  // Template helpers moved to BlazeComponent - using different names to avoid conflicts
  isGeneralSetting() {
    return this.generalSetting && this.generalSetting.get();
  },
  isEmailSetting() {
    return this.emailSetting && this.emailSetting.get();
  },
  isAccountSetting() {
    return this.accountSetting && this.accountSetting.get();
  },
  isTableVisibilityModeSetting() {
    return this.tableVisibilityModeSetting && this.tableVisibilityModeSetting.get();
  },
  isAnnouncementSetting() {
    return this.announcementSetting && this.announcementSetting.get();
  },
  isAccessibilitySetting() {
    return this.accessibilitySetting && this.accessibilitySetting.get();
  },
  isLayoutSetting() {
    return this.layoutSetting && this.layoutSetting.get();
  },
  isWebhookSetting() {
    return this.webhookSetting && this.webhookSetting.get();
  },
  isAttachmentSettings() {
    return this.attachmentSettings && this.attachmentSettings.get();
  },
  isCronSettings() {
    return this.cronSettings && this.cronSettings.get();
  },
  isLoading() {
    return this.loading && this.loading.get();
  },

  // Attachment settings helpers
  filesystemPath() {
    return process.env.WRITABLE_PATH || '/data';
  },
  
  attachmentsPath() {
    const writablePath = process.env.WRITABLE_PATH || '/data';
    return `${writablePath}/attachments`;
  },
  
  avatarsPath() {
    const writablePath = process.env.WRITABLE_PATH || '/data';
    return `${writablePath}/avatars`;
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

  // Cron settings helpers
  migrationStatus() {
    return cronMigrationStatus.get() || TAPi18n.__('idle');
  },
  
  migrationProgress() {
    return cronMigrationProgress.get() || 0;
  },
  
  migrationCurrentStep() {
    return cronMigrationCurrentStep.get() || '';
  },
  
  isMigrating() {
    return cronIsMigrating.get() || false;
  },
  
  migrationSteps() {
    return cronMigrationSteps.get() || [];
  },
  
  migrationStepsWithIndex() {
    const steps = cronMigrationSteps.get() || [];
    return steps.map((step, idx) => ({
      ...step,
      index: idx + 1
    }));
  },
  
  cronJobs() {
    return cronJobs.get() || [];
  },

  migrationCurrentStepNum() {
    return cronMigrationCurrentStepNum.get() || 0;
  },

  migrationTotalSteps() {
    return cronMigrationTotalSteps.get() || 0;
  },

  migrationErrors() {
    return this.migrationErrorsList ? this.migrationErrorsList.get() : [];
  },

  hasErrors() {
    const errors = this.migrationErrors();
    return errors && errors.length > 0;
  },

  formatDateTime(date) {
    if (!date) return '';
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  },

  setLoading(w) {
    this.loading.set(w);
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

  // Event handlers for cron settings
  'click button.js-start-migration'(event) {
    event.preventDefault();
    this.setLoading(true);
    const selectedIndex = parseInt($('.js-migration-select').val() || '0', 10);
    
    if (selectedIndex === 0) {
      // Run all migrations
      Meteor.call('cron.startAllMigrations', (error, result) => {
        this.setLoading(false);
        if (error) {
          alert(TAPi18n.__('migration-start-failed') + ': ' + error.reason);
        } else {
          alert(TAPi18n.__('migration-started'));
        }
      });
    } else {
      // Run specific migration
      Meteor.call('cron.startSpecificMigration', selectedIndex - 1, (error, result) => {
        this.setLoading(false);
        if (error) {
          alert(TAPi18n.__('migration-start-failed') + ': ' + error.reason);
        } else {
          alert(TAPi18n.__('migration-started'));
        }
      });
    }
  },

  'click button.js-pause-migration'(event) {
    event.preventDefault();
    this.setLoading(true);
    Meteor.call('cron.pauseAllMigrations', (error, result) => {
      this.setLoading(false);
      if (error) {
        alert(TAPi18n.__('migration-pause-failed') + ': ' + error.reason);
      } else {
        alert(TAPi18n.__('migration-paused'));
      }
    });
  },

  'click button.js-stop-migration'(event) {
    event.preventDefault();
    if (confirm(TAPi18n.__('migration-stop-confirm'))) {
      this.setLoading(true);
      Meteor.call('cron.stopAllMigrations', (error, result) => {
        this.setLoading(false);
        if (error) {
          alert(TAPi18n.__('migration-stop-failed') + ': ' + error.reason);
        } else {
          alert(TAPi18n.__('migration-stopped'));
        }
      });
    }
  },

  'click button.js-schedule-board-cleanup'(event) {
    event.preventDefault();
    // Placeholder - board cleanup scheduling
    alert(TAPi18n.__('board-cleanup-scheduled'));
  },

  'click button.js-schedule-board-archive'(event) {
    event.preventDefault();
    // Placeholder - board archive scheduling
    alert(TAPi18n.__('board-archive-scheduled'));
  },

  'click button.js-schedule-board-backup'(event) {
    event.preventDefault();
    // Placeholder - board backup scheduling
    alert(TAPi18n.__('board-backup-scheduled'));
  },

  'click button.js-pause-job'(event) {
    event.preventDefault();
    const jobId = $(event.target).data('job-id');
    this.setLoading(true);
    Meteor.call('cron.pauseJob', jobId, (error, result) => {
      this.setLoading(false);
      if (error) {
        alert(TAPi18n.__('cron-job-pause-failed') + ': ' + error.reason);
      } else {
        alert(TAPi18n.__('cron-job-paused'));
      }
    });
  },

  'click button.js-delete-job'(event) {
    event.preventDefault();
    const jobId = $(event.target).data('job-id');
    if (confirm(TAPi18n.__('cron-job-delete-confirm'))) {
      this.setLoading(true);
      Meteor.call('cron.removeJob', jobId, (error, result) => {
        this.setLoading(false);
        if (error) {
          alert(TAPi18n.__('cron-job-delete-failed') + ': ' + error.reason);
        } else {
          alert(TAPi18n.__('cron-job-deleted'));
        }
      });
    }
  },

  'click button.js-add-cron-job'(event) {
    event.preventDefault();
    // Placeholder for adding a new cron job (e.g., open a modal)
    alert(TAPi18n.__('add-cron-job-placeholder'));
  },

  checkField(selector) {
    const value = $(selector).val();
    if (!value || value.trim() === '') {
      $(selector)
        .parents('li.smtp-form')
        .addClass('has-error');
      throw Error('blank field');
    } else {
      return value;
    }
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
  toggleForgotPassword() {
    this.setLoading(true);
    const forgotPasswordClosed = ReactiveCache.getCurrentSetting().disableForgotPassword;
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { disableForgotPassword: !forgotPasswordClosed },
    });
    this.setLoading(false);
  },
  toggleRegistration() {
    this.setLoading(true);
    const registrationClosed = ReactiveCache.getCurrentSetting().disableRegistration;
    Settings.update(ReactiveCache.getCurrentSetting()._id, {
      $set: { disableRegistration: !registrationClosed },
    });
    this.setLoading(false);
    if (registrationClosed) {
      $('.invite-people').slideUp();
    } else {
      $('.invite-people').slideDown();
    }
  },
  toggleTLS() {
    $('#mail-server-tls').toggleClass('is-checked');
  },
  toggleHideLogo() {
    $('#hide-logo').toggleClass('is-checked');
  },
  toggleHideCardCounterList() {
    $('#hide-card-counter-list').toggleClass('is-checked');
  },
  toggleHideBoardMemberList() {
    $('#hide-board-member-list').toggleClass('is-checked');
  },
  toggleAccessibilityPageEnabled() {
    $('#accessibility-page-enabled').toggleClass('is-checked');
  },
  toggleDisplayAuthenticationMethod() {
    $('#display-authentication-method').toggleClass('is-checked');
  },

  initializeAttachmentSubMenu() {
    // Set default sub-menu state for attachment settings
    // This will be handled by the attachment settings component
    console.log('Initializing attachment sub-menu');
  },

  initializeCronSubMenu() {
    // Set default sub-menu state for cron settings
    // This will be handled by the cron settings template
    console.log('Initializing cron sub-menu');
  },
  switchMenu(event) {
    const target = $(event.target);
    if (!target.hasClass('active')) {
      $('.side-menu li.active').removeClass('active');
      target.parent().addClass('active');
      const targetID = target.data('id');
      
      // Reset all settings to false
      this.forgotPasswordSetting.set(false);
      this.generalSetting.set(false);
      this.emailSetting.set(false);
      this.accountSetting.set(false);
      this.tableVisibilityModeSetting.set(false);
      this.announcementSetting.set(false);
      this.accessibilitySetting.set(false);
      this.layoutSetting.set(false);
      this.webhookSetting.set(false);
      this.attachmentSettings.set(false);
      this.cronSettings.set(false);
      
      // Set the selected setting to true
      if (targetID === 'registration-setting') {
        this.generalSetting.set(true);
      } else if (targetID === 'email-setting') {
        this.emailSetting.set(true);
      } else if (targetID === 'account-setting') {
        this.accountSetting.set(true);
      } else if (targetID === 'tableVisibilityMode-setting') {
        this.tableVisibilityModeSetting.set(true);
      } else if (targetID === 'announcement-setting') {
        this.announcementSetting.set(true);
      } else if (targetID === 'accessibility-setting') {
        this.accessibilitySetting.set(true);
      } else if (targetID === 'layout-setting') {
        this.layoutSetting.set(true);
      } else if (targetID === 'webhook-setting') {
        this.webhookSetting.set(true);
      } else if (targetID === 'attachment-settings') {
        this.attachmentSettings.set(true);
        this.initializeAttachmentSubMenu();
      } else if (targetID === 'cron-settings') {
        this.cronSettings.set(true);
        this.initializeCronSubMenu();
      }
    }
  },

  checkBoard(event) {
    let target = $(event.target);
    if (!target.hasClass('js-toggle-board-choose')) {
      target = target.parent();
    }
    const checkboxId = target.attr('id');
    $(`#${checkboxId} .materialCheckBox`).toggleClass('is-checked');
    $(`#${checkboxId}`).toggleClass('is-checked');
  },

  inviteThroughEmail() {
    const emails = $('#email-to-invite')
      .val()
      .toLowerCase()
      .trim()
      .split('\n')
      .join(',')
      .split(',');
    const boardsToInvite = [];
    $('.js-toggle-board-choose .materialCheckBox.is-checked').each(function() {
      boardsToInvite.push($(this).data('id'));
    });
    const validEmails = [];
    emails.forEach(email => {
      if (email && SimpleSchema.RegEx.Email.test(email.trim())) {
        validEmails.push(email.trim());
      }
    });
    if (validEmails.length) {
      this.setLoading(true);
      Meteor.call('sendInvitation', validEmails, boardsToInvite, () => {
        // if (!err) {
        //   TODO - show more info to user
        // }
        this.setLoading(false);
      });
    }
  },

  saveMailServerInfo() {
    this.setLoading(true);
    $('li').removeClass('has-error');

    try {
      const host = this.checkField('#mail-server-host');
      const port = this.checkField('#mail-server-port');
      const username = $('#mail-server-username')
        .val()
        .trim();
      const password = $('#mail-server-password')
        .val()
        .trim();
      const from = this.checkField('#mail-server-from');
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
      this.setLoading(false);
    }
  },

  saveLayout() {
    this.setLoading(true);
    $('li').removeClass('has-error');

    const productName = ($('#product-name').val() || '').trim();
    const customLoginLogoImageUrl = ($('#custom-login-logo-image-url').val() || '').trim();
    const customLoginLogoLinkUrl = ($('#custom-login-logo-link-url').val() || '').trim();
    const customHelpLinkUrl = ($('#custom-help-link-url').val() || '').trim();
    const textBelowCustomLoginLogo = ($('#text-below-custom-login-logo').val() || '').trim();
    const automaticLinkedUrlSchemes = ($('#automatic-linked-url-schemes').val() || '').trim();
    const customTopLeftCornerLogoImageUrl = ($('#custom-top-left-corner-logo-image-url').val() || '').trim();
    const customTopLeftCornerLogoLinkUrl = ($('#custom-top-left-corner-logo-link-url').val() || '').trim();
    const customTopLeftCornerLogoHeight = ($('#custom-top-left-corner-logo-height').val() || '').trim();

    const oidcBtnText = ($('#oidcBtnTextvalue').val() || '').trim();
    const mailDomainName = ($('#mailDomainNamevalue').val() || '').trim();
    const legalNotice = ($('#legalNoticevalue').val() || '').trim();
    const hideLogoChange = $('input[name=hideLogo]:checked').val() === 'true';
    const hideCardCounterListChange = $('input[name=hideCardCounterList]:checked').val() === 'true';
    const hideBoardMemberListChange = $('input[name=hideBoardMemberList]:checked').val() === 'true';
    const displayAuthenticationMethod =
      $('input[name=displayAuthenticationMethod]:checked').val() === 'true';
    const defaultAuthenticationMethod = $('#defaultAuthenticationMethod').val();
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
      this.setLoading(false);
    }

    DocHead.setTitle(productName);
  },

  toggleSupportPage() {
    this.setLoading(true);
    const supportPageEnabled = !$('.js-toggle-support .materialCheckBox').hasClass('is-checked');
    $('.js-toggle-support .materialCheckBox').toggleClass('is-checked');
    $('.support-content').toggleClass('hide');
    Settings.update(Settings.findOne()._id, {
      $set: { supportPageEnabled },
    });
    this.setLoading(false);
  },

  toggleSupportPublic() {
    this.setLoading(true);
    const supportPagePublic = !$('.js-toggle-support-public .materialCheckBox').hasClass('is-checked');
    $('.js-toggle-support-public .materialCheckBox').toggleClass('is-checked');
    Settings.update(Settings.findOne()._id, {
      $set: { supportPagePublic },
    });
    this.setLoading(false);
  },

  saveSupportSettings() {
    this.setLoading(true);
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
      this.setLoading(false);
    }
  },

  sendSMTPTestEmail() {
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

  events() {
    return [
      {
        'click a.js-toggle-forgot-password': this.toggleForgotPassword,
        'click a.js-toggle-registration': this.toggleRegistration,
        'click a.js-toggle-tls': this.toggleTLS,
        'click a.js-setting-menu': this.switchMenu,
        'click a.js-toggle-board-choose': this.checkBoard,
        'click button.js-email-invite': this.inviteThroughEmail,
        'click button.js-save': this.saveMailServerInfo,
        'click button.js-send-smtp-test-email': this.sendSMTPTestEmail,
        'click a.js-toggle-hide-logo': this.toggleHideLogo,
        'click a.js-toggle-hide-card-counter-list': this.toggleHideCardCounterList,
        'click a.js-toggle-hide-board-member-list': this.toggleHideBoardMemberList,
        'click button.js-save-layout': this.saveLayout,
        'click a.js-toggle-support': this.toggleSupportPage,
        'click a.js-toggle-support-public': this.toggleSupportPublic,
        'click button.js-support-save': this.saveSupportSettings,
        'click a.js-toggle-display-authentication-method': this
          .toggleDisplayAuthenticationMethod,
      },
    ];
  },
}).register('setting');

BlazeComponent.extendComponent({
  saveAccountsChange() {
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

  // Brute force lockout settings method moved to lockedUsersBody.js

  allowEmailChange() {
    return AccountSettings.findOne('accounts-allowEmailChange')?.booleanValue || false;
  },

  allowUserNameChange() {
    return AccountSettings.findOne('accounts-allowUserNameChange')?.booleanValue || false;
  },

  allowUserDelete() {
    return AccountSettings.findOne('accounts-allowUserDelete')?.booleanValue || false;
  },

  // Lockout settings helper methods moved to lockedUsersBody.js

  allBoardsHideActivities() {
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

  events() {
    return [
      {
        'click button.js-accounts-save': this.saveAccountsChange,
      },
      {
        'click button.js-all-boards-hide-activities': this.allBoardsHideActivities,
      },
    ];
  },
}).register('accountSettings');

BlazeComponent.extendComponent({
  saveTableVisibilityChange() {
    const allowPrivateOnly =
      $('input[name=allowPrivateOnly]:checked').val() === 'true';
    TableVisibilityModeSettings.update('tableVisibilityMode-allowPrivateOnly', {
      $set: { booleanValue: allowPrivateOnly },
    });
  },
  allowPrivateOnly() {
    return TableVisibilityModeSettings.findOne('tableVisibilityMode-allowPrivateOnly').booleanValue;
  },
  allBoardsHideActivities() {
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

  events() {
    return [
      {
        'click button.js-tableVisibilityMode-save': this.saveTableVisibilityChange,
      },
      {
        'click button.js-all-boards-hide-activities': this.allBoardsHideActivities,
      },
    ];
  },
}).register('tableVisibilityModeSettings');

BlazeComponent.extendComponent({
  onCreated() {
    this.loading = new ReactiveVar(false);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  currentAnnouncements() {
    return Announcements.findOne();
  },

  saveMessage() {
    const message = $('#admin-announcement')
      .val()
      .trim();
    Announcements.update(Announcements.findOne()._id, {
      $set: { body: message },
    });
  },

  toggleActive() {
    this.setLoading(true);
    const announcements = this.currentAnnouncements();
    const isActive = announcements.enabled;
    Announcements.update(announcements._id, {
      $set: { enabled: !isActive },
    });
    this.setLoading(false);
    if (isActive) {
      $('.admin-announcement').slideUp();
    } else {
      $('.admin-announcement').slideDown();
    }
  },

  events() {
    return [
      {
        'click a.js-toggle-activemessage': this.toggleActive,
        'click button.js-announcement-save': this.saveMessage,
      },
    ];
  },
}).register('announcementSettings');

BlazeComponent.extendComponent({
  onCreated() {
    this.loading = new ReactiveVar(false);
  },

  setLoading(w) {
    this.loading.set(w);
  },

  currentAccessibility() {
    return AccessibilitySettings.findOne();
  },

  saveAccessibility() {
    this.setLoading(true);
    const title = $('#admin-accessibility-title')
      .val()
      .trim();
    const content = $('#admin-accessibility-content')
      .val()
      .trim();
    
    try {
      AccessibilitySettings.update(AccessibilitySettings.findOne()._id, {
        $set: {
          title: title,
          body: content
        },
      });
    } catch (e) {
      console.error('Error saving accessibility settings:', e);
      return;
    } finally {
      this.setLoading(false);
    }
  },

  toggleAccessibility() {
    this.setLoading(true);
    const accessibilitySetting = this.currentAccessibility();
    const isActive = accessibilitySetting.enabled;
    AccessibilitySettings.update(accessibilitySetting._id, {
      $set: { enabled: !isActive },
    });
    this.setLoading(false);
    if (isActive) {
      $('.accessibility-content').slideUp();
    } else {
      $('.accessibility-content').slideDown();
    }
  },

  events() {
    return [
      {
        'click a.js-toggle-accessibility': this.toggleAccessibility,
        'click button.js-accessibility-save': this.saveAccessibility,
      },
    ];
  },
}).register('accessibilitySettings');

Template.selectAuthenticationMethod.onCreated(function() {
  this.authenticationMethods = new ReactiveVar([]);

  Meteor.call('getAuthenticationsEnabled', (_, result) => {
    if (result) {
      // TODO : add a management of different languages
      // (ex {value: ldap, text: TAPi18n.__('ldap', {}, T9n.getLanguage() || 'en')})
      this.authenticationMethods.set([
        { value: 'password' },
        // Gets only the authentication methods availables
        ...Object.entries(result)
          .filter(e => e[1])
          .map(e => ({ value: e[0] })),
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

