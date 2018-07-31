import { BaseAddMemberPopup } from '../baseAddMemberPopup';
import { TeamToBoardContainer } from '../mixins/teamToBoardContainer';

const AddTeamPopup = BaseAddMemberPopup.extendComponent({

  mixins() {
    return [TeamToBoardContainer];
  },
});

AddTeamPopup.register('addTeamPopup');
