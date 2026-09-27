'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
(async () => {
  const source = fs.readFileSync('client/lib/editorSubmit.js', 'utf8');
  const { isSubmitKey } = await import('data:text/javascript;base64,' + Buffer.from(fs.readFileSync('models/lib/editorSubmitKey.js', 'utf8')).toString('base64'));
  const body = source.slice(source.indexOf('export function'), source.indexOf('\nMeteor.startup')).replaceAll('export ', '');
  const submit = vm.runInNewContext(`${body}; submitEditorKey`, { isSubmitKey });
  let clicks = 0, prevented = 0, stopped = 0;
  const button = { tagName: 'BUTTON', type: 'submit', disabled: false, getClientRects: () => [1], click: () => clicks++ };
  const editor = { tagName: 'TEXTAREA', dataset: {}, form: { elements: [button] } };
  function press(extra = {}, enabled = true) {
    return submit({ target: editor, key: 'Enter', preventDefault: () => prevented++, stopPropagation: () => stopped++, ...extra }, enabled);
  }
  assert.equal(press(), true);
  assert.deepEqual([clicks, prevented, stopped], [1, 1, 1]);
  assert.equal(press({ shiftKey: true }), false);
  assert.equal(press({}, false), false);
  assert.equal(press({ ctrlKey: true }, false), true);
  for (const extra of [{ isComposing: true }, { keyCode: 229 }, { defaultPrevented: true }]) assert.equal(press(extra), false);
  for (const property of ['readOnly', 'disabled']) {
    editor[property] = true; assert.equal(press(), false); editor[property] = false;
  }
  for (const tagName of ['INPUT', 'SELECT', 'BUTTON']) {
    editor.tagName = tagName; assert.equal(press(), false);
  }
  editor.tagName = 'TEXTAREA';
  button.disabled = true; assert.equal(press(), false); button.disabled = false;
  editor.form = null; assert.equal(press(), false, 'do not guess an action for an unowned textarea');
  editor.dataset.editorSubmit = '.js-save';
  editor.closest = selector => {
    assert.ok(selector.includes('[data-editor-scope]'));
    return { querySelectorAll: selector => { assert.equal(selector, '.js-save'); return [button]; } };
  };
  assert.equal(press(), true);
  editor.closest = () => null;
  assert.equal(press(), false, 'never search another editor or page for its save button');
  assert.match(fs.readFileSync('client/imports.js', 'utf8'), /import '\/client\/lib\/editorSubmit'/);
  let destroyed = 0;
  const resize = vm.runInNewContext(`${body}; beginEditorResize`, { isSubmitKey, autosize: { destroy(el) { destroyed++; el.style.height = ''; } } });
  const resizable = { tagName: 'TEXTAREA', style: { height: '80px', width: '220px' }, getBoundingClientRect: () => ({ left: 10, right: 230, bottom: 100, height: 80 }) };
  assert.equal(resize({ target: resizable, clientX: 225, clientY: 95 }), true);
  assert.equal(resizable.style.height, '80px');
  assert.equal(resizable.style.width, '220px');
  assert.equal(resize({ target: resizable, clientX: 15, clientY: 95 }), true, 'RTL corner');
  assert.equal(resize({ target: resizable, clientX: 100, clientY: 50 }), false, 'ordinary typing/clicking retains autosize');
  resizable.disabled = true;
  assert.equal(resize({ target: resizable, clientX: 225, clientY: 95 }), false);
  assert.equal(resize({ target: { tagName: 'INPUT' } }), false);
  assert.equal(destroyed, 2);
  console.log('Editor routing: shortcuts, disabled/read-only controls, IME, handled events, scoped actions and non-editor exclusions pass');
})().catch(error => { console.error(error); process.exitCode = 1; });
