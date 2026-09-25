import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { TAPi18n } from '/imports/i18n';
import { MultiSelection } from '/client/lib/multiSelection';
import './structuralSelection.jade';
import './structuralSelection.css';

Template.structuralSelectionCheckbox.helpers({
  selected() { return MultiSelection.isObjectSelected(this.kind, this.id); },
});
Template.structuralSelectionCheckbox.events({
  'mousedown .js-structural-selection'(event) { event.stopPropagation(); },
  'click .js-structural-selection'(event, instance) {
    event.preventDefault(); event.stopPropagation();
    const { kind, id } = instance.data;
    MultiSelection.toggleObject(kind, id, Session.get('currentBoard'));
  },
});
Template.moveObjectsPopup.onCreated(function () {
  this.selection = MultiSelection.mixedSelection();
  this.target = new ReactiveVar({ boardId: Session.get('currentBoard'), ...(this.data?.destination || {}) });
  this.options = new ReactiveVar({});
  this.error = new ReactiveVar(this.data?.error || ''); this.busy = new ReactiveVar(false);
  this.autorun(() => {
    const target = this.target.get();
    Meteor.call('structuralMoveOptions', target, (error, options) => {
      if (this.target.get() !== target || this.isDestroyed) return;
      if (error) this.error.set(error.reason || error.message);
      else this.options.set(options);
    });
  });
});
const fields = [['boardId', 'boards'], ['swimlaneId', 'swimlanes'], ['listId', 'lists'], ['cardId', 'cards'], ['checklistId', 'checklists'], ['itemId', 'r-item']];
Template.moveObjectsPopup.helpers({
  error() { return Template.instance().error; },
  busy() { return Template.instance().busy; },
  fields() {
    const instance = Template.instance(), target = instance.target.get(), options = instance.options.get();
    return fields.map(([key, label]) => ({ key, label: TAPi18n.__(label), emptyLabel: key === 'cardId' ? TAPi18n.__('add-card') : key === 'checklistId' ? TAPi18n.__('add-checklist') : '—', options: (options[key] || []).map(doc => ({ ...doc, selected: target[key] === doc._id })) }));
  },
});
Template.moveObjectsPopup.events({
  'change .js-object-destination'(event, instance) {
    const key = event.target.dataset.field, next = { ...instance.target.get(), [key]: event.target.value };
    for (const [child] of fields.slice(fields.findIndex(([field]) => field === key) + 1)) delete next[child];
    instance.error.set(''); instance.target.set(next);
  },
  async 'click .js-move-objects'(event, instance) {
    event.preventDefault(); if (instance.busy.get()) return;
    instance.busy.set(true); instance.error.set('');
    try {
      await Meteor.callAsync('moveBoardObjects', Session.get('currentBoard'), instance.selection,
        { ...instance.target.get(), position: instance.find('.js-object-position').value });
      MultiSelection.reset(); Popup.close();
    } catch (error) { instance.error.set(error.reason || error.message); }
    finally { instance.busy.set(false); }
  },
});

// A common drag path for heterogeneous selections. Existing single-object and
// card-only sortables remain responsible when no structural object is selected.
import { ReactiveCache } from '/imports/reactiveCache';
const entitySelectors = [
  ['item', '.js-checklist-item'], ['checklist', '.minicard-checklist'],
  ['card', '.js-minicard'], ['list', '.js-list'], ['swimlane', '.js-swimlane-header'],
];
function entityAt(element) {
  for (const [kind, selector] of entitySelectors) {
    const node = element?.closest(selector);
    if (!node) continue;
    const data = Blaze.getData(node);
    const doc = kind === 'item' ? data?.item : kind === 'checklist' ? data?.checklist : data;
    if (doc?._id) return { kind, doc, node };
  }
  return null;
}
function targetFor(entity) {
  const target = { boardId: Session.get('currentBoard'), position: 'before' };
  let { kind, doc } = entity;
  if (kind === 'item') { target.itemId = doc._id; doc = ReactiveCache.getChecklist(doc.checklistId); kind = 'checklist'; }
  if (kind === 'checklist') { target.checklistId = doc._id; doc = ReactiveCache.getCard(doc.cardId); kind = 'card'; }
  if (kind === 'card') { target.cardId = doc._id; target.swimlaneId = doc.swimlaneId; doc = ReactiveCache.getList(doc.listId); kind = 'list'; }
  if (kind === 'list') { target.listId = doc._id; target.swimlaneId ||= doc.swimlaneId || Blaze.getData(entity.node.closest('.js-swimlane'))?._id; }
  if (kind === 'swimlane') target.swimlaneId = doc._id;
  return target;
}
Meteor.startup(() => {
  let drag;
  document.addEventListener('mousedown', event => {
    if (event.button !== 0 || !MultiSelection.isActive() || !MultiSelection.hasObjects() ||
        event.target.closest('input,textarea,button,select,.materialCheckBox')) return;
    const entity = entityAt(event.target);
    if (!entity || !(entity.kind === 'card' ? MultiSelection.isSelected(entity.doc._id)
      : MultiSelection.isObjectSelected(entity.kind, entity.doc._id))) return;
    event.stopImmediatePropagation(); event.preventDefault();
    drag = { x: event.clientX, y: event.clientY, selection: MultiSelection.mixedSelection() };
  }, true);
  document.addEventListener('mousemove', event => {
    if (!drag) return;
    if (!drag.preview && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    if (!drag.preview) {
      drag.preview = document.createElement('div'); drag.preview.className = 'structural-drag-preview';
      drag.preview.textContent = `${drag.selection.length}`; document.body.append(drag.preview);
    }
    event.preventDefault();
    drag.preview.style.left = `${event.clientX + 12}px`; drag.preview.style.top = `${event.clientY + 12}px`;
    drag.target?.node.classList.remove('structural-drop-target');
    drag.target = entityAt(document.elementFromPoint(event.clientX, event.clientY));
    drag.target?.node.classList.add('structural-drop-target');
  }, true);
  document.addEventListener('mouseup', async event => {
    if (!drag) return;
    const completed = drag; drag = null;
    completed.preview?.remove(); completed.target?.node.classList.remove('structural-drop-target');
    if (!completed.preview || !completed.target) return;
    event.preventDefault(); event.stopImmediatePropagation();
    document.addEventListener('click', click => { click.preventDefault(); click.stopImmediatePropagation(); }, { capture: true, once: true });
    const destination = targetFor(completed.target);
    const bounds = completed.target.node.getBoundingClientRect();
    destination.position = event.clientY < bounds.y + bounds.height / 2 ? 'before' : 'after';
    try {
      await Meteor.callAsync('moveBoardObjects', Session.get('currentBoard'), completed.selection, destination);
      MultiSelection.reset();
    } catch (error) {
      // The picker allows correcting incomplete destinations, including a new
      // board or a precise child position, without losing the selection.
      Popup.open('moveObjects').call({ destination, error: error.reason || error.message }, {
        currentTarget: completed.target.node, target: completed.target.node, preventDefault() {},
      });
    }
  }, true);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !drag) return;
    drag.preview?.remove(); drag.target?.node.classList.remove('structural-drop-target'); drag = null;
  }, true);
});
