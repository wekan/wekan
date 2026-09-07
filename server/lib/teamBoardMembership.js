import Boards from '/models/boards';
import {
  gainedTeamIds,
  newTeamBoardMemberEntry,
  boardsToAddMemberTo,
} from '/models/lib/teamBoardMemberSync';

// A user added to a Team must obtain the same ordinary membership on boards
// assigned to that Team. This is shared by every administrative user editor.
export async function addUserToTeamBoards(userId, oldTeams, newTeams) {
  try {
    const gained = gainedTeamIds(oldTeams, newTeams);
    if (!gained.length) return;
    const boards = await Boards.find(
      { teams: { $elemMatch: { teamId: { $in: gained }, isActive: true } } },
      { fields: { _id: 1, type: 1, teams: 1, members: 1 } },
    ).fetchAsync();
    for (const boardId of boardsToAddMemberTo(boards, userId, gained)) {
      await Boards.updateAsync(
        { _id: boardId, 'members.userId': { $ne: userId } },
        { $push: { members: newTeamBoardMemberEntry(userId) } },
      );
    }
  } catch (error) {
    console.error('addUserToTeamBoards failed:', error);
  }
}

export default { addUserToTeamBoards };
