import Presence from 'Presence';
import Session from 'Session';

Presence.configure({
  state() {
    return {
      currentBoardId: Session.get('currentBoard'),
    };
  },
});
