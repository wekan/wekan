import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import fs from 'fs';
import Settings from '/models/settings';
import { TAPi18n } from '/imports/i18n';
import {
  consumeLegacyHtml4DownloadSession,
  consumeLegacyHtml4Session,
  LegacyHtml4Sessions,
  sessionFields,
} from '/server/lib/legacyHtml4Session';
import { legacyHtml4Page } from '/server/lib/legacyHtml4Pages';
import EventLog from '/models/eventLog';
import { repairBrokenCardsForAdmin } from '/server/methods/repairBrokenCards';
import { restoreListSwimlanesForAdmin } from '/server/methods/restoreListSwimlanes';
import { startTextDatabaseMigrationForAdmin } from '/server/methods/migrateTextDatabase';
import {
  listBackupsForAdmin,
  restoreBackupForAdmin,
  runBackupForAdmin,
  saveBackupScheduleForAdmin,
} from '/server/methods/backup';
import {
  importLegacyHtml4File,
  importLegacyHtml4ScopedFile,
  importLegacyHtml4Text,
} from '/server/lib/legacyHtml4Imports';
import {
  isLegacyHtml4Multipart,
  receiveLegacyHtml4Multipart,
  removeLegacyHtml4Upload,
} from '/server/lib/legacyHtml4Multipart';
import {
  castAccessibleCardPoker,
  castAccessibleCardVote,
  createAccessibleCard,
  createAccessibleSubtask,
  moveAccessibleCard,
  moveAccessibleCardToList,
  moveAccessibleSubtask,
  removeAccessibleCardLocation,
  removeAccessibleCardDependency,
  removeAccessibleCardStickerAt,
  saveAccessibleCardLocation,
  saveAccessibleCardDependency,
  setAccessibleCardSticker,
  setAccessibleCardCustomFieldAssigned,
  setAccessibleCardLabel,
  setAccessibleCardIdentity,
  setAccessibleCardPerson,
  setAccessibleCardArchived,
  setAccessibleSubtaskArchived,
  updateAccessibleCardColor,
  updateAccessibleCardDate,
  updateAccessibleCardIdentityText,
  updateAccessibleCardMetric,
  updateAccessibleCardParent,
  updateAccessibleCardSort,
  updateAccessibleCardCustomField,
  updateAccessibleCardContent,
  updateAccessibleCardPoker,
  updateAccessibleCardVote,
  updateAccessibleSubtaskTitle,
} from '/server/lib/accessibleCardOperations';
import {
  createAccessibleComment,
  removeAccessibleComment,
  updateAccessibleComment,
} from '/server/lib/accessibleCommentOperations';
import { toggleAccessibleCommentReaction } from '/server/lib/accessibleCommentReactionOperations';
import { serveLegacyHtml4ChecklistExport } from '/server/lib/legacyHtml4ScopedExport';
import { serveAccessibleRulesExport } from '/server/lib/accessibleRuleExport';
import { serveLegacyHtml4Attachment } from '/server/lib/legacyHtml4AttachmentResponse';
import { permanentlyDeleteAttachmentFromFilesReport } from '/server/lib/permanentAttachmentDelete';
import { setProblemFeatureSettingForAdmin } from '/server/lib/problemFeatureSettings';
import { setPermanentDeleteEnabledForAdmin } from '/server/lib/permanentDeleteSetting';
import { checkNewestVersionsForAdmin } from '/server/statistics';
import { setAnnouncementFieldForAdmin } from '/server/lib/adminAnnouncement';
import {
  setAccessibilityContentForAdmin,
  setAccessibilityEnabledForAdmin,
} from '/server/lib/adminAccessibility';
import {
  setPwaAssetLinksForAdmin,
  setPwaHeadContentForAdmin,
  setPwaToggleForAdmin,
} from '/server/lib/adminPwaSettings';
import { saveGlobalWebhookForAdmin } from '/server/lib/adminGlobalWebhooks';
import { customHeadMarkup } from '/server/lib/customHeadValidation';
import { saveVisibilitySettingsForAdmin } from '/server/lib/adminVisibilitySettings';
import {
  createTranslationForAdmin,
  deleteTranslationForAdmin,
  updateTranslationForAdmin,
} from '/server/lib/adminTranslations';
import { setInviteRolesForAdmin } from '/server/lib/adminInviteRoles';
import {
  setLoginAllowForAdmin,
  setLoginIdentityForAdmin,
} from '/server/lib/adminLoginSettings';
import { sendInvitationsForUser } from '/server/models/settings';
import {
  saveEmailAccessForAdmin,
  saveMailTransportForAdmin,
  sendSmtpTestForAdmin,
} from '/server/lib/adminEmailSettings';
import {
  createOrganizationForAdmin,
  deleteOrganizationForAdmin,
  saveOrganizationTenantFieldsForAdmin,
  setAllOrganizationsFeatureForAdmin,
  setBoardMembersSameOrgForAdmin,
  setOrganizationAdminForAdmin,
  setOrganizationFeatureForAdmin,
  updateOrganizationForAdmin,
} from '/server/lib/adminOrganizations';
import {
  createTeamForAdmin,
  deleteTeamForAdmin,
  setAllTeamsFeatureForAdmin,
  setBoardMembersSameTeamForAdmin,
  setTeamFeatureForAdmin,
  updateTeamForAdmin,
} from '/server/lib/adminTeams';
import { saveLockoutSettingsForAdmin, unlockAllUsersForAdmin,
  unlockUserForAdmin } from '/server/lib/adminLockout';
const {
  LIMIT_FIELDS,
  LIMIT_MODES,
  getBlockedFieldName,
  toBytes,
} = require('/models/lib/attachmentTransferLimits');
const {
  CLOUD_CONFIG_FIELDS,
  normalizeCloudConfig,
} = require('/models/lib/attachmentCloudConfig');
import { clearPersonAvatarForAdmin, createPersonForAdmin, deletePersonAvatarForAdmin,
  deletePersonForAdmin, impersonatePersonForAdmin, selectPersonAvatarForAdmin,
  setPersonActiveForAdmin, updatePeopleTeamForAdmin, updatePersonForAdmin,
  uploadPersonAvatarForAdmin } from '/server/lib/adminPeople';
import { setAdminThemeForUser } from '/server/lib/adminThemeSettings';
import { uploadBrandingImageForUser } from '/server/brandingImages';
import {
  removeAccessibleAttachment,
  renameAccessibleAttachment,
  setAccessibleAttachmentCover,
} from '/server/lib/accessibleAttachmentOperations';
import {
  copyAccessibleBoard,
  createAccessibleBoardWithInitialSwimlanes,
  permanentlyDeleteAccessibleArchivedBoards,
  setAccessibleBoardWorkspace,
  setAccessibleBoardArchived,
  toggleAccessibleBoardStar,
  toggleAccessibleDefaultBoard,
} from '/server/lib/accessibleBoardListOperations';
import { updateAccessibleWatch } from '/server/notifications/watch';
import {
  copyAccessibleChecklist,
  convertAccessibleChecklistItemToCard,
  createAccessibleChecklist,
  createAccessibleChecklistItem,
  moveAccessibleChecklist,
  moveAccessibleChecklistItem,
  moveAccessibleChecklistToCard,
  removeAccessibleChecklist,
  removeAccessibleChecklistItem,
  toggleAccessibleChecklistItem,
  toggleAccessibleChecklistSetting,
  updateAccessibleChecklistItemTitle,
  updateAccessibleChecklistTitle,
} from '/server/lib/accessibleChecklistOperations';
import {
  createAccessibleWorkflowRule,
  createAccessibleParameterizedRule,
  importAccessibleRules,
  removeAccessibleRule,
  renameAccessibleRule,
  replaceAccessibleWorkflowAction,
} from '/server/lib/accessibleRuleOperations';
import {
  CAPABILITY_SCRIPT_PATH,
  capabilityScript,
  isDocumentRequest,
  renderLegacyHtml4Page,
} from '/imports/lib/legacyHtml4';

// Progressive enhancement starts with a usable document. A capable browser
// requests the normal Meteor document using a request header after the small
// external probe succeeds. No browser name, cookie or URL mode flag is used.
WebApp.handlers.get(CAPABILITY_SCRIPT_PATH, (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(capabilityScript);
});

function requestLanguage(req) {
  const header = String(req.headers?.['accept-language'] || 'en');
  for (const part of header.split(',')) {
    const requested = part.split(';')[0].trim();
    const exact = TAPi18n.resolveTag(requested);
    const base = TAPi18n.resolveTag(requested.split('-')[0]);
    if (exact || base) return exact || base;
  }
  return 'en';
}

function translatedOr(translate, key, fallback, argumentsObject = {}) {
  const value = translate(key, argumentsObject);
  return value && value !== key ? value : fallback;
}

function binaryPurpose(body = {}) {
  if (body.legacyOperation === 'export-rules') {
    const boardId = String(body.boardId || '').replace(/[^A-Za-z0-9_-]/g, '');
    const format = String(body.ruleExportFormat || '').replace(/[^a-z]/g, '');
    return `download:rules-${boardId}-${format}`;
  }
  if (body.legacyOperation === 'export-checklist') {
    return `download:${String(body.checklistId || '').replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'preview-attachment-gif') {
    return `download:gif-${String(body.attachmentId || '').replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'download-attachment-original') {
    return `download:original-${String(body.attachmentId || '').replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'preview-admin-attachment-gif') {
    return `download:admin-gif-${String(body.attachmentId || '')
      .replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  if (body.legacyOperation === 'download-admin-attachment-original') {
    return `download:admin-original-${String(body.attachmentId || '')
      .replace(/[^A-Za-z0-9_-]/g, '')}`;
  }
  return '';
}

WebApp.handlers.use(async (req, res, next) => {
  const path = new URL(req.url, 'http://wekan.invalid').pathname;
  let session = null;
  let multipartUpload = null;
  if (isLegacyHtml4Multipart(req, path)) {
    try {
      const multipart = await receiveLegacyHtml4Multipart(req);
      req.body = multipart.fields;
      multipartUpload = multipart.upload;
    } catch (_) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Invalid or oversized import upload.');
      return;
    }
  }
  if (req.method === 'POST' && req.body?.legacySession) {
    session = ['export-rules', 'export-checklist', 'preview-attachment-gif',
      'download-attachment-original', 'preview-admin-attachment-gif',
      'download-admin-attachment-original'].includes(req.body?.legacyOperation)
      ? await consumeLegacyHtml4DownloadSession(req, path, binaryPurpose(req.body))
      : await consumeLegacyHtml4Session(req, path);
    if (!session) {
      await removeLegacyHtml4Upload(multipartUpload);
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-session', {
          req,
          detail: `refused invalid, expired or replayed HTML4 action for ${path}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      res.statusCode = 303;
      res.setHeader('Location', path);
      res.end();
      return;
    }
  } else if (!isDocumentRequest(req)) {
    await removeLegacyHtml4Upload(multipartUpload);
    return next();
  }

  const setting = (await Settings.findOneAsync({})) || {};
  const language = requestLanguage(req);
  await TAPi18n.ensureLanguageLoaded(language);
  const translate = (key, argumentsObject = {}) => TAPi18n.__(key, argumentsObject, language);
  let user = session ? await Meteor.users.findOneAsync(session.userId, {
    fields: { username: 1, isAdmin: 1 },
  }) : null;
  const query = new URL(req.url, 'http://wekan.invalid').searchParams;
  const requestFields = { ...(req.body || {}) };
  const rulesPath = /^\/b\/([^/]+)\/[^/]+\/rules$/.exec(path);
  if (session && path === '/admin/settings/version'
    && requestFields.legacyOperation === 'check-newest-versions') {
    try {
      const result = await checkNewestVersionsForAdmin(session.userId);
      requestFields.legacyVersionResult = result.text;
    } catch (error) {
      requestFields.legacyVersionResult = translatedOr(
        translate, error?.error || 'version-check-failed',
        'It was not possible to check the version number.',
      );
    }
  }
  if (session && path === '/admin/settings/announcement'
    && ['set-announcement-enabled', 'set-announcement-body']
      .includes(requestFields.legacyOperation)) {
    try {
      const enabled = requestFields.legacyOperation === 'set-announcement-enabled';
      let value = requestFields.announcementBody;
      if (enabled) {
        if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
          throw new Meteor.Error('invalid-setting-value');
        }
        value = requestFields.enabled === 'true';
      }
      await setAnnouncementFieldForAdmin(
        session.userId,
        enabled ? 'enabled' : 'body',
        value,
        { req },
      );
      requestFields.legacyAnnouncementResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyAnnouncementResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/settings/accessibility'
    && ['set-accessibility-enabled', 'set-accessibility-content']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'set-accessibility-enabled') {
        if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
          throw new Meteor.Error('invalid-setting-value');
        }
        await setAccessibilityEnabledForAdmin(
          session.userId, requestFields.enabled === 'true', { req },
        );
      } else {
        await setAccessibilityContentForAdmin(
          session.userId,
          String(requestFields.accessibilityTitle || ''),
          String(requestFields.accessibilityBody || ''),
          { req },
        );
      }
      requestFields.legacyAccessibilityResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyAccessibilityResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/settings/pwa'
    && ['set-pwa-toggle', 'set-pwa-head-content', 'set-pwa-assetlinks']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'set-pwa-toggle') {
        if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
          throw new Meteor.Error('invalid-setting-value');
        }
        await setPwaToggleForAdmin(session.userId,
          String(requestFields.settingField || ''), requestFields.enabled === 'true', { req });
      } else if (requestFields.legacyOperation === 'set-pwa-head-content') {
        await setPwaHeadContentForAdmin(session.userId,
          String(requestFields.customHeadMetaTags || ''),
          String(requestFields.customHeadLinkTags || ''),
          String(requestFields.customManifestContent || ''), { req });
      } else {
        await setPwaAssetLinksForAdmin(session.userId,
          String(requestFields.customAssetLinksContent || ''), { req });
      }
      requestFields.legacyPwaResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyPwaResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/settings/global-webhooks'
    && requestFields.legacyOperation === 'save-global-webhook') {
    try {
      await saveGlobalWebhookForAdmin(session.userId,
        String(requestFields.webhookId || ''), {
          title: String(requestFields.title || ''),
          url: String(requestFields.url || ''),
          token: String(requestFields.token || ''),
          type: String(requestFields.type || ''),
          enabled: requestFields.enabled === 'true',
        }, { req });
      requestFields.legacyGlobalWebhookResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyGlobalWebhookResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/settings/visibility'
    && /^save-visibility-/.test(String(requestFields.legacyOperation || ''))) {
    try {
      const checked = name => requestFields[name] === 'true';
      if (requestFields.legacyOperation === 'save-visibility-allboards') {
        await saveVisibilitySettingsForAdmin(session.userId, 'allBoards', {
          allowPrivateOnly: checked('allowPrivateOnly'),
          hideBoardActivitiesOnAllBoards: checked('hideBoardActivitiesOnAllBoards'),
          hideCardCounterList: checked('hideCardCounterList'),
          hideBoardMemberList: checked('hideBoardMemberList'),
          spinnerName: String(requestFields.spinnerName || ''),
        }, { req });
      } else if (requestFields.legacyOperation === 'save-visibility-urls') {
        await saveVisibilitySettingsForAdmin(session.userId, 'urls', {
          supportPageEnabled: checked('supportPageEnabled'),
          supportPagePublic: checked('supportPagePublic'),
          supportTitle: String(requestFields.supportTitle || ''),
          supportPageText: String(requestFields.supportPageText || ''),
          customHelpLinkUrl: String(requestFields.customHelpLinkUrl || ''),
          legalNotice: String(requestFields.legalNotice || ''),
          automaticLinkedUrlSchemes: String(requestFields.automaticLinkedUrlSchemes || ''),
        }, { req });
      } else if (requestFields.legacyOperation === 'save-visibility-product') {
        await saveVisibilitySettingsForAdmin(session.userId, 'product', {
          productName: String(requestFields.productName || ''),
        }, { req });
      } else if (requestFields.legacyOperation === 'save-visibility-logos') {
        await saveVisibilitySettingsForAdmin(session.userId, 'logos', {
          hideLogo: checked('hideLogo'),
          customLoginLogoLinkUrl: String(requestFields.customLoginLogoLinkUrl || ''),
          textBelowCustomLoginLogo: String(requestFields.textBelowCustomLoginLogo || ''),
          customTopLeftCornerLogoLinkUrl:
            String(requestFields.customTopLeftCornerLogoLinkUrl || ''),
          customTopLeftCornerLogoHeight:
            String(requestFields.customTopLeftCornerLogoHeight || ''),
        }, { req });
      } else if (requestFields.legacyOperation === 'save-visibility-theme') {
        const custom = [requestFields.themeCustomColor1, requestFields.themeCustomColor2]
          .map(value => String(value || '').trim()).filter(Boolean);
        await setAdminThemeForUser(session.userId, req.headers,
          String(requestFields.themeColor || '') || null, custom);
      } else throw new Meteor.Error('invalid-setting-group');
      requestFields.legacyVisibilityResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyVisibilityResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/settings/visibility' && multipartUpload
    && requestFields.legacyOperation === 'upload-visibility-logo') {
    try {
      const input = await fs.promises.readFile(multipartUpload.tempPath);
      await uploadBrandingImageForUser(session.userId, 'global', null,
        String(requestFields.brandingSlot || ''), input);
      requestFields.legacyVisibilityResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyVisibilityResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/settings/translation'
    && requestFields.legacyOperation === 'request-delete-translation') {
    requestFields.confirmTranslationDelete = String(requestFields.translationId || '');
  }
  if (session && path === '/admin/people/roles'
    && ['save-invite-roles', 'all-invite-roles', 'clear-invite-roles']
      .includes(requestFields.legacyOperation)) {
    try {
      let roles = requestFields.allowedRoles || [];
      if (!Array.isArray(roles)) roles = roles ? [roles] : [];
      if (requestFields.legacyOperation === 'all-invite-roles') {
        roles = require('/models/inviteToBoardRolesSettings').INVITE_TO_BOARD_ROLES;
      } else if (requestFields.legacyOperation === 'clear-invite-roles') roles = [];
      await setInviteRolesForAdmin(session.userId, roles.map(String), { req });
      requestFields.legacyRolesResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyRolesResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/login'
    && ['set-login-allow', 'save-login-identity', 'send-login-invitations']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'set-login-allow') {
        if (requestFields.allowed !== 'true' && requestFields.allowed !== 'false') {
          throw new Meteor.Error('invalid-setting-value');
        }
        await setLoginAllowForAdmin(session.userId,
          String(requestFields.loginAllowKey || ''), requestFields.allowed === 'true', { req });
      } else if (requestFields.legacyOperation === 'save-login-identity') {
        await setLoginIdentityForAdmin(session.userId, {
          defaultAuthenticationMethod:
            String(requestFields.defaultAuthenticationMethod || ''),
          oidcBtnText: String(requestFields.oidcBtnText || ''),
        }, { req });
      } else {
        const emails = String(requestFields.invitationEmails || '')
          .toLowerCase().split(/[\n,]+/).map(value => value.trim()).filter(Boolean);
        let boards = requestFields.invitationBoards || [];
        if (!Array.isArray(boards)) boards = boards ? [boards] : [];
        if (emails.length > 100 || boards.length > 500) {
          throw new Meteor.Error('too-many-items');
        }
        await sendInvitationsForUser(session.userId, emails, boards.map(String));
      }
      requestFields.legacyLoginResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyLoginResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/email'
    && ['save-mail-transport', 'save-email-access', 'send-smtp-test-email']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'save-mail-transport') {
        await saveMailTransportForAdmin(session.userId, {
          enabled: requestFields.mailEnabled === 'true',
          service: String(requestFields.mailService || 'SMTP'),
          configuration: {
            host: String(requestFields.mailHost || ''),
            port: String(requestFields.mailPort || ''),
            secure: requestFields.mailSecure === 'true',
            username: String(requestFields.mailUsername || ''),
            from: String(requestFields.mailFrom || ''),
          },
          password: String(requestFields.mailPassword || ''),
        }, { req });
      } else if (requestFields.legacyOperation === 'save-email-access') {
        await saveEmailAccessForAdmin(session.userId, {
          mailDomainName: String(requestFields.mailDomainName || ''),
          allowEmailChange: requestFields.allowEmailChange === 'true',
        }, { req });
      } else {
        const result = await sendSmtpTestForAdmin(session.userId, { req });
        requestFields.legacyEmailResult = `${translatedOr(translate,
          result.message, 'Email sent')}: ${result.email}`;
      }
      if (!requestFields.legacyEmailResult) {
        requestFields.legacyEmailResult = translatedOr(translate, 'done', 'Done');
      }
    } catch (error) {
      requestFields.legacyEmailResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/organizations') {
    const operation = String(requestFields.legacyOperation || '');
    try {
      const orgId = String(requestFields.orgId || '');
      if (operation === 'show-create-organization') {
        requestFields.showCreateOrganization = true;
      } else if (operation === 'show-edit-organization') {
        requestFields.editOrgId = orgId;
      } else if (operation === 'show-organization-admins') {
        requestFields.adminsOrgId = orgId;
      } else if (operation === 'create-organization') {
        requestFields.editOrgId = await createOrganizationForAdmin(session.userId, {
          orgDisplayName: String(requestFields.orgDisplayName || ''),
          orgDesc: String(requestFields.orgDesc || ''),
          orgShortName: String(requestFields.orgShortName || ''),
          orgAutoAddUsersWithDomainName:
            String(requestFields.orgAutoAddUsersWithDomainName || ''),
          orgWebsite: String(requestFields.orgWebsite || ''),
          orgIsActive: requestFields.orgIsActive === 'true',
        }, { req });
      } else if (operation === 'update-organization') {
        await updateOrganizationForAdmin(session.userId, orgId, {
          orgDisplayName: String(requestFields.orgDisplayName || ''),
          orgDesc: String(requestFields.orgDesc || ''),
          orgShortName: String(requestFields.orgShortName || ''),
          orgAutoAddUsersWithDomainName:
            String(requestFields.orgAutoAddUsersWithDomainName || ''),
          orgWebsite: String(requestFields.orgWebsite || ''),
          orgIsActive: requestFields.orgIsActive === 'true',
        }, { req });
        requestFields.editOrgId = orgId;
      } else if (operation === 'save-organization-tenant') {
        await saveOrganizationTenantFieldsForAdmin(session.userId, orgId, {
          orgDomains: String(requestFields.orgDomains || ''),
          orgProductName: String(requestFields.orgProductName || ''),
          orgCustomLoginLogoLinkUrl: String(requestFields.orgCustomLoginLogoLinkUrl || ''),
          orgTextBelowCustomLoginLogo: String(requestFields.orgTextBelowCustomLoginLogo || ''),
          orgCustomTopLeftCornerLogoLinkUrl:
            String(requestFields.orgCustomTopLeftCornerLogoLinkUrl || ''),
          orgCustomHelpLinkUrl: String(requestFields.orgCustomHelpLinkUrl || ''),
          orgLegalNotice: String(requestFields.orgLegalNotice || ''),
        }, { req });
        requestFields.editOrgId = orgId;
      } else if (operation === 'set-organization-feature') {
        await setOrganizationFeatureForAdmin(session.userId, orgId,
          String(requestFields.organizationFeature || ''),
          requestFields.enabled === 'true', { req });
      } else if (operation === 'set-all-organizations-feature') {
        await setAllOrganizationsFeatureForAdmin(session.userId,
          String(requestFields.organizationFeature || ''),
          requestFields.enabled === 'true', { req });
      } else if (operation === 'set-board-members-same-org') {
        await setBoardMembersSameOrgForAdmin(session.userId,
          requestFields.enabled === 'true', { req });
      } else if (operation === 'set-organization-admin') {
        await setOrganizationAdminForAdmin(session.userId, orgId,
          String(requestFields.targetUserId || ''),
          requestFields.enabled === 'true', { req });
        requestFields.adminsOrgId = orgId;
      } else if (operation === 'request-delete-organization') {
        requestFields.confirmOrgDelete = orgId;
      } else if (operation === 'delete-organization') {
        await deleteOrganizationForAdmin(session.userId, orgId, { req });
      }
      if (operation && !['show-create-organization', 'show-edit-organization',
        'show-organization-admins', 'request-delete-organization'].includes(operation)) {
        requestFields.legacyOrganizationResult = translatedOr(translate, 'done', 'Done');
      }
    } catch (error) {
      requestFields.editOrgId ||= String(requestFields.orgId || '');
      requestFields.legacyOrganizationResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/organizations' && multipartUpload
    && requestFields.legacyOperation === 'upload-organization-logo') {
    try {
      const input = await fs.promises.readFile(multipartUpload.tempPath);
      const orgId = String(requestFields.orgId || '');
      await uploadBrandingImageForUser(session.userId, 'org', orgId,
        String(requestFields.brandingSlot || ''), input);
      requestFields.editOrgId = orgId;
      requestFields.legacyOrganizationResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyOrganizationResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/teams') {
    const operation = String(requestFields.legacyOperation || '');
    try {
      const teamId = String(requestFields.teamId || '');
      const input = {
        teamDisplayName: String(requestFields.teamDisplayName || ''),
        teamDesc: String(requestFields.teamDesc || ''),
        teamShortName: String(requestFields.teamShortName || ''),
        teamWebsite: String(requestFields.teamWebsite || ''),
        teamIsActive: requestFields.teamIsActive === 'true',
      };
      if (operation === 'show-create-team') requestFields.showCreateTeam = true;
      else if (operation === 'show-edit-team') requestFields.editTeamId = teamId;
      else if (operation === 'create-team') {
        requestFields.editTeamId = await createTeamForAdmin(session.userId, input, { req });
      } else if (operation === 'update-team') {
        await updateTeamForAdmin(session.userId, teamId, input, { req });
        requestFields.editTeamId = teamId;
      } else if (operation === 'set-team-feature') {
        await setTeamFeatureForAdmin(session.userId, teamId,
          String(requestFields.teamFeature || ''), requestFields.enabled === 'true', { req });
      } else if (operation === 'set-all-teams-feature') {
        await setAllTeamsFeatureForAdmin(session.userId,
          String(requestFields.teamFeature || ''), requestFields.enabled === 'true', { req });
      } else if (operation === 'set-board-members-same-team') {
        await setBoardMembersSameTeamForAdmin(session.userId,
          requestFields.enabled === 'true', { req });
      } else if (operation === 'request-delete-team') {
        requestFields.confirmTeamDelete = teamId;
      } else if (operation === 'delete-team') {
        await deleteTeamForAdmin(session.userId, teamId, { req });
      }
      if (operation && !['show-create-team', 'show-edit-team',
        'request-delete-team'].includes(operation)) {
        requestFields.legacyTeamResult = translatedOr(translate, 'done', 'Done');
      }
    } catch (error) {
      requestFields.editTeamId ||= String(requestFields.teamId || '');
      requestFields.legacyTeamResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/locked-users') {
    const operation = String(requestFields.legacyOperation || '');
    try {
      if (operation === 'save-lockout-settings') {
        await saveLockoutSettingsForAdmin(session.userId, {
          knownFailuresBeforeLockout: Number(requestFields.knownFailuresBeforeLockout),
          knownLockoutPeriod: Number(requestFields.knownLockoutPeriod),
          knownFailureWindow: Number(requestFields.knownFailureWindow),
          unknownFailuresBeforeLockout: Number(requestFields.unknownFailuresBeforeLockout),
          unknownLockoutPeriod: Number(requestFields.unknownLockoutPeriod),
          unknownFailureWindow: Number(requestFields.unknownFailureWindow),
        }, { req });
      } else if (operation === 'request-unlock-user') {
        requestFields.confirmUnlockUser = String(requestFields.targetUserId || '');
      } else if (operation === 'unlock-user') {
        await unlockUserForAdmin(session.userId,
          String(requestFields.targetUserId || ''), { req });
      } else if (operation === 'request-unlock-all') {
        requestFields.confirmUnlockAll = true;
      } else if (operation === 'unlock-all-users') {
        await unlockAllUsersForAdmin(session.userId, { req });
      }
      if (operation && !['request-unlock-user', 'request-unlock-all'].includes(operation)) {
        requestFields.legacyLockoutResult = translatedOr(translate, 'done', 'Done');
      }
    } catch (error) {
      requestFields.legacyLockoutResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/people') {
    const operation = String(requestFields.legacyOperation || '');
    const values = value => (Array.isArray(value) ? value : value ? [value] : [])
      .map(String);
    const personInput = () => ({
      username: String(requestFields.username || ''),
      fullname: String(requestFields.fullname || ''),
      initials: String(requestFields.initials || ''),
      password: String(requestFields.password || ''),
      email: String(requestFields.email || ''),
      emailVerified: requestFields.emailVerified === 'true',
      isAdmin: requestFields.isAdmin === 'true',
      loginDisabled: requestFields.loginDisabled === 'true',
      authenticationMethod: String(requestFields.authenticationMethod || 'password'),
      importUsernames: String(requestFields.importUsernames || '')
        .split(/\s*[,;]\s*/).filter(Boolean),
      orgIds: values(requestFields.orgIds),
      teamIds: values(requestFields.teamIds),
    });
    try {
      if (operation === 'show-create-person') {
        requestFields.showCreatePerson = true;
      } else if (operation === 'create-person') {
        requestFields.editPersonId = await createPersonForAdmin(
          session.userId, personInput(), { req });
      } else if (operation === 'update-person') {
        const targetUserId = String(requestFields.targetUserId || '');
        await updatePersonForAdmin(session.userId, targetUserId, personInput(), { req });
        requestFields.editPersonId = targetUserId;
      } else if (operation === 'update-people-team') {
        await updatePeopleTeamForAdmin(session.userId,
          values(requestFields.targetUserIds), String(requestFields.teamId || ''),
          requestFields.teamAction === 'add', { req });
      } else if (operation === 'request-delete-person') {
        requestFields.confirmDeletePerson = String(requestFields.targetUserId || '');
      } else if (operation === 'delete-person') {
        await deletePersonForAdmin(session.userId,
          String(requestFields.targetUserId || ''), { req });
      } else if (operation === 'request-impersonate-person') {
        requestFields.confirmImpersonatePerson = String(requestFields.targetUserId || '');
      } else if (operation === 'impersonate-person') {
        const targetUserId = await impersonatePersonForAdmin(session.userId,
          String(requestFields.targetUserId || ''), { req });
        await LegacyHtml4Sessions.updateAsync(session._id, { $set: { userId: targetUserId } });
        session.userId = targetUserId;
        user = await Meteor.users.findOneAsync(targetUserId, {
          fields: { username: 1, isAdmin: 1, 'profile.language': 1 },
        });
        requestFields.legacyRedirectPath = '/allboards';
      } else if (operation === 'clear-person-avatar') {
        const targetUserId = String(requestFields.targetUserId || '');
        await clearPersonAvatarForAdmin(session.userId, targetUserId, { req });
        requestFields.editPersonId = targetUserId;
      } else if (operation === 'select-person-avatar') {
        const targetUserId = String(requestFields.targetUserId || '');
        await selectPersonAvatarForAdmin(session.userId, targetUserId,
          String(requestFields.avatarId || ''), { req });
        requestFields.editPersonId = targetUserId;
      } else if (operation === 'request-delete-person-avatar') {
        requestFields.editPersonId = String(requestFields.targetUserId || '');
        requestFields.confirmDeletePersonAvatar = String(requestFields.avatarId || '');
      } else if (operation === 'delete-person-avatar') {
        const targetUserId = String(requestFields.targetUserId || '');
        await deletePersonAvatarForAdmin(session.userId, targetUserId,
          String(requestFields.avatarId || ''), { req });
        requestFields.editPersonId = targetUserId;
      } else if (operation === 'show-person') {
        requestFields.editPersonId = String(requestFields.targetUserId || '');
      } else if (operation === 'set-person-active') {
        await setPersonActiveForAdmin(session.userId,
          String(requestFields.targetUserId || ''), requestFields.active === 'true', { req });
      } else if (operation === 'request-unlock-person') {
        requestFields.confirmUnlockPerson = String(requestFields.targetUserId || '');
      } else if (operation === 'unlock-person') {
        await unlockUserForAdmin(session.userId,
          String(requestFields.targetUserId || ''), { req });
      } else if (operation === 'show-login-country') {
        requestFields.locationUserId = String(requestFields.targetUserId || '');
        requestFields.locationCountry = String(requestFields.locationCountry || '');
      }
      if (operation && !['show-create-person', 'show-person', 'request-unlock-person',
        'request-delete-person', 'request-impersonate-person',
        'request-delete-person-avatar',
        'show-login-country', 'impersonate-person'].includes(operation)) {
        requestFields.legacyPeopleResult = translatedOr(translate, 'done', 'Done');
      }
    } catch (error) {
      requestFields.legacyPeopleResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/people/people' && multipartUpload
    && requestFields.legacyOperation === 'upload-person-avatar') {
    try {
      const targetUserId = String(requestFields.targetUserId || '');
      const input = await fs.promises.readFile(multipartUpload.tempPath);
      await uploadPersonAvatarForAdmin(session.userId, targetUserId, input, { req });
      requestFields.editPersonId = targetUserId;
      requestFields.legacyPeopleResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyPeopleResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  const isAttachmentSettingsOperation =
    (path === '/admin/attachments/default-save-storage'
      && requestFields.legacyOperation === 'set-default-attachment-storage')
    || (path === '/admin/attachments/limits'
      && requestFields.legacyOperation === 'save-attachment-transfer-limits');
  if (session && isAttachmentSettingsOperation) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        if (requestFields.legacyOperation === 'set-default-attachment-storage') {
          return Meteor.server.method_handlers.setDefaultAttachmentStorage.call(
            invocation, String(requestFields.storageName || ''),
          );
        }
        const current = await Meteor.server.method_handlers.getAttachmentStorageSettings.call(
          invocation,
        );
        const limitSettings = { ...(current.limitSettings || {}) };
        for (const field of LIMIT_FIELDS) {
          const mode = String(requestFields[`${field}Mode`] || '');
          if (!Object.values(LIMIT_MODES).includes(mode)) {
            throw new Meteor.Error('invalid-setting-value', 'Invalid limit mode');
          }
          const blockedField = getBlockedFieldName(field);
          limitSettings[blockedField] = mode === LIMIT_MODES.BLOCKED;
          if (mode !== LIMIT_MODES.MAX_SIZE) {
            limitSettings[field] = 0;
            continue;
          }
          const bytes = toBytes(requestFields[`${field}Value`],
            String(requestFields[`${field}Unit`] || ''));
          if (!bytes) throw new Meteor.Error(
            'attachment-transfer-limits-invalid-value', 'Invalid transfer limit');
          limitSettings[field] = bytes;
        }
        limitSettings.avatarsUploadBlocked = requestFields.avatarsUploadBlocked === 'true';
        return Meteor.server.method_handlers.updateAttachmentStorageSettings.call(invocation, {
          uploadSettings: {
            ...(current.uploadSettings || {}),
            maxFileSize: limitSettings.attachmentsUploadMaxBytes,
          },
          limitSettings,
        });
      });
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, 'saved', 'Saved');
    } catch (error) {
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed');
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachments', {
          req, userId: session.userId,
          detail: `refused HTML4 Attachments operation: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  const attachmentMoveOperations = {
    'start-attachment-move': 'startBulkAttachmentMove',
    'repair-attachment-locations': 'repairAttachmentStorageLocations',
    'pause-attachment-move': 'pauseBulkAttachmentMove',
    'resume-attachment-move': 'resumeBulkAttachmentMove',
    'cancel-attachment-move': 'cancelBulkAttachmentMove',
  };
  if (session && path === '/admin/attachments/move'
    && attachmentMoveOperations[requestFields.legacyOperation]) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const method = attachmentMoveOperations[requestFields.legacyOperation];
      await DDP._CurrentMethodInvocation.withValue(invocation, () => {
        if (method === 'startBulkAttachmentMove') return Meteor.server.method_handlers[method]
          .call(invocation, String(requestFields.moveSource || ''),
            String(requestFields.moveDestination || ''),
            String(requestFields.moveScope || ''));
        return Meteor.server.method_handlers[method].call(invocation);
      });
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed');
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachments', {
          req, userId: session.userId,
          detail: `refused HTML4 attachment move: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  const localStorageMatch = path.match(/^\/admin\/attachments\/(filesystem|gridfs)$/);
  if (session && localStorageMatch
    && ['set-local-storage-read', 'calculate-local-storage-stats', 'compact-gridfs']
      .includes(requestFields.legacyOperation)) {
    try {
      const storage = localStorageMatch[1];
      if (requestFields.legacyOperation === 'compact-gridfs' && storage !== 'gridfs') {
        throw new Meteor.Error('invalid-storage', 'Compact is available for GridFS only');
      }
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        if (requestFields.legacyOperation === 'set-local-storage-read') {
          if (!['true', 'false'].includes(requestFields.enabled)) {
            throw new Meteor.Error('invalid-setting-value');
          }
          const current = await Meteor.server.method_handlers.getAttachmentStorageSettings
            .call(invocation);
          return Meteor.server.method_handlers.updateAttachmentStorageSettings.call(invocation, {
            ...current,
            storageConfig: {
              ...(current.storageConfig || {}),
              [storage]: {
                ...(current.storageConfig?.[storage] || {}),
                read: requestFields.enabled === 'true',
              },
            },
          });
        }
        if (requestFields.legacyOperation === 'calculate-local-storage-stats') {
          const method = storage === 'filesystem'
            ? 'getFilesystemStorageStats' : 'getGridFsStorageStats';
          requestFields.legacyAttachmentStorageStats =
            await Meteor.server.method_handlers[method].call(invocation);
          return;
        }
        requestFields.legacyCompactResult =
          await Meteor.server.method_handlers.compactMongoGridFs.call(invocation);
      });
      requestFields.legacyAttachmentsResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed');
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachments', {
          req, userId: session.userId,
          detail: `refused HTML4 ${String(localStorageMatch[1])} operation: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  const cloudStorageMatch = path.match(/^\/admin\/attachments\/(s3|azure|gcs)$/);
  if (session && cloudStorageMatch
    && ['save-cloud-storage', 'test-cloud-storage', 'calculate-cloud-storage-stats']
      .includes(requestFields.legacyOperation)) {
    try {
      const provider = cloudStorageMatch[1];
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        if (requestFields.legacyOperation === 'calculate-cloud-storage-stats') {
          const methods = { s3: 'getS3StorageStats', azure: 'getAzureStorageStats',
            gcs: 'getGcsStorageStats' };
          requestFields.legacyAttachmentStorageStats =
            await Meteor.server.method_handlers[methods[provider]].call(invocation);
          return;
        }
        const raw = {};
        for (const [field, definition] of Object.entries(CLOUD_CONFIG_FIELDS[provider])) {
          if (definition.hidden) continue;
          raw[field] = definition.type === 'boolean'
            ? requestFields[field] === 'true' : String(requestFields[field] || '');
        }
        const config = normalizeCloudConfig(provider, raw);
        if (requestFields.legacyOperation === 'save-cloud-storage') {
          return Meteor.server.method_handlers.updateAttachmentStorageSettings.call(invocation, {
            storageConfig: { [provider]: config },
          });
        }
        try {
          const result = await Meteor.server.method_handlers.testAttachmentCloudConnection
            .call(invocation, provider, config);
          requestFields.legacyCloudTestResult = result?.ok
            ? { ok: true } : { ok: false, error: result?.error || 'failed' };
        } catch (error) {
          if (error?.error === 'invalid-storage-settings'
            || error?.error === 'not-authorized') throw error;
          requestFields.legacyCloudTestResult = {
            ok: false, error: String(error?.reason || error?.message || 'failed').slice(0, 500),
          };
        }
      });
      if (requestFields.legacyOperation !== 'test-cloud-storage') {
        requestFields.legacyAttachmentsResult = translatedOr(translate, 'done', 'Done');
      }
    } catch (error) {
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed');
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachments', {
          req, userId: session.userId,
          detail: `refused HTML4 ${String(cloudStorageMatch[1])} settings: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  if (session && path === '/admin/attachments/database-migration'
    && requestFields.legacyOperation === 'start-database-migration') {
    try {
      const direction = String(requestFields.direction || '');
      if (!['toFerretDB', 'toMongoDB'].includes(direction)) {
        throw new Meteor.Error('bad-direction');
      }
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      await DDP._CurrentMethodInvocation.withValue(invocation, () =>
        startTextDatabaseMigrationForAdmin(session.userId, direction));
      requestFields.legacyAttachmentsResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed');
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachments', {
          req, userId: session.userId,
          detail: `refused HTML4 database migration: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  if (session && path === '/admin/attachments/backup'
    && ['run-backup', 'save-backup-schedule', 'list-backups', 'restore-backup']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'run-backup') {
        await runBackupForAdmin(session.userId, {
          attachments: requestFields.backupAttachments === 'true',
          avatars: requestFields.backupAvatars === 'true',
          data: requestFields.backupData === 'true',
        }, String(requestFields.backupStorage || ''),
        requestFields.backupOrgId ? String(requestFields.backupOrgId) : null);
      } else if (requestFields.legacyOperation === 'save-backup-schedule') {
        const frequency = String(requestFields.backupFrequency || 'off');
        await saveBackupScheduleForAdmin(session.userId, {
          enabled: frequency !== 'off', frequency,
          time: String(requestFields.backupTime || ''),
          dayOfWeek: String(requestFields.backupDayOfWeek || ''),
          dayOfMonth: Number(requestFields.backupDayOfMonth),
          attachments: requestFields.backupAttachments === 'true',
          avatars: requestFields.backupAvatars === 'true',
          data: requestFields.backupData === 'true',
          storage: String(requestFields.backupStorage || ''),
        });
      } else if (requestFields.legacyOperation === 'list-backups') {
        requestFields.legacyBackupList = await listBackupsForAdmin(session.userId);
      } else {
        if (requestFields.confirmed !== 'true') throw new Meteor.Error('confirmation-required');
        const listed = await listBackupsForAdmin(session.userId);
        const backupPath = String(requestFields.backupPath || '');
        if (!listed.some(backup => backup.path === backupPath)) {
          throw new Meteor.Error('not-authorized');
        }
        await restoreBackupForAdmin(session.userId, backupPath,
          String(requestFields.backupRestoreMode || ''));
      }
      requestFields.legacyAttachmentsResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyAttachmentsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed');
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachments', {
          req, userId: session.userId,
          detail: `refused HTML4 backup operation: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  if (session && path === '/admin/settings/translation'
    && ['create-translation', 'update-translation', 'delete-translation']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'create-translation') {
        await createTranslationForAdmin(session.userId,
          String(requestFields.language || ''), String(requestFields.text || ''),
          String(requestFields.translationText || ''), { req });
      } else if (requestFields.legacyOperation === 'update-translation') {
        await updateTranslationForAdmin(session.userId,
          String(requestFields.translationId || ''),
          String(requestFields.translationText || ''), { req });
      } else {
        await deleteTranslationForAdmin(session.userId,
          String(requestFields.translationId || ''), { req });
      }
      requestFields.legacyTranslationResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyTranslationResult = translatedOr(
        translate, error?.error || error?.message || 'operation-failed', 'Operation failed');
    }
  }
  if (session && path === '/admin/problems/security'
    && requestFields.legacyOperation === 'set-security-feature') {
    try {
      if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
        throw new Meteor.Error('invalid-setting-value');
      }
      await setProblemFeatureSettingForAdmin(
        session.userId,
        'security',
        String(requestFields.settingField || ''),
        requestFields.enabled === 'true',
        { req },
      );
      requestFields.legacySecurityResult = translatedOr(
        translate, 'saved', 'Saved',
      );
    } catch (error) {
      requestFields.legacySecurityResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/problems/notifications'
    && requestFields.legacyOperation === 'set-notification-feature') {
    try {
      if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
        throw new Meteor.Error('invalid-setting-value');
      }
      await setProblemFeatureSettingForAdmin(
        session.userId,
        'notifications',
        String(requestFields.settingField || ''),
        requestFields.enabled === 'true',
        { req },
      );
      requestFields.legacyNotificationsResult = translatedOr(
        translate, 'done', 'Done',
      );
    } catch (error) {
      requestFields.legacyNotificationsResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/problems/delete'
    && requestFields.legacyOperation === 'set-permanent-delete') {
    try {
      if (requestFields.enabled !== 'true' && requestFields.enabled !== 'false') {
        throw new Meteor.Error('invalid-setting-value');
      }
      await setPermanentDeleteEnabledForAdmin(
        session.userId,
        requestFields.enabled === 'true',
        { httpHeaders: req.headers, clientAddress: req.socket?.remoteAddress },
      );
      requestFields.legacyDeleteResult = translatedOr(translate, 'done', 'Done');
    } catch (error) {
      requestFields.legacyDeleteResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
    }
  }
  if (session && path === '/admin/problems/summary'
    && ['acknowledge-problems', 'repair-broken-cards', 'restore-list-swimlanes']
      .includes(requestFields.legacyOperation)) {
    try {
      if (requestFields.legacyOperation === 'acknowledge-problems') {
        const streams = Array.isArray(requestFields.problemStreams)
          ? requestFields.problemStreams : requestFields.problemStreams
            ? [requestFields.problemStreams] : [];
        if (streams.length) {
          await EventLog.acknowledgeForAdmin(session.userId, streams);
          requestFields.legacyProblemResult = translatedOr(
            translate, 'acknowledge', 'Acknowledge',
          );
        }
      } else if (requestFields.legacyOperation === 'repair-broken-cards') {
        const result = await repairBrokenCardsForAdmin(session.userId);
        const fixed = (result.cardsAssigned || 0) + (result.cardsRescued || 0)
          + (result.archivedCardsFixed || 0) + (result.listsAssigned || 0)
          + (result.swimlanesAssigned || 0);
        requestFields.legacyProblemResult = result.unfixable > 0
          ? translate('repair-broken-cards-done-unfixable', {
            fixed, unfixable: result.unfixable,
          }) : translate('repair-broken-cards-done', { fixed });
      } else {
        const result = await restoreListSwimlanesForAdmin(session.userId);
        requestFields.legacyProblemResult = translate('restore-list-swimlanes-done', result);
      }
    } catch (error) {
      requestFields.legacyProblemResult = translatedOr(
        translate, error?.error || 'operation-failed', 'Operation failed',
      );
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-problems', {
          req, userId: session.userId,
          detail: `refused HTML4 Problems Summary operation: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
  }
  if (session && rulesPath && requestFields.legacyOperation === 'export-rules') {
    try {
      const routeBoardId = decodeURIComponent(rulesPath[1]);
      if (requestFields.boardId !== routeBoardId) {
        throw new Meteor.Error('forbidden', 'Rule export does not belong to route board');
      }
      await serveAccessibleRulesExport({
        res,
        userId: session.userId,
        boardId: routeBoardId,
        format: requestFields.ruleExportFormat,
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-export', {
          req, userId: session.userId,
          detail: `refused HTML4 rules export: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.error === 'forbidden' ? 403 : 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Rules export denied.');
      } else res.end();
    }
    return;
  }
  if (session && rulesPath
    && requestFields.legacyOperation === 'confirm-delete-rule') {
    requestFields.confirmRuleDelete = String(requestFields.ruleId || '');
  }
  if (session && rulesPath
    && ['create-workflow-rule', 'create-parameterized-rule',
      'replace-workflow-action', 'import-rules',
      'rename-rule', 'delete-rule']
      .includes(requestFields.legacyOperation)) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const result = await DDP._CurrentMethodInvocation.withValue(invocation, () => {
        const input = {
          boardId: decodeURIComponent(rulesPath[1]),
          ruleId: String(requestFields.ruleId || ''),
        };
        if (requestFields.legacyOperation === 'create-workflow-rule') {
          return createAccessibleWorkflowRule(session.userId, {
            boardId: input.boardId,
            title: requestFields.ruleTitle,
            triggerIndex: requestFields.triggerIndex,
            actionIndex: requestFields.actionIndex,
          });
        }
        if (requestFields.legacyOperation === 'create-parameterized-rule') {
          const fields = {};
          for (const name of [
            'triggerCardTitle', 'triggerListName', 'triggerSwimlaneName',
            'triggerUsername', 'triggerLabelId', 'triggerChecklistName',
            'triggerChecklistItemName', 'triggerScheduleType', 'triggerTime',
            'triggerWeekday', 'triggerDayOfMonth', 'triggerDate',
            'triggerDueCondition', 'triggerDays', 'triggerButtonLabel',
            'actionBoardId', 'actionCardName', 'actionListName',
            'actionFromListName', 'actionSwimlaneName', 'actionLabelId',
            'actionUsername', 'actionSortField', 'actionDateField',
            'actionAmount', 'actionUnit', 'actionColor', 'actionChecklistName',
            'actionChecklistItemName', 'actionChecklistItems', 'actionEmailTo',
            'actionEmailSubject', 'actionEmailMessage',
          ]) fields[name] = requestFields[name];
          return createAccessibleParameterizedRule(session.userId, {
            boardId: input.boardId,
            title: requestFields.ruleTitle,
            triggerKind: requestFields.triggerKind,
            actionKind: requestFields.actionKind,
            fields,
          });
        }
        if (requestFields.legacyOperation === 'replace-workflow-action') {
          return replaceAccessibleWorkflowAction(session.userId, {
            ...input, actionIndex: requestFields.actionIndex,
          });
        }
        if (requestFields.legacyOperation === 'import-rules') {
          return importAccessibleRules(session.userId, {
            boardId: input.boardId,
            format: requestFields.ruleImportFormat,
            text: requestFields.ruleImportText,
          });
        }
        return requestFields.legacyOperation === 'rename-rule'
          ? renameAccessibleRule(session.userId, {
              ...input, title: requestFields.ruleTitle,
            })
          : removeAccessibleRule(session.userId, input);
      });
      requestFields.legacyRuleResult = { ok: true, result };
    } catch (error) {
      requestFields.legacyRuleResult = {
        ok: false,
        errorKey: typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
          ? error.error : 'operation-failed',
      };
    }
  }
  const cardOperations = [
    'create-card', 'move-card-up', 'move-card-down', 'edit-card-title',
    'edit-card-description', 'edit-card-date', 'edit-card-color', 'move-card-to-list',
    'toggle-card-label', 'toggle-card-person', 'toggle-card-identity',
    'edit-card-identity-text', 'edit-card-sort', 'save-card-location',
    'remove-card-location', 'set-card-sticker', 'remove-card-sticker',
    'assign-card-custom-field', 'edit-card-custom-field',
    'edit-card-custom-field-checkbox',
    'save-card-dependency', 'remove-card-dependency',
    'configure-card-vote', 'update-card-vote-end', 'cast-card-vote', 'remove-card-vote',
    'configure-card-poker', 'update-card-poker-end', 'cast-card-poker',
    'finish-card-poker', 'replay-card-poker', 'estimate-card-poker', 'remove-card-poker',
    'set-card-due-complete', 'set-card-spent-time', 'clear-card-spent-time',
    'set-card-watch', 'set-card-parent', 'add-subtask', 'edit-subtask-title',
    'move-subtask-up', 'move-subtask-down', 'archive-subtask',
    'archive-card', 'restore-card',
  ];
  const commentOperations = [
    'add-comment', 'edit-comment', 'delete-comment', 'toggle-comment-reaction',
  ];
  const checklistOperations = [
    'add-checklist', 'edit-checklist', 'delete-checklist', 'toggle-checklist-setting',
    'move-checklist-up', 'move-checklist-down', 'move-checklist-to-card',
    'copy-checklist-to-card',
    'add-checklist-item', 'edit-checklist-item', 'toggle-checklist-item',
    'delete-checklist-item', 'move-checklist-item-up', 'move-checklist-item-down',
    'convert-checklist-item-to-card',
  ];
  const attachmentOperations = [
    'rename-attachment', 'delete-attachment', 'set-attachment-cover',
  ];
  const boardListOperations = [
    'toggle-board-star', 'toggle-default-board', 'archive-board', 'restore-board',
    'create-board', 'copy-board',
    'set-board-workspace',
    'permanently-delete-board',
  ];
  const isBoardListPath = /^\/(?:allboards|templates|remaining|archive)(?:\/|$)/.test(path);
  if (session && isBoardListPath
    && requestFields.legacyOperation === 'confirm-archive-board') {
    requestFields.confirmBoardArchive = String(requestFields.boardId || '');
  }
  if (session && isBoardListPath
    && requestFields.legacyOperation === 'confirm-copy-board') {
    requestFields.confirmBoardCopy = String(requestFields.boardId || '');
  }
  if (session && isBoardListPath
    && requestFields.legacyOperation === 'confirm-permanently-delete-board') {
    requestFields.confirmBoardPermanentDelete = String(requestFields.boardId || '');
  }
  if (session && isBoardListPath
    && boardListOperations.includes(requestFields.legacyOperation)) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const result = await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        const boardId = String(requestFields.boardId || '');
        if (requestFields.legacyOperation === 'toggle-board-star') {
          return toggleAccessibleBoardStar(session.userId, boardId);
        }
        if (requestFields.legacyOperation === 'toggle-default-board') {
          return toggleAccessibleDefaultBoard(session.userId, boardId);
        }
        if (requestFields.legacyOperation === 'create-board') {
          const type = requestFields.boardType === 'template-container'
            ? 'template-container' : 'board';
          return createAccessibleBoardWithInitialSwimlanes(session.userId, {
            title: String(requestFields.boardTitle || ''),
            permission: String(requestFields.boardPermission || 'private'),
            type,
            migrationVersion: 1,
            swimlanes: type === 'template-container' ? [
              { title: 'Card Templates', sort: 1, type: 'template-container', role: 'card' },
              { title: 'List Templates', sort: 2, type: 'template-container', role: 'list' },
              { title: 'Board Templates', sort: 3, type: 'template-container', role: 'board' },
            ] : [{ title: 'Default' }],
          });
        }
        if (requestFields.legacyOperation === 'copy-board') {
          const source = await copyAccessibleBoard(session.userId, boardId, {});
          return source;
        }
        if (requestFields.legacyOperation === 'set-board-workspace') {
          return setAccessibleBoardWorkspace(
            session.userId, boardId, String(requestFields.workspaceId || ''),
          );
        }
        if (requestFields.legacyOperation === 'permanently-delete-board') {
          return permanentlyDeleteAccessibleArchivedBoards(
            session.userId, [boardId], invocation.connection,
          );
        }
        return setAccessibleBoardArchived(
          session.userId, boardId, requestFields.legacyOperation === 'archive-board',
        );
      });
      requestFields.legacyBoardListResult = { ok: true, result };
    } catch (error) {
      requestFields.legacyBoardListResult = {
        ok: false,
        errorKey: typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
          ? error.error : 'operation-failed',
      };
    }
  }
  const isFilesReportPath = path === '/admin/problems/files';
  if (session && isFilesReportPath
    && requestFields.legacyOperation === 'confirm-permanently-delete-admin-attachment') {
    requestFields.confirmPermanentAttachmentDelete = String(
      requestFields.attachmentId || '',
    );
  }
  if (session && isFilesReportPath
    && requestFields.legacyOperation === 'permanently-delete-admin-attachment') {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      await DDP._CurrentMethodInvocation.withValue(invocation, () =>
        permanentlyDeleteAttachmentFromFilesReport(
          session.userId, String(requestFields.attachmentId || ''),
          invocation.connection,
        ));
      requestFields.legacyFilesResult = { ok: true };
    } catch (error) {
      requestFields.legacyFilesResult = {
        ok: false,
        errorKey: typeof error?.error === 'string'
          && /^[a-z0-9_-]{1,100}$/i.test(error.error)
          ? error.error : 'operation-failed',
      };
    }
  }
  if (session && isFilesReportPath
    && ['preview-admin-attachment-gif', 'download-admin-attachment-original']
      .includes(requestFields.legacyOperation)) {
    try {
      await serveLegacyHtml4Attachment({
        res, userId: session.userId,
        attachmentId: requestFields.attachmentId,
        representation: requestFields.legacyOperation === 'preview-admin-attachment-gif'
          ? 'gif' : 'original',
        adminOnly: true,
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-admin-attachment', {
          req, userId: session.userId,
          detail: `refused HTML4 Admin attachment response: ${String(error?.message || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.statusCode || (error?.message === 'forbidden' ? 403 : 415);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Attachment response denied.');
      } else res.end();
    }
    return;
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && ['preview-attachment-gif', 'download-attachment-original']
      .includes(requestFields.legacyOperation)) {
    try {
      await serveLegacyHtml4Attachment({
        res, userId: session.userId,
        boardId: requestFields.boardId,
        cardId: requestFields.cardId,
        attachmentId: requestFields.attachmentId,
        representation: requestFields.legacyOperation === 'preview-attachment-gif'
          ? 'gif' : 'original',
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-attachment', {
          req, userId: session.userId,
          detail: `refused HTML4 attachment response: ${String(error?.message || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.statusCode || (error?.message === 'forbidden' ? 403 : 415);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Attachment response denied.');
      } else res.end();
    }
    return;
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'export-checklist') {
    try {
      await serveLegacyHtml4ChecklistExport({
        res,
        userId: session.userId,
        boardId: requestFields.boardId,
        cardId: requestFields.cardId,
        checklistId: requestFields.checklistId,
        format: requestFields.exportFormat,
        exportFields: requestFields.exportFields,
      });
    } catch (error) {
      try {
        require('/server/lib/canary').tripCanary('authz.legacy-html4-export', {
          req, userId: session.userId,
          detail: `refused HTML4 checklist export: ${String(error?.error || 'failed')}`,
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
      if (!res.headersSent) {
        res.statusCode = error?.error === 'forbidden' ? 403 : 400;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Checklist export denied.');
      } else res.end();
    }
    return;
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-comment') {
    requestFields.confirmCommentDelete = String(requestFields.commentId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'start-comment-reply') {
    requestFields.replyToComment = String(requestFields.commentId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-checklist') {
    requestFields.confirmChecklistDelete = String(requestFields.checklistId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-checklist-item') {
    requestFields.confirmChecklistItemDelete = String(requestFields.itemId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-delete-attachment') {
    requestFields.confirmAttachmentDelete = String(requestFields.attachmentId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-remove-card-vote') {
    requestFields.confirmVoteRemove = String(requestFields.cardId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-remove-card-poker') {
    requestFields.confirmPokerRemove = String(requestFields.cardId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'confirm-archive-subtask') {
    requestFields.confirmSubtaskArchive = String(requestFields.subtaskId || '');
  }
  if (session && /^\/b\/[^/]+/.test(path)
    && [...cardOperations, ...commentOperations, ...checklistOperations, ...attachmentOperations]
      .includes(requestFields.legacyOperation)) {
    try {
      const invocation = { userId: session.userId,
        connection: { clientAddress: String(session.address || '') } };
      const result = await DDP._CurrentMethodInvocation.withValue(invocation, async () => {
        const attachmentInput = {
          boardId: requestFields.boardId, cardId: requestFields.cardId,
          attachmentId: requestFields.attachmentId,
        };
        if (requestFields.legacyOperation === 'rename-attachment') {
          return renameAccessibleAttachment(session.userId, {
            ...attachmentInput, name: requestFields.attachmentName,
          });
        }
        if (requestFields.legacyOperation === 'delete-attachment') {
          return removeAccessibleAttachment(session.userId, attachmentInput);
        }
        if (requestFields.legacyOperation === 'set-attachment-cover') {
          return setAccessibleAttachmentCover(session.userId, {
            ...attachmentInput, enabled: requestFields.coverState === 'on',
          });
        }
        if (requestFields.legacyOperation === 'add-comment') {
          return createAccessibleComment(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            text: requestFields.commentText, parentId: requestFields.parentId,
          });
        }
        if (requestFields.legacyOperation === 'edit-comment') {
          return updateAccessibleComment(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            commentId: requestFields.commentId, text: requestFields.commentText,
          });
        }
        if (requestFields.legacyOperation === 'delete-comment') {
          return removeAccessibleComment(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            commentId: requestFields.commentId,
          });
        }
        if (requestFields.legacyOperation === 'toggle-comment-reaction') {
          return toggleAccessibleCommentReaction(session.userId, {
            boardId: requestFields.boardId, cardId: requestFields.cardId,
            commentId: requestFields.commentId,
            reactionCodepoint: requestFields.reactionCodepoint,
          });
        }
        const checklistInput = {
          boardId: requestFields.boardId, cardId: requestFields.cardId,
          checklistId: requestFields.checklistId, itemId: requestFields.itemId,
        };
        if (requestFields.legacyOperation === 'add-checklist') {
          return createAccessibleChecklist(session.userId, {
            ...checklistInput, title: requestFields.checklistTitle,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'edit-checklist') {
          return updateAccessibleChecklistTitle(session.userId, {
            ...checklistInput, title: requestFields.checklistTitle,
          });
        }
        if (requestFields.legacyOperation === 'delete-checklist') {
          return removeAccessibleChecklist(session.userId, checklistInput);
        }
        if (requestFields.legacyOperation === 'move-checklist-up'
          || requestFields.legacyOperation === 'move-checklist-down') {
          return moveAccessibleChecklist(session.userId, {
            ...checklistInput,
            direction: requestFields.legacyOperation === 'move-checklist-up' ? 'up' : 'down',
          });
        }
        if (requestFields.legacyOperation === 'move-checklist-to-card') {
          const [targetBoardId, targetCardId] = String(requestFields.targetCardRef || '').split('|');
          return moveAccessibleChecklistToCard(session.userId, {
            ...checklistInput, targetBoardId, targetCardId,
          });
        }
        if (requestFields.legacyOperation === 'copy-checklist-to-card') {
          const [targetBoardId, targetCardId] = String(requestFields.targetCardRef || '').split('|');
          return copyAccessibleChecklist(session.userId, {
            ...checklistInput, targetBoardId, targetCardId,
          });
        }
        if (requestFields.legacyOperation === 'toggle-checklist-setting') {
          return toggleAccessibleChecklistSetting(session.userId, {
            ...checklistInput, setting: requestFields.checklistSetting,
          });
        }
        if (requestFields.legacyOperation === 'add-checklist-item') {
          return createAccessibleChecklistItem(session.userId, {
            ...checklistInput, title: requestFields.checklistItemTitle,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'edit-checklist-item') {
          return updateAccessibleChecklistItemTitle(session.userId, {
            ...checklistInput, title: requestFields.checklistItemTitle,
          });
        }
        if (requestFields.legacyOperation === 'toggle-checklist-item') {
          return toggleAccessibleChecklistItem(session.userId, checklistInput);
        }
        if (requestFields.legacyOperation === 'delete-checklist-item') {
          return removeAccessibleChecklistItem(session.userId, checklistInput);
        }
        if (requestFields.legacyOperation === 'convert-checklist-item-to-card') {
          const [targetBoardId, targetSwimlaneId, targetListId, targetCardId] =
            String(requestFields.cardDestination || '').split('|');
          return convertAccessibleChecklistItemToCard(session.userId, {
            ...checklistInput,
            title: requestFields.convertedCardTitle,
            targetBoardId,
            targetSwimlaneId,
            targetListId,
            targetCardId,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'move-checklist-item-up'
          || requestFields.legacyOperation === 'move-checklist-item-down') {
          return moveAccessibleChecklistItem(session.userId, {
            ...checklistInput,
            direction: requestFields.legacyOperation === 'move-checklist-item-up' ? 'up' : 'down',
          });
        }
        if (requestFields.legacyOperation === 'create-card') {
          return createAccessibleCard(session.userId, {
            boardId: requestFields.boardId, listId: requestFields.listId,
            swimlaneId: requestFields.swimlaneId, title: requestFields.cardTitle,
            position: requestFields.position,
          });
        }
        if (requestFields.legacyOperation === 'move-card-up'
          || requestFields.legacyOperation === 'move-card-down') {
          return moveAccessibleCard(session.userId, requestFields.cardId,
            requestFields.legacyOperation === 'move-card-up' ? 'up' : 'down');
        }
        if (requestFields.legacyOperation === 'edit-card-title'
          || requestFields.legacyOperation === 'edit-card-description') {
          return updateAccessibleCardContent(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.legacyOperation === 'edit-card-title' ? 'title' : 'description',
            value: requestFields.legacyOperation === 'edit-card-title'
              ? requestFields.cardTitle : requestFields.cardDescription,
          });
        }
        if (requestFields.legacyOperation === 'edit-card-date') {
          return updateAccessibleCardDate(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardDateField, value: requestFields.cardDateValue,
          });
        }
        if (requestFields.legacyOperation === 'edit-card-color') {
          return updateAccessibleCardColor(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            color: requestFields.cardColor,
          });
        }
        if (requestFields.legacyOperation === 'toggle-card-label') {
          return setAccessibleCardLabel(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            labelId: requestFields.labelId, enabled: requestFields.enabled === 'true',
          });
        }
        if (requestFields.legacyOperation === 'toggle-card-person') {
          return setAccessibleCardPerson(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardPersonField,
            targetUserId: requestFields.targetUserId,
            enabled: requestFields.enabled === 'true',
          });
        }
        if (requestFields.legacyOperation === 'edit-card-identity-text') {
          return updateAccessibleCardIdentityText(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardIdentityTextField,
            value: requestFields.cardIdentityText,
          });
        }
        if (requestFields.legacyOperation === 'edit-card-sort') {
          return updateAccessibleCardSort(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            sort: requestFields.cardSort,
          });
        }
        if (requestFields.legacyOperation === 'save-card-location') {
          return saveAccessibleCardLocation(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            locationId: requestFields.locationId, name: requestFields.locationName,
            address: requestFields.locationAddress,
            latitude: requestFields.locationLatitude,
            longitude: requestFields.locationLongitude,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-location') {
          return removeAccessibleCardLocation(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            locationId: requestFields.locationId,
          });
        }
        if (requestFields.legacyOperation === 'set-card-sticker') {
          const stickerParts = String(requestFields.stickerChoice || '').split(':');
          if (stickerParts.length !== 2) throw new Meteor.Error('invalid-card-sticker');
          const [icon, highlight] = stickerParts;
          return setAccessibleCardSticker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            icon, highlight, enabled: true,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-sticker') {
          return removeAccessibleCardStickerAt(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            index: requestFields.stickerIndex,
          });
        }
        if (requestFields.legacyOperation === 'assign-card-custom-field') {
          return setAccessibleCardCustomFieldAssigned(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            customFieldId: requestFields.customFieldId,
            assigned: requestFields.assigned === 'true',
          });
        }
        if (requestFields.legacyOperation === 'edit-card-custom-field'
          || requestFields.legacyOperation === 'edit-card-custom-field-checkbox') {
          return updateAccessibleCardCustomField(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            customFieldId: requestFields.customFieldId,
            value: requestFields.legacyOperation === 'edit-card-custom-field-checkbox'
              ? requestFields.customFieldValue === 'true' : requestFields.customFieldValue,
          });
        }
        if (requestFields.legacyOperation === 'save-card-dependency') {
          return saveAccessibleCardDependency(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            targetCardId: requestFields.targetCardId,
            type: requestFields.dependencyType,
            color: requestFields.dependencyColor,
            icon: requestFields.dependencyIcon,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-dependency') {
          return removeAccessibleCardDependency(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            targetCardId: requestFields.targetCardId,
          });
        }
        if (requestFields.legacyOperation === 'configure-card-vote') {
          return updateAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'configure', question: requestFields.voteQuestion,
            public: requestFields.votePublic === 'true',
            allowNonBoardMembers: requestFields.voteAllowNonBoardMembers === 'true',
            end: requestFields.voteEnd,
          });
        }
        if (requestFields.legacyOperation === 'update-card-vote-end') {
          return updateAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'end', end: requestFields.voteEnd,
          });
        }
        if (requestFields.legacyOperation === 'cast-card-vote') {
          const states = { positive: true, negative: false, clear: null };
          if (!Object.prototype.hasOwnProperty.call(states, requestFields.voteState)) {
            throw new Meteor.Error('invalid-vote-state');
          }
          return castAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            state: states[requestFields.voteState],
          });
        }
        if (requestFields.legacyOperation === 'remove-card-vote') {
          return updateAccessibleCardVote(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId, action: 'remove',
          });
        }
        if (requestFields.legacyOperation === 'configure-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'configure',
            allowNonBoardMembers: requestFields.pokerAllowNonBoardMembers === 'true',
            end: requestFields.pokerEnd,
          });
        }
        if (requestFields.legacyOperation === 'update-card-poker-end'
          || requestFields.legacyOperation === 'finish-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: requestFields.legacyOperation === 'finish-card-poker' ? 'finish' : 'end',
            end: requestFields.pokerEnd,
          });
        }
        if (requestFields.legacyOperation === 'cast-card-poker') {
          return castAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            state: requestFields.pokerState === 'clear' ? null : requestFields.pokerState,
          });
        }
        if (requestFields.legacyOperation === 'replay-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId, action: 'replay',
          });
        }
        if (requestFields.legacyOperation === 'estimate-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'estimation', estimation: requestFields.pokerEstimation,
          });
        }
        if (requestFields.legacyOperation === 'remove-card-poker') {
          return updateAccessibleCardPoker(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId, action: 'remove',
          });
        }
        if (requestFields.legacyOperation === 'set-card-due-complete') {
          return updateAccessibleCardMetric(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'due-complete', value: requestFields.cardDueComplete === 'true',
          });
        }
        if (requestFields.legacyOperation === 'set-card-spent-time'
          || requestFields.legacyOperation === 'clear-card-spent-time') {
          return updateAccessibleCardMetric(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            action: 'spent-time',
            value: requestFields.legacyOperation === 'clear-card-spent-time'
              ? '' : requestFields.cardSpentTime,
            isOvertime: requestFields.legacyOperation === 'set-card-spent-time'
              && requestFields.cardIsOvertime === 'true',
          });
        }
        if (requestFields.legacyOperation === 'set-card-watch') {
          return updateAccessibleWatch(session.userId, 'card', requestFields.watchCardId,
            requestFields.cardWatch === 'true' ? 'watching' : null);
        }
        if (requestFields.legacyOperation === 'set-card-parent') {
          return updateAccessibleCardParent(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            parentCardId: requestFields.parentCardId || null,
          });
        }
        const subtaskInput = {
          parentCardId: requestFields.cardId,
          boardId: requestFields.boardId,
          subtaskId: requestFields.subtaskId,
        };
        if (requestFields.legacyOperation === 'add-subtask') {
          return createAccessibleSubtask(session.userId, {
            ...subtaskInput, title: requestFields.subtaskTitle,
          });
        }
        if (requestFields.legacyOperation === 'edit-subtask-title') {
          return updateAccessibleSubtaskTitle(session.userId, {
            ...subtaskInput, title: requestFields.subtaskTitle,
          });
        }
        if (requestFields.legacyOperation === 'move-subtask-up'
          || requestFields.legacyOperation === 'move-subtask-down') {
          return moveAccessibleSubtask(session.userId, {
            ...subtaskInput,
            direction: requestFields.legacyOperation === 'move-subtask-up' ? 'up' : 'down',
          });
        }
        if (requestFields.legacyOperation === 'archive-subtask') {
          return setAccessibleSubtaskArchived(session.userId, {
            ...subtaskInput, archived: true,
          });
        }
        if (requestFields.legacyOperation === 'toggle-card-identity') {
          return setAccessibleCardIdentity(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            field: requestFields.cardIdentityField,
            targetUserId: requestFields.targetUserId,
            enabled: requestFields.enabled === 'true',
          });
        }
        if (requestFields.legacyOperation === 'move-card-to-list') {
          return moveAccessibleCardToList(session.userId, {
            cardId: requestFields.cardId, boardId: requestFields.boardId,
            listId: requestFields.cardListId, position: requestFields.position,
          });
        }
        return setAccessibleCardArchived(session.userId, {
          cardId: requestFields.cardId, boardId: requestFields.boardId,
          archived: requestFields.legacyOperation === 'archive-card',
        });
      });
      requestFields.legacyCardResult = { ok: true, result };
    } catch (error) {
      const errorKey = typeof error?.error === 'string' && /^[a-z0-9_-]{1,100}$/i.test(error.error)
        ? error.error : 'operation-failed';
      requestFields.legacyCardResult = {
        ok: false,
        errorKey,
      };
    }
  }
  if (session && requestFields.legacyOperation === 'import-board-text') {
    const source = /^\/import\/([^/]+)$/.exec(path)?.[1] || '';
    requestFields.legacyImportResult = await importLegacyHtml4Text({
      userId: session.userId,
      source,
      text: requestFields.importText,
      fields: requestFields.importFields,
      clientAddress: session.address,
    });
  }
  if (session && multipartUpload && /^\/b\/[^/]+/.test(path)
    && requestFields.legacyOperation === 'import-checklist-file') {
    requestFields.legacyImportResult = await importLegacyHtml4ScopedFile({
      userId: session.userId,
      target: {
        boardId: requestFields.boardId,
        cardId: requestFields.cardId,
        checklistId: requestFields.checklistId,
      },
      upload: multipartUpload,
      fields: requestFields.importField,
      clientAddress: session.address,
    });
    if (!requestFields.legacyImportResult?.ok
      && requestFields.legacyImportResult?.errorKey === 'forbidden') {
      try {
        require('/server/lib/securityLog').record({
          category: 'authz', bleed: 'ImportBleed', severity: 'high',
          action: 'blocked', source: 'legacyHtml4:checklist-import', req,
          userId: session.userId,
          detail: 'refused checklist import with mismatched board, card or checklist scope',
        });
      } catch (_) { /* reporting must not weaken the refusal */ }
    }
    requestFields.legacyCardResult = requestFields.legacyImportResult;
  }
  if (session && multipartUpload && requestFields.legacyOperation === 'import-board-file') {
    const source = /^\/import\/([^/]+)$/.exec(path)?.[1] || '';
    requestFields.legacyImportResult = await importLegacyHtml4File({
      userId: session.userId,
      source,
      upload: multipartUpload,
      fields: requestFields.importFields,
      clientAddress: session.address,
    });
  }
  await removeLegacyHtml4Upload(multipartUpload);
  if (query.has('q')) requestFields.q = query.get('q');
  if (query.has('searchView')) requestFields.searchView = query.get('searchView');
  if (query.has('page')) requestFields.page = query.get('page');
  requestFields.req = req;
  requestFields.requestHeaders = req.headers;
  const page = await legacyHtml4Page(requestFields.legacyRedirectPath || path,
    session?.userId || null, requestFields, translate);

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Vary', 'X-Wekan-Progressive-Client, Accept');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(renderLegacyHtml4Page(req.url, {
    productName: setting.productName || 'WeKan',
    hideLogo: setting.hideLogo === true,
    customLoginLogoLinkUrl: setting.customLoginLogoLinkUrl || '',
    textBelowCustomLoginLogo: setting.textBelowCustomLoginLogo || '',
    legalNotice: setting.legalNotice || '',
    disableRegistration: setting.disableRegistration === true,
    disableForgotPassword: setting.disableForgotPassword === true,
    loginFailed: new URL(req.url, 'http://wekan.invalid').searchParams.get('login') === 'failed',
    registrationFailed: new URL(req.url, 'http://wekan.invalid').searchParams.get('registration') === 'failed',
    recoveryRequested: new URL(req.url, 'http://wekan.invalid').searchParams.get('recovery') === 'requested',
    tokenFailed: new URL(req.url, 'http://wekan.invalid').searchParams.get('token') === 'failed',
    verificationRequested: new URL(req.url, 'http://wekan.invalid').searchParams.get('verification') === 'requested',
    authenticated: Boolean(session),
    username: user?.username || '',
    isAdmin: user?.isAdmin === true,
    sessionFields: session ? sessionFields(session, '/allboards') : null,
    actionFields: (action, purpose) => session ? sessionFields(session, action, purpose) : null,
    page,
    language,
    translate,
    validatedCustomHeadTags: (() => {
      try { return customHeadMarkup(setting); } catch (_) { return ''; }
    })(),
  }));
});
