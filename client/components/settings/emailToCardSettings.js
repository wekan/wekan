import { ReactiveCache } from '/imports/reactiveCache';
import { ReactiveVar } from 'meteor/reactive-var';
import { Random } from 'meteor/random';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
import { EMAIL_PARTS, cleanParts } from '/models/lib/emailToCard';

// Email to card in Notification Settings (emailToCardSettings.jade). The
// admin form is read through getInboundMailSettings - the settings document's
// inboundMail is never published, because it holds the passwords - and saved
// with saveInboundMailSettings, which keeps a stored password or secret when
// its field is left empty. Board and member choices save on every change.

function currentBoard() {
  return ReactiveCache.getBoard(Utils.getCurrentBoardId());
}

function errorText(error) {
  const key = error && (error.error || error.reason);
  return key ? TAPi18n.__(String(key)) : TAPi18n.__('error-notAuthorized');
}

const PART_LABELS = {
  description: 'email-to-card-part-description',
  stripQuoted: 'email-to-card-part-strip-quoted',
  attachments: 'email-to-card-part-attachments',
  senderLine: 'email-to-card-part-sender-line',
};

function partOptions(name, value) {
  const kind = EMAIL_PARTS[name];
  const values = Array.isArray(kind) ? kind : [true, false];
  return [{ value: '', labelKey: 'default', selected: value === undefined },
    ...values.map(v => ({
      value: String(v),
      labelKey: v === true ? 'yes' : v === false ? 'no' : `email-to-card-description-${v}`,
      selected: value === v,
    }))];
}

function storedParts(scope) {
  if (scope === 'board') {
    const board = currentBoard();
    return cleanParts(board && board.emailToCard && board.emailToCard.parts);
  }
  const user = ReactiveCache.getCurrentUser();
  return cleanParts(user && user.profile && user.profile.emailToCard && user.profile.emailToCard.parts);
}

function boardEmailToCard() {
  const board = currentBoard();
  return (board && board.emailToCard) || {};
}

function saveBoard(instance, change) {
  const board = currentBoard();
  if (!board) return;
  const current = boardEmailToCard();
  const next = {
    enabled: current.enabled === true,
    listId: current.listId || null,
    swimlaneId: current.swimlaneId || null,
    parts: cleanParts(current.parts),
    ...change,
  };
  Meteor.call('setBoardEmailToCard', board._id, next, error => {
    instance.message.set(error ? errorText(error) : '');
    if (!error) loadAddress(instance);
  });
}

function saveMember(instance, change) {
  const user = ReactiveCache.getCurrentUser();
  const current = (user && user.profile && user.profile.emailToCard) || {};
  const next = {
    enabled: current.enabled === true || current.enabled === false ? current.enabled : null,
    parts: cleanParts(current.parts),
    ...change,
  };
  Meteor.call('setMemberEmailToCard', next, error => instance.message.set(error ? errorText(error) : ''));
}

function loadAddress(instance) {
  const boardId = Utils.getCurrentBoardId();
  if (!boardId) return;
  Meteor.call('emailToCardAddress', boardId, (error, result) => {
    instance.address.set(error ? { enabled: false, reason: 'not-authorized' } : result);
  });
}

// The admin form, read back from the inputs (accounts keep their order).
function readAdminForm(instance) {
  const admin = instance.admin.get();
  const passwords = {};
  const accounts = (admin.accounts || []).map(account => {
    const box = instance.$(`.email-to-card-account[data-id="${account.id}"]`);
    const out = { id: account.id };
    box.find('.js-etc-account').each((i, el) => {
      const key = el.dataset.key;
      out[key] = key === 'secure' || key === 'enabled' ? el.value === 'true' : el.value;
    });
    const password = box.find('.js-etc-account-password').val();
    if (password) passwords[account.id] = password;
    return out;
  });
  return {
    enabled: admin.enabled === true,
    domain: String(instance.$('.js-etc-domain').val() || admin.domain || '').trim(),
    webhookSecret: String(instance.$('.js-etc-webhook-secret').val() || ''),
    clearWebhookSecret: instance.clearSecret.get(),
    accounts,
    passwords,
  };
}

Template.emailToCardSettings.onCreated(function () {
  this.admin = new ReactiveVar(null);
  this.address = new ReactiveVar(null);
  this.message = new ReactiveVar('');
  this.clearSecret = new ReactiveVar(false);
  if (this.data.scope === 'admin') {
    Meteor.call('getInboundMailSettings', (error, result) => {
      if (error) this.message.set(errorText(error));
      else this.admin.set(result);
    });
  }
  if (this.data.scope === 'board') loadAddress(this);
});

Template.emailToCardSettings.helpers({
  isAdminScope() { return Template.instance().data.scope === 'admin'; },
  isBoardScope() { return Template.instance().data.scope === 'board'; },
  isMemberScope() { return Template.instance().data.scope === 'member'; },
  isSandstorm() { return !!Meteor.settings?.public?.sandstorm; },
  admin() { return Template.instance().admin.get(); },
  clearSecret() { return Template.instance().clearSecret.get(); },
  message() { return Template.instance().message.get(); },
  address() { return Template.instance().address.get() || {}; },
  addressOffKey() {
    const address = Template.instance().address.get();
    return `email-to-card-off-${(address && address.reason) || 'admin-off'}`;
  },
  sandstormBoards() {
    const admin = Template.instance().admin.get() || {};
    const chosen = admin.sandstormBoard && admin.sandstormBoard.boardId;
    const user = ReactiveCache.getCurrentUser();
    const boards = ReactiveCache.getBoards({ archived: false, type: 'board', 'members.userId': user && user._id },
      { sort: { title: 1 } }) || [];
    return boards.map(b => ({ _id: b._id, title: b.title, selected: b._id === chosen }));
  },
  canEditBoard() {
    const user = ReactiveCache.getCurrentUser();
    return !!(user && (user.isBoardAdmin() || user.isAdmin));
  },
  boardEnabled() { return boardEmailToCard().enabled === true; },
  boardLists() {
    const board = currentBoard();
    if (!board) return [];
    const chosen = boardEmailToCard().listId;
    return (ReactiveCache.getLists({ boardId: board._id, archived: false }, { sort: { sort: 1 } }) || [])
      .map(l => ({ _id: l._id, title: l.title, selected: l._id === chosen }));
  },
  boardSwimlanes() {
    const board = currentBoard();
    if (!board) return [];
    const chosen = boardEmailToCard().swimlaneId;
    return (ReactiveCache.getSwimlanes({ boardId: board._id, archived: false }, { sort: { sort: 1 } }) || [])
      .map(s => ({ _id: s._id, title: s.title, selected: s._id === chosen }));
  },
  memberEnabled() {
    const user = ReactiveCache.getCurrentUser();
    const value = user && user.profile && user.profile.emailToCard && user.profile.emailToCard.enabled;
    return value === true || value === false ? String(value) : '';
  },
  partRows() {
    const instance = Template.instance();
    const scope = instance.data.scope;
    const parts = storedParts(scope);
    const user = ReactiveCache.getCurrentUser();
    const readOnly = scope === 'board' && !(user && (user.isBoardAdmin() || user.isAdmin));
    return Object.keys(EMAIL_PARTS).map(name => ({
      name, labelKey: PART_LABELS[name], readOnly, options: partOptions(name, parts[name]),
    }));
  },
});

function partValue(name, raw) {
  if (raw === '') return undefined;
  return Array.isArray(EMAIL_PARTS[name]) ? raw : raw === 'true';
}

Template.emailToCardSettings.events({
  // --- Admin Panel ---
  'click .js-etc-admin-enabled'(event, instance) {
    event.preventDefault();
    const admin = instance.admin.get();
    instance.admin.set({ ...admin, ...readAdminForm(instance), enabled: !admin.enabled });
  },
  'click .js-etc-clear-secret'(event, instance) {
    event.preventDefault();
    instance.clearSecret.set(!instance.clearSecret.get());
  },
  'click .js-etc-add-account'(event, instance) {
    event.preventDefault();
    const admin = instance.admin.get();
    const form = readAdminForm(instance);
    const accounts = form.accounts.map(a => ({ ...(admin.accounts || []).find(o => o.id === a.id), ...a }));
    accounts.push({ id: Random.id(12), label: '', host: '', port: 993, secure: true, username: '',
      mailbox: 'INBOX', after: 'seen', enabled: true });
    instance.admin.set({ ...admin, domain: form.domain, accounts });
  },
  'click .js-etc-remove-account'(event, instance) {
    event.preventDefault();
    const id = event.currentTarget.closest('.email-to-card-account').dataset.id;
    const admin = instance.admin.get();
    instance.admin.set({ ...admin, accounts: (admin.accounts || []).filter(a => a.id !== id) });
  },
  'click .js-etc-admin-save'(event, instance) {
    event.preventDefault();
    Meteor.call('saveInboundMailSettings', readAdminForm(instance), (error, result) => {
      if (error) {
        instance.message.set(errorText(error));
        return;
      }
      instance.clearSecret.set(false);
      instance.$('input[type="password"]').val('');
      instance.admin.set({ ...instance.admin.get(), ...result });
      instance.message.set(TAPi18n.__('email-to-card-saved'));
    });
  },
  'change .js-etc-sandstorm-board'(event, instance) {
    Meteor.call('setSandstormEmailBoard', event.currentTarget.value, (error, result) => {
      if (error) instance.message.set(errorText(error));
      else instance.admin.set({ ...instance.admin.get(), sandstormBoard: result });
    });
  },
  // --- Board Settings ---
  'click .js-etc-board-enabled'(event, instance) {
    event.preventDefault();
    saveBoard(instance, { enabled: !boardEmailToCard().enabled });
  },
  'change .js-etc-board-place'(event, instance) {
    saveBoard(instance, { [event.currentTarget.dataset.key]: event.currentTarget.value || null });
  },
  'click .js-etc-new-address'(event, instance) {
    event.preventDefault();
    Meteor.call('emailToCardNewAddress', Utils.getCurrentBoardId(), (error, result) => {
      if (error) instance.message.set(errorText(error));
      else instance.address.set(result);
    });
  },
  // --- Member Settings ---
  'change .js-etc-member-enabled'(event, instance) {
    const raw = event.currentTarget.value;
    saveMember(instance, { enabled: raw === '' ? null : raw === 'true' });
  },
  // --- both ---
  'change .js-etc-part'(event, instance) {
    const name = event.currentTarget.dataset.part;
    const parts = { ...storedParts(instance.data.scope) };
    const value = partValue(name, event.currentTarget.value);
    if (value === undefined) delete parts[name];
    else parts[name] = value;
    if (instance.data.scope === 'board') saveBoard(instance, { parts });
    else saveMember(instance, { parts });
  },
});
