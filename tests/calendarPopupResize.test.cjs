'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
let events;
const context = {
  window: { innerWidth: 1280, innerHeight: 900 },
  Popup: { template: {
    events(map) { events = map; }, onRendered() {}, onDestroyed() {},
  } },
};
const source = fs.readFileSync(path.join(__dirname, '../client/components/main/popup.js'), 'utf8');
vm.runInNewContext(source.replace(/^import .*;\n/gm, ''), context);
const element = {
  dataset: {}, style: { setProperty(key, value) { this[key] = value; } },
  getBoundingClientRect() {
    return { left: 440, top: 12, width: Number.parseFloat(this.style.width) || 400,
      height: Number.parseFloat(this.style.height) || 600 };
  },
};
let captured;
const button = { closest: () => element, setPointerCapture(id) { captured = id; } };
const event = { button: 0, pointerId: 1, clientX: 800, clientY: 600,
  currentTarget: button, preventDefault() {}, stopPropagation() {} };
const tpl = {};
events['pointerdown .js-date-popup-resize'](event, tpl);
assert.equal(captured, 1, 'drag captures the pointer even when released outside');
events['pointermove .js-date-popup-resize']({ ...event, clientX: 840, clientY: 640 }, tpl);
assert.equal(element.style.width, '440px');
assert.equal(element.style.height, '640px');
events['pointermove .js-date-popup-resize']({ ...event, pointerId: 2, clientX: 1000 }, tpl);
assert.equal(element.style.width, '440px', 'another pointer must not resize the popup');
events['keydown .js-date-popup-resize']({ ...event, key: 'ArrowRight' });
events['keydown .js-date-popup-resize']({ ...event, key: 'ArrowDown' });
assert.equal(element.style.width, '460px');
assert.equal(element.style.height, '660px');
context.resizeDatePopup(element, 1, 1);
assert.equal(element.style.width, '320px');
assert.equal(element.style.height, '600px', 'shrinking keeps the initial controls visible');
context.resizeDatePopup(element, 10000, 10000);
assert.equal(element.style.width, '828px');
assert.equal(element.style.height, '876px', 'resizing stays inside the viewport');
context.window.innerWidth = 500;
context.window.innerHeight = 400;
context.resizeDatePopup(element, 10000, 10000);
assert.equal(element.style.width, '48px');
assert.equal(element.style.height, '376px', 'a short viewport still takes priority over the minimum');
events['pointerup .js-date-popup-resize, pointercancel .js-date-popup-resize, lostpointercapture .js-date-popup-resize'](event, tpl);
assert.equal(tpl._dateResize, null);
console.log('calendarPopupResize: captured dragging, keyboard resizing, content minimum and viewport limits passed');
context.window.innerWidth = 1280;
context.window.innerHeight = 900;
element.querySelector = () => ({});
const title = { closest: () => null };
const moveEvent = { ...event, target: title };
events['pointerdown .header'](moveEvent, tpl);
events['pointermove .header']({ ...moveEvent, clientX: 700, clientY: 700 }, tpl);
assert.equal(element.style.left, '340px');
assert.equal(element.style.top, '112px');
events['pointermove .header']({ ...moveEvent, pointerId: 3, clientX: 100 }, tpl);
assert.equal(element.style.left, '340px', 'unrelated pointers cannot move the popup');
events['pointermove .header']({ ...moveEvent, clientX: -10000, clientY: -10000 }, tpl);
assert.equal(element.style.left, '12px');
assert.equal(element.style.top, '12px');
events['pointerup .header, pointercancel .header, lostpointercapture .header'](moveEvent, tpl);
assert.equal(tpl._dateMove, null);
events['pointerdown .header']({ ...moveEvent, target: { closest: () => ({}) } }, tpl);
assert.equal(tpl._dateMove, null, 'header links and buttons do not start dragging');
element.querySelector = () => null;
events['pointerdown .header'](moveEvent, tpl);
assert.equal(tpl._dateMove, null, 'other popups retain their original behavior');
console.log('Date popup title dragging, viewport limits and interactive header exclusions passed');
