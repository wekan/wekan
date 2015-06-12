// XXX Should we use something like Moderniz instead of our custom detector?

var whichTransitionEvent = function() {
  var t;
  var el = document.createElement('fakeelement');
  var transitions = {
    transition:'transitionend',
    OTransition:'oTransitionEnd',
    MSTransition:'msTransitionEnd',
    MozTransition:'transitionend',
    WebkitTransition:'webkitTransitionEnd'
  };

  for (t in transitions) {
    if (el.style[t] !== undefined) {
      return transitions[t];
    }
  }
};

var whichAnimationEvent = function() {
  var t;
  var el = document.createElement('fakeelement');
  var transitions = {
    animation:'animationend',
    OAnimation:'oAnimationEnd',
    MSTransition:'msAnimationEnd',
    MozAnimation:'animationend',
    WebkitAnimation:'webkitAnimationEnd'
  };

  for (t in transitions) {
    if (el.style[t] !== undefined) {
      return transitions[t];
    }
  }
};

CSSEvents = {
  transitionend: whichTransitionEvent(),
  animationend: whichAnimationEvent()
};
