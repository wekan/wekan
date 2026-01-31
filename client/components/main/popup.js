import { BlazeComponent } from 'meteor/peerlibrary:blaze-components';
import { Template } from 'meteor/templating';

const PopupBias = {
  Before: Symbol("S"),
  Overlap: Symbol("M"),
  After: Symbol("A"),
  Fullscreen: Symbol("F"),
  includes(e) {
    return Object.values(this).includes(e);
  }
}

// this class is a bit cumbersome and could probably be done simpler.
// it manages two things : initial placement and sizing given an opener element,
// and then movement and resizing. one difficulty was to be able, as a popup
// which can be resized from the "outside" (CSS4) and move from the inside (inner
// component), which also grows and shrinks frequently, to adapt.
// I tried many approach and failed to get the perfect fit; I feel that there is
// always something indeterminate at some point. so the only drawback is that
// if a popup contains another resizable component (e.g. card details), and if
// it has been resized (with CSS handle), it will lose its dimensions when dragging
// it next time.
class PopupDetachedComponent extends BlazeComponent {
  onCreated() {
    // Set by parent/caller (usually PopupComponent)
    ({ nonPlaceholderOpener: this.nonPlaceholderOpener, closeDOMs: this.closeDOMs = [], followDOM: this.followDOM } = this.data());


    if (typeof(this.closeDOMs) === "string") {
      // helper for passing arg in JADE template
      this.closeDOMs = this.closeDOMs.split(';');
    }

    // The popup's own header, if it exists
    this.closeDOMs.push("click .js-close-detached-popup");
  }

  // Main intent of this component is to have a modular popup with defaults:
  // - sticks to its opener while being a child of body (thus in the same stacking context, no z-index issue)
  // - is responsive on shrink while keeping position absolute
  // - can grow back to initial position step by step
  // - exposes various sizes as CSS variables so each rendered popup can use them to adapt defaults
  // * issue is that it is done by hand, with heurisitic/simple algorithm from my thoughts, not sure it covers edge cases
  // * however it works well so far and maybe more "fixed" element should be popups
  onRendered() {
    // Remember initial ratio between initial dimensions and viewport
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    this.popup = this.firstNode();
    this.popupOpener = this.data().openerElement;

    const popupStyle = window.getComputedStyle(this.firstNode());
    // margin may be in a relative unit, not computable in JS, but we get the actual pixels here
    this.popupMargin = parseFloat(popupStyle.getPropertyValue("--popup-margin"), 10) || Math.min(window.innerWidth / 50, window.innerHeight / 50);

    this.dims(this.computeMaxDims());

    this.initialPopupWidth = this.popupDims.width;
    this.initialPopupHeight = this.popupDims.height;
    this.initialHeightRatio = this.initialPopupHeight / viewportHeight;
    this.initialWidthRatio = this.initialPopupWidth / viewportWidth;

    this.dims(this.computePopupDims());


    if (this.followDOM) {
      // we cannot use the event map because it only accepts known events;
      // but neither resize nor moving can be easily tracked; luckily, MutationObserver API
      // can track inline style, which is probably the way of doing of of underlying element.
      // ---
      // try child DOM element and if not found, fallback to any displayed element
      this.innerElement = this.find(this.followDOM) ?? document.querySelector(this.followDOM);
      this.follow();
    }

    this.toFront();

    // there is a reactive variable for window resize in Utils, but the interface is too slow
    // with all reactive stuff, use events when possible and when not really bypassing logic
    $(window).on('resize', () => {
      this.dims(this.computePopupDims());
    });
  }

  dims(newDims) {
    if (!this.popupDims) {
      this.popupDims = {};
    }
    if (newDims) {
      // boilerplate to make sure that popup visually fits
      let { left, top, width, height } = newDims;
      let overflowBottom = top + height + 2 * this.popupMargin - window.innerHeight;
      let overflowRight = left + width + 2 * this.popupMargin - window.innerWidth;
      if (overflowRight > 0) {
        width = Math.max(window.innerWidth / 10, Math.min(width - overflowRight, window.innerWidth - 2 * this.popupMargin));
      }
      if (overflowBottom > 0) {
        height = Math.max(window.innerHeight / 10, Math.min(height - overflowBottom, window.innerHeight - 2 * this.popupMargin));
      }
      left = Math.max(left, this.popupMargin);
      top = Math.max(top, this.popupMargin);
      newDims = { left, top, width, height };
      for (const e of Object.keys(newDims)) {
          $(this.popup).css(e, `${parseFloat(newDims[e])}px`);
        }
        Object.assign(this.popupDims, newDims);
      }
    return this.popupDims;
  }

  sizeAfterExternalChange(params) {
    let payload = {};
    let asis = {};
    for (const e of ["left", "top", "height", "width"]) {
      let p = params[e];
      if (!p) continue;
      if (typeof(p) === "string") {p = parseFloat(p)}
      if (isNaN(p)) {asis[e] = p}
      else {payload[e] = p}
    }
    $(this.popup).css(asis);
    if (Object.keys(payload).length === 0) return;

    let { left, top, width, height } = payload;

    if (this.innerElement) {
      const innerStyle = window.getComputedStyle(this.innerElement);
      const innerWidth = parseFloat(innerStyle.width)
      const innerHeight = parseFloat(innerStyle.height)
      if (innerWidth && (innerWidth < width || !this.mouseDown)) {
        width = innerWidth;
      }
      if (innerHeight && (innerHeight < height || !this.mouseDown)) {
        height = innerHeight;
      }
    }

    if (left && top) {
      return {left, top, height, width};
    }
    return {height, width};
  }

  follow() {
    // It took me a while to find this idea and I had soooo much lines of code before
    // for a mediocre result; here the thing is that anytime popup changes
    // dimension, both sizes (virtually) go to auto, but there's only one round trip because
    // the inner only one element is being actively moved/redim (CSS resize, handle, collapse...).
    // So the passive element will grow or shrink with either its parent or child, without complicated computations and without preventing manual resizing then.
    // 💡 A nice thing to add would be avoiding reset the size when dragging after having resized;
    // but this is not so simple and would at least need to differentiate events (e.g. by keeping
    // track on previous individual properties and taking care of infinite loops))
    let deltaX;
    let deltaY;
    const followChild = new MutationObserver(() => {
      const style = window.getComputedStyle(this.innerElement);
      const left = parseFloat(style.left);
      const top = parseFloat(style.top);
      if (!deltaX || isNaN(deltaX)) {deltaX = this.dims().left - left}
      if (!deltaY || isNaN(deltaY)) {deltaY = this.dims().top - top}
      this.dims(this.sizeAfterExternalChange({width: this.popup.scrollWidth, height: this.popup.scrollHeight, left: parseFloat(left) + deltaX, top: parseFloat(top) + deltaY}));
    })

    followChild.observe(this.innerElement, { attributes: true, attributeFilter: ['style', 'class'] });
  }

  currentZ(z = undefined) {
    // relative, add a constant to be above root elements
    if (z !== undefined) {
      this.firstNode().style.zIndex = parseInt(z) + 10;
    }
    return parseInt(this.firstNode().style.zIndex) - 10;
  }

  // a bit complex...
  toFront() {
    this.currentZ(Math.max(...PopupComponent.stack.map(p => BlazeComponent.getComponentForElement(p.outerView.firstNode()).currentZ())) || 0 + 1);

  }

  toBack() {
    this.currentZ(Math.min(...PopupComponent.stack.map(p => BlazeComponent.getComponentForElement(p.outerView.firstNode()).currentZ())) || 1 - 1);
  }

  events() {
    // needs to be done at this level; "parent" is not a parent in DOM
    let closeEvents = {};

    this.closeDOMs?.forEach((e) => {
      closeEvents[e] = (_) => {
        this.parentComponent().destroy();
      }
    })

    const miscEvents = {
      'click .js-confirm'() {
        this.data().afterConfirm?.call(this);
      },
      'dragend .pop-over'() {
        this.dims(this.computePopupDims());
      },
      // bad heuristic but only for best-effort UI
      'pointerdown .pop-over'() {
        this.mouseDown = true;
      },
      'pointerup .pop-over'() {
        this.mouseDown = false;
      }
    };

    // We do not manage dragging without our own header
    if (this.data().showHeader) {
      const handleSelector = Utils.isMiniScreen() ? '.js-popup-drag-handle' : '.header-title';
      miscEvents[`pointerdown ${handleSelector}`] = (event) => {
        event.preventDefault();
        $(event.target).addClass('is-active');
        const deltaHandleX = this.dims().left - event.clientX;
        const deltaHandleY = this.dims().top - event.clientY;

        const onPointerMove = (e) => {
          this.dims(this.sizeAfterExternalChange({ left: e.clientX + deltaHandleX, top: e.clientY + deltaHandleY }));

          if (this.popup.scrollY) {
            this.popup.scrollTo(0, 0);
          }
        };

        const onPointerUp = (event) => {
          $(document).off('pointermove', onPointerMove);
          $(document).off('pointerup', onPointerUp);
          $(event.target).removeClass('is-active');
        };

        if (Utils.shouldIgnorePointer(event)) {
          onPointerUp(event);
          return;
        }

        $(document).on('pointermove', onPointerMove);
        $(document).on('pointerup', onPointerUp);
      };
    }
    return super.events().concat(closeEvents).concat(miscEvents);
  }

  computeMaxDims() {
    // Get size of inner content, even if it overflows
    const content = this.find('.content');
    let popupHeight = content.scrollHeight;
    let popupWidth = content.scrollWidth;
    if (this.data().showHeader) {
      const headerRect = this.find('.header');
      popupHeight += headerRect.scrollHeight;
      popupWidth = Math.max(popupWidth, headerRect.scrollWidth)
    }
    return { width: Math.max(popupWidth, $(this.popup).width()), height: Math.max(popupHeight, $(this.popup).height()) };

  }

  placeOnSingleDimension(elementLength, openerPos, openerLength, maxLength, biases, n) {
    // avoid too much recursion if no solution
    if (!n) {
      n = 0;
    }
    if (n >= 5) {
      // if we exhausted a bias, remove it
      n = 0;
      biases.pop();
      if (biases.length === 0) {
        return -1;
      }
    } else {
      n += 1;
    }

    if (!biases?.length) {
      const cut = maxLength / 3;

      if (openerPos < cut) {
        // Corresponds to the default ordering: if element is close to the axe's start,
        // try to put the popup after it; then to overlap; and give up otherwise.
        biases = [PopupBias.After, PopupBias.Overlap]
      }
      else if (openerPos > 2 * cut) {
        // Same idea if popup is close to the end
        biases = [PopupBias.Before, PopupBias.Overlap]
      }
      else {
        // If in the middle, try to overlap: choosing between start or end, even for
        // default, is too arbitrary; a custom order can be passed in argument.
        biases = [PopupBias.Overlap]
      }
    }
    // Remove the first element and get it
    const bias = biases.splice(0, 1)[0];

    let factor;
    const openerRef = openerPos + openerLength / 2;
    if (bias === PopupBias.Before) {
      factor = 1;
    }
    else if (bias === PopupBias.Overlap) {
      factor = openerRef / maxLength;
    }
    else {
      factor = 0;
    }

    let candidatePos = openerRef - elementLength * factor;
    const deltaMax = candidatePos + elementLength - maxLength;
    if (candidatePos < 0 || deltaMax > 0) {
      if (deltaMax <= 2 * this.popupMargin) {
        // if this is just a matter of margin, try again
        // useful for (literal) corner cases
        biases = [bias].concat(biases);
        openerPos -= 5;
      }
      if (biases.length === 0) {
        // we could have returned candidate position even if the size is too large, so
        // that the caller can choose, but it means more computations and edge cases...
        // any negative means fullscreen overall as the caller will take the maximum between
        // margin and candidate.
        return -1;
      }
      return this.placeOnSingleDimension(elementLength, openerPos, openerLength, maxLength, biases, n);
    }
    return candidatePos;
  }

  computePopupDims() {
    if (!this.isRendered?.()) {
      return;
    }

    // Coordinates of opener related to viewport
    let { x: parentX, y: parentY } = this.nonPlaceholderOpener.getBoundingClientRect();
    let { height: parentHeight, width: parentWidth } = this.nonPlaceholderOpener.getBoundingClientRect();

    // Initial dimensions scaled to the viewport, if it has changed
    let popupHeight = window.innerHeight * this.initialHeightRatio;
    let popupWidth = window.innerWidth * this.initialWidthRatio;

    if (Utils.isMiniScreen() && popupWidth >= 4 * window.innerWidth / 5 && popupHeight >= 4 * window.innerHeight / 5) {
      // Go fullscreen!
      popupWidth = window.innerWidth;
      // Avoid address bar, let a bit of margin to scroll
      popupHeight = 4 * window.innerHeight / 5;
      this.popupMargin = 0;
      return ({
        width: window.innerWidth,
        height: window.innerHeight,
        left: 0,
        top: 0,
      });
    } else {
      // Current viewport dimensions
      let maxHeight = window.innerHeight - this.popupMargin * 2;
      let maxWidth = window.innerWidth - this.popupMargin * 2;
      let biasX, biasY;
      if (Utils.isMiniScreen()) {
        // On mobile I found that being able to close a popup really close from where it has been clicked
        // is comfortable; so given that the close button is top-right, we prefer the position of
        // popup being right-bottom, when possible. We then try every position, rather than choosing
        // relatively to the relative position of opener in viewport
        biasX = [PopupBias.Before, PopupBias.Overlap, PopupBias.After];
        biasY = [PopupBias.After, PopupBias.Overlap, PopupBias.Before];
      }

      const candidateX = this.placeOnSingleDimension(popupWidth, parentX, parentWidth, maxWidth, biasX);
      const candidateY = this.placeOnSingleDimension(popupHeight, parentY, parentHeight, maxHeight, biasY);

      // Reasonable defaults that can be overriden by CSS later: popups are tall, try to fit the reste
      // of the screen starting from parent element, or full screen if element if not fitting
      return ({
        width: popupWidth,
        height: popupHeight,
        left: candidateX,
        top: candidateY,
      });
    }
  }
}

class PopupComponent extends BlazeComponent {
  static stack = [];
  // good enough as long as few occurences of such cases
  static multipleWhitelist = ["cardDetails"];

  // to provide compatibility with Popup.open().
  static open(args) {
    const openerView = Blaze.getView(args.openerElement);
    if (!openerView) {
      console.warn(`no parent found for popup ${args.name}, attaching to body: this should not happen`);
    }


    // render ourselves; everything is automatically managed from that moment, we just added
    // a level of indirection but this will not interfere with data
    const popup = new PopupComponent();
    Blaze.renderWithData(
      popup.renderComponent(BlazeComponent.currentComponent()),
      args,
      args.openerElement,
      null,
      openerView
    );
    return popup;
  }

  static destroy() {
    PopupComponent.stack.at(-1)?.destroy();
  }

  static findParentPopup(element) {
    return BlazeComponent.getComponentForElement($(element).closest('.pop-over')[0]);
  }

  static toFront(event) {
    PopupComponent.findParentPopup(event.target).toFront();
  }

  static toBack(event) {
    PopupComponent.findParentPopup(event.target).toBack();
  }

  getOpenerElement(view) {
    // Look for the first parent view whose first DOM element is not virtually us
    const firstNode = $(view.firstNode());

    // The goal is to have the best chances to get the element whose size and pos
    // are relevant; e.g. when clicking on a date on a minicard, we don't wan't
    // the opener to be set to the minicard.
    // In order to work in general, we need to take special situations into account,
    // e.g. the placeholder is isolated, or does not have previous node, and so on.
    // In general we prefer previous node, then next, then any displayed sibling,
    // then the parent, and so on.
    let candidates = [];
    if (!firstNode.hasClass(this.popupPlaceholderClass())) {
      candidates.push(firstNode);
    }
    candidates = candidates.concat([firstNode.prev(), firstNode.next()]);
    const otherSiblings = Array.from(firstNode.siblings()).filter(e => !candidates.includes(e));

    for (const cand of candidates.concat(otherSiblings)) {
      const displayCSS = cand?.css("display");
      if (displayCSS && displayCSS !== "none") {
        return cand[0];
      }
    }
    return this.getOpenerElement(view.parentView);
  }

  getParentData(view) {;
    let data;
    // ⚠️ node can be a text node
    while (view.firstNode?.()?.classList?.contains(this.popupPlaceholderClass())) {
      view = view.parentView;
      data = Blaze.getData(view);
    }
    // This is VERY IMPORTANT to get data like this and not with templateInstance.data,
    // because this form is reactive. So all inner popups have reactive data, which is nice
    return data;
  }

  onCreated() {
    // All of this, except name, is optional. The rest is provided "just in case", for convenience (hopefully)
    //
    // - name is the name of a template to render inside the popup (to the detriment of its size) or the contrary
    // - showHeader can be turned off if the inner content always have a header with buttons and so on
    // - title is shown when header is shown
    // - miscOptions is for compatibility
    // - closeVar is an optional string representing a Session variable: if set, the popup reactively closes when the variable changes and set the variable to null on close
    // - closeDOMs can be used alternatively; it is an array of "<event> <selector>" to listen that closes the popup.
    //   if header is shown, closing the popup is already managed. selector is relative to the inner template (same as its event map)
    // - followDOM is an element whose dimensions and position will serve as reference; works only with inline styles (otherwise we probably would need IntersectionObserver-like stuff, async etc)
    //   it is useful when the content can be redimensionned/moved by code or user; we still manage events, resizes etc
    //   but allow inner elements or handles to do it (and we adapt).
    // do not render a template multiple times
    const existing = PopupComponent.stack.find((e) => (e.name == this.name));
    if (existing && !PopupComponent.multipleWhitelist.indexOf(this.name)) {
      // ⚠️ is there a default better than another? I feel that closing existing
      // popup is not bad in general because having the same button for open and close
      // is common
      existing.destroy();
      // but is could also be re-rendering, eg
      // existing.render();
      return;
    }

    const data = this.data();
    this.popupArgs = {
      name: data.name,
      showHeader: data.showHeader ?? true,
      title: data.title,
      openerElement: data.openerElement,
      closeDOMs: data.closeDOMs,
      followDOM: data.followDOM,
      forceData: data.miscOptions?.dataContextIfCurrentDataIsUndefined,
      afterConfirm: data.miscOptions?.afterConfirm,
    }
    this.name = this.data().name;

    this.innerTemplate = Template[this.name];
    this.innerComponent = BlazeComponent.getComponent(this.name);

    this.outerComponent = BlazeComponent.getComponent('popupDetached');
    if (!(this.innerComponent || this.innerTemplate)) {
      throw new Error(`template and/or component ${this.name} not found`);
    }

    // If arg is not set, must be closed manually by calling destroy()
    if (this.popupArgs.closeVar) {
      this.closeInitialValue = Session.get(this.data().closeVar);
      if (!this.closeInitialValue === undefined) {
        this.autorun(() => {
          if (Session.get(this.data().closeVar) !== this.closeInitialValue) {
            this.onDestroyed();
          }
        });
      }
    }
  }

  popupPlaceholderClass() {
    return "popup-placeholder";
  }

  render() {
    const oldOuterView = this.outerView;
    // see below for comments
    this.outerView = Blaze.renderWithData(
      // data is passed through the parent relationship
      // we need to render it again to keep events in sync with inner popup
      this.outerComponent.renderComponent(this.component()),
      this.popupArgs,
      document.body,
      null,
      this.openerView
    );
    this.innerView = Blaze.renderWithData(
      // the template to render: either the content is a BlazeComponent or a regular template
      // if a BlazeComponent, render it as a template first
      this.innerComponent?.renderComponent?.(this.component()) || this.innerTemplate,
      // dataContext used for rendering: each time we go find data, because it is non-reactive
      () => (this.popupArgs.forceData || this.getParentData(this.currentView)),
      // DOM parent: ask to the detached popup, will be inserted at the last child
      this.outerView.firstNode()?.getElementsByClassName('content')?.[0] || document.body,
      // "stop" DOM element; we don't use
      null,
      // important: this is the Blaze.View object which will be set as `parentView` of
      // the rendered view. we set it as the parent view, so that the detached popup
      // can interact with its "parent" without being a child of it, and without
      // manipulating DOM directly.
      this.openerView
    );
    if (oldOuterView) {
      Blaze.remove(oldOuterView);
    }
  }

  onRendered() {
    // Use plain Blaze stuff to be able to render all templates, but use components when available/relevant
    this.currentView = Blaze.currentView || Blaze.getView(this.component().firstNode());

    // Placement will be related to the opener (usually clicked element)
    // But template data and view related to the opener are not the same:
    // - view is probably outer, as is was already rendered on click
    // - template data could be found with Template.parentData(n), but `n` can
    //   vary depending on context: using those methods feels more reliable for this use case
    this.popupArgs.openerElement ??= this.getOpenerElement(this.currentView);
    this.openerView = Blaze.getView(this.popupArgs.openerElement);
    // With programmatic/click opening, we get the "real" opener; with dynamic
    // templating we get the placeholder and need to go up to get a glimpse of
    // the "real" opener size. It is quite imprecise in that case (maybe the
    // interesting opener is a sibling, not an ancestor), but seems to do the job
    // for now.
    // Also it feels sane that inner content does not have a reference to
    // a virtual placeholder.
    const opener = this.popupArgs.openerElement;
    let sizedOpener = opener;
    if (opener.classList?.contains?.(this.popupPlaceholderClass())) {
      sizedOpener = opener.parentNode;
    }
    this.popupArgs.nonPlaceholderOpener = sizedOpener;

    PopupComponent.stack.push(this);

    try {
      this.render();
      // Render above other popups by default
    } catch(e) {
      // If something went wrong during rendering, do not create
      // "zombie" popups
      console.error(`cannot render popup ${this.name}: ${e}`);
      this.destroy();
    }
  }

  destroy() {
    if (!PopupComponent.stack.includes(this)) {
      // Avoid loop destroy
      return;
    }
    const closeVar = this.data().closeVar;
    if (closeVar) {
      Session.set(closeVar, null);
    }
    // Maybe overkill but may help to avoid leaking memory
    // as programmatic rendering is less usual
    for (const view of [this.innerView, this.currentView, this.outerView]) {
      try {
        Blaze.remove(view);
      } catch {
        console.warn(`A view failed to be removed: ${view}`)
      }
    }
    this.innerComponent?.removeComponent?.();
    this.outerComponent?.removeComponent?.();
    this.removeComponent();

    // not necesserly removed in order, e.g. multiple cards
    PopupComponent.stack = PopupComponent.stack.filter(e => e !== this);
  }


  closeWithPlaceholder(parentElement) {
    // adapted from https://stackoverflow.com/questions/52834774/dom-event-when-element-is-removed
    // strangely, when opener is removed because of a reactive change, this component
    // do not get any lifecycle hook called, so we need to bridge the gap. Simply
    // "close" popup when placeholder is off-DOM.
    while (parentElement.nodeType === Node.TEXT_NODE) {
      parentElement = parentElement.parentElement;
    }
    const placeholder = parentElement.getElementsByClassName(this.popupPlaceholderClass());
    if (!placeholder.length) {
      return;
    }
    const observer = new MutationObserver(() => {
      // DOM element being suppressed is reflected in array
      if (placeholder.length === 0) {
        this.destroy();
      }
    });
    observer.observe(parentElement, {childList: true});
  }
}

PopupComponent.register("popup");
PopupDetachedComponent.register('popupDetached');

export default PopupComponent;
window.PopupComponent = PopupComponent;