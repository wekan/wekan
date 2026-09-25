import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { TAPi18n } from '/imports/i18n';
import { Utils } from '/client/lib/utils';
const { canDragSelection } = require('/models/lib/boardDragging');
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
  ['item', '.js-checklist-item'], ['checklist', '.minicard-checklist, .js-checklist'],
  ['card', '.js-minicard'], ['list', '.js-list'], ['swimlane', '.js-swimlane-header'],
];
function entityAt(element, dropTarget = false) {
  for (const [kind, selector] of entitySelectors) {
    const node = element?.closest(selector);
    if (!node) continue;
    const data = Blaze.getData(node);
    const doc = kind === 'item' ? data?.item : kind === 'checklist' ? data?.checklist : data;
    if (doc?._id) return { kind, doc, node };
  }
  // Empty lane space has no list/card ancestor. Accept it on drop, while
  // retaining the header-only start target for dragging a selected swimlane.
  if (dropTarget) {
    const node = element?.closest('.js-swimlane');
    const doc = node && Blaze.getData(node);
    if (doc?._id) return { kind: 'swimlane', doc, node };
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
// Render names as text, never clone interactive controls or insert title HTML.
function createDragPreview(selection) {
  const preview = document.createElement('div');
  preview.className = 'structural-drag-preview';
  const count = document.createElement('div');
  count.className = 'structural-drag-count';
  count.textContent = String(selection.length);
  preview.append(count);
  const types = {
    swimlane: ['getSwimlane', 'fa-bars'], list: ['getList', 'fa-list'],
    card: ['getCard', 'fa-sticky-note-o'], checklist: ['getChecklist', 'fa-check-square-o'],
    item: ['getChecklistItem', 'fa-check'],
  };
  for (const entry of selection.slice(0, 8)) {
    const type = types[entry.kind];
    if (!type) continue;
    const doc = ReactiveCache[type[0]](entry.id);
    const row = document.createElement('div');
    row.className = 'structural-drag-name';
    const icon = document.createElement('i');
    icon.className = `fa ${type[1]}`;
    icon.setAttribute('aria-hidden', 'true');
    const name = document.createElement('span');
    name.textContent = doc?.title || entry.id;
    row.append(icon, name);
    preview.append(row);
  }
  if (selection.length > 8) {
    const more = document.createElement('div');
    more.textContent = `+${selection.length - 8}`;
    preview.append(more);
  }
  return preview;
}
Meteor.startup(() => {
  let drag;
  document.addEventListener('mousedown', event => {
    // Disabled nested objects must not fall through to an ancestor sortable.
    if (!event.target.closest('input,textarea,button,select,.materialCheckBox')) {
      const entity = entityAt(event.target);
      const kind = event.target.closest('.js-subtasks') ? 'subtask' : entity?.kind;
      if (kind && !Utils.canDragBoardObject(kind)) {
        event.stopImmediatePropagation(); return;
      }
    }
    if (event.button !== 0 || !MultiSelection.isActive() || !MultiSelection.hasObjects() ||
        event.target.closest('input,textarea,button,select,.materialCheckBox')) return;
    const entity = entityAt(event.target);
    if (!entity || !(entity.kind === 'card' ? MultiSelection.isSelected(entity.doc._id)
      : MultiSelection.isObjectSelected(entity.kind, entity.doc._id))) return;
    event.stopImmediatePropagation(); event.preventDefault();
    if (!canDragSelection(ReactiveCache.getBoard(Session.get('currentBoard')), MultiSelection.mixedSelection())) return;
    drag = { x: event.clientX, y: event.clientY, selection: MultiSelection.mixedSelection() };
  }, true);
  document.addEventListener('mousemove', event => {
    if (!drag) return;
    if (!drag.preview && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
    if (!drag.preview) {
      drag.preview = createDragPreview(drag.selection);
      document.body.append(drag.preview);
    }
    event.preventDefault();
    drag.preview.style.left = `${event.clientX + 12}px`; drag.preview.style.top = `${event.clientY + 12}px`;
    drag.target?.node.classList.remove('structural-drop-target');
    drag.target = entityAt(document.elementFromPoint(event.clientX, event.clientY), true);
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
      await Meteor.callAsync('moveBoardObjects', Session.get('currentBoard'), completed.selection, destination, { drag: true });
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
