import {BaseAddMemberPopup} from '../baseAddMemberPopup';
import {TeamContainer} from '../mixins/teamContainer';

class AddTeamMemberPopup extends BaseAddMemberPopup {

  mixins() {
    return [TeamContainer];
  }
}

AddTeamMemberPopup.register('addTeamMemberPopup');
