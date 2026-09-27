import autosize from 'autosize';
import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { isSubmitKey } from '/models/lib/editorSubmitKey';

// The fallback for multiline editors without a template-specific key handler.
// Bubble after textarea autocomplete and Blaze handlers; an already handled key
// must never submit twice. Explicit action selectors cover editors without forms.
export function submitEditorKey(event, submitOnEnter) {
  const editor = event.target;
  if (editor?.tagName !== 'TEXTAREA' || editor.readOnly || editor.disabled ||
      !isSubmitKey(event, { submitOnEnter })) return false;

  let button;
  const selector = editor.dataset.editorSubmit;
  if (selector) {
    const scope = editor.closest('[data-editor-scope], .setting-detail, .pop-over');
    button = Array.from(scope?.querySelectorAll(selector) || []).find(control =>
      !control.disabled && control.getClientRects().length);
  } else if (editor.form) {
    button = Array.from(editor.form.elements).find(control =>
      (control.tagName === 'BUTTON' || control.tagName === 'INPUT') &&
      control.type === 'submit' && !control.disabled && control.getClientRects().length);
  }
  if (!button || button.disabled || !button.getClientRects().length) return false;
  event.preventDefault();
  event.stopPropagation();
  button.click();
  return true;
}

// Once the user takes the resize handle, autosize must not undo that size on
// the next keystroke. Preserve the current geometry before releasing autosize.
export function beginEditorResize(event) {
  const editor = event.target;
  if (editor?.tagName !== 'TEXTAREA' || editor.disabled) return false;
  const rect = editor.getBoundingClientRect();
  const nearBottom = event.clientY >= rect.bottom - 20 && event.clientY <= rect.bottom;
  const nearCorner = (event.clientX >= rect.right - 20 && event.clientX <= rect.right) ||
    (event.clientX <= rect.left + 20 && event.clientX >= rect.left);
  if (!nearBottom || !nearCorner) return false;
  const height = editor.style.height || `${rect.height}px`;
  const width = editor.style.width;
  autosize.destroy(editor);
  editor.style.height = height;
  editor.style.width = width;
  return true;
}

Meteor.startup(() => {
  document.addEventListener('pointerdown', beginEditorResize);
  document.addEventListener('keydown', event => {
    submitEditorKey(event, !!ReactiveCache.getCurrentUser()?.hasSubmitOnEnter?.());
  });
});
