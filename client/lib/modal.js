const closedValue = null

window.Modal = new class {
  constructor() {
    this._currentModal = new ReactiveVar(closedValue)
  }

  getTemplateName() {
    return this._currentModal.get()
  }

  isOpen() {
    return this.getTemplateName() !== closedValue
  }

  close() {
    this._currentModal.set(closedValue)
  }

  open(modalName) {
    this._currentModal.set(modalName)
  }
};

Blaze.registerHelper('Modal', Modal)

EscapeActions.register('modalWindow',
  () => Modal.close(),
  () => Modal.isOpen(),
  { noClickEscapeOn: '.modal-content' }
);
