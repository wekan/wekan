/**
 * @fileoverview dragscroll - scroll area by dragging
 * @version 0.0.9
 * 
 * @license MIT, see http://github.com/wekan/dragscroll
 * @copyright 2015-2026 asvd <heliosframework@gmail.com>, mfilser, xet7
 */

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.dragscroll = {}));
    }
}(this, function (exports) {
    var _window = window;
    var _document = document;
    var mousemove = 'mousemove';
    var mouseup = 'mouseup';
    var mousedown = 'mousedown';
    var EventListener = 'EventListener';
    var addEventListener = 'add'+EventListener;
    var removeEventListener = 'remove'+EventListener;
    var newScrollX, newScrollY;

    var dragged = [];
    var reset = function(i, el) {
        for (i = 0; i < dragged.length;) {
            el = dragged[i++];
            el = el.container || el;
            el[removeEventListener](mousedown, el.md, 0);
            _window[removeEventListener](mouseup, el.mu, 0);
            _window[removeEventListener](mousemove, el.mm, 0);
        }

        // cloning into array since HTMLCollection is updated dynamically
        dragged = [].slice.call(_document.getElementsByClassName('dragscroll'));
        for (i = 0; i < dragged.length;) {
            (function(el, lastClientX, lastClientY, pushed, scroller, cont){
                (cont = el.container || el)[addEventListener](
                    mousedown,
                    cont.md = function(e) {

                        obj = e.target
                        noteEditableChild = false
                        while (obj != undefined && obj != null && obj.tagName.toUpperCase() != 'BODY'){
                            if (obj.classList.contains("note-editable")){
                                noteEditableChild = true
                            }
                            obj = obj.parentNode;
                        }

                        if (e.target.tagName === "SELECT"
                          || e.target.tagName === "INPUT"
                          || e.target.tagName === "TEXTAREA"
                          || noteEditableChild
                        ) {
                            return true
                        }
                        const elementsOfClick = _document.elementsFromPoint(e.clientX, e.clientY);
                        const hasNoDragScroll = elementsOfClick.every(elem => !elem.classList.contains('nodragscroll'));
                        if ((!el.hasAttribute('nochilddrag') && hasNoDragScroll) ||
                            _document.elementFromPoint(
                                e.pageX, e.pageY
                            ) == cont
                        ) {
                            pushed = 1;
                            lastClientX = e.clientX;
                            lastClientY = e.clientY;

                            e.preventDefault();
                            document.body.style.cursor = "all-scroll";
                        }
                    }, 0
                );

                _window[addEventListener](
                    mouseup, cont.mu = function() {
                        pushed = 0;
                        document.body.style.cursor = "";
                    }, 0
                );

                _window[addEventListener](
                    mousemove,
                    cont.mm = function(e) {
                        if (pushed) {
                            (scroller = el.scroller||el).scrollLeft -=
                                newScrollX = (- lastClientX + (lastClientX=e.clientX));
                            scroller.scrollTop -=
                                newScrollY = (- lastClientY + (lastClientY=e.clientY));
                            if (el == _document.body) {
                                (scroller = _document.documentElement).scrollLeft -= newScrollX;
                                scroller.scrollTop -= newScrollY;
                            }
                            
                            document.body.style.cursor = "all-scroll";
                        }
                    }, 0
                );
             })(dragged[i++]);
        }
    }

      
    if (_document.readyState == 'complete') {
        reset();
    } else {
        _window[addEventListener]('load', reset, 0);
    }

    exports.reset = reset;
}));
