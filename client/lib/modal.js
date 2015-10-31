const closedValue = null;

window.Modal = new class {
  constructor() {
    this._currentModal = new ReactiveVar(closedValue);
    this._onCloseGoTo = '';
  }

  getTemplateName() {
    return this._currentModal.get();
  }

  isOpen() {
    return this.getTemplateName() !== closedValue;
  }

  close() {
    this._currentModal.set(closedValue);
    if (this._onCloseGoTo) {
      FlowRouter.go(this._onCloseGoTo);
    }
  }

  open(modalName, { onCloseGoTo = ''} = {}) {
    this._currentModal.set(modalName);
    this._onCloseGoTo = onCloseGoTo;
  }
};

Blaze.registerHelper('Modal', Modal);

EscapeActions.register('modalWindow',
  () => Modal.close(),
  () => Modal.isOpen(),
  { noClickEscapeOn: '.modal-content' }
);
