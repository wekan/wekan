import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';

function canManage() { return !!Utils.getCurrentBoard()?.hasAdmin(Meteor.userId()); }
function snapshot(id) {
  const rule = ReactiveCache.getRule(id);
  if (!rule || rule.boardId !== Session.get('currentBoard')) return null;
  return { rule, trigger: ReactiveCache.getTrigger(rule.triggerId), action: ReactiveCache.getAction(rule.actionId) };
}
function fingerprint(data) { return JSON.stringify([data?.rule?.title, data?.trigger, data?.action]); }
function discard(tpl) { return !tpl.dirty.get() || confirm(TAPi18n.__('r-blocks-discard')); }
function load(tpl) {
  if (!tpl.editor || tpl.busy.get()) return;
  const id = tpl.selected.get(), data = id ? snapshot(id) : null;
  try {
    if (id && (!data?.trigger || !data?.action)) throw new Error(TAPi18n.__('r-blocks-unavailable'));
    tpl.editor.load(data?.trigger, data?.action);
    tpl.find('.js-blocks-title').value = data?.rule?.title || '';
    tpl.loaded = fingerprint(data);
    tpl.error.set(''); tpl.dirty.set(false); Session.set('rulesBlocksDirty', false);
  } catch (error) {
    tpl.editor.load();
    tpl.error.set(error.message);
  }
}
Template.rulesBlocks.onCreated(function () {
  this.selected = new ReactiveVar('');
  this.ready = new ReactiveVar(false);
  this.busy = new ReactiveVar(false);
  this.error = new ReactiveVar('');
  this.dirty = new ReactiveVar(false);
  this.saved = new ReactiveVar(false);
  this.boardId = Session.get('currentBoard');
  this.autorun(() => {
    const boardId = Session.get('currentBoard');
    if (boardId !== this.boardId) {
      this.boardId = boardId;
      this.selected.set('');
      this.dirty.set(false);
      this.saved.set(false);
      Session.set('rulesBlocksDirty', false);
      this.editor?.load();
    }
    if (boardId) this.subscribe('boardRules', boardId);
  });
});
Template.rulesBlocks.onRendered(async function () {
  const tpl = this;
  if (!canManage()) return;
  try {
    const { createRulesBlocksEditor } = await import('./blocks/editor');
    if (tpl.destroyed || tpl.boardId !== Session.get('currentBoard') || !canManage()) return;
    tpl.editor = createRulesBlocksEditor(tpl.find('.js-rules-blocks-workspace'), {
      translate: (key, options) => TAPi18n.__(key, options),
      rtl: TAPi18n.isRTL(),
      onChange() { tpl.dirty.set(true); tpl.saved.set(false); Session.set('rulesBlocksDirty', true); },
    });
    tpl.ready.set(true);
    tpl.autorun(() => {
      TAPi18n.getLanguage();
      TAPi18n.revision.get();
      Tracker.nonreactive(() => tpl.editor.setLocale(TAPi18n.isRTL()));
    });
    tpl.autorun(() => {
      if (!tpl.subscriptionsReady()) return;
      const id = tpl.selected.get();
      if (id) snapshot(id);
      if (tpl.dirty.get() || tpl.busy.get()) return;
      Tracker.nonreactive(() => load(tpl));
    });
  } catch (error) { if (!tpl.destroyed) tpl.error.set(`${TAPi18n.__('error')}: ${error.message}`); }
});
Template.rulesBlocks.onDestroyed(function () {
  this.destroyed = true;
  this.editor?.dispose();
  Session.set('rulesBlocksDirty', false);
});
Template.rulesBlocks.helpers({
  canManageBlocks: canManage,
  blockRules() { return ReactiveCache.getRules({ boardId: Session.get('currentBoard') }); },
  selectedRuleId() { return Template.instance().selected.get(); },
  isSelectedRule() { return this._id === Template.instance().selected.get(); },
  blocksReady() { return Template.instance().ready.get(); },
  blocksBusy() { return Template.instance().busy.get(); },
  blocksDisabled() { const tpl = Template.instance(); return !tpl.ready.get() || tpl.busy.get(); },
  blocksError() { return Template.instance().error.get(); },
  blocksDirty() { return Template.instance().dirty.get(); },
  blocksSaved() { return Template.instance().saved.get(); },
});
Template.rulesBlocks.events({
  'change .js-blocks-rule'(event, tpl) {
    if (!discard(tpl)) { event.currentTarget.value = tpl.selected.get(); return; }
    tpl.dirty.set(false); tpl.selected.set(event.currentTarget.value); load(tpl);
  },
  'click .js-blocks-new'(event, tpl) {
    if (!discard(tpl)) return;
    tpl.dirty.set(false); tpl.selected.set(''); load(tpl);
  },
  'click .js-blocks-reload'(event, tpl) { if (discard(tpl)) load(tpl); },
  'input .js-blocks-title'(event, tpl) { tpl.dirty.set(true); tpl.saved.set(false); Session.set('rulesBlocksDirty', true); },
  'click .js-blocks-form'(event, tpl) {
    if (!discard(tpl)) { event.stopImmediatePropagation(); return; }
    Session.set('rulesBlocksDirty', false);
    // The parent rulesMain owns the existing form editor and its edit target.
    // The event bubbles to the existing parent form-editor handler.
  },
  async 'click .js-blocks-save'(event, tpl) {
    if (!canManage() || tpl.busy.get() || !tpl.editor || tpl.boardId !== Session.get('currentBoard')) return;
    try {
      const title = tpl.find('.js-blocks-title').value.trim();
      if (!title) throw new Error(TAPi18n.__('r-rule-title-required'));
      let documents;
      try { documents = tpl.editor.read(); }
      catch (error) { throw new Error(TAPi18n.__('r-blocks-invalid')); }
      const { trigger, action } = documents;
      const id = tpl.selected.get();
      if (id && fingerprint(snapshot(id)) !== tpl.loaded) throw new Error(TAPi18n.__('r-blocks-conflict'));
      tpl.busy.set(true); tpl.error.set('');
      if (id) await Meteor.callAsync('rules.updateRule', id, title, trigger, action);
      else {
        const result = await Meteor.callAsync('rules.createRule', tpl.boardId, title, trigger, action);
        if (!tpl.destroyed) tpl.selected.set(result._id);
      }
      if (!tpl.destroyed) {
        tpl.dirty.set(false); Session.set('rulesBlocksDirty', false); tpl.saved.set(true);
      }
    } catch (error) { if (!tpl.destroyed) tpl.error.set(error.reason || error.message); }
    finally { if (!tpl.destroyed) tpl.busy.set(false); }
  },
});
