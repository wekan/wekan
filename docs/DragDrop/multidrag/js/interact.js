/**
 * interact.js 1.10.27
 *
 * Copyright (c) 2012-present Taye Adeyemi <dev@taye.me>
 * Released under the MIT License.
 * https://raw.github.com/taye/interact.js/main/LICENSE
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.interact = factory());
})(this, (function () { 'use strict';

  function ownKeys(e, r) {
    var t = Object.keys(e);
    if (Object.getOwnPropertySymbols) {
      var o = Object.getOwnPropertySymbols(e);
      r && (o = o.filter(function (r) {
        return Object.getOwnPropertyDescriptor(e, r).enumerable;
      })), t.push.apply(t, o);
    }
    return t;
  }
  function _objectSpread2(e) {
    for (var r = 1; r < arguments.length; r++) {
      var t = null != arguments[r] ? arguments[r] : {};
      r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
        _defineProperty(e, r, t[r]);
      }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
        Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
      });
    }
    return e;
  }
  function _typeof(o) {
    "@babel/helpers - typeof";

    return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
      return typeof o;
    } : function (o) {
      return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
    }, _typeof(o);
  }
  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }
  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _defineProperty(obj, key, value) {
    key = _toPropertyKey(key);
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }
    return obj;
  }
  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }
    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    Object.defineProperty(subClass, "prototype", {
      writable: false
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }
  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }
  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;
    try {
      Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }
  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }
    return self;
  }
  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    } else if (call !== void 0) {
      throw new TypeError("Derived constructors may only return object or undefined");
    }
    return _assertThisInitialized(self);
  }
  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();
    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
        result;
      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;
        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }
      return _possibleConstructorReturn(this, result);
    };
  }
  function _superPropBase(object, property) {
    while (!Object.prototype.hasOwnProperty.call(object, property)) {
      object = _getPrototypeOf(object);
      if (object === null) break;
    }
    return object;
  }
  function _get() {
    if (typeof Reflect !== "undefined" && Reflect.get) {
      _get = Reflect.get.bind();
    } else {
      _get = function _get(target, property, receiver) {
        var base = _superPropBase(target, property);
        if (!base) return;
        var desc = Object.getOwnPropertyDescriptor(base, property);
        if (desc.get) {
          return desc.get.call(arguments.length < 3 ? target : receiver);
        }
        return desc.value;
      };
    }
    return _get.apply(this, arguments);
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  var isWindow = (function (thing) {
    return !!(thing && thing.Window) && thing instanceof thing.Window;
  });

  var realWindow = undefined;
  var win = undefined;
  function init$3(window) {
    // get wrapped window if using Shadow DOM polyfill

    realWindow = window;

    // create a TextNode
    var el = window.document.createTextNode('');

    // check if it's wrapped by a polyfill
    if (el.ownerDocument !== window.document && typeof window.wrap === 'function' && window.wrap(el) === el) {
      // use wrapped window
      window = window.wrap(window);
    }
    win = window;
  }
  if (typeof window !== 'undefined' && !!window) {
    init$3(window);
  }
  function getWindow(node) {
    if (isWindow(node)) {
      return node;
    }
    var rootNode = node.ownerDocument || node;
    return rootNode.defaultView || win.window;
  }

  var window$1 = function window(thing) {
    return thing === win || isWindow(thing);
  };
  var docFrag = function docFrag(thing) {
    return object(thing) && thing.nodeType === 11;
  };
  var object = function object(thing) {
    return !!thing && _typeof(thing) === 'object';
  };
  var func = function func(thing) {
    return typeof thing === 'function';
  };
  var number = function number(thing) {
    return typeof thing === 'number';
  };
  var bool = function bool(thing) {
    return typeof thing === 'boolean';
  };
  var string = function string(thing) {
    return typeof thing === 'string';
  };
  var element = function element(thing) {
    if (!thing || _typeof(thing) !== 'object') {
      return false;
    }
    var _window = getWindow(thing) || win;
    return /object|function/.test(typeof Element === "undefined" ? "undefined" : _typeof(Element)) ? thing instanceof Element || thing instanceof _window.Element : thing.nodeType === 1 && typeof thing.nodeName === 'string';
  };
  var plainObject = function plainObject(thing) {
    return object(thing) && !!thing.constructor && /function Object\b/.test(thing.constructor.toString());
  };
  var array = function array(thing) {
    return object(thing) && typeof thing.length !== 'undefined' && func(thing.splice);
  };
  var is = {
    window: window$1,
    docFrag: docFrag,
    object: object,
    func: func,
    number: number,
    bool: bool,
    string: string,
    element: element,
    plainObject: plainObject,
    array: array
  };

  function install$g(scope) {
    var actions = scope.actions,
      Interactable = scope.Interactable,
      defaults = scope.defaults;
    Interactable.prototype.draggable = drag.draggable;
    actions.map.drag = drag;
    actions.methodDict.drag = 'draggable';
    defaults.actions.drag = drag.defaults;
  }
  function beforeMove(_ref) {
    var interaction = _ref.interaction;
    if (interaction.prepared.name !== 'drag') return;
    var axis = interaction.prepared.axis;
    if (axis === 'x') {
      interaction.coords.cur.page.y = interaction.coords.start.page.y;
      interaction.coords.cur.client.y = interaction.coords.start.client.y;
      interaction.coords.velocity.client.y = 0;
      interaction.coords.velocity.page.y = 0;
    } else if (axis === 'y') {
      interaction.coords.cur.page.x = interaction.coords.start.page.x;
      interaction.coords.cur.client.x = interaction.coords.start.client.x;
      interaction.coords.velocity.client.x = 0;
      interaction.coords.velocity.page.x = 0;
    }
  }
  function move$1(_ref2) {
    var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;
    if (interaction.prepared.name !== 'drag') return;
    var axis = interaction.prepared.axis;
    if (axis === 'x' || axis === 'y') {
      var opposite = axis === 'x' ? 'y' : 'x';
      iEvent.page[opposite] = interaction.coords.start.page[opposite];
      iEvent.client[opposite] = interaction.coords.start.client[opposite];
      iEvent.delta[opposite] = 0;
    }
  }
  var draggable = function draggable(options) {
    if (is.object(options)) {
      this.options.drag.enabled = options.enabled !== false;
      this.setPerAction('drag', options);
      this.setOnEvents('drag', options);
      if (/^(xy|x|y|start)$/.test(options.lockAxis)) {
        this.options.drag.lockAxis = options.lockAxis;
      }
      if (/^(xy|x|y)$/.test(options.startAxis)) {
        this.options.drag.startAxis = options.startAxis;
      }
      return this;
    }
    if (is.bool(options)) {
      this.options.drag.enabled = options;
      return this;
    }
    return this.options.drag;
  };
  var drag = {
    id: 'actions/drag',
    install: install$g,
    listeners: {
      'interactions:before-action-move': beforeMove,
      'interactions:action-resume': beforeMove,
      // dragmove
      'interactions:action-move': move$1,
      'auto-start:check': function autoStartCheck(arg) {
        var interaction = arg.interaction,
          interactable = arg.interactable,
          buttons = arg.buttons;
        var dragOptions = interactable.options.drag;
        if (!(dragOptions && dragOptions.enabled) ||
        // check mouseButton setting if the pointer is down
        interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & interactable.options.drag.mouseButtons) === 0) {
          return undefined;
        }
        arg.action = {
          name: 'drag',
          axis: dragOptions.lockAxis === 'start' ? dragOptions.startAxis : dragOptions.lockAxis
        };
        return false;
      }
    },
    draggable: draggable,
    beforeMove: beforeMove,
    move: move$1,
    defaults: {
      startAxis: 'xy',
      lockAxis: 'xy'
    },
    getCursor: function getCursor() {
      return 'move';
    },
    filterEventType: function filterEventType(type) {
      return type.search('drag') === 0;
    }
  };
  var drag$1 = drag;

  var domObjects = {
    init: init$2,
    document: null,
    DocumentFragment: null,
    SVGElement: null,
    SVGSVGElement: null,
    SVGElementInstance: null,
    Element: null,
    HTMLElement: null,
    Event: null,
    Touch: null,
    PointerEvent: null
  };
  function blank() {}
  var domObjects$1 = domObjects;
  function init$2(window) {
    var win = window;
    domObjects.document = win.document;
    domObjects.DocumentFragment = win.DocumentFragment || blank;
    domObjects.SVGElement = win.SVGElement || blank;
    domObjects.SVGSVGElement = win.SVGSVGElement || blank;
    domObjects.SVGElementInstance = win.SVGElementInstance || blank;
    domObjects.Element = win.Element || blank;
    domObjects.HTMLElement = win.HTMLElement || domObjects.Element;
    domObjects.Event = win.Event;
    domObjects.Touch = win.Touch || blank;
    domObjects.PointerEvent = win.PointerEvent || win.MSPointerEvent;
  }

  var browser = {
    init: init$1,
    supportsTouch: null,
    supportsPointerEvent: null,
    isIOS7: null,
    isIOS: null,
    isIe9: null,
    isOperaMobile: null,
    prefixedMatchesSelector: null,
    pEventTypes: null,
    wheelEvent: null
  };
  function init$1(window) {
    var Element = domObjects$1.Element;
    var navigator = window.navigator || {};

    // Does the browser support touch input?
    browser.supportsTouch = 'ontouchstart' in window || is.func(window.DocumentTouch) && domObjects$1.document instanceof window.DocumentTouch;

    // Does the browser support PointerEvents
    // https://github.com/taye/interact.js/issues/703#issuecomment-471570492
    browser.supportsPointerEvent = navigator.pointerEnabled !== false && !!domObjects$1.PointerEvent;
    browser.isIOS = /iP(hone|od|ad)/.test(navigator.platform);

    // scrolling doesn't change the result of getClientRects on iOS 7
    browser.isIOS7 = /iP(hone|od|ad)/.test(navigator.platform) && /OS 7[^\d]/.test(navigator.appVersion);
    browser.isIe9 = /MSIE 9/.test(navigator.userAgent);

    // Opera Mobile must be handled differently
    browser.isOperaMobile = navigator.appName === 'Opera' && browser.supportsTouch && /Presto/.test(navigator.userAgent);

    // prefix matchesSelector
    browser.prefixedMatchesSelector = 'matches' in Element.prototype ? 'matches' : 'webkitMatchesSelector' in Element.prototype ? 'webkitMatchesSelector' : 'mozMatchesSelector' in Element.prototype ? 'mozMatchesSelector' : 'oMatchesSelector' in Element.prototype ? 'oMatchesSelector' : 'msMatchesSelector';
    browser.pEventTypes = browser.supportsPointerEvent ? domObjects$1.PointerEvent === window.MSPointerEvent ? {
      up: 'MSPointerUp',
      down: 'MSPointerDown',
      over: 'mouseover',
      out: 'mouseout',
      move: 'MSPointerMove',
      cancel: 'MSPointerCancel'
    } : {
      up: 'pointerup',
      down: 'pointerdown',
      over: 'pointerover',
      out: 'pointerout',
      move: 'pointermove',
      cancel: 'pointercancel'
    } : null;

    // because Webkit and Opera still use 'mousewheel' event type
    browser.wheelEvent = domObjects$1.document && 'onmousewheel' in domObjects$1.document ? 'mousewheel' : 'wheel';
  }
  var browser$1 = browser;

  function nodeContains(parent, child) {
    if (parent.contains) {
      return parent.contains(child);
    }
    while (child) {
      if (child === parent) {
        return true;
      }
      child = child.parentNode;
    }
    return false;
  }
  function closest(element, selector) {
    while (is.element(element)) {
      if (matchesSelector(element, selector)) {
        return element;
      }
      element = parentNode(element);
    }
    return null;
  }
  function parentNode(node) {
    var parent = node.parentNode;
    if (is.docFrag(parent)) {
      // skip past #shado-root fragments
      // tslint:disable-next-line
      while ((parent = parent.host) && is.docFrag(parent)) {
        continue;
      }
      return parent;
    }
    return parent;
  }
  function matchesSelector(element, selector) {
    // remove /deep/ from selectors if shadowDOM polyfill is used
    if (win !== realWindow) {
      selector = selector.replace(/\/deep\//g, ' ');
    }
    return element[browser$1.prefixedMatchesSelector](selector);
  }
  var getParent = function getParent(el) {
    return el.parentNode || el.host;
  };

  // Test for the element that's "above" all other qualifiers
  function indexOfDeepestElement(elements) {
    var deepestNodeParents = [];
    var deepestNodeIndex;
    for (var i = 0; i < elements.length; i++) {
      var currentNode = elements[i];
      var deepestNode = elements[deepestNodeIndex];

      // node may appear in elements array multiple times
      if (!currentNode || i === deepestNodeIndex) {
        continue;
      }
      if (!deepestNode) {
        deepestNodeIndex = i;
        continue;
      }
      var currentNodeParent = getParent(currentNode);
      var deepestNodeParent = getParent(deepestNode);

      // check if the deepest or current are document.documentElement/rootElement
      // - if the current node is, do nothing and continue
      if (currentNodeParent === currentNode.ownerDocument) {
        continue;
      }
      // - if deepest is, update with the current node and continue to next
      else if (deepestNodeParent === currentNode.ownerDocument) {
        deepestNodeIndex = i;
        continue;
      }

      // compare zIndex of siblings
      if (currentNodeParent === deepestNodeParent) {
        if (zIndexIsHigherThan(currentNode, deepestNode)) {
          deepestNodeIndex = i;
        }
        continue;
      }

      // populate the ancestry array for the latest deepest node
      deepestNodeParents = deepestNodeParents.length ? deepestNodeParents : getNodeParents(deepestNode);
      var ancestryStart = void 0;

      // if the deepest node is an HTMLElement and the current node is a non root svg element
      if (deepestNode instanceof domObjects$1.HTMLElement && currentNode instanceof domObjects$1.SVGElement && !(currentNode instanceof domObjects$1.SVGSVGElement)) {
        // TODO: is this check necessary? Was this for HTML elements embedded in SVG?
        if (currentNode === deepestNodeParent) {
          continue;
        }
        ancestryStart = currentNode.ownerSVGElement;
      } else {
        ancestryStart = currentNode;
      }
      var currentNodeParents = getNodeParents(ancestryStart, deepestNode.ownerDocument);
      var commonIndex = 0;

      // get (position of closest common ancestor) + 1
      while (currentNodeParents[commonIndex] && currentNodeParents[commonIndex] === deepestNodeParents[commonIndex]) {
        commonIndex++;
      }
      var parents = [currentNodeParents[commonIndex - 1], currentNodeParents[commonIndex], deepestNodeParents[commonIndex]];
      if (parents[0]) {
        var child = parents[0].lastChild;
        while (child) {
          if (child === parents[1]) {
            deepestNodeIndex = i;
            deepestNodeParents = currentNodeParents;
            break;
          } else if (child === parents[2]) {
            break;
          }
          child = child.previousSibling;
        }
      }
    }
    return deepestNodeIndex;
  }
  function getNodeParents(node, limit) {
    var parents = [];
    var parent = node;
    var parentParent;
    while ((parentParent = getParent(parent)) && parent !== limit && parentParent !== parent.ownerDocument) {
      parents.unshift(parent);
      parent = parentParent;
    }
    return parents;
  }
  function zIndexIsHigherThan(higherNode, lowerNode) {
    var higherIndex = parseInt(getWindow(higherNode).getComputedStyle(higherNode).zIndex, 10) || 0;
    var lowerIndex = parseInt(getWindow(lowerNode).getComputedStyle(lowerNode).zIndex, 10) || 0;
    return higherIndex >= lowerIndex;
  }
  function matchesUpTo(element, selector, limit) {
    while (is.element(element)) {
      if (matchesSelector(element, selector)) {
        return true;
      }
      element = parentNode(element);
      if (element === limit) {
        return matchesSelector(element, selector);
      }
    }
    return false;
  }
  function getActualElement(element) {
    return element.correspondingUseElement || element;
  }
  function getScrollXY(relevantWindow) {
    relevantWindow = relevantWindow || win;
    return {
      x: relevantWindow.scrollX || relevantWindow.document.documentElement.scrollLeft,
      y: relevantWindow.scrollY || relevantWindow.document.documentElement.scrollTop
    };
  }
  function getElementClientRect(element) {
    var clientRect = element instanceof domObjects$1.SVGElement ? element.getBoundingClientRect() : element.getClientRects()[0];
    return clientRect && {
      left: clientRect.left,
      right: clientRect.right,
      top: clientRect.top,
      bottom: clientRect.bottom,
      width: clientRect.width || clientRect.right - clientRect.left,
      height: clientRect.height || clientRect.bottom - clientRect.top
    };
  }
  function getElementRect(element) {
    var clientRect = getElementClientRect(element);
    if (!browser$1.isIOS7 && clientRect) {
      var scroll = getScrollXY(getWindow(element));
      clientRect.left += scroll.x;
      clientRect.right += scroll.x;
      clientRect.top += scroll.y;
      clientRect.bottom += scroll.y;
    }
    return clientRect;
  }
  function getPath(node) {
    var path = [];
    while (node) {
      path.push(node);
      node = parentNode(node);
    }
    return path;
  }
  function trySelector(value) {
    if (!is.string(value)) {
      return false;
    }

    // an exception will be raised if it is invalid
    domObjects$1.document.querySelector(value);
    return true;
  }

  function extend(dest, source) {
    for (var prop in source) {
      dest[prop] = source[prop];
    }
    var ret = dest;
    return ret;
  }

  function getStringOptionResult(value, target, element) {
    if (value === 'parent') {
      return parentNode(element);
    }
    if (value === 'self') {
      return target.getRect(element);
    }
    return closest(element, value);
  }
  function resolveRectLike(value, target, element, functionArgs) {
    var returnValue = value;
    if (is.string(returnValue)) {
      returnValue = getStringOptionResult(returnValue, target, element);
    } else if (is.func(returnValue)) {
      returnValue = returnValue.apply(void 0, functionArgs);
    }
    if (is.element(returnValue)) {
      returnValue = getElementRect(returnValue);
    }
    return returnValue;
  }
  function rectToXY(rect) {
    return rect && {
      x: 'x' in rect ? rect.x : rect.left,
      y: 'y' in rect ? rect.y : rect.top
    };
  }
  function xywhToTlbr(rect) {
    if (rect && !('left' in rect && 'top' in rect)) {
      rect = extend({}, rect);
      rect.left = rect.x || 0;
      rect.top = rect.y || 0;
      rect.right = rect.right || rect.left + rect.width;
      rect.bottom = rect.bottom || rect.top + rect.height;
    }
    return rect;
  }
  function tlbrToXywh(rect) {
    if (rect && !('x' in rect && 'y' in rect)) {
      rect = extend({}, rect);
      rect.x = rect.left || 0;
      rect.y = rect.top || 0;
      rect.width = rect.width || (rect.right || 0) - rect.x;
      rect.height = rect.height || (rect.bottom || 0) - rect.y;
    }
    return rect;
  }
  function addEdges(edges, rect, delta) {
    if (edges.left) {
      rect.left += delta.x;
    }
    if (edges.right) {
      rect.right += delta.x;
    }
    if (edges.top) {
      rect.top += delta.y;
    }
    if (edges.bottom) {
      rect.bottom += delta.y;
    }
    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;
  }

  function getOriginXY(target, element, actionName) {
    var actionOptions = actionName && target.options[actionName];
    var actionOrigin = actionOptions && actionOptions.origin;
    var origin = actionOrigin || target.options.origin;
    var originRect = resolveRectLike(origin, target, element, [target && element]);
    return rectToXY(originRect) || {
      x: 0,
      y: 0
    };
  }

  function normalize(type, listeners) {
    var filter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function (_typeOrPrefix) {
      return true;
    };
    var result = arguments.length > 3 ? arguments[3] : undefined;
    result = result || {};
    if (is.string(type) && type.search(' ') !== -1) {
      type = split(type);
    }
    if (is.array(type)) {
      type.forEach(function (t) {
        return normalize(t, listeners, filter, result);
      });
      return result;
    }

    // before:  type = [{ drag: () => {} }], listeners = undefined
    // after:   type = ''                  , listeners = [{ drag: () => {} }]
    if (is.object(type)) {
      listeners = type;
      type = '';
    }
    if (is.func(listeners) && filter(type)) {
      result[type] = result[type] || [];
      result[type].push(listeners);
    } else if (is.array(listeners)) {
      for (var _i2 = 0, _listeners2 = listeners; _i2 < _listeners2.length; _i2++) {
        var l = _listeners2[_i2];
        normalize(type, l, filter, result);
      }
    } else if (is.object(listeners)) {
      for (var prefix in listeners) {
        var combinedTypes = split(prefix).map(function (p) {
          return "".concat(type).concat(p);
        });
        normalize(combinedTypes, listeners[prefix], filter, result);
      }
    }
    return result;
  }
  function split(type) {
    return type.trim().split(/ +/);
  }

  var hypot = (function (x, y) {
    return Math.sqrt(x * x + y * y);
  });

  var VENDOR_PREFIXES = ['webkit', 'moz'];
  function pointerExtend(dest, source) {
    dest.__set || (dest.__set = {});
    var _loop = function _loop(prop) {
      // skip deprecated prefixed properties
      if (VENDOR_PREFIXES.some(function (prefix) {
        return prop.indexOf(prefix) === 0;
      })) return 1; // continue
      if (typeof dest[prop] !== 'function' && prop !== '__set') {
        Object.defineProperty(dest, prop, {
          get: function get() {
            if (prop in dest.__set) return dest.__set[prop];
            return dest.__set[prop] = source[prop];
          },
          set: function set(value) {
            dest.__set[prop] = value;
          },
          configurable: true
        });
      }
    };
    for (var prop in source) {
      if (_loop(prop)) continue;
    }
    return dest;
  }

  function copyCoords(dest, src) {
    dest.page = dest.page || {};
    dest.page.x = src.page.x;
    dest.page.y = src.page.y;
    dest.client = dest.client || {};
    dest.client.x = src.client.x;
    dest.client.y = src.client.y;
    dest.timeStamp = src.timeStamp;
  }
  function setCoordDeltas(targetObj, prev, cur) {
    targetObj.page.x = cur.page.x - prev.page.x;
    targetObj.page.y = cur.page.y - prev.page.y;
    targetObj.client.x = cur.client.x - prev.client.x;
    targetObj.client.y = cur.client.y - prev.client.y;
    targetObj.timeStamp = cur.timeStamp - prev.timeStamp;
  }
  function setCoordVelocity(targetObj, delta) {
    var dt = Math.max(delta.timeStamp / 1000, 0.001);
    targetObj.page.x = delta.page.x / dt;
    targetObj.page.y = delta.page.y / dt;
    targetObj.client.x = delta.client.x / dt;
    targetObj.client.y = delta.client.y / dt;
    targetObj.timeStamp = dt;
  }
  function setZeroCoords(targetObj) {
    targetObj.page.x = 0;
    targetObj.page.y = 0;
    targetObj.client.x = 0;
    targetObj.client.y = 0;
  }
  function isNativePointer(pointer) {
    return pointer instanceof domObjects$1.Event || pointer instanceof domObjects$1.Touch;
  }

  // Get specified X/Y coords for mouse or event.touches[0]
  function getXY(type, pointer, xy) {
    xy = xy || {};
    type = type || 'page';
    xy.x = pointer[type + 'X'];
    xy.y = pointer[type + 'Y'];
    return xy;
  }
  function getPageXY(pointer, page) {
    page = page || {
      x: 0,
      y: 0
    };

    // Opera Mobile handles the viewport and scrolling oddly
    if (browser$1.isOperaMobile && isNativePointer(pointer)) {
      getXY('screen', pointer, page);
      page.x += window.scrollX;
      page.y += window.scrollY;
    } else {
      getXY('page', pointer, page);
    }
    return page;
  }
  function getClientXY(pointer, client) {
    client = client || {};
    if (browser$1.isOperaMobile && isNativePointer(pointer)) {
      // Opera Mobile handles the viewport and scrolling oddly
      getXY('screen', pointer, client);
    } else {
      getXY('client', pointer, client);
    }
    return client;
  }
  function getPointerId(pointer) {
    return is.number(pointer.pointerId) ? pointer.pointerId : pointer.identifier;
  }
  function setCoords(dest, pointers, timeStamp) {
    var pointer = pointers.length > 1 ? pointerAverage(pointers) : pointers[0];
    getPageXY(pointer, dest.page);
    getClientXY(pointer, dest.client);
    dest.timeStamp = timeStamp;
  }
  function getTouchPair(event) {
    var touches = [];

    // array of touches is supplied
    if (is.array(event)) {
      touches[0] = event[0];
      touches[1] = event[1];
    }
    // an event
    else {
      if (event.type === 'touchend') {
        if (event.touches.length === 1) {
          touches[0] = event.touches[0];
          touches[1] = event.changedTouches[0];
        } else if (event.touches.length === 0) {
          touches[0] = event.changedTouches[0];
          touches[1] = event.changedTouches[1];
        }
      } else {
        touches[0] = event.touches[0];
        touches[1] = event.touches[1];
      }
    }
    return touches;
  }
  function pointerAverage(pointers) {
    var average = {
      pageX: 0,
      pageY: 0,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0
    };
    for (var _i2 = 0; _i2 < pointers.length; _i2++) {
      var pointer = pointers[_i2];
      for (var prop in average) {
        average[prop] += pointer[prop];
      }
    }
    for (var _prop in average) {
      average[_prop] /= pointers.length;
    }
    return average;
  }
  function touchBBox(event) {
    if (!event.length) {
      return null;
    }
    var touches = getTouchPair(event);
    var minX = Math.min(touches[0].pageX, touches[1].pageX);
    var minY = Math.min(touches[0].pageY, touches[1].pageY);
    var maxX = Math.max(touches[0].pageX, touches[1].pageX);
    var maxY = Math.max(touches[0].pageY, touches[1].pageY);
    return {
      x: minX,
      y: minY,
      left: minX,
      top: minY,
      right: maxX,
      bottom: maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  function touchDistance(event, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = getTouchPair(event);
    var dx = touches[0][sourceX] - touches[1][sourceX];
    var dy = touches[0][sourceY] - touches[1][sourceY];
    return hypot(dx, dy);
  }
  function touchAngle(event, deltaSource) {
    var sourceX = deltaSource + 'X';
    var sourceY = deltaSource + 'Y';
    var touches = getTouchPair(event);
    var dx = touches[1][sourceX] - touches[0][sourceX];
    var dy = touches[1][sourceY] - touches[0][sourceY];
    var angle = 180 * Math.atan2(dy, dx) / Math.PI;
    return angle;
  }
  function getPointerType(pointer) {
    return is.string(pointer.pointerType) ? pointer.pointerType : is.number(pointer.pointerType) ? [undefined, undefined, 'touch', 'pen', 'mouse'][pointer.pointerType] :
    // if the PointerEvent API isn't available, then the "pointer" must
    // be either a MouseEvent, TouchEvent, or Touch object
    /touch/.test(pointer.type || '') || pointer instanceof domObjects$1.Touch ? 'touch' : 'mouse';
  }

  // [ event.target, event.currentTarget ]
  function getEventTargets(event) {
    var path = is.func(event.composedPath) ? event.composedPath() : event.path;
    return [getActualElement(path ? path[0] : event.target), getActualElement(event.currentTarget)];
  }
  function newCoords() {
    return {
      page: {
        x: 0,
        y: 0
      },
      client: {
        x: 0,
        y: 0
      },
      timeStamp: 0
    };
  }
  function coordsToEvent(coords) {
    var event = {
      coords: coords,
      get page() {
        return this.coords.page;
      },
      get client() {
        return this.coords.client;
      },
      get timeStamp() {
        return this.coords.timeStamp;
      },
      get pageX() {
        return this.coords.page.x;
      },
      get pageY() {
        return this.coords.page.y;
      },
      get clientX() {
        return this.coords.client.x;
      },
      get clientY() {
        return this.coords.client.y;
      },
      get pointerId() {
        return this.coords.pointerId;
      },
      get target() {
        return this.coords.target;
      },
      get type() {
        return this.coords.type;
      },
      get pointerType() {
        return this.coords.pointerType;
      },
      get buttons() {
        return this.coords.buttons;
      },
      preventDefault: function preventDefault() {}
    };
    return event;
  }

  var BaseEvent = /*#__PURE__*/function () {
    function BaseEvent(interaction) {
      _classCallCheck(this, BaseEvent);
      /** @internal */
      this.immediatePropagationStopped = false;
      this.propagationStopped = false;
      this._interaction = interaction;
    }
    _createClass(BaseEvent, [{
      key: "preventDefault",
      value: function preventDefault() {}

      /**
       * Don't call any other listeners (even on the current target)
       */
    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.propagationStopped = true;
      }

      /**
       * Don't call listeners on the remaining targets
       */
    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
      }
    }]);
    return BaseEvent;
  }();

  // defined outside of class definition to avoid assignment of undefined during
  // construction

  // getters and setters defined here to support typescript 3.6 and below which
  // don't support getter and setters in .d.ts files
  Object.defineProperty(BaseEvent.prototype, 'interaction', {
    get: function get() {
      return this._interaction._proxy;
    },
    set: function set() {}
  });

  var remove = function remove(array, target) {
    return array.splice(array.indexOf(target), 1);
  };
  var merge = function merge(target, source) {
    for (var _i2 = 0; _i2 < source.length; _i2++) {
      var item = source[_i2];
      target.push(item);
    }
    return target;
  };
  var from = function from(source) {
    return merge([], source);
  };
  var findIndex = function findIndex(array, func) {
    for (var i = 0; i < array.length; i++) {
      if (func(array[i], i, array)) {
        return i;
      }
    }
    return -1;
  };
  var find = function find(array, func) {
    return array[findIndex(array, func)];
  };

  var DropEvent = /*#__PURE__*/function (_BaseEvent) {
    _inherits(DropEvent, _BaseEvent);
    var _super = _createSuper(DropEvent);
    /**
     * Class of events fired on dropzones during drags with acceptable targets.
     */
    function DropEvent(dropState, dragEvent, type) {
      var _this;
      _classCallCheck(this, DropEvent);
      _this = _super.call(this, dragEvent._interaction);
      _this.dropzone = void 0;
      _this.dragEvent = void 0;
      _this.relatedTarget = void 0;
      _this.draggable = void 0;
      _this.propagationStopped = false;
      _this.immediatePropagationStopped = false;
      var _ref = type === 'dragleave' ? dropState.prev : dropState.cur,
        element = _ref.element,
        dropzone = _ref.dropzone;
      _this.type = type;
      _this.target = element;
      _this.currentTarget = element;
      _this.dropzone = dropzone;
      _this.dragEvent = dragEvent;
      _this.relatedTarget = dragEvent.target;
      _this.draggable = dragEvent.interactable;
      _this.timeStamp = dragEvent.timeStamp;
      return _this;
    }

    /**
     * If this is a `dropactivate` event, the dropzone element will be
     * deactivated.
     *
     * If this is a `dragmove` or `dragenter`, a `dragleave` will be fired on the
     * dropzone element and more.
     */
    _createClass(DropEvent, [{
      key: "reject",
      value: function reject() {
        var _this2 = this;
        var dropState = this._interaction.dropState;
        if (this.type !== 'dropactivate' && (!this.dropzone || dropState.cur.dropzone !== this.dropzone || dropState.cur.element !== this.target)) {
          return;
        }
        dropState.prev.dropzone = this.dropzone;
        dropState.prev.element = this.target;
        dropState.rejected = true;
        dropState.events.enter = null;
        this.stopImmediatePropagation();
        if (this.type === 'dropactivate') {
          var activeDrops = dropState.activeDrops;
          var index = findIndex(activeDrops, function (_ref2) {
            var dropzone = _ref2.dropzone,
              element = _ref2.element;
            return dropzone === _this2.dropzone && element === _this2.target;
          });
          dropState.activeDrops.splice(index, 1);
          var deactivateEvent = new DropEvent(dropState, this.dragEvent, 'dropdeactivate');
          deactivateEvent.dropzone = this.dropzone;
          deactivateEvent.target = this.target;
          this.dropzone.fire(deactivateEvent);
        } else {
          this.dropzone.fire(new DropEvent(dropState, this.dragEvent, 'dragleave'));
        }
      }
    }, {
      key: "preventDefault",
      value: function preventDefault() {}
    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.propagationStopped = true;
      }
    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
      }
    }]);
    return DropEvent;
  }(BaseEvent);

  function install$f(scope) {
    var actions = scope.actions,
      interact = scope.interactStatic,
      Interactable = scope.Interactable,
      defaults = scope.defaults;
    scope.usePlugin(drag$1);
    Interactable.prototype.dropzone = function (options) {
      return dropzoneMethod(this, options);
    };
    Interactable.prototype.dropCheck = function (dragEvent, event, draggable, draggableElement, dropElement, rect) {
      return dropCheckMethod(this, dragEvent, event, draggable, draggableElement, dropElement, rect);
    };
    interact.dynamicDrop = function (newValue) {
      if (is.bool(newValue)) {
        // if (dragging && scope.dynamicDrop !== newValue && !newValue) {
        //  calcRects(dropzones)
        // }

        scope.dynamicDrop = newValue;
        return interact;
      }
      return scope.dynamicDrop;
    };
    extend(actions.phaselessTypes, {
      dragenter: true,
      dragleave: true,
      dropactivate: true,
      dropdeactivate: true,
      dropmove: true,
      drop: true
    });
    actions.methodDict.drop = 'dropzone';
    scope.dynamicDrop = false;
    defaults.actions.drop = drop.defaults;
  }
  function collectDropzones(_ref, draggableElement) {
    var interactables = _ref.interactables;
    var drops = [];

    // collect all dropzones and their elements which qualify for a drop
    for (var _i2 = 0, _interactables$list2 = interactables.list; _i2 < _interactables$list2.length; _i2++) {
      var _dropzone = _interactables$list2[_i2];
      if (!_dropzone.options.drop.enabled) {
        continue;
      }
      var accept = _dropzone.options.drop.accept;

      // test the draggable draggableElement against the dropzone's accept setting
      if (is.element(accept) && accept !== draggableElement || is.string(accept) && !matchesSelector(draggableElement, accept) || is.func(accept) && !accept({
        dropzone: _dropzone,
        draggableElement: draggableElement
      })) {
        continue;
      }
      for (var _i4 = 0, _dropzone$getAllEleme2 = _dropzone.getAllElements(); _i4 < _dropzone$getAllEleme2.length; _i4++) {
        var dropzoneElement = _dropzone$getAllEleme2[_i4];
        if (dropzoneElement !== draggableElement) {
          drops.push({
            dropzone: _dropzone,
            element: dropzoneElement,
            rect: _dropzone.getRect(dropzoneElement)
          });
        }
      }
    }
    return drops;
  }
  function fireActivationEvents(activeDrops, event) {
    // loop through all active dropzones and trigger event
    for (var _i6 = 0, _activeDrops$slice2 = activeDrops.slice(); _i6 < _activeDrops$slice2.length; _i6++) {
      var _activeDrops$slice2$_ = _activeDrops$slice2[_i6],
        _dropzone2 = _activeDrops$slice2$_.dropzone,
        element = _activeDrops$slice2$_.element;
      event.dropzone = _dropzone2;

      // set current element as event target
      event.target = element;
      _dropzone2.fire(event);
      event.propagationStopped = event.immediatePropagationStopped = false;
    }
  }

  // return a new array of possible drops. getActiveDrops should always be
  // called when a drag has just started or a drag event happens while
  // dynamicDrop is true
  function getActiveDrops(scope, dragElement) {
    // get dropzones and their elements that could receive the draggable
    var activeDrops = collectDropzones(scope, dragElement);
    for (var _i8 = 0; _i8 < activeDrops.length; _i8++) {
      var activeDrop = activeDrops[_i8];
      activeDrop.rect = activeDrop.dropzone.getRect(activeDrop.element);
    }
    return activeDrops;
  }
  function getDrop(_ref2, dragEvent, pointerEvent) {
    var dropState = _ref2.dropState,
      draggable = _ref2.interactable,
      dragElement = _ref2.element;
    var validDrops = [];

    // collect all dropzones and their elements which qualify for a drop
    for (var _i10 = 0, _dropState$activeDrop2 = dropState.activeDrops; _i10 < _dropState$activeDrop2.length; _i10++) {
      var _dropState$activeDrop3 = _dropState$activeDrop2[_i10],
        _dropzone3 = _dropState$activeDrop3.dropzone,
        dropzoneElement = _dropState$activeDrop3.element,
        _rect = _dropState$activeDrop3.rect;
      var isValid = _dropzone3.dropCheck(dragEvent, pointerEvent, draggable, dragElement, dropzoneElement, _rect);
      validDrops.push(isValid ? dropzoneElement : null);
    } // get the most appropriate dropzone based on DOM depth and order
    var dropIndex = indexOfDeepestElement(validDrops);
    return dropState.activeDrops[dropIndex] || null;
  }
  function getDropEvents(interaction, _pointerEvent, dragEvent) {
    var dropState = interaction.dropState;
    var dropEvents = {
      enter: null,
      leave: null,
      activate: null,
      deactivate: null,
      move: null,
      drop: null
    };
    if (dragEvent.type === 'dragstart') {
      dropEvents.activate = new DropEvent(dropState, dragEvent, 'dropactivate');
      dropEvents.activate.target = null;
      dropEvents.activate.dropzone = null;
    }
    if (dragEvent.type === 'dragend') {
      dropEvents.deactivate = new DropEvent(dropState, dragEvent, 'dropdeactivate');
      dropEvents.deactivate.target = null;
      dropEvents.deactivate.dropzone = null;
    }
    if (dropState.rejected) {
      return dropEvents;
    }
    if (dropState.cur.element !== dropState.prev.element) {
      // if there was a previous dropzone, create a dragleave event
      if (dropState.prev.dropzone) {
        dropEvents.leave = new DropEvent(dropState, dragEvent, 'dragleave');
        dragEvent.dragLeave = dropEvents.leave.target = dropState.prev.element;
        dragEvent.prevDropzone = dropEvents.leave.dropzone = dropState.prev.dropzone;
      }
      // if dropzone is not null, create a dragenter event
      if (dropState.cur.dropzone) {
        dropEvents.enter = new DropEvent(dropState, dragEvent, 'dragenter');
        dragEvent.dragEnter = dropState.cur.element;
        dragEvent.dropzone = dropState.cur.dropzone;
      }
    }
    if (dragEvent.type === 'dragend' && dropState.cur.dropzone) {
      dropEvents.drop = new DropEvent(dropState, dragEvent, 'drop');
      dragEvent.dropzone = dropState.cur.dropzone;
      dragEvent.relatedTarget = dropState.cur.element;
    }
    if (dragEvent.type === 'dragmove' && dropState.cur.dropzone) {
      dropEvents.move = new DropEvent(dropState, dragEvent, 'dropmove');
      dragEvent.dropzone = dropState.cur.dropzone;
    }
    return dropEvents;
  }
  function fireDropEvents(interaction, events) {
    var dropState = interaction.dropState;
    var activeDrops = dropState.activeDrops,
      cur = dropState.cur,
      prev = dropState.prev;
    if (events.leave) {
      prev.dropzone.fire(events.leave);
    }
    if (events.enter) {
      cur.dropzone.fire(events.enter);
    }
    if (events.move) {
      cur.dropzone.fire(events.move);
    }
    if (events.drop) {
      cur.dropzone.fire(events.drop);
    }
    if (events.deactivate) {
      fireActivationEvents(activeDrops, events.deactivate);
    }
    dropState.prev.dropzone = cur.dropzone;
    dropState.prev.element = cur.element;
  }
  function onEventCreated(_ref3, scope) {
    var interaction = _ref3.interaction,
      iEvent = _ref3.iEvent,
      event = _ref3.event;
    if (iEvent.type !== 'dragmove' && iEvent.type !== 'dragend') {
      return;
    }
    var dropState = interaction.dropState;
    if (scope.dynamicDrop) {
      dropState.activeDrops = getActiveDrops(scope, interaction.element);
    }
    var dragEvent = iEvent;
    var dropResult = getDrop(interaction, dragEvent, event);

    // update rejected status
    dropState.rejected = dropState.rejected && !!dropResult && dropResult.dropzone === dropState.cur.dropzone && dropResult.element === dropState.cur.element;
    dropState.cur.dropzone = dropResult && dropResult.dropzone;
    dropState.cur.element = dropResult && dropResult.element;
    dropState.events = getDropEvents(interaction, event, dragEvent);
  }
  function dropzoneMethod(interactable, options) {
    if (is.object(options)) {
      interactable.options.drop.enabled = options.enabled !== false;
      if (options.listeners) {
        var normalized = normalize(options.listeners);
        // rename 'drop' to '' as it will be prefixed with 'drop'
        var corrected = Object.keys(normalized).reduce(function (acc, type) {
          var correctedType = /^(enter|leave)/.test(type) ? "drag".concat(type) : /^(activate|deactivate|move)/.test(type) ? "drop".concat(type) : type;
          acc[correctedType] = normalized[type];
          return acc;
        }, {});
        var prevListeners = interactable.options.drop.listeners;
        prevListeners && interactable.off(prevListeners);
        interactable.on(corrected);
        interactable.options.drop.listeners = corrected;
      }
      if (is.func(options.ondrop)) {
        interactable.on('drop', options.ondrop);
      }
      if (is.func(options.ondropactivate)) {
        interactable.on('dropactivate', options.ondropactivate);
      }
      if (is.func(options.ondropdeactivate)) {
        interactable.on('dropdeactivate', options.ondropdeactivate);
      }
      if (is.func(options.ondragenter)) {
        interactable.on('dragenter', options.ondragenter);
      }
      if (is.func(options.ondragleave)) {
        interactable.on('dragleave', options.ondragleave);
      }
      if (is.func(options.ondropmove)) {
        interactable.on('dropmove', options.ondropmove);
      }
      if (/^(pointer|center)$/.test(options.overlap)) {
        interactable.options.drop.overlap = options.overlap;
      } else if (is.number(options.overlap)) {
        interactable.options.drop.overlap = Math.max(Math.min(1, options.overlap), 0);
      }
      if ('accept' in options) {
        interactable.options.drop.accept = options.accept;
      }
      if ('checker' in options) {
        interactable.options.drop.checker = options.checker;
      }
      return interactable;
    }
    if (is.bool(options)) {
      interactable.options.drop.enabled = options;
      return interactable;
    }
    return interactable.options.drop;
  }
  function dropCheckMethod(interactable, dragEvent, event, draggable, draggableElement, dropElement, rect) {
    var dropped = false;

    // if the dropzone has no rect (eg. display: none)
    // call the custom dropChecker or just return false
    if (!(rect = rect || interactable.getRect(dropElement))) {
      return interactable.options.drop.checker ? interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement) : false;
    }
    var dropOverlap = interactable.options.drop.overlap;
    if (dropOverlap === 'pointer') {
      var origin = getOriginXY(draggable, draggableElement, 'drag');
      var page = getPageXY(dragEvent);
      page.x += origin.x;
      page.y += origin.y;
      var horizontal = page.x > rect.left && page.x < rect.right;
      var vertical = page.y > rect.top && page.y < rect.bottom;
      dropped = horizontal && vertical;
    }
    var dragRect = draggable.getRect(draggableElement);
    if (dragRect && dropOverlap === 'center') {
      var cx = dragRect.left + dragRect.width / 2;
      var cy = dragRect.top + dragRect.height / 2;
      dropped = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;
    }
    if (dragRect && is.number(dropOverlap)) {
      var overlapArea = Math.max(0, Math.min(rect.right, dragRect.right) - Math.max(rect.left, dragRect.left)) * Math.max(0, Math.min(rect.bottom, dragRect.bottom) - Math.max(rect.top, dragRect.top));
      var overlapRatio = overlapArea / (dragRect.width * dragRect.height);
      dropped = overlapRatio >= dropOverlap;
    }
    if (interactable.options.drop.checker) {
      dropped = interactable.options.drop.checker(dragEvent, event, dropped, interactable, dropElement, draggable, draggableElement);
    }
    return dropped;
  }
  var drop = {
    id: 'actions/drop',
    install: install$f,
    listeners: {
      'interactions:before-action-start': function interactionsBeforeActionStart(_ref4) {
        var interaction = _ref4.interaction;
        if (interaction.prepared.name !== 'drag') {
          return;
        }
        interaction.dropState = {
          cur: {
            dropzone: null,
            element: null
          },
          prev: {
            dropzone: null,
            element: null
          },
          rejected: null,
          events: null,
          activeDrops: []
        };
      },
      'interactions:after-action-start': function interactionsAfterActionStart(_ref5, scope) {
        var interaction = _ref5.interaction,
          event = _ref5.event,
          dragEvent = _ref5.iEvent;
        if (interaction.prepared.name !== 'drag') {
          return;
        }
        var dropState = interaction.dropState;

        // reset active dropzones
        dropState.activeDrops = [];
        dropState.events = {};
        dropState.activeDrops = getActiveDrops(scope, interaction.element);
        dropState.events = getDropEvents(interaction, event, dragEvent);
        if (dropState.events.activate) {
          fireActivationEvents(dropState.activeDrops, dropState.events.activate);
          scope.fire('actions/drop:start', {
            interaction: interaction,
            dragEvent: dragEvent
          });
        }
      },
      'interactions:action-move': onEventCreated,
      'interactions:after-action-move': function interactionsAfterActionMove(_ref6, scope) {
        var interaction = _ref6.interaction,
          dragEvent = _ref6.iEvent;
        if (interaction.prepared.name !== 'drag') {
          return;
        }
        var dropState = interaction.dropState;
        fireDropEvents(interaction, dropState.events);
        scope.fire('actions/drop:move', {
          interaction: interaction,
          dragEvent: dragEvent
        });
        dropState.events = {};
      },
      'interactions:action-end': function interactionsActionEnd(arg, scope) {
        if (arg.interaction.prepared.name !== 'drag') {
          return;
        }
        var interaction = arg.interaction,
          dragEvent = arg.iEvent;
        onEventCreated(arg, scope);
        fireDropEvents(interaction, interaction.dropState.events);
        scope.fire('actions/drop:end', {
          interaction: interaction,
          dragEvent: dragEvent
        });
      },
      'interactions:stop': function interactionsStop(_ref7) {
        var interaction = _ref7.interaction;
        if (interaction.prepared.name !== 'drag') {
          return;
        }
        var dropState = interaction.dropState;
        if (dropState) {
          dropState.activeDrops = null;
          dropState.events = null;
          dropState.cur.dropzone = null;
          dropState.cur.element = null;
          dropState.prev.dropzone = null;
          dropState.prev.element = null;
          dropState.rejected = false;
        }
      }
    },
    getActiveDrops: getActiveDrops,
    getDrop: getDrop,
    getDropEvents: getDropEvents,
    fireDropEvents: fireDropEvents,
    filterEventType: function filterEventType(type) {
      return type.search('drag') === 0 || type.search('drop') === 0;
    },
    defaults: {
      enabled: false,
      accept: null,
      overlap: 'pointer'
    }
  };
  var drop$1 = drop;

  function install$e(scope) {
    var actions = scope.actions,
      Interactable = scope.Interactable,
      defaults = scope.defaults;
    Interactable.prototype.gesturable = function (options) {
      if (is.object(options)) {
        this.options.gesture.enabled = options.enabled !== false;
        this.setPerAction('gesture', options);
        this.setOnEvents('gesture', options);
        return this;
      }
      if (is.bool(options)) {
        this.options.gesture.enabled = options;
        return this;
      }
      return this.options.gesture;
    };
    actions.map.gesture = gesture;
    actions.methodDict.gesture = 'gesturable';
    defaults.actions.gesture = gesture.defaults;
  }
  function updateGestureProps(_ref) {
    var interaction = _ref.interaction,
      iEvent = _ref.iEvent,
      phase = _ref.phase;
    if (interaction.prepared.name !== 'gesture') return;
    var pointers = interaction.pointers.map(function (p) {
      return p.pointer;
    });
    var starting = phase === 'start';
    var ending = phase === 'end';
    var deltaSource = interaction.interactable.options.deltaSource;
    iEvent.touches = [pointers[0], pointers[1]];
    if (starting) {
      iEvent.distance = touchDistance(pointers, deltaSource);
      iEvent.box = touchBBox(pointers);
      iEvent.scale = 1;
      iEvent.ds = 0;
      iEvent.angle = touchAngle(pointers, deltaSource);
      iEvent.da = 0;
      interaction.gesture.startDistance = iEvent.distance;
      interaction.gesture.startAngle = iEvent.angle;
    } else if (ending || interaction.pointers.length < 2) {
      var prevEvent = interaction.prevEvent;
      iEvent.distance = prevEvent.distance;
      iEvent.box = prevEvent.box;
      iEvent.scale = prevEvent.scale;
      iEvent.ds = 0;
      iEvent.angle = prevEvent.angle;
      iEvent.da = 0;
    } else {
      iEvent.distance = touchDistance(pointers, deltaSource);
      iEvent.box = touchBBox(pointers);
      iEvent.scale = iEvent.distance / interaction.gesture.startDistance;
      iEvent.angle = touchAngle(pointers, deltaSource);
      iEvent.ds = iEvent.scale - interaction.gesture.scale;
      iEvent.da = iEvent.angle - interaction.gesture.angle;
    }
    interaction.gesture.distance = iEvent.distance;
    interaction.gesture.angle = iEvent.angle;
    if (is.number(iEvent.scale) && iEvent.scale !== Infinity && !isNaN(iEvent.scale)) {
      interaction.gesture.scale = iEvent.scale;
    }
  }
  var gesture = {
    id: 'actions/gesture',
    before: ['actions/drag', 'actions/resize'],
    install: install$e,
    listeners: {
      'interactions:action-start': updateGestureProps,
      'interactions:action-move': updateGestureProps,
      'interactions:action-end': updateGestureProps,
      'interactions:new': function interactionsNew(_ref2) {
        var interaction = _ref2.interaction;
        interaction.gesture = {
          angle: 0,
          distance: 0,
          scale: 1,
          startAngle: 0,
          startDistance: 0
        };
      },
      'auto-start:check': function autoStartCheck(arg) {
        if (arg.interaction.pointers.length < 2) {
          return undefined;
        }
        var gestureOptions = arg.interactable.options.gesture;
        if (!(gestureOptions && gestureOptions.enabled)) {
          return undefined;
        }
        arg.action = {
          name: 'gesture'
        };
        return false;
      }
    },
    defaults: {},
    getCursor: function getCursor() {
      return '';
    },
    filterEventType: function filterEventType(type) {
      return type.search('gesture') === 0;
    }
  };
  var gesture$1 = gesture;

  function install$d(scope) {
    var actions = scope.actions,
      browser = scope.browser,
      Interactable = scope.Interactable,
      defaults = scope.defaults;

    // Less Precision with touch input

    resize.cursors = initCursors(browser);
    resize.defaultMargin = browser.supportsTouch || browser.supportsPointerEvent ? 20 : 10;
    Interactable.prototype.resizable = function (options) {
      return resizable(this, options, scope);
    };
    actions.map.resize = resize;
    actions.methodDict.resize = 'resizable';
    defaults.actions.resize = resize.defaults;
  }
  function resizeChecker(arg) {
    var interaction = arg.interaction,
      interactable = arg.interactable,
      element = arg.element,
      rect = arg.rect,
      buttons = arg.buttons;
    if (!rect) {
      return undefined;
    }
    var page = extend({}, interaction.coords.cur.page);
    var resizeOptions = interactable.options.resize;
    if (!(resizeOptions && resizeOptions.enabled) ||
    // check mouseButton setting if the pointer is down
    interaction.pointerIsDown && /mouse|pointer/.test(interaction.pointerType) && (buttons & resizeOptions.mouseButtons) === 0) {
      return undefined;
    }

    // if using resize.edges
    if (is.object(resizeOptions.edges)) {
      var resizeEdges = {
        left: false,
        right: false,
        top: false,
        bottom: false
      };
      for (var edge in resizeEdges) {
        resizeEdges[edge] = checkResizeEdge(edge, resizeOptions.edges[edge], page, interaction._latestPointer.eventTarget, element, rect, resizeOptions.margin || resize.defaultMargin);
      }
      resizeEdges.left = resizeEdges.left && !resizeEdges.right;
      resizeEdges.top = resizeEdges.top && !resizeEdges.bottom;
      if (resizeEdges.left || resizeEdges.right || resizeEdges.top || resizeEdges.bottom) {
        arg.action = {
          name: 'resize',
          edges: resizeEdges
        };
      }
    } else {
      var right = resizeOptions.axis !== 'y' && page.x > rect.right - resize.defaultMargin;
      var bottom = resizeOptions.axis !== 'x' && page.y > rect.bottom - resize.defaultMargin;
      if (right || bottom) {
        arg.action = {
          name: 'resize',
          axes: (right ? 'x' : '') + (bottom ? 'y' : '')
        };
      }
    }
    return arg.action ? false : undefined;
  }
  function resizable(interactable, options, scope) {
    if (is.object(options)) {
      interactable.options.resize.enabled = options.enabled !== false;
      interactable.setPerAction('resize', options);
      interactable.setOnEvents('resize', options);
      if (is.string(options.axis) && /^x$|^y$|^xy$/.test(options.axis)) {
        interactable.options.resize.axis = options.axis;
      } else if (options.axis === null) {
        interactable.options.resize.axis = scope.defaults.actions.resize.axis;
      }
      if (is.bool(options.preserveAspectRatio)) {
        interactable.options.resize.preserveAspectRatio = options.preserveAspectRatio;
      } else if (is.bool(options.square)) {
        interactable.options.resize.square = options.square;
      }
      return interactable;
    }
    if (is.bool(options)) {
      interactable.options.resize.enabled = options;
      return interactable;
    }
    return interactable.options.resize;
  }
  function checkResizeEdge(name, value, page, element, interactableElement, rect, margin) {
    // false, '', undefined, null
    if (!value) {
      return false;
    }

    // true value, use pointer coords and element rect
    if (value === true) {
      // if dimensions are negative, "switch" edges
      var width = is.number(rect.width) ? rect.width : rect.right - rect.left;
      var height = is.number(rect.height) ? rect.height : rect.bottom - rect.top;

      // don't use margin greater than half the relevent dimension
      margin = Math.min(margin, Math.abs((name === 'left' || name === 'right' ? width : height) / 2));
      if (width < 0) {
        if (name === 'left') {
          name = 'right';
        } else if (name === 'right') {
          name = 'left';
        }
      }
      if (height < 0) {
        if (name === 'top') {
          name = 'bottom';
        } else if (name === 'bottom') {
          name = 'top';
        }
      }
      if (name === 'left') {
        var edge = width >= 0 ? rect.left : rect.right;
        return page.x < edge + margin;
      }
      if (name === 'top') {
        var _edge = height >= 0 ? rect.top : rect.bottom;
        return page.y < _edge + margin;
      }
      if (name === 'right') {
        return page.x > (width >= 0 ? rect.right : rect.left) - margin;
      }
      if (name === 'bottom') {
        return page.y > (height >= 0 ? rect.bottom : rect.top) - margin;
      }
    }

    // the remaining checks require an element
    if (!is.element(element)) {
      return false;
    }
    return is.element(value) ?
    // the value is an element to use as a resize handle
    value === element :
    // otherwise check if element matches value as selector
    matchesUpTo(element, value, interactableElement);
  }

  /* eslint-disable multiline-ternary */
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  function initCursors(browser) {
    return browser.isIe9 ? {
      x: 'e-resize',
      y: 's-resize',
      xy: 'se-resize',
      top: 'n-resize',
      left: 'w-resize',
      bottom: 's-resize',
      right: 'e-resize',
      topleft: 'se-resize',
      bottomright: 'se-resize',
      topright: 'ne-resize',
      bottomleft: 'ne-resize'
    } : {
      x: 'ew-resize',
      y: 'ns-resize',
      xy: 'nwse-resize',
      top: 'ns-resize',
      left: 'ew-resize',
      bottom: 'ns-resize',
      right: 'ew-resize',
      topleft: 'nwse-resize',
      bottomright: 'nwse-resize',
      topright: 'nesw-resize',
      bottomleft: 'nesw-resize'
    };
  }
  /* eslint-enable multiline-ternary */

  function start$7(_ref) {
    var iEvent = _ref.iEvent,
      interaction = _ref.interaction;
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) {
      return;
    }
    var resizeEvent = iEvent;
    var rect = interaction.rect;
    interaction._rects = {
      start: extend({}, rect),
      corrected: extend({}, rect),
      previous: extend({}, rect),
      delta: {
        left: 0,
        right: 0,
        width: 0,
        top: 0,
        bottom: 0,
        height: 0
      }
    };
    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = interaction._rects.corrected;
    resizeEvent.deltaRect = interaction._rects.delta;
  }
  function move(_ref2) {
    var iEvent = _ref2.iEvent,
      interaction = _ref2.interaction;
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
    var resizeEvent = iEvent;
    var resizeOptions = interaction.interactable.options.resize;
    var invert = resizeOptions.invert;
    var invertible = invert === 'reposition' || invert === 'negate';
    var current = interaction.rect;
    var _interaction$_rects = interaction._rects,
      startRect = _interaction$_rects.start,
      corrected = _interaction$_rects.corrected,
      deltaRect = _interaction$_rects.delta,
      previous = _interaction$_rects.previous;
    extend(previous, corrected);
    if (invertible) {
      // if invertible, copy the current rect
      extend(corrected, current);
      if (invert === 'reposition') {
        // swap edge values if necessary to keep width/height positive
        if (corrected.top > corrected.bottom) {
          var swap = corrected.top;
          corrected.top = corrected.bottom;
          corrected.bottom = swap;
        }
        if (corrected.left > corrected.right) {
          var _swap = corrected.left;
          corrected.left = corrected.right;
          corrected.right = _swap;
        }
      }
    } else {
      // if not invertible, restrict to minimum of 0x0 rect
      corrected.top = Math.min(current.top, startRect.bottom);
      corrected.bottom = Math.max(current.bottom, startRect.top);
      corrected.left = Math.min(current.left, startRect.right);
      corrected.right = Math.max(current.right, startRect.left);
    }
    corrected.width = corrected.right - corrected.left;
    corrected.height = corrected.bottom - corrected.top;
    for (var edge in corrected) {
      deltaRect[edge] = corrected[edge] - previous[edge];
    }
    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = corrected;
    resizeEvent.deltaRect = deltaRect;
  }
  function end$1(_ref3) {
    var iEvent = _ref3.iEvent,
      interaction = _ref3.interaction;
    if (interaction.prepared.name !== 'resize' || !interaction.prepared.edges) return;
    var resizeEvent = iEvent;
    resizeEvent.edges = interaction.prepared.edges;
    resizeEvent.rect = interaction._rects.corrected;
    resizeEvent.deltaRect = interaction._rects.delta;
  }
  function updateEventAxes(_ref4) {
    var iEvent = _ref4.iEvent,
      interaction = _ref4.interaction;
    if (interaction.prepared.name !== 'resize' || !interaction.resizeAxes) return;
    var options = interaction.interactable.options;
    var resizeEvent = iEvent;
    if (options.resize.square) {
      if (interaction.resizeAxes === 'y') {
        resizeEvent.delta.x = resizeEvent.delta.y;
      } else {
        resizeEvent.delta.y = resizeEvent.delta.x;
      }
      resizeEvent.axes = 'xy';
    } else {
      resizeEvent.axes = interaction.resizeAxes;
      if (interaction.resizeAxes === 'x') {
        resizeEvent.delta.y = 0;
      } else if (interaction.resizeAxes === 'y') {
        resizeEvent.delta.x = 0;
      }
    }
  }
  var resize = {
    id: 'actions/resize',
    before: ['actions/drag'],
    install: install$d,
    listeners: {
      'interactions:new': function interactionsNew(_ref5) {
        var interaction = _ref5.interaction;
        interaction.resizeAxes = 'xy';
      },
      'interactions:action-start': function interactionsActionStart(arg) {
        start$7(arg);
        updateEventAxes(arg);
      },
      'interactions:action-move': function interactionsActionMove(arg) {
        move(arg);
        updateEventAxes(arg);
      },
      'interactions:action-end': end$1,
      'auto-start:check': resizeChecker
    },
    defaults: {
      square: false,
      preserveAspectRatio: false,
      axis: 'xy',
      // use default margin
      margin: NaN,
      // object with props left, right, top, bottom which are
      // true/false values to resize when the pointer is over that edge,
      // CSS selectors to match the handles for each direction
      // or the Elements for each handle
      edges: null,
      // a value of 'none' will limit the resize rect to a minimum of 0x0
      // 'negate' will alow the rect to have negative width/height
      // 'reposition' will keep the width/height positive by swapping
      // the top and bottom edges and/or swapping the left and right edges
      invert: 'none'
    },
    cursors: null,
    getCursor: function getCursor(_ref6) {
      var edges = _ref6.edges,
        axis = _ref6.axis,
        name = _ref6.name;
      var cursors = resize.cursors;
      var result = null;
      if (axis) {
        result = cursors[name + axis];
      } else if (edges) {
        var cursorKey = '';
        for (var _i2 = 0, _ref8 = ['top', 'bottom', 'left', 'right']; _i2 < _ref8.length; _i2++) {
          var edge = _ref8[_i2];
          if (edges[edge]) {
            cursorKey += edge;
          }
        }
        result = cursors[cursorKey];
      }
      return result;
    },
    filterEventType: function filterEventType(type) {
      return type.search('resize') === 0;
    },
    defaultMargin: null
  };
  var resize$1 = resize;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  var actions = {
    id: 'actions',
    install: function install(scope) {
      scope.usePlugin(gesture$1);
      scope.usePlugin(resize$1);
      scope.usePlugin(drag$1);
      scope.usePlugin(drop$1);
    }
  };

  var lastTime = 0;
  var _request;
  var _cancel;
  function init(global) {
    _request = global.requestAnimationFrame;
    _cancel = global.cancelAnimationFrame;
    if (!_request) {
      var vendors = ['ms', 'moz', 'webkit', 'o'];
      for (var _i2 = 0; _i2 < vendors.length; _i2++) {
        var vendor = vendors[_i2];
        _request = global["".concat(vendor, "RequestAnimationFrame")];
        _cancel = global["".concat(vendor, "CancelAnimationFrame")] || global["".concat(vendor, "CancelRequestAnimationFrame")];
      }
    }
    _request = _request && _request.bind(global);
    _cancel = _cancel && _cancel.bind(global);
    if (!_request) {
      _request = function request(callback) {
        var currTime = Date.now();
        var timeToCall = Math.max(0, 16 - (currTime - lastTime));
        var token = global.setTimeout(function () {
          // eslint-disable-next-line n/no-callback-literal
          callback(currTime + timeToCall);
        }, timeToCall);
        lastTime = currTime + timeToCall;
        return token;
      };
      _cancel = function cancel(token) {
        return clearTimeout(token);
      };
    }
  }
  var raf = {
    request: function request(callback) {
      return _request(callback);
    },
    cancel: function cancel(token) {
      return _cancel(token);
    },
    init: init
  };

  function install$c(scope) {
    var defaults = scope.defaults,
      actions = scope.actions;
    scope.autoScroll = autoScroll;
    autoScroll.now = function () {
      return scope.now();
    };
    actions.phaselessTypes.autoscroll = true;
    defaults.perAction.autoScroll = autoScroll.defaults;
  }
  var autoScroll = {
    defaults: {
      enabled: false,
      margin: 60,
      // the item that is scrolled (Window or HTMLElement)
      container: null,
      // the scroll speed in pixels per second
      speed: 300
    },
    now: Date.now,
    interaction: null,
    i: 0,
    // the handle returned by window.setInterval

    // Direction each pulse is to scroll in
    x: 0,
    y: 0,
    isScrolling: false,
    prevTime: 0,
    margin: 0,
    speed: 0,
    start: function start(interaction) {
      autoScroll.isScrolling = true;
      raf.cancel(autoScroll.i);
      interaction.autoScroll = autoScroll;
      autoScroll.interaction = interaction;
      autoScroll.prevTime = autoScroll.now();
      autoScroll.i = raf.request(autoScroll.scroll);
    },
    stop: function stop() {
      autoScroll.isScrolling = false;
      if (autoScroll.interaction) {
        autoScroll.interaction.autoScroll = null;
      }
      raf.cancel(autoScroll.i);
    },
    // scroll the window by the values in scroll.x/y
    scroll: function scroll() {
      var interaction = autoScroll.interaction;
      var interactable = interaction.interactable,
        element = interaction.element;
      var actionName = interaction.prepared.name;
      var options = interactable.options[actionName].autoScroll;
      var container = getContainer(options.container, interactable, element);
      var now = autoScroll.now();
      // change in time in seconds
      var dt = (now - autoScroll.prevTime) / 1000;
      // displacement
      var s = options.speed * dt;
      if (s >= 1) {
        var scrollBy = {
          x: autoScroll.x * s,
          y: autoScroll.y * s
        };
        if (scrollBy.x || scrollBy.y) {
          var prevScroll = getScroll(container);
          if (is.window(container)) {
            container.scrollBy(scrollBy.x, scrollBy.y);
          } else if (container) {
            container.scrollLeft += scrollBy.x;
            container.scrollTop += scrollBy.y;
          }
          var curScroll = getScroll(container);
          var delta = {
            x: curScroll.x - prevScroll.x,
            y: curScroll.y - prevScroll.y
          };
          if (delta.x || delta.y) {
            interactable.fire({
              type: 'autoscroll',
              target: element,
              interactable: interactable,
              delta: delta,
              interaction: interaction,
              container: container
            });
          }
        }
        autoScroll.prevTime = now;
      }
      if (autoScroll.isScrolling) {
        raf.cancel(autoScroll.i);
        autoScroll.i = raf.request(autoScroll.scroll);
      }
    },
    check: function check(interactable, actionName) {
      var _options$actionName$a;
      var options = interactable.options;
      return (_options$actionName$a = options[actionName].autoScroll) == null ? void 0 : _options$actionName$a.enabled;
    },
    onInteractionMove: function onInteractionMove(_ref) {
      var interaction = _ref.interaction,
        pointer = _ref.pointer;
      if (!(interaction.interacting() && autoScroll.check(interaction.interactable, interaction.prepared.name))) {
        return;
      }
      if (interaction.simulation) {
        autoScroll.x = autoScroll.y = 0;
        return;
      }
      var top;
      var right;
      var bottom;
      var left;
      var interactable = interaction.interactable,
        element = interaction.element;
      var actionName = interaction.prepared.name;
      var options = interactable.options[actionName].autoScroll;
      var container = getContainer(options.container, interactable, element);
      if (is.window(container)) {
        left = pointer.clientX < autoScroll.margin;
        top = pointer.clientY < autoScroll.margin;
        right = pointer.clientX > container.innerWidth - autoScroll.margin;
        bottom = pointer.clientY > container.innerHeight - autoScroll.margin;
      } else {
        var rect = getElementClientRect(container);
        left = pointer.clientX < rect.left + autoScroll.margin;
        top = pointer.clientY < rect.top + autoScroll.margin;
        right = pointer.clientX > rect.right - autoScroll.margin;
        bottom = pointer.clientY > rect.bottom - autoScroll.margin;
      }
      autoScroll.x = right ? 1 : left ? -1 : 0;
      autoScroll.y = bottom ? 1 : top ? -1 : 0;
      if (!autoScroll.isScrolling) {
        // set the autoScroll properties to those of the target
        autoScroll.margin = options.margin;
        autoScroll.speed = options.speed;
        autoScroll.start(interaction);
      }
    }
  };
  function getContainer(value, interactable, element) {
    return (is.string(value) ? getStringOptionResult(value, interactable, element) : value) || getWindow(element);
  }
  function getScroll(container) {
    if (is.window(container)) {
      container = window.document.body;
    }
    return {
      x: container.scrollLeft,
      y: container.scrollTop
    };
  }
  var autoScrollPlugin = {
    id: 'auto-scroll',
    install: install$c,
    listeners: {
      'interactions:new': function interactionsNew(_ref3) {
        var interaction = _ref3.interaction;
        interaction.autoScroll = null;
      },
      'interactions:destroy': function interactionsDestroy(_ref4) {
        var interaction = _ref4.interaction;
        interaction.autoScroll = null;
        autoScroll.stop();
        if (autoScroll.interaction) {
          autoScroll.interaction = null;
        }
      },
      'interactions:stop': autoScroll.stop,
      'interactions:action-move': function interactionsActionMove(arg) {
        return autoScroll.onInteractionMove(arg);
      }
    }
  };
  var autoScroll$1 = autoScrollPlugin;

  function warnOnce(method, message) {
    var warned = false;
    return function () {
      if (!warned) {
        win.console.warn(message);
        warned = true;
      }
      return method.apply(this, arguments);
    };
  }
  function copyAction(dest, src) {
    dest.name = src.name;
    dest.axis = src.axis;
    dest.edges = src.edges;
    return dest;
  }

  function install$b(scope) {
    var Interactable = scope.Interactable;
    Interactable.prototype.getAction = function getAction(pointer, event, interaction, element) {
      var action = defaultActionChecker(this, event, interaction, element, scope);
      if (this.options.actionChecker) {
        return this.options.actionChecker(pointer, event, action, this, element, interaction);
      }
      return action;
    };
    Interactable.prototype.ignoreFrom = warnOnce(function (newValue) {
      return this._backCompatOption('ignoreFrom', newValue);
    }, 'Interactable.ignoreFrom() has been deprecated. Use Interactble.draggable({ignoreFrom: newValue}).');
    Interactable.prototype.allowFrom = warnOnce(function (newValue) {
      return this._backCompatOption('allowFrom', newValue);
    }, 'Interactable.allowFrom() has been deprecated. Use Interactble.draggable({allowFrom: newValue}).');
    Interactable.prototype.actionChecker = actionChecker;
    Interactable.prototype.styleCursor = styleCursor;
  }
  function defaultActionChecker(interactable, event, interaction, element, scope) {
    var rect = interactable.getRect(element);
    var buttons = event.buttons || {
      0: 1,
      1: 4,
      3: 8,
      4: 16
    }[event.button];
    var arg = {
      action: null,
      interactable: interactable,
      interaction: interaction,
      element: element,
      rect: rect,
      buttons: buttons
    };
    scope.fire('auto-start:check', arg);
    return arg.action;
  }
  function styleCursor(newValue) {
    if (is.bool(newValue)) {
      this.options.styleCursor = newValue;
      return this;
    }
    if (newValue === null) {
      delete this.options.styleCursor;
      return this;
    }
    return this.options.styleCursor;
  }
  function actionChecker(checker) {
    if (is.func(checker)) {
      this.options.actionChecker = checker;
      return this;
    }
    if (checker === null) {
      delete this.options.actionChecker;
      return this;
    }
    return this.options.actionChecker;
  }
  var InteractableMethods = {
    id: 'auto-start/interactableMethods',
    install: install$b
  };

  /* eslint-enable import/no-duplicates */

  function install$a(scope) {
    var interact = scope.interactStatic,
      defaults = scope.defaults;
    scope.usePlugin(InteractableMethods);
    defaults.base.actionChecker = null;
    defaults.base.styleCursor = true;
    extend(defaults.perAction, {
      manualStart: false,
      max: Infinity,
      maxPerElement: 1,
      allowFrom: null,
      ignoreFrom: null,
      // only allow left button by default
      // see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#Return_value
      mouseButtons: 1
    });
    interact.maxInteractions = function (newValue) {
      return maxInteractions(newValue, scope);
    };
    scope.autoStart = {
      // Allow this many interactions to happen simultaneously
      maxInteractions: Infinity,
      withinInteractionLimit: withinInteractionLimit,
      cursorElement: null
    };
  }
  function prepareOnDown(_ref, scope) {
    var interaction = _ref.interaction,
      pointer = _ref.pointer,
      event = _ref.event,
      eventTarget = _ref.eventTarget;
    if (interaction.interacting()) return;
    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  }
  function prepareOnMove(_ref2, scope) {
    var interaction = _ref2.interaction,
      pointer = _ref2.pointer,
      event = _ref2.event,
      eventTarget = _ref2.eventTarget;
    if (interaction.pointerType !== 'mouse' || interaction.pointerIsDown || interaction.interacting()) return;
    var actionInfo = getActionInfo(interaction, pointer, event, eventTarget, scope);
    prepare(interaction, actionInfo, scope);
  }
  function startOnMove(arg, scope) {
    var interaction = arg.interaction;
    if (!interaction.pointerIsDown || interaction.interacting() || !interaction.pointerWasMoved || !interaction.prepared.name) {
      return;
    }
    scope.fire('autoStart:before-start', arg);
    var interactable = interaction.interactable;
    var actionName = interaction.prepared.name;
    if (actionName && interactable) {
      // check manualStart and interaction limit
      if (interactable.options[actionName].manualStart || !withinInteractionLimit(interactable, interaction.element, interaction.prepared, scope)) {
        interaction.stop();
      } else {
        interaction.start(interaction.prepared, interactable, interaction.element);
        setInteractionCursor(interaction, scope);
      }
    }
  }
  function clearCursorOnStop(_ref3, scope) {
    var interaction = _ref3.interaction;
    var interactable = interaction.interactable;
    if (interactable && interactable.options.styleCursor) {
      setCursor(interaction.element, '', scope);
    }
  }

  // Check if the current interactable supports the action.
  // If so, return the validated action. Otherwise, return null
  function validateAction(action, interactable, element, eventTarget, scope) {
    if (interactable.testIgnoreAllow(interactable.options[action.name], element, eventTarget) && interactable.options[action.name].enabled && withinInteractionLimit(interactable, element, action, scope)) {
      return action;
    }
    return null;
  }
  function validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope) {
    for (var i = 0, len = matches.length; i < len; i++) {
      var match = matches[i];
      var matchElement = matchElements[i];
      var matchAction = match.getAction(pointer, event, interaction, matchElement);
      if (!matchAction) {
        continue;
      }
      var action = validateAction(matchAction, match, matchElement, eventTarget, scope);
      if (action) {
        return {
          action: action,
          interactable: match,
          element: matchElement
        };
      }
    }
    return {
      action: null,
      interactable: null,
      element: null
    };
  }
  function getActionInfo(interaction, pointer, event, eventTarget, scope) {
    var matches = [];
    var matchElements = [];
    var element = eventTarget;
    function pushMatches(interactable) {
      matches.push(interactable);
      matchElements.push(element);
    }
    while (is.element(element)) {
      matches = [];
      matchElements = [];
      scope.interactables.forEachMatch(element, pushMatches);
      var actionInfo = validateMatches(interaction, pointer, event, matches, matchElements, eventTarget, scope);
      if (actionInfo.action && !actionInfo.interactable.options[actionInfo.action.name].manualStart) {
        return actionInfo;
      }
      element = parentNode(element);
    }
    return {
      action: null,
      interactable: null,
      element: null
    };
  }
  function prepare(interaction, _ref4, scope) {
    var action = _ref4.action,
      interactable = _ref4.interactable,
      element = _ref4.element;
    action = action || {
      name: null
    };
    interaction.interactable = interactable;
    interaction.element = element;
    copyAction(interaction.prepared, action);
    interaction.rect = interactable && action.name ? interactable.getRect(element) : null;
    setInteractionCursor(interaction, scope);
    scope.fire('autoStart:prepared', {
      interaction: interaction
    });
  }
  function withinInteractionLimit(interactable, element, action, scope) {
    var options = interactable.options;
    var maxActions = options[action.name].max;
    var maxPerElement = options[action.name].maxPerElement;
    var autoStartMax = scope.autoStart.maxInteractions;
    var activeInteractions = 0;
    var interactableCount = 0;
    var elementCount = 0;

    // no actions if any of these values == 0
    if (!(maxActions && maxPerElement && autoStartMax)) {
      return false;
    }
    for (var _i2 = 0, _scope$interactions$l2 = scope.interactions.list; _i2 < _scope$interactions$l2.length; _i2++) {
      var interaction = _scope$interactions$l2[_i2];
      var otherAction = interaction.prepared.name;
      if (!interaction.interacting()) {
        continue;
      }
      activeInteractions++;
      if (activeInteractions >= autoStartMax) {
        return false;
      }
      if (interaction.interactable !== interactable) {
        continue;
      }
      interactableCount += otherAction === action.name ? 1 : 0;
      if (interactableCount >= maxActions) {
        return false;
      }
      if (interaction.element === element) {
        elementCount++;
        if (otherAction === action.name && elementCount >= maxPerElement) {
          return false;
        }
      }
    }
    return autoStartMax > 0;
  }
  function maxInteractions(newValue, scope) {
    if (is.number(newValue)) {
      scope.autoStart.maxInteractions = newValue;
      return this;
    }
    return scope.autoStart.maxInteractions;
  }
  function setCursor(element, cursor, scope) {
    var prevCursorElement = scope.autoStart.cursorElement;
    if (prevCursorElement && prevCursorElement !== element) {
      prevCursorElement.style.cursor = '';
    }
    element.ownerDocument.documentElement.style.cursor = cursor;
    element.style.cursor = cursor;
    scope.autoStart.cursorElement = cursor ? element : null;
  }
  function setInteractionCursor(interaction, scope) {
    var interactable = interaction.interactable,
      element = interaction.element,
      prepared = interaction.prepared;
    if (!(interaction.pointerType === 'mouse' && interactable && interactable.options.styleCursor)) {
      // clear previous target element cursor
      if (scope.autoStart.cursorElement) {
        setCursor(scope.autoStart.cursorElement, '', scope);
      }
      return;
    }
    var cursor = '';
    if (prepared.name) {
      var cursorChecker = interactable.options[prepared.name].cursorChecker;
      if (is.func(cursorChecker)) {
        cursor = cursorChecker(prepared, interactable, element, interaction._interacting);
      } else {
        cursor = scope.actions.map[prepared.name].getCursor(prepared);
      }
    }
    setCursor(interaction.element, cursor || '', scope);
  }
  var autoStart$1 = {
    id: 'auto-start/base',
    before: ['actions'],
    install: install$a,
    listeners: {
      'interactions:down': prepareOnDown,
      'interactions:move': function interactionsMove(arg, scope) {
        prepareOnMove(arg, scope);
        startOnMove(arg, scope);
      },
      'interactions:stop': clearCursorOnStop
    },
    maxInteractions: maxInteractions,
    withinInteractionLimit: withinInteractionLimit,
    validateAction: validateAction
  };
  var autoStart$2 = autoStart$1;

  function beforeStart(_ref, scope) {
    var interaction = _ref.interaction,
      eventTarget = _ref.eventTarget,
      dx = _ref.dx,
      dy = _ref.dy;
    if (interaction.prepared.name !== 'drag') return;

    // check if a drag is in the correct axis
    var absX = Math.abs(dx);
    var absY = Math.abs(dy);
    var targetOptions = interaction.interactable.options.drag;
    var startAxis = targetOptions.startAxis;
    var currentAxis = absX > absY ? 'x' : absX < absY ? 'y' : 'xy';
    interaction.prepared.axis = targetOptions.lockAxis === 'start' ? currentAxis[0] // always lock to one axis even if currentAxis === 'xy'
    : targetOptions.lockAxis;

    // if the movement isn't in the startAxis of the interactable
    if (currentAxis !== 'xy' && startAxis !== 'xy' && startAxis !== currentAxis) {
      interaction.prepared.name = null;

      // then try to get a drag from another ineractable
      var element = eventTarget;
      var getDraggable = function getDraggable(interactable) {
        if (interactable === interaction.interactable) return;
        var options = interaction.interactable.options.drag;
        if (!options.manualStart && interactable.testIgnoreAllow(options, element, eventTarget)) {
          var action = interactable.getAction(interaction.downPointer, interaction.downEvent, interaction, element);
          if (action && action.name === 'drag' && checkStartAxis(currentAxis, interactable) && autoStart$2.validateAction(action, interactable, element, eventTarget, scope)) {
            return interactable;
          }
        }
      };

      // check all interactables
      while (is.element(element)) {
        var interactable = scope.interactables.forEachMatch(element, getDraggable);
        if (interactable) {
          interaction.prepared.name = 'drag';
          interaction.interactable = interactable;
          interaction.element = element;
          break;
        }
        element = parentNode(element);
      }
    }
  }
  function checkStartAxis(startAxis, interactable) {
    if (!interactable) {
      return false;
    }
    var thisAxis = interactable.options.drag.startAxis;
    return startAxis === 'xy' || thisAxis === 'xy' || thisAxis === startAxis;
  }
  var dragAxis = {
    id: 'auto-start/dragAxis',
    listeners: {
      'autoStart:before-start': beforeStart
    }
  };

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable */

  function install$9(scope) {
    var defaults = scope.defaults;
    scope.usePlugin(autoStart$2);
    defaults.perAction.hold = 0;
    defaults.perAction.delay = 0;
  }
  function getHoldDuration(interaction) {
    var actionName = interaction.prepared && interaction.prepared.name;
    if (!actionName) {
      return null;
    }
    var options = interaction.interactable.options;
    return options[actionName].hold || options[actionName].delay;
  }
  var hold = {
    id: 'auto-start/hold',
    install: install$9,
    listeners: {
      'interactions:new': function interactionsNew(_ref) {
        var interaction = _ref.interaction;
        interaction.autoStartHoldTimer = null;
      },
      'autoStart:prepared': function autoStartPrepared(_ref2) {
        var interaction = _ref2.interaction;
        var hold = getHoldDuration(interaction);
        if (hold > 0) {
          interaction.autoStartHoldTimer = setTimeout(function () {
            interaction.start(interaction.prepared, interaction.interactable, interaction.element);
          }, hold);
        }
      },
      'interactions:move': function interactionsMove(_ref3) {
        var interaction = _ref3.interaction,
          duplicate = _ref3.duplicate;
        if (interaction.autoStartHoldTimer && interaction.pointerWasMoved && !duplicate) {
          clearTimeout(interaction.autoStartHoldTimer);
          interaction.autoStartHoldTimer = null;
        }
      },
      // prevent regular down->move autoStart
      'autoStart:before-start': function autoStartBeforeStart(_ref4) {
        var interaction = _ref4.interaction;
        var holdDuration = getHoldDuration(interaction);
        if (holdDuration > 0) {
          interaction.prepared.name = null;
        }
      }
    },
    getHoldDuration: getHoldDuration
  };
  var hold$1 = hold;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  var autoStart = {
    id: 'auto-start',
    install: function install(scope) {
      scope.usePlugin(autoStart$2);
      scope.usePlugin(hold$1);
      scope.usePlugin(dragAxis);
    }
  };

  var preventDefault = function preventDefault(newValue) {
    if (/^(always|never|auto)$/.test(newValue)) {
      this.options.preventDefault = newValue;
      return this;
    }
    if (is.bool(newValue)) {
      this.options.preventDefault = newValue ? 'always' : 'never';
      return this;
    }
    return this.options.preventDefault;
  };
  function checkAndPreventDefault(interactable, scope, event) {
    var setting = interactable.options.preventDefault;
    if (setting === 'never') return;
    if (setting === 'always') {
      event.preventDefault();
      return;
    }

    // setting === 'auto'

    // if the browser supports passive event listeners and isn't running on iOS,
    // don't preventDefault of touch{start,move} events. CSS touch-action and
    // user-select should be used instead of calling event.preventDefault().
    if (scope.events.supportsPassive && /^touch(start|move)$/.test(event.type)) {
      var doc = getWindow(event.target).document;
      var docOptions = scope.getDocOptions(doc);
      if (!(docOptions && docOptions.events) || docOptions.events.passive !== false) {
        return;
      }
    }

    // don't preventDefault of pointerdown events
    if (/^(mouse|pointer|touch)*(down|start)/i.test(event.type)) {
      return;
    }

    // don't preventDefault on editable elements
    if (is.element(event.target) && matchesSelector(event.target, 'input,select,textarea,[contenteditable=true],[contenteditable=true] *')) {
      return;
    }
    event.preventDefault();
  }
  function onInteractionEvent(_ref) {
    var interaction = _ref.interaction,
      event = _ref.event;
    if (interaction.interactable) {
      interaction.interactable.checkAndPreventDefault(event);
    }
  }
  function install$8(scope) {
    var Interactable = scope.Interactable;
    Interactable.prototype.preventDefault = preventDefault;
    Interactable.prototype.checkAndPreventDefault = function (event) {
      return checkAndPreventDefault(this, scope, event);
    };

    // prevent native HTML5 drag on interact.js target elements
    scope.interactions.docEvents.push({
      type: 'dragstart',
      listener: function listener(event) {
        for (var _i2 = 0, _scope$interactions$l2 = scope.interactions.list; _i2 < _scope$interactions$l2.length; _i2++) {
          var interaction = _scope$interactions$l2[_i2];
          if (interaction.element && (interaction.element === event.target || nodeContains(interaction.element, event.target))) {
            interaction.interactable.checkAndPreventDefault(event);
            return;
          }
        }
      }
    });
  }
  var interactablePreventDefault = {
    id: 'core/interactablePreventDefault',
    install: install$8,
    listeners: ['down', 'move', 'up', 'cancel'].reduce(function (acc, eventType) {
      acc["interactions:".concat(eventType)] = onInteractionEvent;
      return acc;
    }, {})
  };

  function isNonNativeEvent(type, actions) {
    if (actions.phaselessTypes[type]) {
      return true;
    }
    for (var name in actions.map) {
      if (type.indexOf(name) === 0 && type.substr(name.length) in actions.phases) {
        return true;
      }
    }
    return false;
  }

  var CheckName = /*#__PURE__*/function (CheckName) {
    CheckName["touchAction"] = "touchAction";
    CheckName["boxSizing"] = "boxSizing";
    CheckName["noListeners"] = "noListeners";
    return CheckName;
  }(CheckName || {});
  var prefix = '[interact.js] ';
  var links = {
    touchAction: 'https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action',
    boxSizing: 'https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing'
  };

  // eslint-disable-next-line no-undef
  var isProduction = "development" === 'production';
  function install$7(scope) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      logger = _ref.logger;
    var Interactable = scope.Interactable,
      defaults = scope.defaults;
    scope.logger = logger || console;
    defaults.base.devTools = {
      ignore: {}
    };
    Interactable.prototype.devTools = function (options) {
      if (options) {
        extend(this.options.devTools, options);
        return this;
      }
      return this.options.devTools;
    };

    // can't set native events on non string targets without `addEventListener` prop
    var _onOff = Interactable.prototype._onOff;
    Interactable.prototype._onOff = function (method, typeArg, listenerArg, options, filter) {
      if (is.string(this.target) || this.target.addEventListener) {
        return _onOff.call(this, method, typeArg, listenerArg, options, filter);
      }
      if (is.object(typeArg) && !is.array(typeArg)) {
        options = listenerArg;
        listenerArg = null;
      }
      var normalizedListeners = normalize(typeArg, listenerArg, filter);
      for (var type in normalizedListeners) {
        if (isNonNativeEvent(type, scope.actions)) continue;
        scope.logger.warn(prefix + "Can't add native \"".concat(type, "\" event listener to target without `addEventListener(type, listener, options)` prop."));
      }
      return _onOff.call(this, method, normalizedListeners, options);
    };
  }
  var checks = [{
    name: CheckName.touchAction,
    perform: function perform(_ref2) {
      var element = _ref2.element;
      return !!element && !parentHasStyle(element, 'touchAction', /pan-|pinch|none/);
    },
    getInfo: function getInfo(_ref3) {
      var element = _ref3.element;
      return [element, links.touchAction];
    },
    text: 'Consider adding CSS "touch-action: none" to this element\n'
  }, {
    name: CheckName.boxSizing,
    perform: function perform(interaction) {
      var element = interaction.element;
      return interaction.prepared.name === 'resize' && element instanceof domObjects$1.HTMLElement && !hasStyle(element, 'boxSizing', /border-box/);
    },
    text: 'Consider adding CSS "box-sizing: border-box" to this resizable element',
    getInfo: function getInfo(_ref4) {
      var element = _ref4.element;
      return [element, links.boxSizing];
    }
  }, {
    name: CheckName.noListeners,
    perform: function perform(interaction) {
      var _interaction$interact;
      var actionName = interaction.prepared.name;
      var moveListeners = ((_interaction$interact = interaction.interactable) == null ? void 0 : _interaction$interact.events.types["".concat(actionName, "move")]) || [];
      return !moveListeners.length;
    },
    getInfo: function getInfo(interaction) {
      return [interaction.prepared.name, interaction.interactable];
    },
    text: 'There are no listeners set for this action'
  }];
  function hasStyle(element, prop, styleRe) {
    var value = element.style[prop] || win.getComputedStyle(element)[prop];
    return styleRe.test((value || '').toString());
  }
  function parentHasStyle(element, prop, styleRe) {
    var parent = element;
    while (is.element(parent)) {
      if (hasStyle(parent, prop, styleRe)) {
        return true;
      }
      parent = parentNode(parent);
    }
    return false;
  }
  var id = 'dev-tools';
  var defaultExport = isProduction ? {
    id: id,
    install: function install() {}
  } : {
    id: id,
    install: install$7,
    listeners: {
      'interactions:action-start': function interactionsActionStart(_ref5, scope) {
        var interaction = _ref5.interaction;
        for (var _i2 = 0; _i2 < checks.length; _i2++) {
          var check = checks[_i2];
          var options = interaction.interactable && interaction.interactable.options;
          if (!(options && options.devTools && options.devTools.ignore[check.name]) && check.perform(interaction)) {
            var _scope$logger;
            (_scope$logger = scope.logger).warn.apply(_scope$logger, [prefix + check.text].concat(check.getInfo(interaction)));
          }
        }
      }
    },
    checks: checks,
    CheckName: CheckName,
    links: links,
    prefix: prefix
  };
  var devTools = defaultExport;

  // tslint:disable-next-line ban-types
  function clone(source) {
    var dest = {};
    for (var prop in source) {
      var value = source[prop];
      if (is.plainObject(value)) {
        dest[prop] = clone(value);
      } else if (is.array(value)) {
        dest[prop] = from(value);
      } else {
        dest[prop] = value;
      }
    }
    return dest;
  }

  var Modification = /*#__PURE__*/function () {
    function Modification(interaction) {
      _classCallCheck(this, Modification);
      this.states = [];
      this.startOffset = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      };
      this.startDelta = void 0;
      this.result = void 0;
      this.endResult = void 0;
      this.startEdges = void 0;
      this.edges = void 0;
      this.interaction = void 0;
      this.interaction = interaction;
      this.result = createResult();
      this.edges = {
        left: false,
        right: false,
        top: false,
        bottom: false
      };
    }
    _createClass(Modification, [{
      key: "start",
      value: function start(_ref, pageCoords) {
        var phase = _ref.phase;
        var interaction = this.interaction;
        var modifierList = getModifierList(interaction);
        this.prepareStates(modifierList);
        this.startEdges = extend({}, interaction.edges);
        this.edges = extend({}, this.startEdges);
        this.startOffset = getRectOffset(interaction.rect, pageCoords);
        this.startDelta = {
          x: 0,
          y: 0
        };
        var arg = this.fillArg({
          phase: phase,
          pageCoords: pageCoords,
          preEnd: false
        });
        this.result = createResult();
        this.startAll(arg);
        var result = this.result = this.setAll(arg);
        return result;
      }
    }, {
      key: "fillArg",
      value: function fillArg(arg) {
        var interaction = this.interaction;
        arg.interaction = interaction;
        arg.interactable = interaction.interactable;
        arg.element = interaction.element;
        arg.rect || (arg.rect = interaction.rect);
        arg.edges || (arg.edges = this.startEdges);
        arg.startOffset = this.startOffset;
        return arg;
      }
    }, {
      key: "startAll",
      value: function startAll(arg) {
        for (var _i2 = 0, _this$states2 = this.states; _i2 < _this$states2.length; _i2++) {
          var state = _this$states2[_i2];
          if (state.methods.start) {
            arg.state = state;
            state.methods.start(arg);
          }
        }
      }
    }, {
      key: "setAll",
      value: function setAll(arg) {
        var phase = arg.phase,
          preEnd = arg.preEnd,
          skipModifiers = arg.skipModifiers,
          unmodifiedRect = arg.rect,
          unmodifiedEdges = arg.edges;
        arg.coords = extend({}, arg.pageCoords);
        arg.rect = extend({}, unmodifiedRect);
        arg.edges = extend({}, unmodifiedEdges);
        var states = skipModifiers ? this.states.slice(skipModifiers) : this.states;
        var newResult = createResult(arg.coords, arg.rect);
        for (var _i4 = 0; _i4 < states.length; _i4++) {
          var _state$methods;
          var state = states[_i4];
          var options = state.options;
          var lastModifierCoords = extend({}, arg.coords);
          var returnValue = null;
          if ((_state$methods = state.methods) != null && _state$methods.set && this.shouldDo(options, preEnd, phase)) {
            arg.state = state;
            returnValue = state.methods.set(arg);
            addEdges(arg.edges, arg.rect, {
              x: arg.coords.x - lastModifierCoords.x,
              y: arg.coords.y - lastModifierCoords.y
            });
          }
          newResult.eventProps.push(returnValue);
        }
        extend(this.edges, arg.edges);
        newResult.delta.x = arg.coords.x - arg.pageCoords.x;
        newResult.delta.y = arg.coords.y - arg.pageCoords.y;
        newResult.rectDelta.left = arg.rect.left - unmodifiedRect.left;
        newResult.rectDelta.right = arg.rect.right - unmodifiedRect.right;
        newResult.rectDelta.top = arg.rect.top - unmodifiedRect.top;
        newResult.rectDelta.bottom = arg.rect.bottom - unmodifiedRect.bottom;
        var prevCoords = this.result.coords;
        var prevRect = this.result.rect;
        if (prevCoords && prevRect) {
          var rectChanged = newResult.rect.left !== prevRect.left || newResult.rect.right !== prevRect.right || newResult.rect.top !== prevRect.top || newResult.rect.bottom !== prevRect.bottom;
          newResult.changed = rectChanged || prevCoords.x !== newResult.coords.x || prevCoords.y !== newResult.coords.y;
        }
        return newResult;
      }
    }, {
      key: "applyToInteraction",
      value: function applyToInteraction(arg) {
        var interaction = this.interaction;
        var phase = arg.phase;
        var curCoords = interaction.coords.cur;
        var startCoords = interaction.coords.start;
        var result = this.result,
          startDelta = this.startDelta;
        var curDelta = result.delta;
        if (phase === 'start') {
          extend(this.startDelta, result.delta);
        }
        for (var _i6 = 0, _ref3 = [[startCoords, startDelta], [curCoords, curDelta]]; _i6 < _ref3.length; _i6++) {
          var _ref3$_i = _ref3[_i6],
            coordsSet = _ref3$_i[0],
            delta = _ref3$_i[1];
          coordsSet.page.x += delta.x;
          coordsSet.page.y += delta.y;
          coordsSet.client.x += delta.x;
          coordsSet.client.y += delta.y;
        }
        var rectDelta = this.result.rectDelta;
        var rect = arg.rect || interaction.rect;
        rect.left += rectDelta.left;
        rect.right += rectDelta.right;
        rect.top += rectDelta.top;
        rect.bottom += rectDelta.bottom;
        rect.width = rect.right - rect.left;
        rect.height = rect.bottom - rect.top;
      }
    }, {
      key: "setAndApply",
      value: function setAndApply(arg) {
        var interaction = this.interaction;
        var phase = arg.phase,
          preEnd = arg.preEnd,
          skipModifiers = arg.skipModifiers;
        var result = this.setAll(this.fillArg({
          preEnd: preEnd,
          phase: phase,
          pageCoords: arg.modifiedCoords || interaction.coords.cur.page
        }));
        this.result = result;

        // don't fire an action move if a modifier would keep the event in the same
        // cordinates as before
        if (!result.changed && (!skipModifiers || skipModifiers < this.states.length) && interaction.interacting()) {
          return false;
        }
        if (arg.modifiedCoords) {
          var page = interaction.coords.cur.page;
          var adjustment = {
            x: arg.modifiedCoords.x - page.x,
            y: arg.modifiedCoords.y - page.y
          };
          result.coords.x += adjustment.x;
          result.coords.y += adjustment.y;
          result.delta.x += adjustment.x;
          result.delta.y += adjustment.y;
        }
        this.applyToInteraction(arg);
      }
    }, {
      key: "beforeEnd",
      value: function beforeEnd(arg) {
        var interaction = arg.interaction,
          event = arg.event;
        var states = this.states;
        if (!states || !states.length) {
          return;
        }
        var doPreend = false;
        for (var _i8 = 0; _i8 < states.length; _i8++) {
          var state = states[_i8];
          arg.state = state;
          var options = state.options,
            methods = state.methods;
          var endPosition = methods.beforeEnd && methods.beforeEnd(arg);
          if (endPosition) {
            this.endResult = endPosition;
            return false;
          }
          doPreend = doPreend || !doPreend && this.shouldDo(options, true, arg.phase, true);
        }
        if (doPreend) {
          // trigger a final modified move before ending
          interaction.move({
            event: event,
            preEnd: true
          });
        }
      }
    }, {
      key: "stop",
      value: function stop(arg) {
        var interaction = arg.interaction;
        if (!this.states || !this.states.length) {
          return;
        }
        var modifierArg = extend({
          states: this.states,
          interactable: interaction.interactable,
          element: interaction.element,
          rect: null
        }, arg);
        this.fillArg(modifierArg);
        for (var _i10 = 0, _this$states4 = this.states; _i10 < _this$states4.length; _i10++) {
          var state = _this$states4[_i10];
          modifierArg.state = state;
          if (state.methods.stop) {
            state.methods.stop(modifierArg);
          }
        }
        this.states = null;
        this.endResult = null;
      }
    }, {
      key: "prepareStates",
      value: function prepareStates(modifierList) {
        this.states = [];
        for (var index = 0; index < modifierList.length; index++) {
          var _modifierList$index = modifierList[index],
            options = _modifierList$index.options,
            methods = _modifierList$index.methods,
            name = _modifierList$index.name;
          this.states.push({
            options: options,
            methods: methods,
            index: index,
            name: name
          });
        }
        return this.states;
      }
    }, {
      key: "restoreInteractionCoords",
      value: function restoreInteractionCoords(_ref4) {
        var _ref4$interaction = _ref4.interaction,
          coords = _ref4$interaction.coords,
          rect = _ref4$interaction.rect,
          modification = _ref4$interaction.modification;
        if (!modification.result) return;
        var startDelta = modification.startDelta;
        var _modification$result = modification.result,
          curDelta = _modification$result.delta,
          rectDelta = _modification$result.rectDelta;
        var coordsAndDeltas = [[coords.start, startDelta], [coords.cur, curDelta]];
        for (var _i12 = 0, _ref6 = coordsAndDeltas; _i12 < _ref6.length; _i12++) {
          var _ref6$_i = _ref6[_i12],
            coordsSet = _ref6$_i[0],
            delta = _ref6$_i[1];
          coordsSet.page.x -= delta.x;
          coordsSet.page.y -= delta.y;
          coordsSet.client.x -= delta.x;
          coordsSet.client.y -= delta.y;
        }
        rect.left -= rectDelta.left;
        rect.right -= rectDelta.right;
        rect.top -= rectDelta.top;
        rect.bottom -= rectDelta.bottom;
      }
    }, {
      key: "shouldDo",
      value: function shouldDo(options, preEnd, phase, requireEndOnly) {
        if (
        // ignore disabled modifiers
        !options || options.enabled === false ||
        // check if we require endOnly option to fire move before end
        requireEndOnly && !options.endOnly ||
        // don't apply endOnly modifiers when not ending
        options.endOnly && !preEnd ||
        // check if modifier should run be applied on start
        phase === 'start' && !options.setStart) {
          return false;
        }
        return true;
      }
    }, {
      key: "copyFrom",
      value: function copyFrom(other) {
        this.startOffset = other.startOffset;
        this.startDelta = other.startDelta;
        this.startEdges = other.startEdges;
        this.edges = other.edges;
        this.states = other.states.map(function (s) {
          return clone(s);
        });
        this.result = createResult(extend({}, other.result.coords), extend({}, other.result.rect));
      }
    }, {
      key: "destroy",
      value: function destroy() {
        for (var prop in this) {
          this[prop] = null;
        }
      }
    }]);
    return Modification;
  }();
  function createResult(coords, rect) {
    return {
      rect: rect,
      coords: coords,
      delta: {
        x: 0,
        y: 0
      },
      rectDelta: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      },
      eventProps: [],
      changed: true
    };
  }
  function getModifierList(interaction) {
    var actionOptions = interaction.interactable.options[interaction.prepared.name];
    var actionModifiers = actionOptions.modifiers;
    if (actionModifiers && actionModifiers.length) {
      return actionModifiers;
    }
    return ['snap', 'snapSize', 'snapEdges', 'restrict', 'restrictEdges', 'restrictSize'].map(function (type) {
      var options = actionOptions[type];
      return options && options.enabled && {
        options: options,
        methods: options._methods
      };
    }).filter(function (m) {
      return !!m;
    });
  }
  function getRectOffset(rect, coords) {
    return rect ? {
      left: coords.x - rect.left,
      top: coords.y - rect.top,
      right: rect.right - coords.x,
      bottom: rect.bottom - coords.y
    } : {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };
  }

  function makeModifier(module, name) {
    var defaults = module.defaults;
    var methods = {
      start: module.start,
      set: module.set,
      beforeEnd: module.beforeEnd,
      stop: module.stop
    };
    var modifier = function modifier(_options) {
      var options = _options || {};
      options.enabled = options.enabled !== false;

      // add missing defaults to options
      for (var prop in defaults) {
        if (!(prop in options)) {
          options[prop] = defaults[prop];
        }
      }
      var m = {
        options: options,
        methods: methods,
        name: name,
        enable: function enable() {
          options.enabled = true;
          return m;
        },
        disable: function disable() {
          options.enabled = false;
          return m;
        }
      };
      return m;
    };
    if (name && typeof name === 'string') {
      // for backwrads compatibility
      modifier._defaults = defaults;
      modifier._methods = methods;
    }
    return modifier;
  }
  function addEventModifiers(_ref) {
    var iEvent = _ref.iEvent,
      interaction = _ref.interaction;
    var result = interaction.modification.result;
    if (result) {
      iEvent.modifiers = result.eventProps;
    }
  }
  var modifiersBase = {
    id: 'modifiers/base',
    before: ['actions'],
    install: function install(scope) {
      scope.defaults.perAction.modifiers = [];
    },
    listeners: {
      'interactions:new': function interactionsNew(_ref2) {
        var interaction = _ref2.interaction;
        interaction.modification = new Modification(interaction);
      },
      'interactions:before-action-start': function interactionsBeforeActionStart(arg) {
        var interaction = arg.interaction;
        var modification = arg.interaction.modification;
        modification.start(arg, interaction.coords.start.page);
        interaction.edges = modification.edges;
        modification.applyToInteraction(arg);
      },
      'interactions:before-action-move': function interactionsBeforeActionMove(arg) {
        var interaction = arg.interaction;
        var modification = interaction.modification;
        var ret = modification.setAndApply(arg);
        interaction.edges = modification.edges;
        return ret;
      },
      'interactions:before-action-end': function interactionsBeforeActionEnd(arg) {
        var interaction = arg.interaction;
        var modification = interaction.modification;
        var ret = modification.beforeEnd(arg);
        interaction.edges = modification.startEdges;
        return ret;
      },
      'interactions:action-start': addEventModifiers,
      'interactions:action-move': addEventModifiers,
      'interactions:action-end': addEventModifiers,
      'interactions:after-action-start': function interactionsAfterActionStart(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      },
      'interactions:after-action-move': function interactionsAfterActionMove(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      },
      'interactions:stop': function interactionsStop(arg) {
        return arg.interaction.modification.stop(arg);
      }
    }
  };
  var base = modifiersBase;

  // eslint-disable-next-line @typescript-eslint/no-empty-interface

  var defaults$7 = {
    base: {
      preventDefault: 'auto',
      deltaSource: 'page'
    },
    perAction: {
      enabled: false,
      origin: {
        x: 0,
        y: 0
      }
    },
    actions: {}
  };

  // defined outside of class definition to avoid assignment of undefined during
  // construction

  var InteractEvent = /*#__PURE__*/function (_BaseEvent) {
    _inherits(InteractEvent, _BaseEvent);
    var _super = _createSuper(InteractEvent);
    function InteractEvent(interaction, event, actionName, phase, element, preEnd, type) {
      var _this;
      _classCallCheck(this, InteractEvent);
      _this = _super.call(this, interaction);
      _this.relatedTarget = null;
      _this.screenX = void 0;
      _this.screenY = void 0;
      _this.button = void 0;
      _this.buttons = void 0;
      _this.ctrlKey = void 0;
      _this.shiftKey = void 0;
      _this.altKey = void 0;
      _this.metaKey = void 0;
      _this.page = void 0;
      _this.client = void 0;
      _this.delta = void 0;
      _this.rect = void 0;
      _this.x0 = void 0;
      _this.y0 = void 0;
      _this.t0 = void 0;
      _this.dt = void 0;
      _this.duration = void 0;
      _this.clientX0 = void 0;
      _this.clientY0 = void 0;
      _this.velocity = void 0;
      _this.speed = void 0;
      _this.swipe = void 0;
      // resize
      _this.axes = void 0;
      /** @internal */
      _this.preEnd = void 0;
      element = element || interaction.element;
      var target = interaction.interactable;
      var deltaSource = (target && target.options || defaults$7).deltaSource;
      var origin = getOriginXY(target, element, actionName);
      var starting = phase === 'start';
      var ending = phase === 'end';
      var prevEvent = starting ? _assertThisInitialized(_this) : interaction.prevEvent;
      var coords = starting ? interaction.coords.start : ending ? {
        page: prevEvent.page,
        client: prevEvent.client,
        timeStamp: interaction.coords.cur.timeStamp
      } : interaction.coords.cur;
      _this.page = extend({}, coords.page);
      _this.client = extend({}, coords.client);
      _this.rect = extend({}, interaction.rect);
      _this.timeStamp = coords.timeStamp;
      if (!ending) {
        _this.page.x -= origin.x;
        _this.page.y -= origin.y;
        _this.client.x -= origin.x;
        _this.client.y -= origin.y;
      }
      _this.ctrlKey = event.ctrlKey;
      _this.altKey = event.altKey;
      _this.shiftKey = event.shiftKey;
      _this.metaKey = event.metaKey;
      _this.button = event.button;
      _this.buttons = event.buttons;
      _this.target = element;
      _this.currentTarget = element;
      _this.preEnd = preEnd;
      _this.type = type || actionName + (phase || '');
      _this.interactable = target;
      _this.t0 = starting ? interaction.pointers[interaction.pointers.length - 1].downTime : prevEvent.t0;
      _this.x0 = interaction.coords.start.page.x - origin.x;
      _this.y0 = interaction.coords.start.page.y - origin.y;
      _this.clientX0 = interaction.coords.start.client.x - origin.x;
      _this.clientY0 = interaction.coords.start.client.y - origin.y;
      if (starting || ending) {
        _this.delta = {
          x: 0,
          y: 0
        };
      } else {
        _this.delta = {
          x: _this[deltaSource].x - prevEvent[deltaSource].x,
          y: _this[deltaSource].y - prevEvent[deltaSource].y
        };
      }
      _this.dt = interaction.coords.delta.timeStamp;
      _this.duration = _this.timeStamp - _this.t0;

      // velocity and speed in pixels per second
      _this.velocity = extend({}, interaction.coords.velocity[deltaSource]);
      _this.speed = hypot(_this.velocity.x, _this.velocity.y);
      _this.swipe = ending || phase === 'inertiastart' ? _this.getSwipe() : null;
      return _this;
    }
    _createClass(InteractEvent, [{
      key: "getSwipe",
      value: function getSwipe() {
        var interaction = this._interaction;
        if (interaction.prevEvent.speed < 600 || this.timeStamp - interaction.prevEvent.timeStamp > 150) {
          return null;
        }
        var angle = 180 * Math.atan2(interaction.prevEvent.velocityY, interaction.prevEvent.velocityX) / Math.PI;
        var overlap = 22.5;
        if (angle < 0) {
          angle += 360;
        }
        var left = 135 - overlap <= angle && angle < 225 + overlap;
        var up = 225 - overlap <= angle && angle < 315 + overlap;
        var right = !left && (315 - overlap <= angle || angle < 45 + overlap);
        var down = !up && 45 - overlap <= angle && angle < 135 + overlap;
        return {
          up: up,
          down: down,
          left: left,
          right: right,
          angle: angle,
          speed: interaction.prevEvent.speed,
          velocity: {
            x: interaction.prevEvent.velocityX,
            y: interaction.prevEvent.velocityY
          }
        };
      }
    }, {
      key: "preventDefault",
      value: function preventDefault() {}

      /**
       * Don't call listeners on the remaining targets
       */
    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.immediatePropagationStopped = this.propagationStopped = true;
      }

      /**
       * Don't call any other listeners (even on the current target)
       */
    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.propagationStopped = true;
      }
    }]);
    return InteractEvent;
  }(BaseEvent);

  // getters and setters defined here to support typescript 3.6 and below which
  // don't support getter and setters in .d.ts files
  Object.defineProperties(InteractEvent.prototype, {
    pageX: {
      get: function get() {
        return this.page.x;
      },
      set: function set(value) {
        this.page.x = value;
      }
    },
    pageY: {
      get: function get() {
        return this.page.y;
      },
      set: function set(value) {
        this.page.y = value;
      }
    },
    clientX: {
      get: function get() {
        return this.client.x;
      },
      set: function set(value) {
        this.client.x = value;
      }
    },
    clientY: {
      get: function get() {
        return this.client.y;
      },
      set: function set(value) {
        this.client.y = value;
      }
    },
    dx: {
      get: function get() {
        return this.delta.x;
      },
      set: function set(value) {
        this.delta.x = value;
      }
    },
    dy: {
      get: function get() {
        return this.delta.y;
      },
      set: function set(value) {
        this.delta.y = value;
      }
    },
    velocityX: {
      get: function get() {
        return this.velocity.x;
      },
      set: function set(value) {
        this.velocity.x = value;
      }
    },
    velocityY: {
      get: function get() {
        return this.velocity.y;
      },
      set: function set(value) {
        this.velocity.y = value;
      }
    }
  });

  var PointerInfo = /*#__PURE__*/_createClass(function PointerInfo(id, pointer, event, downTime, downTarget) {
    _classCallCheck(this, PointerInfo);
    this.id = void 0;
    this.pointer = void 0;
    this.event = void 0;
    this.downTime = void 0;
    this.downTarget = void 0;
    this.id = id;
    this.pointer = pointer;
    this.event = event;
    this.downTime = downTime;
    this.downTarget = downTarget;
  });

  var _ProxyValues = /*#__PURE__*/function (_ProxyValues) {
    _ProxyValues["interactable"] = "";
    _ProxyValues["element"] = "";
    _ProxyValues["prepared"] = "";
    _ProxyValues["pointerIsDown"] = "";
    _ProxyValues["pointerWasMoved"] = "";
    _ProxyValues["_proxy"] = "";
    return _ProxyValues;
  }({});
  var _ProxyMethods = /*#__PURE__*/function (_ProxyMethods) {
    _ProxyMethods["start"] = "";
    _ProxyMethods["move"] = "";
    _ProxyMethods["end"] = "";
    _ProxyMethods["stop"] = "";
    _ProxyMethods["interacting"] = "";
    return _ProxyMethods;
  }({});
  var idCounter = 0;
  var Interaction = /*#__PURE__*/function () {
    function Interaction(_ref) {
      var _this = this;
      var pointerType = _ref.pointerType,
        scopeFire = _ref.scopeFire;
      _classCallCheck(this, Interaction);
      /** current interactable being interacted with */
      this.interactable = null;
      /** the target element of the interactable */
      this.element = null;
      this.rect = null;
      /** @internal */
      this._rects = void 0;
      /** @internal */
      this.edges = null;
      /** @internal */
      this._scopeFire = void 0;
      // action that's ready to be fired on next move event
      this.prepared = {
        name: null,
        axis: null,
        edges: null
      };
      this.pointerType = void 0;
      /** @internal keep track of added pointers */
      this.pointers = [];
      /** @internal pointerdown/mousedown/touchstart event */
      this.downEvent = null;
      /** @internal */
      this.downPointer = {};
      /** @internal */
      this._latestPointer = {
        pointer: null,
        event: null,
        eventTarget: null
      };
      /** @internal */
      this.prevEvent = null;
      this.pointerIsDown = false;
      this.pointerWasMoved = false;
      /** @internal */
      this._interacting = false;
      /** @internal */
      this._ending = false;
      /** @internal */
      this._stopped = true;
      /** @internal */
      this._proxy = void 0;
      /** @internal */
      this.simulation = null;
      this.doMove = warnOnce(function (signalArg) {
        this.move(signalArg);
      }, 'The interaction.doMove() method has been renamed to interaction.move()');
      this.coords = {
        // Starting InteractEvent pointer coordinates
        start: newCoords(),
        // Previous native pointer move event coordinates
        prev: newCoords(),
        // current native pointer move event coordinates
        cur: newCoords(),
        // Change in coordinates and time of the pointer
        delta: newCoords(),
        // pointer velocity
        velocity: newCoords()
      };
      /** @internal */
      this._id = idCounter++;
      this._scopeFire = scopeFire;
      this.pointerType = pointerType;
      var that = this;
      this._proxy = {};
      var _loop = function _loop(key) {
        Object.defineProperty(_this._proxy, key, {
          get: function get() {
            return that[key];
          }
        });
      };
      for (var key in _ProxyValues) {
        _loop(key);
      }
      var _loop2 = function _loop2(_key) {
        Object.defineProperty(_this._proxy, _key, {
          value: function value() {
            return that[_key].apply(that, arguments);
          }
        });
      };
      for (var _key in _ProxyMethods) {
        _loop2(_key);
      }
      this._scopeFire('interactions:new', {
        interaction: this
      });
    }
    _createClass(Interaction, [{
      key: "pointerMoveTolerance",
      get: /** @internal */function get() {
        return 1;
      }
    }, {
      key: "pointerDown",
      value: function pointerDown(pointer, event, eventTarget) {
        var pointerIndex = this.updatePointer(pointer, event, eventTarget, true);
        var pointerInfo = this.pointers[pointerIndex];
        this._scopeFire('interactions:down', {
          pointer: pointer,
          event: event,
          eventTarget: eventTarget,
          pointerIndex: pointerIndex,
          pointerInfo: pointerInfo,
          type: 'down',
          interaction: this
        });
      }

      /**
       * ```js
       * interact(target)
       *   .draggable({
       *     // disable the default drag start by down->move
       *     manualStart: true
       *   })
       *   // start dragging after the user holds the pointer down
       *   .on('hold', function (event) {
       *     var interaction = event.interaction
       *
       *     if (!interaction.interacting()) {
       *       interaction.start({ name: 'drag' },
       *                         event.interactable,
       *                         event.currentTarget)
       *     }
       * })
       * ```
       *
       * Start an action with the given Interactable and Element as tartgets. The
       * action must be enabled for the target Interactable and an appropriate
       * number of pointers must be held down - 1 for drag/resize, 2 for gesture.
       *
       * Use it with `interactable.<action>able({ manualStart: false })` to always
       * [start actions manually](https://github.com/taye/interact.js/issues/114)
       *
       * @param action - The action to be performed - drag, resize, etc.
       * @param target - The Interactable to target
       * @param element - The DOM Element to target
       * @returns Whether the interaction was successfully started
       */
    }, {
      key: "start",
      value: function start(action, interactable, element) {
        if (this.interacting() || !this.pointerIsDown || this.pointers.length < (action.name === 'gesture' ? 2 : 1) || !interactable.options[action.name].enabled) {
          return false;
        }
        copyAction(this.prepared, action);
        this.interactable = interactable;
        this.element = element;
        this.rect = interactable.getRect(element);
        this.edges = this.prepared.edges ? extend({}, this.prepared.edges) : {
          left: true,
          right: true,
          top: true,
          bottom: true
        };
        this._stopped = false;
        this._interacting = this._doPhase({
          interaction: this,
          event: this.downEvent,
          phase: 'start'
        }) && !this._stopped;
        return this._interacting;
      }
    }, {
      key: "pointerMove",
      value: function pointerMove(pointer, event, eventTarget) {
        if (!this.simulation && !(this.modification && this.modification.endResult)) {
          this.updatePointer(pointer, event, eventTarget, false);
        }
        var duplicateMove = this.coords.cur.page.x === this.coords.prev.page.x && this.coords.cur.page.y === this.coords.prev.page.y && this.coords.cur.client.x === this.coords.prev.client.x && this.coords.cur.client.y === this.coords.prev.client.y;
        var dx;
        var dy;

        // register movement greater than pointerMoveTolerance
        if (this.pointerIsDown && !this.pointerWasMoved) {
          dx = this.coords.cur.client.x - this.coords.start.client.x;
          dy = this.coords.cur.client.y - this.coords.start.client.y;
          this.pointerWasMoved = hypot(dx, dy) > this.pointerMoveTolerance;
        }
        var pointerIndex = this.getPointerIndex(pointer);
        var signalArg = {
          pointer: pointer,
          pointerIndex: pointerIndex,
          pointerInfo: this.pointers[pointerIndex],
          event: event,
          type: 'move',
          eventTarget: eventTarget,
          dx: dx,
          dy: dy,
          duplicate: duplicateMove,
          interaction: this
        };
        if (!duplicateMove) {
          // set pointer coordinate, time changes and velocity
          setCoordVelocity(this.coords.velocity, this.coords.delta);
        }
        this._scopeFire('interactions:move', signalArg);
        if (!duplicateMove && !this.simulation) {
          // if interacting, fire an 'action-move' signal etc
          if (this.interacting()) {
            signalArg.type = null;
            this.move(signalArg);
          }
          if (this.pointerWasMoved) {
            copyCoords(this.coords.prev, this.coords.cur);
          }
        }
      }

      /**
       * ```js
       * interact(target)
       *   .draggable(true)
       *   .on('dragmove', function (event) {
       *     if (someCondition) {
       *       // change the snap settings
       *       event.interactable.draggable({ snap: { targets: [] }})
       *       // fire another move event with re-calculated snap
       *       event.interaction.move()
       *     }
       *   })
       * ```
       *
       * Force a move of the current action at the same coordinates. Useful if
       * snap/restrict has been changed and you want a movement with the new
       * settings.
       */
    }, {
      key: "move",
      value: function move(signalArg) {
        if (!signalArg || !signalArg.event) {
          setZeroCoords(this.coords.delta);
        }
        signalArg = extend({
          pointer: this._latestPointer.pointer,
          event: this._latestPointer.event,
          eventTarget: this._latestPointer.eventTarget,
          interaction: this
        }, signalArg || {});
        signalArg.phase = 'move';
        this._doPhase(signalArg);
      }

      /**
       * @internal
       * End interact move events and stop auto-scroll unless simulation is running
       */
    }, {
      key: "pointerUp",
      value: function pointerUp(pointer, event, eventTarget, curEventTarget) {
        var pointerIndex = this.getPointerIndex(pointer);
        if (pointerIndex === -1) {
          pointerIndex = this.updatePointer(pointer, event, eventTarget, false);
        }
        var type = /cancel$/i.test(event.type) ? 'cancel' : 'up';
        this._scopeFire("interactions:".concat(type), {
          pointer: pointer,
          pointerIndex: pointerIndex,
          pointerInfo: this.pointers[pointerIndex],
          event: event,
          eventTarget: eventTarget,
          type: type,
          curEventTarget: curEventTarget,
          interaction: this
        });
        if (!this.simulation) {
          this.end(event);
        }
        this.removePointer(pointer, event);
      }

      /** @internal */
    }, {
      key: "documentBlur",
      value: function documentBlur(event) {
        this.end(event);
        this._scopeFire('interactions:blur', {
          event: event,
          type: 'blur',
          interaction: this
        });
      }

      /**
       * ```js
       * interact(target)
       *   .draggable(true)
       *   .on('move', function (event) {
       *     if (event.pageX > 1000) {
       *       // end the current action
       *       event.interaction.end()
       *       // stop all further listeners from being called
       *       event.stopImmediatePropagation()
       *     }
       *   })
       * ```
       */
    }, {
      key: "end",
      value: function end(event) {
        this._ending = true;
        event = event || this._latestPointer.event;
        var endPhaseResult;
        if (this.interacting()) {
          endPhaseResult = this._doPhase({
            event: event,
            interaction: this,
            phase: 'end'
          });
        }
        this._ending = false;
        if (endPhaseResult === true) {
          this.stop();
        }
      }
    }, {
      key: "currentAction",
      value: function currentAction() {
        return this._interacting ? this.prepared.name : null;
      }
    }, {
      key: "interacting",
      value: function interacting() {
        return this._interacting;
      }
    }, {
      key: "stop",
      value: function stop() {
        this._scopeFire('interactions:stop', {
          interaction: this
        });
        this.interactable = this.element = null;
        this._interacting = false;
        this._stopped = true;
        this.prepared.name = this.prevEvent = null;
      }

      /** @internal */
    }, {
      key: "getPointerIndex",
      value: function getPointerIndex(pointer) {
        var pointerId = getPointerId(pointer);

        // mouse and pen interactions may have only one pointer
        return this.pointerType === 'mouse' || this.pointerType === 'pen' ? this.pointers.length - 1 : findIndex(this.pointers, function (curPointer) {
          return curPointer.id === pointerId;
        });
      }

      /** @internal */
    }, {
      key: "getPointerInfo",
      value: function getPointerInfo(pointer) {
        return this.pointers[this.getPointerIndex(pointer)];
      }

      /** @internal */
    }, {
      key: "updatePointer",
      value: function updatePointer(pointer, event, eventTarget, down) {
        var id = getPointerId(pointer);
        var pointerIndex = this.getPointerIndex(pointer);
        var pointerInfo = this.pointers[pointerIndex];
        down = down === false ? false : down || /(down|start)$/i.test(event.type);
        if (!pointerInfo) {
          pointerInfo = new PointerInfo(id, pointer, event, null, null);
          pointerIndex = this.pointers.length;
          this.pointers.push(pointerInfo);
        } else {
          pointerInfo.pointer = pointer;
        }
        setCoords(this.coords.cur, this.pointers.map(function (p) {
          return p.pointer;
        }), this._now());
        setCoordDeltas(this.coords.delta, this.coords.prev, this.coords.cur);
        if (down) {
          this.pointerIsDown = true;
          pointerInfo.downTime = this.coords.cur.timeStamp;
          pointerInfo.downTarget = eventTarget;
          pointerExtend(this.downPointer, pointer);
          if (!this.interacting()) {
            copyCoords(this.coords.start, this.coords.cur);
            copyCoords(this.coords.prev, this.coords.cur);
            this.downEvent = event;
            this.pointerWasMoved = false;
          }
        }
        this._updateLatestPointer(pointer, event, eventTarget);
        this._scopeFire('interactions:update-pointer', {
          pointer: pointer,
          event: event,
          eventTarget: eventTarget,
          down: down,
          pointerInfo: pointerInfo,
          pointerIndex: pointerIndex,
          interaction: this
        });
        return pointerIndex;
      }

      /** @internal */
    }, {
      key: "removePointer",
      value: function removePointer(pointer, event) {
        var pointerIndex = this.getPointerIndex(pointer);
        if (pointerIndex === -1) return;
        var pointerInfo = this.pointers[pointerIndex];
        this._scopeFire('interactions:remove-pointer', {
          pointer: pointer,
          event: event,
          eventTarget: null,
          pointerIndex: pointerIndex,
          pointerInfo: pointerInfo,
          interaction: this
        });
        this.pointers.splice(pointerIndex, 1);
        this.pointerIsDown = false;
      }

      /** @internal */
    }, {
      key: "_updateLatestPointer",
      value: function _updateLatestPointer(pointer, event, eventTarget) {
        this._latestPointer.pointer = pointer;
        this._latestPointer.event = event;
        this._latestPointer.eventTarget = eventTarget;
      }
    }, {
      key: "destroy",
      value: function destroy() {
        this._latestPointer.pointer = null;
        this._latestPointer.event = null;
        this._latestPointer.eventTarget = null;
      }

      /** @internal */
    }, {
      key: "_createPreparedEvent",
      value: function _createPreparedEvent(event, phase, preEnd, type) {
        return new InteractEvent(this, event, this.prepared.name, phase, this.element, preEnd, type);
      }

      /** @internal */
    }, {
      key: "_fireEvent",
      value: function _fireEvent(iEvent) {
        var _this$interactable;
        (_this$interactable = this.interactable) == null ? void 0 : _this$interactable.fire(iEvent);
        if (!this.prevEvent || iEvent.timeStamp >= this.prevEvent.timeStamp) {
          this.prevEvent = iEvent;
        }
      }

      /** @internal */
    }, {
      key: "_doPhase",
      value: function _doPhase(signalArg) {
        var event = signalArg.event,
          phase = signalArg.phase,
          preEnd = signalArg.preEnd,
          type = signalArg.type;
        var rect = this.rect;
        if (rect && phase === 'move') {
          // update the rect changes due to pointer move
          addEdges(this.edges, rect, this.coords.delta[this.interactable.options.deltaSource]);
          rect.width = rect.right - rect.left;
          rect.height = rect.bottom - rect.top;
        }
        var beforeResult = this._scopeFire("interactions:before-action-".concat(phase), signalArg);
        if (beforeResult === false) {
          return false;
        }
        var iEvent = signalArg.iEvent = this._createPreparedEvent(event, phase, preEnd, type);
        this._scopeFire("interactions:action-".concat(phase), signalArg);
        if (phase === 'start') {
          this.prevEvent = iEvent;
        }
        this._fireEvent(iEvent);
        this._scopeFire("interactions:after-action-".concat(phase), signalArg);
        return true;
      }

      /** @internal */
    }, {
      key: "_now",
      value: function _now() {
        return Date.now();
      }
    }]);
    return Interaction;
  }();

  _ProxyMethods.offsetBy = '';
  function addTotal(interaction) {
    if (!interaction.pointerIsDown) {
      return;
    }
    addToCoords(interaction.coords.cur, interaction.offset.total);
    interaction.offset.pending.x = 0;
    interaction.offset.pending.y = 0;
  }
  function beforeAction(_ref) {
    var interaction = _ref.interaction;
    applyPending(interaction);
  }
  function beforeEnd(_ref2) {
    var interaction = _ref2.interaction;
    var hadPending = applyPending(interaction);
    if (!hadPending) return;
    interaction.move({
      offset: true
    });
    interaction.end();
    return false;
  }
  function end(_ref3) {
    var interaction = _ref3.interaction;
    interaction.offset.total.x = 0;
    interaction.offset.total.y = 0;
    interaction.offset.pending.x = 0;
    interaction.offset.pending.y = 0;
  }
  function applyPending(interaction) {
    if (!hasPending(interaction)) {
      return false;
    }
    var pending = interaction.offset.pending;
    addToCoords(interaction.coords.cur, pending);
    addToCoords(interaction.coords.delta, pending);
    addEdges(interaction.edges, interaction.rect, pending);
    pending.x = 0;
    pending.y = 0;
    return true;
  }
  function offsetBy(_ref4) {
    var x = _ref4.x,
      y = _ref4.y;
    this.offset.pending.x += x;
    this.offset.pending.y += y;
    this.offset.total.x += x;
    this.offset.total.y += y;
  }
  function addToCoords(_ref5, _ref6) {
    var page = _ref5.page,
      client = _ref5.client;
    var x = _ref6.x,
      y = _ref6.y;
    page.x += x;
    page.y += y;
    client.x += x;
    client.y += y;
  }
  function hasPending(interaction) {
    return !!(interaction.offset.pending.x || interaction.offset.pending.y);
  }
  var offset = {
    id: 'offset',
    before: ['modifiers', 'pointer-events', 'actions', 'inertia'],
    install: function install(scope) {
      scope.Interaction.prototype.offsetBy = offsetBy;
    },
    listeners: {
      'interactions:new': function interactionsNew(_ref7) {
        var interaction = _ref7.interaction;
        interaction.offset = {
          total: {
            x: 0,
            y: 0
          },
          pending: {
            x: 0,
            y: 0
          }
        };
      },
      'interactions:update-pointer': function interactionsUpdatePointer(_ref8) {
        var interaction = _ref8.interaction;
        return addTotal(interaction);
      },
      'interactions:before-action-start': beforeAction,
      'interactions:before-action-move': beforeAction,
      'interactions:before-action-end': beforeEnd,
      'interactions:stop': end
    }
  };
  var offset$1 = offset;

  function install$6(scope) {
    var defaults = scope.defaults;
    scope.usePlugin(offset$1);
    scope.usePlugin(base);
    scope.actions.phases.inertiastart = true;
    scope.actions.phases.resume = true;
    defaults.perAction.inertia = {
      enabled: false,
      resistance: 10,
      // the lambda in exponential decay
      minSpeed: 100,
      // target speed must be above this for inertia to start
      endSpeed: 10,
      // the speed at which inertia is slow enough to stop
      allowResume: true,
      // allow resuming an action in inertia phase
      smoothEndDuration: 300 // animate to snap/restrict endOnly if there's no inertia
    };
  }
  var InertiaState = /*#__PURE__*/function () {
    function InertiaState(interaction) {
      _classCallCheck(this, InertiaState);
      this.active = false;
      this.isModified = false;
      this.smoothEnd = false;
      this.allowResume = false;
      this.modification = void 0;
      this.modifierCount = 0;
      this.modifierArg = void 0;
      this.startCoords = void 0;
      this.t0 = 0;
      this.v0 = 0;
      this.te = 0;
      this.targetOffset = void 0;
      this.modifiedOffset = void 0;
      this.currentOffset = void 0;
      this.lambda_v0 = 0;
      // eslint-disable-line camelcase
      this.one_ve_v0 = 0;
      // eslint-disable-line camelcase
      this.timeout = void 0;
      this.interaction = void 0;
      this.interaction = interaction;
    }
    _createClass(InertiaState, [{
      key: "start",
      value: function start(event) {
        var interaction = this.interaction;
        var options = getOptions$1(interaction);
        if (!options || !options.enabled) {
          return false;
        }
        var velocityClient = interaction.coords.velocity.client;
        var pointerSpeed = hypot(velocityClient.x, velocityClient.y);
        var modification = this.modification || (this.modification = new Modification(interaction));
        modification.copyFrom(interaction.modification);
        this.t0 = interaction._now();
        this.allowResume = options.allowResume;
        this.v0 = pointerSpeed;
        this.currentOffset = {
          x: 0,
          y: 0
        };
        this.startCoords = interaction.coords.cur.page;
        this.modifierArg = modification.fillArg({
          pageCoords: this.startCoords,
          preEnd: true,
          phase: 'inertiastart'
        });
        var thrown = this.t0 - interaction.coords.cur.timeStamp < 50 && pointerSpeed > options.minSpeed && pointerSpeed > options.endSpeed;
        if (thrown) {
          this.startInertia();
        } else {
          modification.result = modification.setAll(this.modifierArg);
          if (!modification.result.changed) {
            return false;
          }
          this.startSmoothEnd();
        }

        // force modification change
        interaction.modification.result.rect = null;

        // bring inertiastart event to the target coords
        interaction.offsetBy(this.targetOffset);
        interaction._doPhase({
          interaction: interaction,
          event: event,
          phase: 'inertiastart'
        });
        interaction.offsetBy({
          x: -this.targetOffset.x,
          y: -this.targetOffset.y
        });
        // force modification change
        interaction.modification.result.rect = null;
        this.active = true;
        interaction.simulation = this;
        return true;
      }
    }, {
      key: "startInertia",
      value: function startInertia() {
        var _this = this;
        var startVelocity = this.interaction.coords.velocity.client;
        var options = getOptions$1(this.interaction);
        var lambda = options.resistance;
        var inertiaDur = -Math.log(options.endSpeed / this.v0) / lambda;
        this.targetOffset = {
          x: (startVelocity.x - inertiaDur) / lambda,
          y: (startVelocity.y - inertiaDur) / lambda
        };
        this.te = inertiaDur;
        this.lambda_v0 = lambda / this.v0;
        this.one_ve_v0 = 1 - options.endSpeed / this.v0;
        var modification = this.modification,
          modifierArg = this.modifierArg;
        modifierArg.pageCoords = {
          x: this.startCoords.x + this.targetOffset.x,
          y: this.startCoords.y + this.targetOffset.y
        };
        modification.result = modification.setAll(modifierArg);
        if (modification.result.changed) {
          this.isModified = true;
          this.modifiedOffset = {
            x: this.targetOffset.x + modification.result.delta.x,
            y: this.targetOffset.y + modification.result.delta.y
          };
        }
        this.onNextFrame(function () {
          return _this.inertiaTick();
        });
      }
    }, {
      key: "startSmoothEnd",
      value: function startSmoothEnd() {
        var _this2 = this;
        this.smoothEnd = true;
        this.isModified = true;
        this.targetOffset = {
          x: this.modification.result.delta.x,
          y: this.modification.result.delta.y
        };
        this.onNextFrame(function () {
          return _this2.smoothEndTick();
        });
      }
    }, {
      key: "onNextFrame",
      value: function onNextFrame(tickFn) {
        var _this3 = this;
        this.timeout = raf.request(function () {
          if (_this3.active) {
            tickFn();
          }
        });
      }
    }, {
      key: "inertiaTick",
      value: function inertiaTick() {
        var _this4 = this;
        var interaction = this.interaction;
        var options = getOptions$1(interaction);
        var lambda = options.resistance;
        var t = (interaction._now() - this.t0) / 1000;
        if (t < this.te) {
          var progress = 1 - (Math.exp(-lambda * t) - this.lambda_v0) / this.one_ve_v0;
          var newOffset;
          if (this.isModified) {
            newOffset = getQuadraticCurvePoint(0, 0, this.targetOffset.x, this.targetOffset.y, this.modifiedOffset.x, this.modifiedOffset.y, progress);
          } else {
            newOffset = {
              x: this.targetOffset.x * progress,
              y: this.targetOffset.y * progress
            };
          }
          var delta = {
            x: newOffset.x - this.currentOffset.x,
            y: newOffset.y - this.currentOffset.y
          };
          this.currentOffset.x += delta.x;
          this.currentOffset.y += delta.y;
          interaction.offsetBy(delta);
          interaction.move();
          this.onNextFrame(function () {
            return _this4.inertiaTick();
          });
        } else {
          interaction.offsetBy({
            x: this.modifiedOffset.x - this.currentOffset.x,
            y: this.modifiedOffset.y - this.currentOffset.y
          });
          this.end();
        }
      }
    }, {
      key: "smoothEndTick",
      value: function smoothEndTick() {
        var _this5 = this;
        var interaction = this.interaction;
        var t = interaction._now() - this.t0;
        var _getOptions = getOptions$1(interaction),
          duration = _getOptions.smoothEndDuration;
        if (t < duration) {
          var newOffset = {
            x: easeOutQuad(t, 0, this.targetOffset.x, duration),
            y: easeOutQuad(t, 0, this.targetOffset.y, duration)
          };
          var delta = {
            x: newOffset.x - this.currentOffset.x,
            y: newOffset.y - this.currentOffset.y
          };
          this.currentOffset.x += delta.x;
          this.currentOffset.y += delta.y;
          interaction.offsetBy(delta);
          interaction.move({
            skipModifiers: this.modifierCount
          });
          this.onNextFrame(function () {
            return _this5.smoothEndTick();
          });
        } else {
          interaction.offsetBy({
            x: this.targetOffset.x - this.currentOffset.x,
            y: this.targetOffset.y - this.currentOffset.y
          });
          this.end();
        }
      }
    }, {
      key: "resume",
      value: function resume(_ref) {
        var pointer = _ref.pointer,
          event = _ref.event,
          eventTarget = _ref.eventTarget;
        var interaction = this.interaction;

        // undo inertia changes to interaction coords
        interaction.offsetBy({
          x: -this.currentOffset.x,
          y: -this.currentOffset.y
        });

        // update pointer at pointer down position
        interaction.updatePointer(pointer, event, eventTarget, true);

        // fire resume signals and event
        interaction._doPhase({
          interaction: interaction,
          event: event,
          phase: 'resume'
        });
        copyCoords(interaction.coords.prev, interaction.coords.cur);
        this.stop();
      }
    }, {
      key: "end",
      value: function end() {
        this.interaction.move();
        this.interaction.end();
        this.stop();
      }
    }, {
      key: "stop",
      value: function stop() {
        this.active = this.smoothEnd = false;
        this.interaction.simulation = null;
        raf.cancel(this.timeout);
      }
    }]);
    return InertiaState;
  }();
  function start$6(_ref2) {
    var interaction = _ref2.interaction,
      event = _ref2.event;
    if (!interaction._interacting || interaction.simulation) {
      return null;
    }
    var started = interaction.inertia.start(event);

    // prevent action end if inertia or smoothEnd
    return started ? false : null;
  }

  // Check if the down event hits the current inertia target
  // control should be return to the user
  function resume(arg) {
    var interaction = arg.interaction,
      eventTarget = arg.eventTarget;
    var state = interaction.inertia;
    if (!state.active) return;
    var element = eventTarget;

    // climb up the DOM tree from the event target
    while (is.element(element)) {
      // if interaction element is the current inertia target element
      if (element === interaction.element) {
        state.resume(arg);
        break;
      }
      element = parentNode(element);
    }
  }
  function stop(_ref3) {
    var interaction = _ref3.interaction;
    var state = interaction.inertia;
    if (state.active) {
      state.stop();
    }
  }
  function getOptions$1(_ref4) {
    var interactable = _ref4.interactable,
      prepared = _ref4.prepared;
    return interactable && interactable.options && prepared.name && interactable.options[prepared.name].inertia;
  }
  var inertia = {
    id: 'inertia',
    before: ['modifiers', 'actions'],
    install: install$6,
    listeners: {
      'interactions:new': function interactionsNew(_ref5) {
        var interaction = _ref5.interaction;
        interaction.inertia = new InertiaState(interaction);
      },
      'interactions:before-action-end': start$6,
      'interactions:down': resume,
      'interactions:stop': stop,
      'interactions:before-action-resume': function interactionsBeforeActionResume(arg) {
        var modification = arg.interaction.modification;
        modification.stop(arg);
        modification.start(arg, arg.interaction.coords.cur.page);
        modification.applyToInteraction(arg);
      },
      'interactions:before-action-inertiastart': function interactionsBeforeActionInertiastart(arg) {
        return arg.interaction.modification.setAndApply(arg);
      },
      'interactions:action-resume': addEventModifiers,
      'interactions:action-inertiastart': addEventModifiers,
      'interactions:after-action-inertiastart': function interactionsAfterActionInertiastart(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      },
      'interactions:after-action-resume': function interactionsAfterActionResume(arg) {
        return arg.interaction.modification.restoreInteractionCoords(arg);
      }
    }
  };

  // http://stackoverflow.com/a/5634528/2280888
  function _getQBezierValue(t, p1, p2, p3) {
    var iT = 1 - t;
    return iT * iT * p1 + 2 * iT * t * p2 + t * t * p3;
  }
  function getQuadraticCurvePoint(startX, startY, cpX, cpY, endX, endY, position) {
    return {
      x: _getQBezierValue(position, startX, cpX, endX),
      y: _getQBezierValue(position, startY, cpY, endY)
    };
  }

  // http://gizma.com/easing/
  function easeOutQuad(t, b, c, d) {
    t /= d;
    return -c * t * (t - 2) + b;
  }
  var inertia$1 = inertia;

  function fireUntilImmediateStopped(event, listeners) {
    for (var _i2 = 0; _i2 < listeners.length; _i2++) {
      var listener = listeners[_i2];
      if (event.immediatePropagationStopped) {
        break;
      }
      listener(event);
    }
  }
  var Eventable = /*#__PURE__*/function () {
    function Eventable(options) {
      _classCallCheck(this, Eventable);
      this.options = void 0;
      this.types = {};
      this.propagationStopped = false;
      this.immediatePropagationStopped = false;
      this.global = void 0;
      this.options = extend({}, options || {});
    }
    _createClass(Eventable, [{
      key: "fire",
      value: function fire(event) {
        var listeners;
        var global = this.global;

        // Interactable#on() listeners
        // tslint:disable no-conditional-assignment
        if (listeners = this.types[event.type]) {
          fireUntilImmediateStopped(event, listeners);
        }

        // interact.on() listeners
        if (!event.propagationStopped && global && (listeners = global[event.type])) {
          fireUntilImmediateStopped(event, listeners);
        }
      }
    }, {
      key: "on",
      value: function on(type, listener) {
        var listeners = normalize(type, listener);
        for (type in listeners) {
          this.types[type] = merge(this.types[type] || [], listeners[type]);
        }
      }
    }, {
      key: "off",
      value: function off(type, listener) {
        var listeners = normalize(type, listener);
        for (type in listeners) {
          var eventList = this.types[type];
          if (!eventList || !eventList.length) {
            continue;
          }
          for (var _i4 = 0, _listeners$type2 = listeners[type]; _i4 < _listeners$type2.length; _i4++) {
            var subListener = _listeners$type2[_i4];
            var _index = eventList.indexOf(subListener);
            if (_index !== -1) {
              eventList.splice(_index, 1);
            }
          }
        }
      }
    }, {
      key: "getRect",
      value: function getRect(_element) {
        return null;
      }
    }]);
    return Eventable;
  }();

  function install$5(scope) {
    var _scope$document;
    var targets = [];
    var delegatedEvents = {};
    var documents = [];
    var eventsMethods = {
      add: add,
      remove: remove,
      addDelegate: addDelegate,
      removeDelegate: removeDelegate,
      delegateListener: delegateListener,
      delegateUseCapture: delegateUseCapture,
      delegatedEvents: delegatedEvents,
      documents: documents,
      targets: targets,
      supportsOptions: false,
      supportsPassive: false
    };

    // check if browser supports passive events and options arg
    (_scope$document = scope.document) == null ? void 0 : _scope$document.createElement('div').addEventListener('test', null, {
      get capture() {
        return eventsMethods.supportsOptions = true;
      },
      get passive() {
        return eventsMethods.supportsPassive = true;
      }
    });
    scope.events = eventsMethods;
    function add(eventTarget, type, listener, optionalArg) {
      if (!eventTarget.addEventListener) return;
      var options = getOptions(optionalArg);
      var target = find(targets, function (t) {
        return t.eventTarget === eventTarget;
      });
      if (!target) {
        target = {
          eventTarget: eventTarget,
          events: {}
        };
        targets.push(target);
      }
      if (!target.events[type]) {
        target.events[type] = [];
      }
      if (!find(target.events[type], function (l) {
        return l.func === listener && optionsMatch(l.options, options);
      })) {
        eventTarget.addEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
        target.events[type].push({
          func: listener,
          options: options
        });
      }
    }
    function remove(eventTarget, type, listener, optionalArg) {
      if (!eventTarget.addEventListener || !eventTarget.removeEventListener) return;
      var targetIndex = findIndex(targets, function (t) {
        return t.eventTarget === eventTarget;
      });
      var target = targets[targetIndex];
      if (!target || !target.events) {
        return;
      }
      if (type === 'all') {
        for (type in target.events) {
          if (target.events.hasOwnProperty(type)) {
            remove(eventTarget, type, 'all');
          }
        }
        return;
      }
      var typeIsEmpty = false;
      var typeListeners = target.events[type];
      if (typeListeners) {
        if (listener === 'all') {
          for (var i = typeListeners.length - 1; i >= 0; i--) {
            var entry = typeListeners[i];
            remove(eventTarget, type, entry.func, entry.options);
          }
          return;
        } else {
          var options = getOptions(optionalArg);
          for (var _i = 0; _i < typeListeners.length; _i++) {
            var _entry = typeListeners[_i];
            if (_entry.func === listener && optionsMatch(_entry.options, options)) {
              eventTarget.removeEventListener(type, listener, eventsMethods.supportsOptions ? options : options.capture);
              typeListeners.splice(_i, 1);
              if (typeListeners.length === 0) {
                delete target.events[type];
                typeIsEmpty = true;
              }
              break;
            }
          }
        }
      }
      if (typeIsEmpty && !Object.keys(target.events).length) {
        targets.splice(targetIndex, 1);
      }
    }
    function addDelegate(selector, context, type, listener, optionalArg) {
      var options = getOptions(optionalArg);
      if (!delegatedEvents[type]) {
        delegatedEvents[type] = [];

        // add delegate listener functions
        for (var _i3 = 0; _i3 < documents.length; _i3++) {
          var doc = documents[_i3];
          add(doc, type, delegateListener);
          add(doc, type, delegateUseCapture, true);
        }
      }
      var delegates = delegatedEvents[type];
      var delegate = find(delegates, function (d) {
        return d.selector === selector && d.context === context;
      });
      if (!delegate) {
        delegate = {
          selector: selector,
          context: context,
          listeners: []
        };
        delegates.push(delegate);
      }
      delegate.listeners.push({
        func: listener,
        options: options
      });
    }
    function removeDelegate(selector, context, type, listener, optionalArg) {
      var options = getOptions(optionalArg);
      var delegates = delegatedEvents[type];
      var matchFound = false;
      var index;
      if (!delegates) return;

      // count from last index of delegated to 0
      for (index = delegates.length - 1; index >= 0; index--) {
        var cur = delegates[index];
        // look for matching selector and context Node
        if (cur.selector === selector && cur.context === context) {
          var listeners = cur.listeners;

          // each item of the listeners array is an array: [function, capture, passive]
          for (var i = listeners.length - 1; i >= 0; i--) {
            var entry = listeners[i];

            // check if the listener functions and capture and passive flags match
            if (entry.func === listener && optionsMatch(entry.options, options)) {
              // remove the listener from the array of listeners
              listeners.splice(i, 1);

              // if all listeners for this target have been removed
              // remove the target from the delegates array
              if (!listeners.length) {
                delegates.splice(index, 1);

                // remove delegate function from context
                remove(context, type, delegateListener);
                remove(context, type, delegateUseCapture, true);
              }

              // only remove one listener
              matchFound = true;
              break;
            }
          }
          if (matchFound) {
            break;
          }
        }
      }
    }

    // bound to the interactable context when a DOM event
    // listener is added to a selector interactable
    function delegateListener(event, optionalArg) {
      var options = getOptions(optionalArg);
      var fakeEvent = new FakeEvent(event);
      var delegates = delegatedEvents[event.type];
      var _pointerUtils$getEven = getEventTargets(event),
        eventTarget = _pointerUtils$getEven[0];
      var element = eventTarget;

      // climb up document tree looking for selector matches
      while (is.element(element)) {
        for (var i = 0; i < delegates.length; i++) {
          var cur = delegates[i];
          var selector = cur.selector,
            context = cur.context;
          if (matchesSelector(element, selector) && nodeContains(context, eventTarget) && nodeContains(context, element)) {
            var listeners = cur.listeners;
            fakeEvent.currentTarget = element;
            for (var _i5 = 0; _i5 < listeners.length; _i5++) {
              var entry = listeners[_i5];
              if (optionsMatch(entry.options, options)) {
                entry.func(fakeEvent);
              }
            }
          }
        }
        element = parentNode(element);
      }
    }
    function delegateUseCapture(event) {
      return delegateListener.call(this, event, true);
    }

    // for type inferrence
    return eventsMethods;
  }
  var FakeEvent = /*#__PURE__*/function () {
    function FakeEvent(originalEvent) {
      _classCallCheck(this, FakeEvent);
      this.currentTarget = void 0;
      this.originalEvent = void 0;
      this.type = void 0;
      this.originalEvent = originalEvent;
      // duplicate the event so that currentTarget can be changed
      pointerExtend(this, originalEvent);
    }
    _createClass(FakeEvent, [{
      key: "preventOriginalDefault",
      value: function preventOriginalDefault() {
        this.originalEvent.preventDefault();
      }
    }, {
      key: "stopPropagation",
      value: function stopPropagation() {
        this.originalEvent.stopPropagation();
      }
    }, {
      key: "stopImmediatePropagation",
      value: function stopImmediatePropagation() {
        this.originalEvent.stopImmediatePropagation();
      }
    }]);
    return FakeEvent;
  }();
  function getOptions(param) {
    if (!is.object(param)) {
      return {
        capture: !!param,
        passive: false
      };
    }
    return {
      capture: !!param.capture,
      passive: !!param.passive
    };
  }
  function optionsMatch(a, b) {
    if (a === b) return true;
    if (typeof a === 'boolean') return !!b.capture === a && !!b.passive === false;
    return !!a.capture === !!b.capture && !!a.passive === !!b.passive;
  }
  var events = {
    id: 'events',
    install: install$5
  };

  var finder = {
    methodOrder: ['simulationResume', 'mouseOrPen', 'hasPointer', 'idle'],
    search: function search(details) {
      for (var _i2 = 0, _finder$methodOrder2 = finder.methodOrder; _i2 < _finder$methodOrder2.length; _i2++) {
        var method = _finder$methodOrder2[_i2];
        var interaction = finder[method](details);
        if (interaction) {
          return interaction;
        }
      }
      return null;
    },
    // try to resume simulation with a new pointer
    simulationResume: function simulationResume(_ref) {
      var pointerType = _ref.pointerType,
        eventType = _ref.eventType,
        eventTarget = _ref.eventTarget,
        scope = _ref.scope;
      if (!/down|start/i.test(eventType)) {
        return null;
      }
      for (var _i4 = 0, _scope$interactions$l2 = scope.interactions.list; _i4 < _scope$interactions$l2.length; _i4++) {
        var interaction = _scope$interactions$l2[_i4];
        var element = eventTarget;
        if (interaction.simulation && interaction.simulation.allowResume && interaction.pointerType === pointerType) {
          while (element) {
            // if the element is the interaction element
            if (element === interaction.element) {
              return interaction;
            }
            element = parentNode(element);
          }
        }
      }
      return null;
    },
    // if it's a mouse or pen interaction
    mouseOrPen: function mouseOrPen(_ref2) {
      var pointerId = _ref2.pointerId,
        pointerType = _ref2.pointerType,
        eventType = _ref2.eventType,
        scope = _ref2.scope;
      if (pointerType !== 'mouse' && pointerType !== 'pen') {
        return null;
      }
      var firstNonActive;
      for (var _i6 = 0, _scope$interactions$l4 = scope.interactions.list; _i6 < _scope$interactions$l4.length; _i6++) {
        var interaction = _scope$interactions$l4[_i6];
        if (interaction.pointerType === pointerType) {
          // if it's a down event, skip interactions with running simulations
          if (interaction.simulation && !hasPointerId(interaction, pointerId)) {
            continue;
          }

          // if the interaction is active, return it immediately
          if (interaction.interacting()) {
            return interaction;
          }
          // otherwise save it and look for another active interaction
          else if (!firstNonActive) {
            firstNonActive = interaction;
          }
        }
      } // if no active mouse interaction was found use the first inactive mouse
      // interaction
      if (firstNonActive) {
        return firstNonActive;
      }

      // find any mouse or pen interaction.
      // ignore the interaction if the eventType is a *down, and a simulation
      // is active
      for (var _i8 = 0, _scope$interactions$l6 = scope.interactions.list; _i8 < _scope$interactions$l6.length; _i8++) {
        var _interaction = _scope$interactions$l6[_i8];
        if (_interaction.pointerType === pointerType && !(/down/i.test(eventType) && _interaction.simulation)) {
          return _interaction;
        }
      }
      return null;
    },
    // get interaction that has this pointer
    hasPointer: function hasPointer(_ref3) {
      var pointerId = _ref3.pointerId,
        scope = _ref3.scope;
      for (var _i10 = 0, _scope$interactions$l8 = scope.interactions.list; _i10 < _scope$interactions$l8.length; _i10++) {
        var interaction = _scope$interactions$l8[_i10];
        if (hasPointerId(interaction, pointerId)) {
          return interaction;
        }
      }
      return null;
    },
    // get first idle interaction with a matching pointerType
    idle: function idle(_ref4) {
      var pointerType = _ref4.pointerType,
        scope = _ref4.scope;
      for (var _i12 = 0, _scope$interactions$l10 = scope.interactions.list; _i12 < _scope$interactions$l10.length; _i12++) {
        var interaction = _scope$interactions$l10[_i12];
        // if there's already a pointer held down
        if (interaction.pointers.length === 1) {
          var target = interaction.interactable;
          // don't add this pointer if there is a target interactable and it
          // isn't gesturable
          if (target && !(target.options.gesture && target.options.gesture.enabled)) {
            continue;
          }
        }
        // maximum of 2 pointers per interaction
        else if (interaction.pointers.length >= 2) {
          continue;
        }
        if (!interaction.interacting() && pointerType === interaction.pointerType) {
          return interaction;
        }
      }
      return null;
    }
  };
  function hasPointerId(interaction, pointerId) {
    return interaction.pointers.some(function (_ref5) {
      var id = _ref5.id;
      return id === pointerId;
    });
  }
  var finder$1 = finder;

  var methodNames = ['pointerDown', 'pointerMove', 'pointerUp', 'updatePointer', 'removePointer', 'windowBlur'];
  function install$4(scope) {
    var listeners = {};
    for (var _i2 = 0; _i2 < methodNames.length; _i2++) {
      var method = methodNames[_i2];
      listeners[method] = doOnInteractions(method, scope);
    }
    var pEventTypes = browser$1.pEventTypes;
    var docEvents;
    if (domObjects$1.PointerEvent) {
      docEvents = [{
        type: pEventTypes.down,
        listener: releasePointersOnRemovedEls
      }, {
        type: pEventTypes.down,
        listener: listeners.pointerDown
      }, {
        type: pEventTypes.move,
        listener: listeners.pointerMove
      }, {
        type: pEventTypes.up,
        listener: listeners.pointerUp
      }, {
        type: pEventTypes.cancel,
        listener: listeners.pointerUp
      }];
    } else {
      docEvents = [{
        type: 'mousedown',
        listener: listeners.pointerDown
      }, {
        type: 'mousemove',
        listener: listeners.pointerMove
      }, {
        type: 'mouseup',
        listener: listeners.pointerUp
      }, {
        type: 'touchstart',
        listener: releasePointersOnRemovedEls
      }, {
        type: 'touchstart',
        listener: listeners.pointerDown
      }, {
        type: 'touchmove',
        listener: listeners.pointerMove
      }, {
        type: 'touchend',
        listener: listeners.pointerUp
      }, {
        type: 'touchcancel',
        listener: listeners.pointerUp
      }];
    }
    docEvents.push({
      type: 'blur',
      listener: function listener(event) {
        for (var _i4 = 0, _scope$interactions$l2 = scope.interactions.list; _i4 < _scope$interactions$l2.length; _i4++) {
          var interaction = _scope$interactions$l2[_i4];
          interaction.documentBlur(event);
        }
      }
    });

    // for ignoring browser's simulated mouse events
    scope.prevTouchTime = 0;
    scope.Interaction = /*#__PURE__*/function (_InteractionBase) {
      _inherits(_class, _InteractionBase);
      var _super = _createSuper(_class);
      function _class() {
        _classCallCheck(this, _class);
        return _super.apply(this, arguments);
      }
      _createClass(_class, [{
        key: "pointerMoveTolerance",
        get: function get() {
          return scope.interactions.pointerMoveTolerance;
        },
        set: function set(value) {
          scope.interactions.pointerMoveTolerance = value;
        }
      }, {
        key: "_now",
        value: function _now() {
          return scope.now();
        }
      }]);
      return _class;
    }(Interaction);
    scope.interactions = {
      // all active and idle interactions
      list: [],
      new: function _new(options) {
        options.scopeFire = function (name, arg) {
          return scope.fire(name, arg);
        };
        var interaction = new scope.Interaction(options);
        scope.interactions.list.push(interaction);
        return interaction;
      },
      listeners: listeners,
      docEvents: docEvents,
      pointerMoveTolerance: 1
    };
    function releasePointersOnRemovedEls() {
      // for all inactive touch interactions with pointers down
      for (var _i6 = 0, _scope$interactions$l4 = scope.interactions.list; _i6 < _scope$interactions$l4.length; _i6++) {
        var interaction = _scope$interactions$l4[_i6];
        if (!interaction.pointerIsDown || interaction.pointerType !== 'touch' || interaction._interacting) {
          continue;
        }

        // if a pointer is down on an element that is no longer in the DOM tree
        var _loop = function _loop() {
          var pointer = _interaction$pointers2[_i8];
          if (!scope.documents.some(function (_ref) {
            var doc = _ref.doc;
            return nodeContains(doc, pointer.downTarget);
          })) {
            // remove the pointer from the interaction
            interaction.removePointer(pointer.pointer, pointer.event);
          }
        };
        for (var _i8 = 0, _interaction$pointers2 = interaction.pointers; _i8 < _interaction$pointers2.length; _i8++) {
          _loop();
        }
      }
    }
    scope.usePlugin(interactablePreventDefault);
  }
  function doOnInteractions(method, scope) {
    return function (event) {
      var interactions = scope.interactions.list;
      var pointerType = getPointerType(event);
      var _pointerUtils$getEven = getEventTargets(event),
        eventTarget = _pointerUtils$getEven[0],
        curEventTarget = _pointerUtils$getEven[1];
      var matches = []; // [ [pointer, interaction], ...]

      if (/^touch/.test(event.type)) {
        scope.prevTouchTime = scope.now();

        // @ts-expect-error
        for (var _i10 = 0, _event$changedTouches2 = event.changedTouches; _i10 < _event$changedTouches2.length; _i10++) {
          var changedTouch = _event$changedTouches2[_i10];
          var pointer = changedTouch;
          var pointerId = getPointerId(pointer);
          var searchDetails = {
            pointer: pointer,
            pointerId: pointerId,
            pointerType: pointerType,
            eventType: event.type,
            eventTarget: eventTarget,
            curEventTarget: curEventTarget,
            scope: scope
          };
          var interaction = getInteraction(searchDetails);
          matches.push([searchDetails.pointer, searchDetails.eventTarget, searchDetails.curEventTarget, interaction]);
        }
      } else {
        var invalidPointer = false;
        if (!browser$1.supportsPointerEvent && /mouse/.test(event.type)) {
          // ignore mouse events while touch interactions are active
          for (var i = 0; i < interactions.length && !invalidPointer; i++) {
            invalidPointer = interactions[i].pointerType !== 'mouse' && interactions[i].pointerIsDown;
          }

          // try to ignore mouse events that are simulated by the browser
          // after a touch event
          invalidPointer = invalidPointer || scope.now() - scope.prevTouchTime < 500 ||
          // on iOS and Firefox Mobile, MouseEvent.timeStamp is zero if simulated
          event.timeStamp === 0;
        }
        if (!invalidPointer) {
          var _searchDetails = {
            pointer: event,
            pointerId: getPointerId(event),
            pointerType: pointerType,
            eventType: event.type,
            curEventTarget: curEventTarget,
            eventTarget: eventTarget,
            scope: scope
          };
          var _interaction = getInteraction(_searchDetails);
          matches.push([_searchDetails.pointer, _searchDetails.eventTarget, _searchDetails.curEventTarget, _interaction]);
        }
      }

      // eslint-disable-next-line no-shadow
      for (var _i12 = 0; _i12 < matches.length; _i12++) {
        var _matches$_i = matches[_i12],
          _pointer = _matches$_i[0],
          _eventTarget = _matches$_i[1],
          _curEventTarget = _matches$_i[2],
          _interaction2 = _matches$_i[3];
        _interaction2[method](_pointer, event, _eventTarget, _curEventTarget);
      }
    };
  }
  function getInteraction(searchDetails) {
    var pointerType = searchDetails.pointerType,
      scope = searchDetails.scope;
    var foundInteraction = finder$1.search(searchDetails);
    var signalArg = {
      interaction: foundInteraction,
      searchDetails: searchDetails
    };
    scope.fire('interactions:find', signalArg);
    return signalArg.interaction || scope.interactions.new({
      pointerType: pointerType
    });
  }
  function onDocSignal(_ref2, eventMethodName) {
    var doc = _ref2.doc,
      scope = _ref2.scope,
      options = _ref2.options;
    var docEvents = scope.interactions.docEvents,
      events = scope.events;
    var eventMethod = events[eventMethodName];
    if (scope.browser.isIOS && !options.events) {
      options.events = {
        passive: false
      };
    }

    // delegate event listener
    for (var eventType in events.delegatedEvents) {
      eventMethod(doc, eventType, events.delegateListener);
      eventMethod(doc, eventType, events.delegateUseCapture, true);
    }
    var eventOptions = options && options.events;
    for (var _i14 = 0; _i14 < docEvents.length; _i14++) {
      var _docEvents$_i = docEvents[_i14],
        _type = _docEvents$_i.type,
        listener = _docEvents$_i.listener;
      eventMethod(doc, _type, listener, eventOptions);
    }
  }
  var interactions = {
    id: 'core/interactions',
    install: install$4,
    listeners: {
      'scope:add-document': function scopeAddDocument(arg) {
        return onDocSignal(arg, 'add');
      },
      'scope:remove-document': function scopeRemoveDocument(arg) {
        return onDocSignal(arg, 'remove');
      },
      'interactable:unset': function interactableUnset(_ref3, scope) {
        var interactable = _ref3.interactable;
        // Stop and destroy related interactions when an Interactable is unset
        for (var i = scope.interactions.list.length - 1; i >= 0; i--) {
          var interaction = scope.interactions.list[i];
          if (interaction.interactable !== interactable) {
            continue;
          }
          interaction.stop();
          scope.fire('interactions:destroy', {
            interaction: interaction
          });
          interaction.destroy();
          if (scope.interactions.list.length > 2) {
            scope.interactions.list.splice(i, 1);
          }
        }
      }
    },
    onDocSignal: onDocSignal,
    doOnInteractions: doOnInteractions,
    methodNames: methodNames
  };
  var interactions$1 = interactions;

  var OnOffMethod = /*#__PURE__*/function (OnOffMethod) {
    OnOffMethod[OnOffMethod["On"] = 0] = "On";
    OnOffMethod[OnOffMethod["Off"] = 1] = "Off";
    return OnOffMethod;
  }(OnOffMethod || {});
  /**
   * ```ts
   * const interactable = interact('.cards')
   *   .draggable({
   *     listeners: { move: event => console.log(event.type, event.pageX, event.pageY) }
   *   })
   *   .resizable({
   *     listeners: { move: event => console.log(event.rect) },
   *     modifiers: [interact.modifiers.restrictEdges({ outer: 'parent' })]
   *   })
   * ```
   */
  var Interactable = /*#__PURE__*/function () {
    function Interactable(target, options, defaultContext, scopeEvents) {
      _classCallCheck(this, Interactable);
      this.target = void 0;
      /** @internal */
      this.options = void 0;
      /** @internal */
      this._actions = void 0;
      /** @internal */
      this.events = new Eventable();
      /** @internal */
      this._context = void 0;
      /** @internal */
      this._win = void 0;
      /** @internal */
      this._doc = void 0;
      /** @internal */
      this._scopeEvents = void 0;
      this._actions = options.actions;
      this.target = target;
      this._context = options.context || defaultContext;
      this._win = getWindow(trySelector(target) ? this._context : target);
      this._doc = this._win.document;
      this._scopeEvents = scopeEvents;
      this.set(options);
    }
    _createClass(Interactable, [{
      key: "_defaults",
      get: /** @internal */function get() {
        return {
          base: {},
          perAction: {},
          actions: {}
        };
      }
    }, {
      key: "setOnEvents",
      value: function setOnEvents(actionName, phases) {
        if (is.func(phases.onstart)) {
          this.on("".concat(actionName, "start"), phases.onstart);
        }
        if (is.func(phases.onmove)) {
          this.on("".concat(actionName, "move"), phases.onmove);
        }
        if (is.func(phases.onend)) {
          this.on("".concat(actionName, "end"), phases.onend);
        }
        if (is.func(phases.oninertiastart)) {
          this.on("".concat(actionName, "inertiastart"), phases.oninertiastart);
        }
        return this;
      }
    }, {
      key: "updatePerActionListeners",
      value: function updatePerActionListeners(actionName, prev, cur) {
        var _this$_actions$map$ac,
          _this = this;
        var actionFilter = (_this$_actions$map$ac = this._actions.map[actionName]) == null ? void 0 : _this$_actions$map$ac.filterEventType;
        var filter = function filter(type) {
          return (actionFilter == null || actionFilter(type)) && isNonNativeEvent(type, _this._actions);
        };
        if (is.array(prev) || is.object(prev)) {
          this._onOff(OnOffMethod.Off, actionName, prev, undefined, filter);
        }
        if (is.array(cur) || is.object(cur)) {
          this._onOff(OnOffMethod.On, actionName, cur, undefined, filter);
        }
      }
    }, {
      key: "setPerAction",
      value: function setPerAction(actionName, options) {
        var defaults = this._defaults;

        // for all the default per-action options
        for (var optionName_ in options) {
          var optionName = optionName_;
          var actionOptions = this.options[actionName];
          var optionValue = options[optionName];

          // remove old event listeners and add new ones
          if (optionName === 'listeners') {
            this.updatePerActionListeners(actionName, actionOptions.listeners, optionValue);
          }

          // if the option value is an array
          if (is.array(optionValue)) {
            actionOptions[optionName] = from(optionValue);
          }
          // if the option value is an object
          else if (is.plainObject(optionValue)) {
            actionOptions[optionName] = extend(actionOptions[optionName] || {}, clone(optionValue));

            // set anabled field to true if it exists in the defaults
            if (is.object(defaults.perAction[optionName]) && 'enabled' in defaults.perAction[optionName]) {
              actionOptions[optionName].enabled = optionValue.enabled !== false;
            }
          }
          // if the option value is a boolean and the default is an object
          else if (is.bool(optionValue) && is.object(defaults.perAction[optionName])) {
            actionOptions[optionName].enabled = optionValue;
          }
          // if it's anything else, do a plain assignment
          else {
            actionOptions[optionName] = optionValue;
          }
        }
      }

      /**
       * The default function to get an Interactables bounding rect. Can be
       * overridden using {@link Interactable.rectChecker}.
       *
       * @param {Element} [element] The element to measure.
       * @return {Rect} The object's bounding rectangle.
       */
    }, {
      key: "getRect",
      value: function getRect(element) {
        element = element || (is.element(this.target) ? this.target : null);
        if (is.string(this.target)) {
          element = element || this._context.querySelector(this.target);
        }
        return getElementRect(element);
      }

      /**
       * Returns or sets the function used to calculate the interactable's
       * element's rectangle
       *
       * @param {function} [checker] A function which returns this Interactable's
       * bounding rectangle. See {@link Interactable.getRect}
       * @return {function | object} The checker function or this Interactable
       */
    }, {
      key: "rectChecker",
      value: function rectChecker(checker) {
        var _this2 = this;
        if (is.func(checker)) {
          this.getRect = function (element) {
            var rect = extend({}, checker.apply(_this2, element));
            if (!('width' in rect)) {
              rect.width = rect.right - rect.left;
              rect.height = rect.bottom - rect.top;
            }
            return rect;
          };
          return this;
        }
        if (checker === null) {
          delete this.getRect;
          return this;
        }
        return this.getRect;
      }

      /** @internal */
    }, {
      key: "_backCompatOption",
      value: function _backCompatOption(optionName, newValue) {
        if (trySelector(newValue) || is.object(newValue)) {
          this.options[optionName] = newValue;
          for (var action in this._actions.map) {
            this.options[action][optionName] = newValue;
          }
          return this;
        }
        return this.options[optionName];
      }

      /**
       * Gets or sets the origin of the Interactable's element.  The x and y
       * of the origin will be subtracted from action event coordinates.
       *
       * @param {Element | object | string} [origin] An HTML or SVG Element whose
       * rect will be used, an object eg. { x: 0, y: 0 } or string 'parent', 'self'
       * or any CSS selector
       *
       * @return {object} The current origin or this Interactable
       */
    }, {
      key: "origin",
      value: function origin(newValue) {
        return this._backCompatOption('origin', newValue);
      }

      /**
       * Returns or sets the mouse coordinate types used to calculate the
       * movement of the pointer.
       *
       * @param {string} [newValue] Use 'client' if you will be scrolling while
       * interacting; Use 'page' if you want autoScroll to work
       * @return {string | object} The current deltaSource or this Interactable
       */
    }, {
      key: "deltaSource",
      value: function deltaSource(newValue) {
        if (newValue === 'page' || newValue === 'client') {
          this.options.deltaSource = newValue;
          return this;
        }
        return this.options.deltaSource;
      }

      /** @internal */
    }, {
      key: "getAllElements",
      value: function getAllElements() {
        var target = this.target;
        if (is.string(target)) {
          return Array.from(this._context.querySelectorAll(target));
        }
        if (is.func(target) && target.getAllElements) {
          return target.getAllElements();
        }
        return is.element(target) ? [target] : [];
      }

      /**
       * Gets the selector context Node of the Interactable. The default is
       * `window.document`.
       *
       * @return {Node} The context Node of this Interactable
       */
    }, {
      key: "context",
      value: function context() {
        return this._context;
      }
    }, {
      key: "inContext",
      value: function inContext(element) {
        return this._context === element.ownerDocument || nodeContains(this._context, element);
      }

      /** @internal */
    }, {
      key: "testIgnoreAllow",
      value: function testIgnoreAllow(options, targetNode, eventTarget) {
        return !this.testIgnore(options.ignoreFrom, targetNode, eventTarget) && this.testAllow(options.allowFrom, targetNode, eventTarget);
      }

      /** @internal */
    }, {
      key: "testAllow",
      value: function testAllow(allowFrom, targetNode, element) {
        if (!allowFrom) {
          return true;
        }
        if (!is.element(element)) {
          return false;
        }
        if (is.string(allowFrom)) {
          return matchesUpTo(element, allowFrom, targetNode);
        } else if (is.element(allowFrom)) {
          return nodeContains(allowFrom, element);
        }
        return false;
      }

      /** @internal */
    }, {
      key: "testIgnore",
      value: function testIgnore(ignoreFrom, targetNode, element) {
        if (!ignoreFrom || !is.element(element)) {
          return false;
        }
        if (is.string(ignoreFrom)) {
          return matchesUpTo(element, ignoreFrom, targetNode);
        } else if (is.element(ignoreFrom)) {
          return nodeContains(ignoreFrom, element);
        }
        return false;
      }

      /**
       * Calls listeners for the given InteractEvent type bound globally
       * and directly to this Interactable
       *
       * @param {InteractEvent} iEvent The InteractEvent object to be fired on this
       * Interactable
       * @return {Interactable} this Interactable
       */
    }, {
      key: "fire",
      value: function fire(iEvent) {
        this.events.fire(iEvent);
        return this;
      }

      /** @internal */
    }, {
      key: "_onOff",
      value: function _onOff(method, typeArg, listenerArg, options, filter) {
        if (is.object(typeArg) && !is.array(typeArg)) {
          options = listenerArg;
          listenerArg = null;
        }
        var listeners = normalize(typeArg, listenerArg, filter);
        for (var _type in listeners) {
          if (_type === 'wheel') {
            _type = browser$1.wheelEvent;
          }
          for (var _i2 = 0, _listeners$_type2 = listeners[_type]; _i2 < _listeners$_type2.length; _i2++) {
            var listener = _listeners$_type2[_i2];
            // if it is an action event type
            if (isNonNativeEvent(_type, this._actions)) {
              this.events[method === OnOffMethod.On ? 'on' : 'off'](_type, listener);
            }
            // delegated event
            else if (is.string(this.target)) {
              this._scopeEvents[method === OnOffMethod.On ? 'addDelegate' : 'removeDelegate'](this.target, this._context, _type, listener, options);
            }
            // remove listener from this Interactable's element
            else {
              this._scopeEvents[method === OnOffMethod.On ? 'add' : 'remove'](this.target, _type, listener, options);
            }
          }
        }
        return this;
      }

      /**
       * Binds a listener for an InteractEvent, pointerEvent or DOM event.
       *
       * @param {string | array | object} types The types of events to listen
       * for
       * @param {function | array | object} [listener] The event listener function(s)
       * @param {object | boolean} [options] options object or useCapture flag for
       * addEventListener
       * @return {Interactable} This Interactable
       */
    }, {
      key: "on",
      value: function on(types, listener, options) {
        return this._onOff(OnOffMethod.On, types, listener, options);
      }

      /**
       * Removes an InteractEvent, pointerEvent or DOM event listener.
       *
       * @param {string | array | object} types The types of events that were
       * listened for
       * @param {function | array | object} [listener] The event listener function(s)
       * @param {object | boolean} [options] options object or useCapture flag for
       * removeEventListener
       * @return {Interactable} This Interactable
       */
    }, {
      key: "off",
      value: function off(types, listener, options) {
        return this._onOff(OnOffMethod.Off, types, listener, options);
      }

      /**
       * Reset the options of this Interactable
       *
       * @param {object} options The new settings to apply
       * @return {object} This Interactable
       */
    }, {
      key: "set",
      value: function set(options) {
        var defaults = this._defaults;
        if (!is.object(options)) {
          options = {};
        }
        this.options = clone(defaults.base);
        for (var actionName_ in this._actions.methodDict) {
          var actionName = actionName_;
          var methodName = this._actions.methodDict[actionName];
          this.options[actionName] = {};
          this.setPerAction(actionName, extend(extend({}, defaults.perAction), defaults.actions[actionName]));
          this[methodName](options[actionName]);
        }
        for (var setting in options) {
          if (setting === 'getRect') {
            this.rectChecker(options.getRect);
            continue;
          }
          if (is.func(this[setting])) {
            this[setting](options[setting]);
          }
        }
        return this;
      }

      /**
       * Remove this interactable from the list of interactables and remove it's
       * action capabilities and event listeners
       */
    }, {
      key: "unset",
      value: function unset() {
        if (is.string(this.target)) {
          // remove delegated events
          for (var _type2 in this._scopeEvents.delegatedEvents) {
            var delegated = this._scopeEvents.delegatedEvents[_type2];
            for (var i = delegated.length - 1; i >= 0; i--) {
              var _delegated$i = delegated[i],
                selector = _delegated$i.selector,
                context = _delegated$i.context,
                listeners = _delegated$i.listeners;
              if (selector === this.target && context === this._context) {
                delegated.splice(i, 1);
              }
              for (var l = listeners.length - 1; l >= 0; l--) {
                this._scopeEvents.removeDelegate(this.target, this._context, _type2, listeners[l][0], listeners[l][1]);
              }
            }
          }
        } else {
          this._scopeEvents.remove(this.target, 'all');
        }
      }
    }]);
    return Interactable;
  }();

  var InteractableSet = /*#__PURE__*/function () {
    function InteractableSet(scope) {
      var _this = this;
      _classCallCheck(this, InteractableSet);
      // all set interactables
      this.list = [];
      this.selectorMap = {};
      this.scope = void 0;
      this.scope = scope;
      scope.addListeners({
        'interactable:unset': function interactableUnset(_ref) {
          var interactable = _ref.interactable;
          var target = interactable.target;
          var interactablesOnTarget = is.string(target) ? _this.selectorMap[target] : target[_this.scope.id];
          var targetIndex = findIndex(interactablesOnTarget, function (i) {
            return i === interactable;
          });
          interactablesOnTarget.splice(targetIndex, 1);
        }
      });
    }
    _createClass(InteractableSet, [{
      key: "new",
      value: function _new(target, options) {
        options = extend(options || {}, {
          actions: this.scope.actions
        });
        var interactable = new this.scope.Interactable(target, options, this.scope.document, this.scope.events);
        this.scope.addDocument(interactable._doc);
        this.list.push(interactable);
        if (is.string(target)) {
          if (!this.selectorMap[target]) {
            this.selectorMap[target] = [];
          }
          this.selectorMap[target].push(interactable);
        } else {
          if (!interactable.target[this.scope.id]) {
            Object.defineProperty(target, this.scope.id, {
              value: [],
              configurable: true
            });
          }
          target[this.scope.id].push(interactable);
        }
        this.scope.fire('interactable:new', {
          target: target,
          options: options,
          interactable: interactable,
          win: this.scope._win
        });
        return interactable;
      }
    }, {
      key: "getExisting",
      value: function getExisting(target, options) {
        var context = options && options.context || this.scope.document;
        var isSelector = is.string(target);
        var interactablesOnTarget = isSelector ? this.selectorMap[target] : target[this.scope.id];
        if (!interactablesOnTarget) return undefined;
        return find(interactablesOnTarget, function (interactable) {
          return interactable._context === context && (isSelector || interactable.inContext(target));
        });
      }
    }, {
      key: "forEachMatch",
      value: function forEachMatch(node, callback) {
        for (var _i2 = 0, _this$list2 = this.list; _i2 < _this$list2.length; _i2++) {
          var _interactable = _this$list2[_i2];
          var ret = void 0;
          if ((is.string(_interactable.target) ?
          // target is a selector and the element matches
          is.element(node) && matchesSelector(node, _interactable.target) :
          // target is the element
          node === _interactable.target) &&
          // the element is in context
          _interactable.inContext(node)) {
            ret = callback(_interactable);
          }
          if (ret !== undefined) {
            return ret;
          }
        }
      }
    }]);
    return InteractableSet;
  }();

  /**
   * ```js
   * interact('#draggable').draggable(true)
   *
   * var rectables = interact('rect')
   * rectables
   *   .gesturable(true)
   *   .on('gesturemove', function (event) {
   *       // ...
   *   })
   * ```
   *
   * The methods of this variable can be used to set elements as interactables
   * and also to change various default settings.
   *
   * Calling it as a function and passing an element or a valid CSS selector
   * string returns an Interactable object which has various methods to configure
   * it.
   *
   * @param {Element | string} target The HTML or SVG Element to interact with
   * or CSS selector
   * @return {Interactable}
   */

  function createInteractStatic(scope) {
    var interact = function interact(target, options) {
      var interactable = scope.interactables.getExisting(target, options);
      if (!interactable) {
        interactable = scope.interactables.new(target, options);
        interactable.events.global = interact.globalEvents;
      }
      return interactable;
    };

    // expose the functions used to calculate multi-touch properties
    interact.getPointerAverage = pointerAverage;
    interact.getTouchBBox = touchBBox;
    interact.getTouchDistance = touchDistance;
    interact.getTouchAngle = touchAngle;
    interact.getElementRect = getElementRect;
    interact.getElementClientRect = getElementClientRect;
    interact.matchesSelector = matchesSelector;
    interact.closest = closest;
    interact.globalEvents = {};

    // eslint-disable-next-line no-undef
    interact.version = "1.10.27";
    interact.scope = scope;
    interact.use = function (plugin, options) {
      this.scope.usePlugin(plugin, options);
      return this;
    };
    interact.isSet = function (target, options) {
      return !!this.scope.interactables.get(target, options && options.context);
    };
    interact.on = warnOnce(function on(type, listener, options) {
      if (is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }
      if (is.array(type)) {
        for (var _i2 = 0, _ref2 = type; _i2 < _ref2.length; _i2++) {
          var eventType = _ref2[_i2];
          this.on(eventType, listener, options);
        }
        return this;
      }
      if (is.object(type)) {
        for (var prop in type) {
          this.on(prop, type[prop], listener);
        }
        return this;
      }

      // if it is an InteractEvent type, add listener to globalEvents
      if (isNonNativeEvent(type, this.scope.actions)) {
        // if this type of event was never bound
        if (!this.globalEvents[type]) {
          this.globalEvents[type] = [listener];
        } else {
          this.globalEvents[type].push(listener);
        }
      }
      // If non InteractEvent type, addEventListener to document
      else {
        this.scope.events.add(this.scope.document, type, listener, {
          options: options
        });
      }
      return this;
    }, 'The interact.on() method is being deprecated');
    interact.off = warnOnce(function off(type, listener, options) {
      if (is.string(type) && type.search(' ') !== -1) {
        type = type.trim().split(/ +/);
      }
      if (is.array(type)) {
        for (var _i4 = 0, _type2 = type; _i4 < _type2.length; _i4++) {
          var eventType = _type2[_i4];
          this.off(eventType, listener, options);
        }
        return this;
      }
      if (is.object(type)) {
        for (var prop in type) {
          this.off(prop, type[prop], listener);
        }
        return this;
      }
      if (isNonNativeEvent(type, this.scope.actions)) {
        var index;
        if (type in this.globalEvents && (index = this.globalEvents[type].indexOf(listener)) !== -1) {
          this.globalEvents[type].splice(index, 1);
        }
      } else {
        this.scope.events.remove(this.scope.document, type, listener, options);
      }
      return this;
    }, 'The interact.off() method is being deprecated');
    interact.debug = function () {
      return this.scope;
    };
    interact.supportsTouch = function () {
      return browser$1.supportsTouch;
    };
    interact.supportsPointerEvent = function () {
      return browser$1.supportsPointerEvent;
    };
    interact.stop = function () {
      for (var _i6 = 0, _this$scope$interacti2 = this.scope.interactions.list; _i6 < _this$scope$interacti2.length; _i6++) {
        var interaction = _this$scope$interacti2[_i6];
        interaction.stop();
      }
      return this;
    };
    interact.pointerMoveTolerance = function (newValue) {
      if (is.number(newValue)) {
        this.scope.interactions.pointerMoveTolerance = newValue;
        return this;
      }
      return this.scope.interactions.pointerMoveTolerance;
    };
    interact.addDocument = function (doc, options) {
      this.scope.addDocument(doc, options);
    };
    interact.removeDocument = function (doc) {
      this.scope.removeDocument(doc);
    };
    return interact;
  }

  /** @internal */
  var Scope = /*#__PURE__*/function () {
    function Scope() {
      var _this = this;
      _classCallCheck(this, Scope);
      this.id = "__interact_scope_".concat(Math.floor(Math.random() * 100));
      this.isInitialized = false;
      this.listenerMaps = [];
      this.browser = browser$1;
      this.defaults = clone(defaults$7);
      this.Eventable = Eventable;
      this.actions = {
        map: {},
        phases: {
          start: true,
          move: true,
          end: true
        },
        methodDict: {},
        phaselessTypes: {}
      };
      this.interactStatic = createInteractStatic(this);
      this.InteractEvent = InteractEvent;
      this.Interactable = void 0;
      this.interactables = new InteractableSet(this);
      // main window
      this._win = void 0;
      // main document
      this.document = void 0;
      // main window
      this.window = void 0;
      // all documents being listened to
      this.documents = [];
      this._plugins = {
        list: [],
        map: {}
      };
      this.onWindowUnload = function (event) {
        return _this.removeDocument(event.target);
      };
      var scope = this;
      this.Interactable = /*#__PURE__*/function (_InteractableBase) {
        _inherits(_class2, _InteractableBase);
        var _super = _createSuper(_class2);
        function _class2() {
          _classCallCheck(this, _class2);
          return _super.apply(this, arguments);
        }
        _createClass(_class2, [{
          key: "_defaults",
          get: function get() {
            return scope.defaults;
          }
        }, {
          key: "set",
          value: function set(options) {
            _get(_getPrototypeOf(_class2.prototype), "set", this).call(this, options);
            scope.fire('interactable:set', {
              options: options,
              interactable: this
            });
            return this;
          }
        }, {
          key: "unset",
          value: function unset() {
            _get(_getPrototypeOf(_class2.prototype), "unset", this).call(this);
            var index = scope.interactables.list.indexOf(this);
            if (index < 0) return;
            scope.interactables.list.splice(index, 1);
            scope.fire('interactable:unset', {
              interactable: this
            });
          }
        }]);
        return _class2;
      }(Interactable);
    }
    _createClass(Scope, [{
      key: "addListeners",
      value: function addListeners(map, id) {
        this.listenerMaps.push({
          id: id,
          map: map
        });
      }
    }, {
      key: "fire",
      value: function fire(name, arg) {
        for (var _i2 = 0, _this$listenerMaps2 = this.listenerMaps; _i2 < _this$listenerMaps2.length; _i2++) {
          var listener = _this$listenerMaps2[_i2].map[name];
          if (!!listener && listener(arg, this, name) === false) {
            return false;
          }
        }
      }
    }, {
      key: "init",
      value: function init(window) {
        return this.isInitialized ? this : initScope(this, window);
      }
    }, {
      key: "pluginIsInstalled",
      value: function pluginIsInstalled(plugin) {
        var id = plugin.id;
        return id ? !!this._plugins.map[id] : this._plugins.list.indexOf(plugin) !== -1;
      }
    }, {
      key: "usePlugin",
      value: function usePlugin(plugin, options) {
        if (!this.isInitialized) {
          return this;
        }
        if (this.pluginIsInstalled(plugin)) {
          return this;
        }
        if (plugin.id) {
          this._plugins.map[plugin.id] = plugin;
        }
        this._plugins.list.push(plugin);
        if (plugin.install) {
          plugin.install(this, options);
        }
        if (plugin.listeners && plugin.before) {
          var index = 0;
          var len = this.listenerMaps.length;
          var before = plugin.before.reduce(function (acc, id) {
            acc[id] = true;
            acc[pluginIdRoot(id)] = true;
            return acc;
          }, {});
          for (; index < len; index++) {
            var otherId = this.listenerMaps[index].id;
            if (otherId && (before[otherId] || before[pluginIdRoot(otherId)])) {
              break;
            }
          }
          this.listenerMaps.splice(index, 0, {
            id: plugin.id,
            map: plugin.listeners
          });
        } else if (plugin.listeners) {
          this.listenerMaps.push({
            id: plugin.id,
            map: plugin.listeners
          });
        }
        return this;
      }
    }, {
      key: "addDocument",
      value: function addDocument(doc, options) {
        // do nothing if document is already known
        if (this.getDocIndex(doc) !== -1) {
          return false;
        }
        var window = getWindow(doc);
        options = options ? extend({}, options) : {};
        this.documents.push({
          doc: doc,
          options: options
        });
        this.events.documents.push(doc);

        // don't add an unload event for the main document
        // so that the page may be cached in browser history
        if (doc !== this.document) {
          this.events.add(window, 'unload', this.onWindowUnload);
        }
        this.fire('scope:add-document', {
          doc: doc,
          window: window,
          scope: this,
          options: options
        });
      }
    }, {
      key: "removeDocument",
      value: function removeDocument(doc) {
        var index = this.getDocIndex(doc);
        var window = getWindow(doc);
        var options = this.documents[index].options;
        this.events.remove(window, 'unload', this.onWindowUnload);
        this.documents.splice(index, 1);
        this.events.documents.splice(index, 1);
        this.fire('scope:remove-document', {
          doc: doc,
          window: window,
          scope: this,
          options: options
        });
      }
    }, {
      key: "getDocIndex",
      value: function getDocIndex(doc) {
        for (var i = 0; i < this.documents.length; i++) {
          if (this.documents[i].doc === doc) {
            return i;
          }
        }
        return -1;
      }
    }, {
      key: "getDocOptions",
      value: function getDocOptions(doc) {
        var docIndex = this.getDocIndex(doc);
        return docIndex === -1 ? null : this.documents[docIndex].options;
      }
    }, {
      key: "now",
      value: function now() {
        return (this.window.Date || Date).now();
      }
    }]);
    return Scope;
  }();

  // Keep Scope class internal, but expose minimal interface to avoid broken types when Scope is stripped out

  /** @internal */
  function initScope(scope, window) {
    scope.isInitialized = true;
    if (is.window(window)) {
      init$3(window);
    }
    domObjects$1.init(window);
    browser$1.init(window);
    raf.init(window);

    // @ts-expect-error
    scope.window = window;
    scope.document = window.document;
    scope.usePlugin(interactions$1);
    scope.usePlugin(events);
    return scope;
  }
  function pluginIdRoot(id) {
    return id && id.replace(/\/.*$/, '');
  }

  var scope = new Scope();
  var interact = scope.interactStatic;
  var interact$1 = interact;
  var _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : window;
  scope.init(_global);

  var edgeTarget = (function () {});

  var elements = (function () {});

  var grid = (function (grid) {
    var coordFields = [['x', 'y'], ['left', 'top'], ['right', 'bottom'], ['width', 'height']].filter(function (_ref) {
      var xField = _ref[0],
        yField = _ref[1];
      return xField in grid || yField in grid;
    });
    var gridFunc = function gridFunc(x, y) {
      var range = grid.range,
        _grid$limits = grid.limits,
        limits = _grid$limits === void 0 ? {
          left: -Infinity,
          right: Infinity,
          top: -Infinity,
          bottom: Infinity
        } : _grid$limits,
        _grid$offset = grid.offset,
        offset = _grid$offset === void 0 ? {
          x: 0,
          y: 0
        } : _grid$offset;
      var result = {
        range: range,
        grid: grid,
        x: null,
        y: null
      };
      for (var _i2 = 0; _i2 < coordFields.length; _i2++) {
        var _coordFields$_i = coordFields[_i2],
          xField = _coordFields$_i[0],
          yField = _coordFields$_i[1];
        var gridx = Math.round((x - offset.x) / grid[xField]);
        var gridy = Math.round((y - offset.y) / grid[yField]);
        result[xField] = Math.max(limits.left, Math.min(limits.right, gridx * grid[xField] + offset.x));
        result[yField] = Math.max(limits.top, Math.min(limits.bottom, gridy * grid[yField] + offset.y));
      }
      return result;
    };
    gridFunc.grid = grid;
    gridFunc.coordFields = coordFields;
    return gridFunc;
  });

  /* eslint-disable import/no-named-as-default, import/no-unresolved */

  var allSnappers = /*#__PURE__*/Object.freeze({
    __proto__: null,
    edgeTarget: edgeTarget,
    elements: elements,
    grid: grid
  });

  var snappersPlugin = {
    id: 'snappers',
    install: function install(scope) {
      var interact = scope.interactStatic;
      interact.snappers = extend(interact.snappers || {}, allSnappers);
      interact.createSnapGrid = interact.snappers.grid;
    }
  };
  var snappers = snappersPlugin;

  var aspectRatio = {
    start: function start(arg) {
      var state = arg.state,
        rect = arg.rect,
        edges = arg.edges,
        coords = arg.pageCoords;
      var _state$options = state.options,
        ratio = _state$options.ratio,
        enabled = _state$options.enabled;
      var _state$options2 = state.options,
        equalDelta = _state$options2.equalDelta,
        modifiers = _state$options2.modifiers;
      if (ratio === 'preserve') {
        ratio = rect.width / rect.height;
      }
      state.startCoords = extend({}, coords);
      state.startRect = extend({}, rect);
      state.ratio = ratio;
      state.equalDelta = equalDelta;
      var linkedEdges = state.linkedEdges = {
        top: edges.top || edges.left && !edges.bottom,
        left: edges.left || edges.top && !edges.right,
        bottom: edges.bottom || edges.right && !edges.top,
        right: edges.right || edges.bottom && !edges.left
      };
      state.xIsPrimaryAxis = !!(edges.left || edges.right);
      if (state.equalDelta) {
        var sign = (linkedEdges.left ? 1 : -1) * (linkedEdges.top ? 1 : -1);
        state.edgeSign = {
          x: sign,
          y: sign
        };
      } else {
        state.edgeSign = {
          x: linkedEdges.left ? -1 : 1,
          y: linkedEdges.top ? -1 : 1
        };
      }
      if (enabled !== false) {
        extend(edges, linkedEdges);
      }
      if (!(modifiers != null && modifiers.length)) return;
      var subModification = new Modification(arg.interaction);
      subModification.copyFrom(arg.interaction.modification);
      subModification.prepareStates(modifiers);
      state.subModification = subModification;
      subModification.startAll(_objectSpread2({}, arg));
    },
    set: function set(arg) {
      var state = arg.state,
        rect = arg.rect,
        coords = arg.coords;
      var linkedEdges = state.linkedEdges;
      var initialCoords = extend({}, coords);
      var aspectMethod = state.equalDelta ? setEqualDelta : setRatio;
      extend(arg.edges, linkedEdges);
      aspectMethod(state, state.xIsPrimaryAxis, coords, rect);
      if (!state.subModification) {
        return null;
      }
      var correctedRect = extend({}, rect);
      addEdges(linkedEdges, correctedRect, {
        x: coords.x - initialCoords.x,
        y: coords.y - initialCoords.y
      });
      var result = state.subModification.setAll(_objectSpread2(_objectSpread2({}, arg), {}, {
        rect: correctedRect,
        edges: linkedEdges,
        pageCoords: coords,
        prevCoords: coords,
        prevRect: correctedRect
      }));
      var delta = result.delta;
      if (result.changed) {
        var xIsCriticalAxis = Math.abs(delta.x) > Math.abs(delta.y);

        // do aspect modification again with critical edge axis as primary
        aspectMethod(state, xIsCriticalAxis, result.coords, result.rect);
        extend(coords, result.coords);
      }
      return result.eventProps;
    },
    defaults: {
      ratio: 'preserve',
      equalDelta: false,
      modifiers: [],
      enabled: false
    }
  };
  function setEqualDelta(_ref, xIsPrimaryAxis, coords) {
    var startCoords = _ref.startCoords,
      edgeSign = _ref.edgeSign;
    if (xIsPrimaryAxis) {
      coords.y = startCoords.y + (coords.x - startCoords.x) * edgeSign.y;
    } else {
      coords.x = startCoords.x + (coords.y - startCoords.y) * edgeSign.x;
    }
  }
  function setRatio(_ref2, xIsPrimaryAxis, coords, rect) {
    var startRect = _ref2.startRect,
      startCoords = _ref2.startCoords,
      ratio = _ref2.ratio,
      edgeSign = _ref2.edgeSign;
    if (xIsPrimaryAxis) {
      var newHeight = rect.width / ratio;
      coords.y = startCoords.y + (newHeight - startRect.height) * edgeSign.y;
    } else {
      var newWidth = rect.height * ratio;
      coords.x = startCoords.x + (newWidth - startRect.width) * edgeSign.x;
    }
  }
  var aspectRatio$1 = makeModifier(aspectRatio, 'aspectRatio');

  var noop = function noop() {};
  noop._defaults = {};
  var rubberband = noop;

  function start$5(_ref) {
    var rect = _ref.rect,
      startOffset = _ref.startOffset,
      state = _ref.state,
      interaction = _ref.interaction,
      pageCoords = _ref.pageCoords;
    var options = state.options;
    var elementRect = options.elementRect;
    var offset = extend({
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    }, options.offset || {});
    if (rect && elementRect) {
      var restriction = getRestrictionRect(options.restriction, interaction, pageCoords);
      if (restriction) {
        var widthDiff = restriction.right - restriction.left - rect.width;
        var heightDiff = restriction.bottom - restriction.top - rect.height;
        if (widthDiff < 0) {
          offset.left += widthDiff;
          offset.right += widthDiff;
        }
        if (heightDiff < 0) {
          offset.top += heightDiff;
          offset.bottom += heightDiff;
        }
      }
      offset.left += startOffset.left - rect.width * elementRect.left;
      offset.top += startOffset.top - rect.height * elementRect.top;
      offset.right += startOffset.right - rect.width * (1 - elementRect.right);
      offset.bottom += startOffset.bottom - rect.height * (1 - elementRect.bottom);
    }
    state.offset = offset;
  }
  function set$4(_ref2) {
    var coords = _ref2.coords,
      interaction = _ref2.interaction,
      state = _ref2.state;
    var options = state.options,
      offset = state.offset;
    var restriction = getRestrictionRect(options.restriction, interaction, coords);
    if (!restriction) return;
    var rect = xywhToTlbr(restriction);
    coords.x = Math.max(Math.min(rect.right - offset.right, coords.x), rect.left + offset.left);
    coords.y = Math.max(Math.min(rect.bottom - offset.bottom, coords.y), rect.top + offset.top);
  }
  function getRestrictionRect(value, interaction, coords) {
    if (is.func(value)) {
      return resolveRectLike(value, interaction.interactable, interaction.element, [coords.x, coords.y, interaction]);
    } else {
      return resolveRectLike(value, interaction.interactable, interaction.element);
    }
  }
  var defaults$6 = {
    restriction: null,
    elementRect: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  var restrict = {
    start: start$5,
    set: set$4,
    defaults: defaults$6
  };
  var restrict$1 = makeModifier(restrict, 'restrict');

  // This modifier adds the options.resize.restrictEdges setting which sets min and
  // max for the top, left, bottom and right edges of the target being resized.
  //
  // interact(target).resize({
  //   edges: { top: true, left: true },
  //   restrictEdges: {
  //     inner: { top: 200, left: 200, right: 400, bottom: 400 },
  //     outer: { top:   0, left:   0, right: 600, bottom: 600 },
  //   },
  // })

  var noInner = {
    top: +Infinity,
    left: +Infinity,
    bottom: -Infinity,
    right: -Infinity
  };
  var noOuter = {
    top: -Infinity,
    left: -Infinity,
    bottom: +Infinity,
    right: +Infinity
  };
  function start$4(_ref) {
    var interaction = _ref.interaction,
      startOffset = _ref.startOffset,
      state = _ref.state;
    var options = state.options;
    var offset;
    if (options) {
      var offsetRect = getRestrictionRect(options.offset, interaction, interaction.coords.start.page);
      offset = rectToXY(offsetRect);
    }
    offset = offset || {
      x: 0,
      y: 0
    };
    state.offset = {
      top: offset.y + startOffset.top,
      left: offset.x + startOffset.left,
      bottom: offset.y - startOffset.bottom,
      right: offset.x - startOffset.right
    };
  }
  function set$3(_ref2) {
    var coords = _ref2.coords,
      edges = _ref2.edges,
      interaction = _ref2.interaction,
      state = _ref2.state;
    var offset = state.offset,
      options = state.options;
    if (!edges) {
      return;
    }
    var page = extend({}, coords);
    var inner = getRestrictionRect(options.inner, interaction, page) || {};
    var outer = getRestrictionRect(options.outer, interaction, page) || {};
    fixRect(inner, noInner);
    fixRect(outer, noOuter);
    if (edges.top) {
      coords.y = Math.min(Math.max(outer.top + offset.top, page.y), inner.top + offset.top);
    } else if (edges.bottom) {
      coords.y = Math.max(Math.min(outer.bottom + offset.bottom, page.y), inner.bottom + offset.bottom);
    }
    if (edges.left) {
      coords.x = Math.min(Math.max(outer.left + offset.left, page.x), inner.left + offset.left);
    } else if (edges.right) {
      coords.x = Math.max(Math.min(outer.right + offset.right, page.x), inner.right + offset.right);
    }
  }
  function fixRect(rect, defaults) {
    for (var _i2 = 0, _ref4 = ['top', 'left', 'bottom', 'right']; _i2 < _ref4.length; _i2++) {
      var edge = _ref4[_i2];
      if (!(edge in rect)) {
        rect[edge] = defaults[edge];
      }
    }
    return rect;
  }
  var defaults$5 = {
    inner: null,
    outer: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  var restrictEdges = {
    noInner: noInner,
    noOuter: noOuter,
    start: start$4,
    set: set$3,
    defaults: defaults$5
  };
  var restrictEdges$1 = makeModifier(restrictEdges, 'restrictEdges');

  var defaults$4 = extend({
    get elementRect() {
      return {
        top: 0,
        left: 0,
        bottom: 1,
        right: 1
      };
    },
    set elementRect(_) {}
  }, restrict.defaults);
  var restrictRect = {
    start: restrict.start,
    set: restrict.set,
    defaults: defaults$4
  };
  var restrictRect$1 = makeModifier(restrictRect, 'restrictRect');

  var noMin = {
    width: -Infinity,
    height: -Infinity
  };
  var noMax = {
    width: +Infinity,
    height: +Infinity
  };
  function start$3(arg) {
    return restrictEdges.start(arg);
  }
  function set$2(arg) {
    var interaction = arg.interaction,
      state = arg.state,
      rect = arg.rect,
      edges = arg.edges;
    var options = state.options;
    if (!edges) {
      return;
    }
    var minSize = tlbrToXywh(getRestrictionRect(options.min, interaction, arg.coords)) || noMin;
    var maxSize = tlbrToXywh(getRestrictionRect(options.max, interaction, arg.coords)) || noMax;
    state.options = {
      endOnly: options.endOnly,
      inner: extend({}, restrictEdges.noInner),
      outer: extend({}, restrictEdges.noOuter)
    };
    if (edges.top) {
      state.options.inner.top = rect.bottom - minSize.height;
      state.options.outer.top = rect.bottom - maxSize.height;
    } else if (edges.bottom) {
      state.options.inner.bottom = rect.top + minSize.height;
      state.options.outer.bottom = rect.top + maxSize.height;
    }
    if (edges.left) {
      state.options.inner.left = rect.right - minSize.width;
      state.options.outer.left = rect.right - maxSize.width;
    } else if (edges.right) {
      state.options.inner.right = rect.left + minSize.width;
      state.options.outer.right = rect.left + maxSize.width;
    }
    restrictEdges.set(arg);
    state.options = options;
  }
  var defaults$3 = {
    min: null,
    max: null,
    endOnly: false,
    enabled: false
  };
  var restrictSize = {
    start: start$3,
    set: set$2,
    defaults: defaults$3
  };
  var restrictSize$1 = makeModifier(restrictSize, 'restrictSize');

  function start$2(arg) {
    var interaction = arg.interaction,
      interactable = arg.interactable,
      element = arg.element,
      rect = arg.rect,
      state = arg.state,
      startOffset = arg.startOffset;
    var options = state.options;
    var origin = options.offsetWithOrigin ? getOrigin(arg) : {
      x: 0,
      y: 0
    };
    var snapOffset;
    if (options.offset === 'startCoords') {
      snapOffset = {
        x: interaction.coords.start.page.x,
        y: interaction.coords.start.page.y
      };
    } else {
      var offsetRect = resolveRectLike(options.offset, interactable, element, [interaction]);
      snapOffset = rectToXY(offsetRect) || {
        x: 0,
        y: 0
      };
      snapOffset.x += origin.x;
      snapOffset.y += origin.y;
    }
    var relativePoints = options.relativePoints;
    state.offsets = rect && relativePoints && relativePoints.length ? relativePoints.map(function (relativePoint, index) {
      return {
        index: index,
        relativePoint: relativePoint,
        x: startOffset.left - rect.width * relativePoint.x + snapOffset.x,
        y: startOffset.top - rect.height * relativePoint.y + snapOffset.y
      };
    }) : [{
      index: 0,
      relativePoint: null,
      x: snapOffset.x,
      y: snapOffset.y
    }];
  }
  function set$1(arg) {
    var interaction = arg.interaction,
      coords = arg.coords,
      state = arg.state;
    var options = state.options,
      offsets = state.offsets;
    var origin = getOriginXY(interaction.interactable, interaction.element, interaction.prepared.name);
    var page = extend({}, coords);
    var targets = [];
    if (!options.offsetWithOrigin) {
      page.x -= origin.x;
      page.y -= origin.y;
    }
    for (var _i2 = 0, _ref2 = offsets; _i2 < _ref2.length; _i2++) {
      var _offset = _ref2[_i2];
      var relativeX = page.x - _offset.x;
      var relativeY = page.y - _offset.y;
      for (var _index = 0, len = options.targets.length; _index < len; _index++) {
        var snapTarget = options.targets[_index];
        var target = void 0;
        if (is.func(snapTarget)) {
          target = snapTarget(relativeX, relativeY, interaction._proxy, _offset, _index);
        } else {
          target = snapTarget;
        }
        if (!target) {
          continue;
        }
        targets.push({
          x: (is.number(target.x) ? target.x : relativeX) + _offset.x,
          y: (is.number(target.y) ? target.y : relativeY) + _offset.y,
          range: is.number(target.range) ? target.range : options.range,
          source: snapTarget,
          index: _index,
          offset: _offset
        });
      }
    }
    var closest = {
      target: null,
      inRange: false,
      distance: 0,
      range: 0,
      delta: {
        x: 0,
        y: 0
      }
    };
    for (var _i4 = 0; _i4 < targets.length; _i4++) {
      var _target = targets[_i4];
      var range = _target.range;
      var dx = _target.x - page.x;
      var dy = _target.y - page.y;
      var distance = hypot(dx, dy);
      var inRange = distance <= range;

      // Infinite targets count as being out of range
      // compared to non infinite ones that are in range
      if (range === Infinity && closest.inRange && closest.range !== Infinity) {
        inRange = false;
      }
      if (!closest.target || (inRange ?
      // is the closest target in range?
      closest.inRange && range !== Infinity ?
      // the pointer is relatively deeper in this target
      distance / range < closest.distance / closest.range :
      // this target has Infinite range and the closest doesn't
      range === Infinity && closest.range !== Infinity ||
      // OR this target is closer that the previous closest
      distance < closest.distance :
      // The other is not in range and the pointer is closer to this target
      !closest.inRange && distance < closest.distance)) {
        closest.target = _target;
        closest.distance = distance;
        closest.range = range;
        closest.inRange = inRange;
        closest.delta.x = dx;
        closest.delta.y = dy;
      }
    }
    if (closest.inRange) {
      coords.x = closest.target.x;
      coords.y = closest.target.y;
    }
    state.closest = closest;
    return closest;
  }
  function getOrigin(arg) {
    var element = arg.interaction.element;
    var optionsOrigin = rectToXY(resolveRectLike(arg.state.options.origin, null, null, [element]));
    var origin = optionsOrigin || getOriginXY(arg.interactable, element, arg.interaction.prepared.name);
    return origin;
  }
  var defaults$2 = {
    range: Infinity,
    targets: null,
    offset: null,
    offsetWithOrigin: true,
    origin: null,
    relativePoints: null,
    endOnly: false,
    enabled: false
  };
  var snap = {
    start: start$2,
    set: set$1,
    defaults: defaults$2
  };
  var snap$1 = makeModifier(snap, 'snap');

  // This modifier allows snapping of the size of targets during resize
  // interactions.

  function start$1(arg) {
    var state = arg.state,
      edges = arg.edges;
    var options = state.options;
    if (!edges) {
      return null;
    }
    arg.state = {
      options: {
        targets: null,
        relativePoints: [{
          x: edges.left ? 0 : 1,
          y: edges.top ? 0 : 1
        }],
        offset: options.offset || 'self',
        origin: {
          x: 0,
          y: 0
        },
        range: options.range
      }
    };
    state.targetFields = state.targetFields || [['width', 'height'], ['x', 'y']];
    snap.start(arg);
    state.offsets = arg.state.offsets;
    arg.state = state;
  }
  function set(arg) {
    var interaction = arg.interaction,
      state = arg.state,
      coords = arg.coords;
    var options = state.options,
      offsets = state.offsets;
    var relative = {
      x: coords.x - offsets[0].x,
      y: coords.y - offsets[0].y
    };
    state.options = extend({}, options);
    state.options.targets = [];
    for (var _i2 = 0, _ref2 = options.targets || []; _i2 < _ref2.length; _i2++) {
      var snapTarget = _ref2[_i2];
      var target = void 0;
      if (is.func(snapTarget)) {
        target = snapTarget(relative.x, relative.y, interaction);
      } else {
        target = snapTarget;
      }
      if (!target) {
        continue;
      }
      for (var _i4 = 0, _state$targetFields2 = state.targetFields; _i4 < _state$targetFields2.length; _i4++) {
        var _state$targetFields2$ = _state$targetFields2[_i4],
          xField = _state$targetFields2$[0],
          yField = _state$targetFields2$[1];
        if (xField in target || yField in target) {
          target.x = target[xField];
          target.y = target[yField];
          break;
        }
      }
      state.options.targets.push(target);
    }
    var returnValue = snap.set(arg);
    state.options = options;
    return returnValue;
  }
  var defaults$1 = {
    range: Infinity,
    targets: null,
    offset: null,
    endOnly: false,
    enabled: false
  };
  var snapSize = {
    start: start$1,
    set: set,
    defaults: defaults$1
  };
  var snapSize$1 = makeModifier(snapSize, 'snapSize');

  /**
   * @module modifiers/snapEdges
   *
   * @description
   * This modifier allows snapping of the edges of targets during resize
   * interactions.
   *
   * ```js
   * interact(target).resizable({
   *   snapEdges: {
   *     targets: [interact.snappers.grid({ x: 100, y: 50 })],
   *   },
   * })
   *
   * interact(target).resizable({
   *   snapEdges: {
   *     targets: [
   *       interact.snappers.grid({
   *        top: 50,
   *        left: 50,
   *        bottom: 100,
   *        right: 100,
   *       }),
   *     ],
   *   },
   * })
   * ```
   */

  function start(arg) {
    var edges = arg.edges;
    if (!edges) {
      return null;
    }
    arg.state.targetFields = arg.state.targetFields || [[edges.left ? 'left' : 'right', edges.top ? 'top' : 'bottom']];
    return snapSize.start(arg);
  }
  var snapEdges = {
    start: start,
    set: snapSize.set,
    defaults: extend(clone(snapSize.defaults), {
      targets: undefined,
      range: undefined,
      offset: {
        x: 0,
        y: 0
      }
    })
  };
  var snapEdges$1 = makeModifier(snapEdges, 'snapEdges');

  /* eslint-disable n/no-extraneous-import, import/no-unresolved */
  var all = {
    aspectRatio: aspectRatio$1,
    restrictEdges: restrictEdges$1,
    restrict: restrict$1,
    restrictRect: restrictRect$1,
    restrictSize: restrictSize$1,
    snapEdges: snapEdges$1,
    snap: snap$1,
    snapSize: snapSize$1,
    spring: rubberband,
    avoid: rubberband,
    transform: rubberband,
    rubberband: rubberband
  };

  /* eslint-enable import/no-duplicates */

  var modifiers = {
    id: 'modifiers',
    install: function install(scope) {
      var interact = scope.interactStatic;
      scope.usePlugin(base);
      scope.usePlugin(snappers);
      interact.modifiers = all;

      // for backwrads compatibility
      for (var type in all) {
        var _all = all[type],
          _defaults = _all._defaults,
          _methods = _all._methods;
        _defaults._methods = _methods;
        scope.defaults.perAction[type] = _defaults;
      }
    }
  };
  var modifiers$1 = modifiers;

  var PointerEvent = /*#__PURE__*/function (_BaseEvent) {
    _inherits(PointerEvent, _BaseEvent);
    var _super = _createSuper(PointerEvent);
    function PointerEvent(type, pointer, event, eventTarget, interaction, timeStamp) {
      var _this;
      _classCallCheck(this, PointerEvent);
      _this = _super.call(this, interaction);
      pointerExtend(_assertThisInitialized(_this), event);
      if (event !== pointer) {
        pointerExtend(_assertThisInitialized(_this), pointer);
      }
      _this.timeStamp = timeStamp;
      _this.originalEvent = event;
      _this.type = type;
      _this.pointerId = getPointerId(pointer);
      _this.pointerType = getPointerType(pointer);
      _this.target = eventTarget;
      _this.currentTarget = null;
      if (type === 'tap') {
        var pointerIndex = interaction.getPointerIndex(pointer);
        _this.dt = _this.timeStamp - interaction.pointers[pointerIndex].downTime;
        var interval = _this.timeStamp - interaction.tapTime;
        _this.double = !!interaction.prevTap && interaction.prevTap.type !== 'doubletap' && interaction.prevTap.target === _this.target && interval < 500;
      } else if (type === 'doubletap') {
        _this.dt = pointer.timeStamp - interaction.tapTime;
        _this.double = true;
      }
      return _this;
    }
    _createClass(PointerEvent, [{
      key: "_subtractOrigin",
      value: function _subtractOrigin(_ref) {
        var originX = _ref.x,
          originY = _ref.y;
        this.pageX -= originX;
        this.pageY -= originY;
        this.clientX -= originX;
        this.clientY -= originY;
        return this;
      }
    }, {
      key: "_addOrigin",
      value: function _addOrigin(_ref2) {
        var originX = _ref2.x,
          originY = _ref2.y;
        this.pageX += originX;
        this.pageY += originY;
        this.clientX += originX;
        this.clientY += originY;
        return this;
      }

      /**
       * Prevent the default behaviour of the original Event
       */
    }, {
      key: "preventDefault",
      value: function preventDefault() {
        this.originalEvent.preventDefault();
      }
    }]);
    return PointerEvent;
  }(BaseEvent);

  var defaults = {
    holdDuration: 600,
    ignoreFrom: null,
    allowFrom: null,
    origin: {
      x: 0,
      y: 0
    }
  };
  var pointerEvents$1 = {
    id: 'pointer-events/base',
    before: ['inertia', 'modifiers', 'auto-start', 'actions'],
    install: install$3,
    listeners: {
      'interactions:new': addInteractionProps,
      'interactions:update-pointer': addHoldInfo,
      'interactions:move': moveAndClearHold,
      'interactions:down': function interactionsDown(arg, scope) {
        downAndStartHold(arg, scope);
        fire(arg, scope);
      },
      'interactions:up': function interactionsUp(arg, scope) {
        clearHold(arg);
        fire(arg, scope);
        tapAfterUp(arg, scope);
      },
      'interactions:cancel': function interactionsCancel(arg, scope) {
        clearHold(arg);
        fire(arg, scope);
      }
    },
    PointerEvent: PointerEvent,
    fire: fire,
    collectEventTargets: collectEventTargets,
    defaults: defaults,
    types: {
      down: true,
      move: true,
      up: true,
      cancel: true,
      tap: true,
      doubletap: true,
      hold: true
    }
  };
  function fire(arg, scope) {
    var interaction = arg.interaction,
      pointer = arg.pointer,
      event = arg.event,
      eventTarget = arg.eventTarget,
      type = arg.type,
      _arg$targets = arg.targets,
      targets = _arg$targets === void 0 ? collectEventTargets(arg, scope) : _arg$targets;
    var pointerEvent = new PointerEvent(type, pointer, event, eventTarget, interaction, scope.now());
    scope.fire('pointerEvents:new', {
      pointerEvent: pointerEvent
    });
    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      targets: targets,
      type: type,
      pointerEvent: pointerEvent
    };
    for (var i = 0; i < targets.length; i++) {
      var target = targets[i];
      for (var prop in target.props || {}) {
        pointerEvent[prop] = target.props[prop];
      }
      var origin = getOriginXY(target.eventable, target.node);
      pointerEvent._subtractOrigin(origin);
      pointerEvent.eventable = target.eventable;
      pointerEvent.currentTarget = target.node;
      target.eventable.fire(pointerEvent);
      pointerEvent._addOrigin(origin);
      if (pointerEvent.immediatePropagationStopped || pointerEvent.propagationStopped && i + 1 < targets.length && targets[i + 1].node !== pointerEvent.currentTarget) {
        break;
      }
    }
    scope.fire('pointerEvents:fired', signalArg);
    if (type === 'tap') {
      // if pointerEvent should make a double tap, create and fire a doubletap
      // PointerEvent and use that as the prevTap
      var prevTap = pointerEvent.double ? fire({
        interaction: interaction,
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        type: 'doubletap'
      }, scope) : pointerEvent;
      interaction.prevTap = prevTap;
      interaction.tapTime = prevTap.timeStamp;
    }
    return pointerEvent;
  }
  function collectEventTargets(_ref, scope) {
    var interaction = _ref.interaction,
      pointer = _ref.pointer,
      event = _ref.event,
      eventTarget = _ref.eventTarget,
      type = _ref.type;
    var pointerIndex = interaction.getPointerIndex(pointer);
    var pointerInfo = interaction.pointers[pointerIndex];

    // do not fire a tap event if the pointer was moved before being lifted
    if (type === 'tap' && (interaction.pointerWasMoved ||
    // or if the pointerup target is different to the pointerdown target
    !(pointerInfo && pointerInfo.downTarget === eventTarget))) {
      return [];
    }
    var path = getPath(eventTarget);
    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: type,
      path: path,
      targets: [],
      node: null
    };
    for (var _i2 = 0; _i2 < path.length; _i2++) {
      var node = path[_i2];
      signalArg.node = node;
      scope.fire('pointerEvents:collect-targets', signalArg);
    }
    if (type === 'hold') {
      signalArg.targets = signalArg.targets.filter(function (target) {
        var _interaction$pointers, _interaction$pointers2;
        return target.eventable.options.holdDuration === ((_interaction$pointers = interaction.pointers[pointerIndex]) == null ? void 0 : (_interaction$pointers2 = _interaction$pointers.hold) == null ? void 0 : _interaction$pointers2.duration);
      });
    }
    return signalArg.targets;
  }
  function addInteractionProps(_ref2) {
    var interaction = _ref2.interaction;
    interaction.prevTap = null; // the most recent tap event on this interaction
    interaction.tapTime = 0; // time of the most recent tap event
  }
  function addHoldInfo(_ref3) {
    var down = _ref3.down,
      pointerInfo = _ref3.pointerInfo;
    if (!down && pointerInfo.hold) {
      return;
    }
    pointerInfo.hold = {
      duration: Infinity,
      timeout: null
    };
  }
  function clearHold(_ref4) {
    var interaction = _ref4.interaction,
      pointerIndex = _ref4.pointerIndex;
    var hold = interaction.pointers[pointerIndex].hold;
    if (hold && hold.timeout) {
      clearTimeout(hold.timeout);
      hold.timeout = null;
    }
  }
  function moveAndClearHold(arg, scope) {
    var interaction = arg.interaction,
      pointer = arg.pointer,
      event = arg.event,
      eventTarget = arg.eventTarget,
      duplicate = arg.duplicate;
    if (!duplicate && (!interaction.pointerIsDown || interaction.pointerWasMoved)) {
      if (interaction.pointerIsDown) {
        clearHold(arg);
      }
      fire({
        interaction: interaction,
        pointer: pointer,
        event: event,
        eventTarget: eventTarget,
        type: 'move'
      }, scope);
    }
  }
  function downAndStartHold(_ref5, scope) {
    var interaction = _ref5.interaction,
      pointer = _ref5.pointer,
      event = _ref5.event,
      eventTarget = _ref5.eventTarget,
      pointerIndex = _ref5.pointerIndex;
    var timer = interaction.pointers[pointerIndex].hold;
    var path = getPath(eventTarget);
    var signalArg = {
      interaction: interaction,
      pointer: pointer,
      event: event,
      eventTarget: eventTarget,
      type: 'hold',
      targets: [],
      path: path,
      node: null
    };
    for (var _i4 = 0; _i4 < path.length; _i4++) {
      var node = path[_i4];
      signalArg.node = node;
      scope.fire('pointerEvents:collect-targets', signalArg);
    }
    if (!signalArg.targets.length) return;
    var minDuration = Infinity;
    for (var _i6 = 0, _signalArg$targets2 = signalArg.targets; _i6 < _signalArg$targets2.length; _i6++) {
      var target = _signalArg$targets2[_i6];
      var holdDuration = target.eventable.options.holdDuration;
      if (holdDuration < minDuration) {
        minDuration = holdDuration;
      }
    }
    timer.duration = minDuration;
    timer.timeout = setTimeout(function () {
      fire({
        interaction: interaction,
        eventTarget: eventTarget,
        pointer: pointer,
        event: event,
        type: 'hold'
      }, scope);
    }, minDuration);
  }
  function tapAfterUp(_ref6, scope) {
    var interaction = _ref6.interaction,
      pointer = _ref6.pointer,
      event = _ref6.event,
      eventTarget = _ref6.eventTarget;
    if (!interaction.pointerWasMoved) {
      fire({
        interaction: interaction,
        eventTarget: eventTarget,
        pointer: pointer,
        event: event,
        type: 'tap'
      }, scope);
    }
  }
  function install$3(scope) {
    scope.pointerEvents = pointerEvents$1;
    scope.defaults.actions.pointerEvents = pointerEvents$1.defaults;
    extend(scope.actions.phaselessTypes, pointerEvents$1.types);
  }

  var pointerEvents$2 = /*#__PURE__*/Object.freeze({
    __proto__: null,
    default: pointerEvents$1
  });

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  function install$2(scope) {
    scope.usePlugin(pointerEvents$1);
    var pointerEvents = scope.pointerEvents;

    // don't repeat by default
    pointerEvents.defaults.holdRepeatInterval = 0;
    pointerEvents.types.holdrepeat = scope.actions.phaselessTypes.holdrepeat = true;
  }
  function onNew(_ref) {
    var pointerEvent = _ref.pointerEvent;
    if (pointerEvent.type !== 'hold') return;
    pointerEvent.count = (pointerEvent.count || 0) + 1;
  }
  function onFired(_ref2, scope) {
    var interaction = _ref2.interaction,
      pointerEvent = _ref2.pointerEvent,
      eventTarget = _ref2.eventTarget,
      targets = _ref2.targets;
    if (pointerEvent.type !== 'hold' || !targets.length) return;

    // get the repeat interval from the first eventable
    var interval = targets[0].eventable.options.holdRepeatInterval;

    // don't repeat if the interval is 0 or less
    if (interval <= 0) return;

    // set a timeout to fire the holdrepeat event
    interaction.holdIntervalHandle = setTimeout(function () {
      scope.pointerEvents.fire({
        interaction: interaction,
        eventTarget: eventTarget,
        type: 'hold',
        pointer: pointerEvent,
        event: pointerEvent
      }, scope);
    }, interval);
  }
  function endHoldRepeat(_ref3) {
    var interaction = _ref3.interaction;
    // set the interaction's holdStopTime property
    // to stop further holdRepeat events
    if (interaction.holdIntervalHandle) {
      clearInterval(interaction.holdIntervalHandle);
      interaction.holdIntervalHandle = null;
    }
  }
  var holdRepeat = {
    id: 'pointer-events/holdRepeat',
    install: install$2,
    listeners: ['move', 'up', 'cancel', 'endall'].reduce(function (acc, enderTypes) {
      acc["pointerEvents:".concat(enderTypes)] = endHoldRepeat;
      return acc;
    }, {
      'pointerEvents:new': onNew,
      'pointerEvents:fired': onFired
    })
  };
  var holdRepeat$1 = holdRepeat;

  function install$1(scope) {
    var Interactable = scope.Interactable;
    Interactable.prototype.pointerEvents = function (options) {
      extend(this.events.options, options);
      return this;
    };
    var __backCompatOption = Interactable.prototype._backCompatOption;
    Interactable.prototype._backCompatOption = function (optionName, newValue) {
      var ret = __backCompatOption.call(this, optionName, newValue);
      if (ret === this) {
        this.events.options[optionName] = newValue;
      }
      return ret;
    };
  }
  var plugin$1 = {
    id: 'pointer-events/interactableTargets',
    install: install$1,
    listeners: {
      'pointerEvents:collect-targets': function pointerEventsCollectTargets(_ref, scope) {
        var targets = _ref.targets,
          node = _ref.node,
          type = _ref.type,
          eventTarget = _ref.eventTarget;
        scope.interactables.forEachMatch(node, function (interactable) {
          var eventable = interactable.events;
          var options = eventable.options;
          if (eventable.types[type] && eventable.types[type].length && interactable.testIgnoreAllow(options, node, eventTarget)) {
            targets.push({
              node: node,
              eventable: eventable,
              props: {
                interactable: interactable
              }
            });
          }
        });
      },
      'interactable:new': function interactableNew(_ref2) {
        var interactable = _ref2.interactable;
        interactable.events.getRect = function (element) {
          return interactable.getRect(element);
        };
      },
      'interactable:set': function interactableSet(_ref3, scope) {
        var interactable = _ref3.interactable,
          options = _ref3.options;
        extend(interactable.events.options, scope.pointerEvents.defaults);
        extend(interactable.events.options, options.pointerEvents || {});
      }
    }
  };
  var interactableTargets = plugin$1;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  var plugin = {
    id: 'pointer-events',
    install: function install(scope) {
      scope.usePlugin(pointerEvents$2);
      scope.usePlugin(holdRepeat$1);
      scope.usePlugin(interactableTargets);
    }
  };
  var pointerEvents = plugin;

  function install(scope) {
    var Interactable = scope.Interactable;
    scope.actions.phases.reflow = true;
    Interactable.prototype.reflow = function (action) {
      return doReflow(this, action, scope);
    };
  }
  function doReflow(interactable, action, scope) {
    var elements = interactable.getAllElements();

    // tslint:disable-next-line variable-name
    var Promise = scope.window.Promise;
    var promises = Promise ? [] : null;
    var _loop = function _loop() {
      var element = elements[_i2];
      var rect = interactable.getRect(element);
      if (!rect) {
        return 1; // break
      }
      var runningInteraction = find(scope.interactions.list, function (interaction) {
        return interaction.interacting() && interaction.interactable === interactable && interaction.element === element && interaction.prepared.name === action.name;
      });
      var reflowPromise;
      if (runningInteraction) {
        runningInteraction.move();
        if (promises) {
          reflowPromise = runningInteraction._reflowPromise || new Promise(function (resolve) {
            runningInteraction._reflowResolve = resolve;
          });
        }
      } else {
        var xywh = tlbrToXywh(rect);
        var coords = {
          page: {
            x: xywh.x,
            y: xywh.y
          },
          client: {
            x: xywh.x,
            y: xywh.y
          },
          timeStamp: scope.now()
        };
        var event = coordsToEvent(coords);
        reflowPromise = startReflow(scope, interactable, element, action, event);
      }
      if (promises) {
        promises.push(reflowPromise);
      }
    };
    for (var _i2 = 0; _i2 < elements.length; _i2++) {
      if (_loop()) break;
    }
    return promises && Promise.all(promises).then(function () {
      return interactable;
    });
  }
  function startReflow(scope, interactable, element, action, event) {
    var interaction = scope.interactions.new({
      pointerType: 'reflow'
    });
    var signalArg = {
      interaction: interaction,
      event: event,
      pointer: event,
      eventTarget: element,
      phase: 'reflow'
    };
    interaction.interactable = interactable;
    interaction.element = element;
    interaction.prevEvent = event;
    interaction.updatePointer(event, event, element, true);
    setZeroCoords(interaction.coords.delta);
    copyAction(interaction.prepared, action);
    interaction._doPhase(signalArg);
    var _ref = scope.window,
      Promise = _ref.Promise;
    var reflowPromise = Promise ? new Promise(function (resolve) {
      interaction._reflowResolve = resolve;
    }) : undefined;
    interaction._reflowPromise = reflowPromise;
    interaction.start(action, interactable, element);
    if (interaction._interacting) {
      interaction.move(signalArg);
      interaction.end(event);
    } else {
      interaction.stop();
      interaction._reflowResolve();
    }
    interaction.removePointer(event, event);
    return reflowPromise;
  }
  var reflow = {
    id: 'reflow',
    install: install,
    listeners: {
      // remove completed reflow interactions
      'interactions:stop': function interactionsStop(_ref2, scope) {
        var interaction = _ref2.interaction;
        if (interaction.pointerType === 'reflow') {
          if (interaction._reflowResolve) {
            interaction._reflowResolve();
          }
          remove(scope.interactions.list, interaction);
        }
      }
    }
  };
  var reflow$1 = reflow;

  /* eslint-disable import/no-duplicates -- for typescript module augmentations */
  /* eslint-enable import/no-duplicates */

  interact$1.use(interactablePreventDefault);
  interact$1.use(offset$1);

  // pointerEvents
  interact$1.use(pointerEvents);

  // inertia
  interact$1.use(inertia$1);

  // snap, resize, etc.
  interact$1.use(modifiers$1);

  // autoStart, hold
  interact$1.use(autoStart);

  // drag and drop, resize, gesture
  interact$1.use(actions);

  // autoScroll
  interact$1.use(autoScroll$1);

  // reflow
  interact$1.use(reflow$1);

  // eslint-disable-next-line no-undef
  {
    interact$1.use(devTools);
  }
  interact$1.default = interact$1;

  if ((typeof module === "undefined" ? "undefined" : _typeof(module)) === 'object' && !!module) {
    try {
      module.exports = interact$1;
    } catch (_unused) {}
  }
  interact$1.default = interact$1;

  return interact$1;

}));
//# sourceMappingURL=interact.js.map
