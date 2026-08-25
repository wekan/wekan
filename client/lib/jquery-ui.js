// https://bugs.jqueryui.com/ticket/15020
// required for sortable
require('jquery-ui/ui/widget')
require('jquery-ui/ui/scroll-parent')
require('jquery-ui/ui/data')
require('jquery-ui/ui/widgets/mouse')
require('jquery-ui/ui/widgets/sortable')

// required for draggable
require('jquery-ui/ui/plugin')
require('jquery-ui/ui/widgets/draggable')

// everything already required for droppable
require('jquery-ui/ui/widgets/droppable')

// enable touch on mobile
require('@rwap/jquery-ui-touch-punch')

// #5421: touch-punch synthesizes a click for EVERY touch gesture shorter than
// 500 ms, even when jQuery UI's mouse adapter successfully completed a drag.
// A fast card move therefore also follows the minicard anchor and opens the
// card route, which looks like a page reload with the moved card popup open.
// Capture whether a drag was active before touch-punch's mouseup clears it and
// suppress only the synchronous click touch-punch emits from that touchend.
const { runTouchEndWithoutPostDragClick } = require('/models/lib/touchDragClickGuard');
const mouseProto = $.ui && $.ui.mouse && $.ui.mouse.prototype;
if (mouseProto && mouseProto._touchEnd && !mouseProto._wekanPostDragClickGuard) {
  const touchEnd = mouseProto._touchEnd;
  mouseProto._touchEnd = function(event) {
    const wasDragging = this._mouseStarted === true;
    return runTouchEndWithoutPostDragClick(
      wasDragging,
      event && event.target,
      () => touchEnd.call(this, event),
    );
  };
  mouseProto._wekanPostDragClickGuard = true;
}
