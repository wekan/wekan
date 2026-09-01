import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { TAPi18n } from '/imports/i18n';

function publicMcpConfig() {
  return Meteor.settings?.public?.mcp || {};
}

function endpoint() {
  const value = publicMcpConfig().endpoint;
  return typeof value === 'string' ? value : '';
}

function isUsableConfigApiKey(value) {
  const key = typeof value === 'string' ? value.trim() : '';
  return key.startsWith('wk_mcp_') && key.length >= 'wk_mcp_'.length + 24;
}

async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('clipboard-unavailable');
}

function clientConfig() {
  const candidate = Template.instance()?.configApiKey?.get()?.trim() || '';
  const apiKey = isUsableConfigApiKey(candidate)
    ? candidate
    : '<YOUR_MCP_API_KEY>';
  return JSON.stringify({
    mcpServers: {
      wekan: {
        url: endpoint(),
        transport: publicMcpConfig().transport || 'streamable-http',
        headers: {
          'x-api-key': apiKey,
        },
      },
    },
  }, null, 2);
}

function formatDate(value) {
  if (!value) return TAPi18n.__('mcp-key-never-used');
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatUsageDate(value) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(date);
}

function formatCount(value) {
  return new Intl.NumberFormat().format(Number(value) || 0);
}

function presentApiKey(key, selectedKeyId) {
  const now = new Date();
  const revoked = Boolean(key.revokedAt);
  const expired = !revoked && new Date(key.expiresAt) <= now;
  let state = 'active';
  if (revoked) state = 'revoked';
  else if (expired) state = 'expired';
  return {
    ...key,
    rowClass: `is-${state}${key._id === selectedKeyId ? ' is-selected' : ''}`,
    stateLabel: TAPi18n.__(`mcp-key-${state}`),
    canRevoke: state === 'active',
    canSelect: state === 'active',
    isSelected: state === 'active' && key._id === selectedKeyId,
    selectButtonClass: key._id === selectedKeyId ? 'primary' : '',
    createdLabel: formatDate(key.createdAt),
    expiresLabel: formatDate(key.expiresAt),
    lastUsedLabel: key.lastUsedAt
      ? formatDate(key.lastUsedAt)
      : TAPi18n.__('mcp-key-never-used'),
  };
}

async function loadApiKeys(template) {
  template.loadingKeys.set(true);
  try {
    template.apiKeys.set(await Meteor.callAsync('mcpApiKeys.list'));
  } catch (error) {
    template.keyStatus.set(TAPi18n.__('mcp-key-load-failed'));
    template.keyStatusClass.set('is-error');
  } finally {
    template.loadingKeys.set(false);
  }
}

async function loadMcpUsage(template) {
  template.loadingUsage.set(true);
  try {
    template.usage.set(await Meteor.callAsync('mcpUsage.summary'));
    template.usageError.set('');
  } catch (error) {
    template.usageError.set(TAPi18n.__('mcp-usage-load-failed'));
  } finally {
    template.loadingUsage.set(false);
  }
}

Template.mcpHub.onCreated(function () {
  this.copyStatus = new ReactiveVar('');
  this.apiKeys = new ReactiveVar([]);
  this.loadingKeys = new ReactiveVar(true);
  this.busy = new ReactiveVar(false);
  this.keyStatus = new ReactiveVar('');
  this.keyStatusClass = new ReactiveVar('');
  this.revealedApiKey = new ReactiveVar('');
  this.revealedKeyId = new ReactiveVar('');
  this.selectedKeyId = new ReactiveVar('');
  this.configApiKey = new ReactiveVar('');
  this.usage = new ReactiveVar(null);
  this.loadingUsage = new ReactiveVar(true);
  this.usageError = new ReactiveVar('');
  loadApiKeys(this);
  loadMcpUsage(this);
});

Template.mcpHub.helpers({
  endpoint,
  endpointConfigured() {
    return Boolean(endpoint()) && publicMcpConfig().enabled === true;
  },
  clientConfig,
  selectedApiKey() {
    const template = Template.instance();
    return template.apiKeys.get().find(key =>
      key._id === template.selectedKeyId.get());
  },
  hasSelectedApiKey() {
    return Boolean(Template.instance().selectedKeyId.get());
  },
  configHasApiKey() {
    return isUsableConfigApiKey(Template.instance().configApiKey.get());
  },
  configKeyInvalid() {
    const value = Template.instance().configApiKey.get().trim();
    return Boolean(value) && !isUsableConfigApiKey(value);
  },
  selectedApiKeyNeedsSecret() {
    const template = Template.instance();
    return Boolean(template.selectedKeyId.get()) &&
      !isUsableConfigApiKey(template.configApiKey.get());
  },
  isLoadingUsage() {
    return Template.instance().loadingUsage.get();
  },
  usageError() {
    return Template.instance().usageError.get();
  },
  hasUsage() {
    return Boolean(Template.instance().usage.get());
  },
  usageTotalCalls() {
    return formatCount(Template.instance().usage.get()?.totals?.toolCallTotal);
  },
  usageDownloads() {
    return formatCount(Template.instance().usage.get()?.totals?.downloadTotal);
  },
  usageCreateRequested() {
    return formatCount(Template.instance().usage.get()?.totals?.createRequested);
  },
  usageCreateSuccess() {
    return formatCount(Template.instance().usage.get()?.totals?.createSuccess);
  },
  usageCreateFailed() {
    return formatCount(Template.instance().usage.get()?.totals?.createFailed);
  },
  usageTodayCreates() {
    return formatCount(Template.instance().usage.get()?.today?.createRequested);
  },
  usageUnlimited() {
    return Template.instance().usage.get()?.dailyCreateLimit === null;
  },
  usageDailyLimit() {
    return formatCount(Template.instance().usage.get()?.dailyCreateLimit);
  },
  usageRemaining() {
    return formatCount(Template.instance().usage.get()?.dailyCreateRemaining);
  },
  usageProgressStyle() {
    const usage = Template.instance().usage.get();
    const used = Number(usage?.today?.createRequested) || 0;
    const limit = Number(usage?.dailyCreateLimit) || 1;
    return `width: ${Math.min(100, Math.round((used / limit) * 100))}%`;
  },
  usageHistory() {
    return (Template.instance().usage.get()?.history || []).map(row => ({
      ...row,
      dateLabel: formatUsageDate(row.dateKey),
      toolCallLabel: formatCount(row.toolCallTotal),
      downloadLabel: formatCount(row.downloadTotal),
      createRequestedLabel: formatCount(row.createRequested),
      createSuccessLabel: formatCount(row.createSuccess),
      createFailedLabel: formatCount(row.createFailed),
    }));
  },
  hasUsageHistory() {
    return (Template.instance().usage.get()?.history || []).length > 0;
  },
  apiKeys() {
    const template = Template.instance();
    return template.apiKeys.get().map(key =>
      presentApiKey(key, template.selectedKeyId.get()));
  },
  hasApiKeys() {
    return Template.instance().apiKeys.get().length > 0;
  },
  activeKeyCount() {
    const now = new Date();
    return Template.instance().apiKeys.get().filter(key =>
      !key.revokedAt && new Date(key.expiresAt) > now).length;
  },
  isLoadingKeys() {
    return Template.instance().loadingKeys.get();
  },
  isBusy() {
    return Template.instance().busy.get();
  },
  revealedApiKey() {
    return Template.instance().revealedApiKey.get();
  },
  keyStatus() {
    return Template.instance().keyStatus.get();
  },
  keyStatusClass() {
    return Template.instance().keyStatusClass.get();
  },
  statusClass() {
    return Boolean(endpoint()) && publicMcpConfig().enabled === true
      ? 'is-connected'
      : 'is-disabled';
  },
  statusIcon() {
    return Boolean(endpoint()) && publicMcpConfig().enabled === true
      ? 'fa-check-circle'
      : 'fa-minus-circle';
  },
  copyStatus() {
    return Template.instance().copyStatus.get();
  },
});

Template.mcpHub.events({
  async 'click .js-refresh-mcp-usage'(event, template) {
    event.preventDefault();
    await loadMcpUsage(template);
  },
  async 'submit .js-create-mcp-key'(event, template) {
    event.preventDefault();
    if (template.busy.get()) return;
    const form = event.currentTarget;
    const name = form.querySelector('.js-mcp-key-name').value;
    const expiresInDays = Number(
      form.querySelector('.js-mcp-key-expiry').value,
    );
    template.busy.set(true);
    template.keyStatus.set('');
    try {
      const result = await Meteor.callAsync(
        'mcpApiKeys.create',
        name,
        expiresInDays,
      );
      template.revealedApiKey.set(result.apiKey);
      template.revealedKeyId.set(result.key._id);
      template.selectedKeyId.set(result.key._id);
      template.configApiKey.set(result.apiKey);
      template.keyStatus.set(TAPi18n.__('mcp-key-created-success'));
      template.keyStatusClass.set('is-success');
      form.reset();
      form.querySelector('.js-mcp-key-expiry').value = '90';
      await loadApiKeys(template);
    } catch (error) {
      const key = error?.error;
      const known = [
        'mcp-key-name-required',
        'mcp-key-expiry-invalid',
        'mcp-key-limit-reached',
      ];
      template.keyStatus.set(TAPi18n.__(
        known.includes(key) ? key : 'mcp-key-create-failed',
      ));
      template.keyStatusClass.set('is-error');
    } finally {
      template.busy.set(false);
    }
  },
  async 'click .js-revoke-mcp-key'(event, template) {
    event.preventDefault();
    const keyId = event.currentTarget.dataset.keyId;
    if (!keyId || template.busy.get()) return;
    if (!window.confirm(TAPi18n.__('mcp-revoke-key-confirm'))) return;
    template.busy.set(true);
    try {
      await Meteor.callAsync('mcpApiKeys.revoke', keyId);
      if (template.selectedKeyId.get() === keyId) {
        template.selectedKeyId.set('');
        template.configApiKey.set('');
      }
      template.keyStatus.set(TAPi18n.__('mcp-key-revoked-success'));
      template.keyStatusClass.set('is-success');
      await loadApiKeys(template);
    } catch (error) {
      template.keyStatus.set(TAPi18n.__('mcp-key-revoke-failed'));
      template.keyStatusClass.set('is-error');
    } finally {
      template.busy.set(false);
    }
  },
  'click .js-select-mcp-key'(event, template) {
    event.preventDefault();
    const keyId = event.currentTarget.dataset.keyId;
    if (!keyId) return;
    template.selectedKeyId.set(keyId);
    template.configApiKey.set(
      template.revealedKeyId.get() === keyId
        ? template.revealedApiKey.get()
        : '',
    );
    template.copyStatus.set('');
  },
  'click .js-clear-selected-mcp-key'(event, template) {
    event.preventDefault();
    template.selectedKeyId.set('');
    template.configApiKey.set('');
    template.copyStatus.set('');
  },
  'input .js-mcp-config-key'(event, template) {
    template.configApiKey.set(event.currentTarget.value);
    template.copyStatus.set('');
  },
  async 'click .js-copy-mcp-secret'(event, template) {
    event.preventDefault();
    try {
      await copyText(template.revealedApiKey.get());
      template.copyStatus.set(TAPi18n.__('mcp-copied'));
    } catch (error) {
      template.copyStatus.set(TAPi18n.__('mcp-copy-failed'));
    }
  },
  'click .js-dismiss-mcp-secret'(event, template) {
    event.preventDefault();
    const revealedKeyId = template.revealedKeyId.get();
    template.revealedApiKey.set('');
    template.revealedKeyId.set('');
    if (template.selectedKeyId.get() === revealedKeyId) {
      template.configApiKey.set('');
    }
  },
  async 'click .js-copy-mcp-endpoint'(event, template) {
    event.preventDefault();
    try {
      await copyText(endpoint());
      template.copyStatus.set(TAPi18n.__('mcp-copied'));
    } catch (error) {
      template.copyStatus.set(TAPi18n.__('mcp-copy-failed'));
    }
  },
  async 'click .js-copy-mcp-config'(event, template) {
    event.preventDefault();
    try {
      await copyText(clientConfig());
      template.copyStatus.set(TAPi18n.__('mcp-copied'));
    } catch (error) {
      template.copyStatus.set(TAPi18n.__('mcp-copy-failed'));
    }
  },
});
