import { BaseAddMemberPopup } from './baseAddMemberPopup';
import { BoardContainer } from './mixins/boardContainer';

const AddMemberPopup = BaseAddMemberPopup.extendComponent({

  mixins() {
    return [BoardContainer];
  },
});

AddMemberPopup.register('addMemberPopup');
