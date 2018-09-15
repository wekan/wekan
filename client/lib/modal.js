const closedValue = null;

window.Modal = new class {
  constructor() {
    this._currentModal = new ReactiveVar(closedValue);
    this._onCloseGoTo = '';
    this._isWideModal = false;
  }

  getHeaderName() {
    const currentModal = this._currentModal.get();
    return currentModal && currentModal.header;
  }

  getTemplateName() {
    const currentModal = this._currentModal.get();
    return currentModal && currentModal.modalName;
  }

  isOpen() {
    return this.getTemplateName() !== closedValue;
  }

  isWide(){
    return this._isWideModal;
  }

  close() {
    this._currentModal.set(closedValue);
    if (this._onCloseGoTo) {
      FlowRouter.go(this._onCloseGoTo);
    }
  }

  openWide(modalName, { header = '', onCloseGoTo = ''} = {}) {
    this._currentModal.set({ header, modalName });
    this._onCloseGoTo = onCloseGoTo;
    this._isWideModal = true;
  }

  open(modalName, { header = '', onCloseGoTo = ''} = {}) {
    this._currentModal.set({ header, modalName });
    this._onCloseGoTo = onCloseGoTo;

  }
}();

Blaze.registerHelper('Modal', Modal);

EscapeActions.register('modalWindow',
  () => Modal.close(),
  () => Modal.isOpen(),
  { noClickEscapeOn: '.modal-container' }
);
