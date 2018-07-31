// Templates from '/ imports' must be imported so they can be used by the router, for example.
// Due to the order in which Meteor loads scripts (https://guide.meteor.com/v1.6/structure.html#load-order),
// imports this template collection before configuring the router.

import '/imports/ui/components/teams/teamsAdmin.jade';
import '/imports/ui/components/teams/teamsAdmin';
import '/imports/ui/components/teams/teamDetails.jade';
import '/imports/ui/components/teams/teamsAdminHeaderBar.jade';

import '/imports/ui/components/teams/teamDetails.jade';
import '/imports/ui/components/teams/teamDetails';
import '/imports/ui/components/teams/teamMember';

import '/imports/ui/components/teams/removeTeamMemberPopup.jade';
import '/imports/ui/components/teams/removeTeamMemberPopup';

import '/imports/ui/components/baseAddMemberPopup.jade';
import '/imports/ui/components/addMemberPopup.jade';
import '/imports/ui/components/addMemberPopup';

import '/imports/ui/components/teams/addTeamMemberPopup.jade';
import '/imports/ui/components/teams/addTeamMemberPopup';

import '/imports/ui/components/teams/addTeamPopup.jade';
import '/imports/ui/components/teams/addTeamPopup';

import '/imports/ui/components/teams/teamDetailsMenuPopup.jade';
import '/imports/ui/components/teams/teamDetailsMenuPopup';
