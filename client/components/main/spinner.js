import { Spinner } from '/client/lib/spinner';

(class extends Spinner {
}.register('spinner'));

(class extends Spinner {
  getSpinnerTemplateRaw() {
    let ret = super.getSpinnerTemplate() + 'Raw';
    return ret;
  }
}.register('spinnerRaw'));
