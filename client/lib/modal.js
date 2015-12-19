import Blaze from 'Blaze';
import FlowRouter from 'FlowRouter';
import { EscapeActions } from 'client/lib';

const closedValue = null;

export const Modal = new class {
  constructor() {
    this._currentModal = new ReactiveVar(closedValue);
    this._onCloseGoTo = '';
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

  close() {
    this._currentModal.set(closedValue);
    if (this._onCloseGoTo) {
      FlowRouter.go(this._onCloseGoTo);
    }
  }

  open(modalName, { header = '', onCloseGoTo = ''} = {}) {
    this._currentModal.set({ header, modalName });
    this._onCloseGoTo = onCloseGoTo;
  }
};

Blaze.registerHelper('Modal', Modal);

EscapeActions.register('modalWindow',
  () => Modal.close(),
  () => Modal.isOpen(),
  { noClickEscapeOn: '.modal-content' }
);
