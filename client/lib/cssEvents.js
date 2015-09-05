// XXX Should we use something like Moderniz instead of our custom detector?

function whichTransitionEvent() {
  const el = document.createElement('fakeelement');
  const transitions = {
    transition:'transitionend',
    OTransition:'oTransitionEnd',
    MSTransition:'msTransitionEnd',
    MozTransition:'transitionend',
    WebkitTransition:'webkitTransitionEnd',
  };

  for (const t in transitions) {
    if (el.style[t] !== undefined) {
      return transitions[t];
    }
  }
}

function whichAnimationEvent() {
  const el = document.createElement('fakeelement');
  const transitions = {
    animation:'animationend',
    OAnimation:'oAnimationEnd',
    MSTransition:'msAnimationEnd',
    MozAnimation:'animationend',
    WebkitAnimation:'webkitAnimationEnd',
  };

  for (const t in transitions) {
    if (el.style[t] !== undefined) {
      return transitions[t];
    }
  }
}

CSSEvents = {
  transitionend: whichTransitionEvent(),
  animationend: whichAnimationEvent(),
};
