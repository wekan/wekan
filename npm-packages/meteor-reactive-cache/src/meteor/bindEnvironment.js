import { getGlobal } from '@wekanteam/meteor-globals';

const Meteor = getGlobal('meteor', 'Meteor');
export default Meteor.bindEnvironment.bind(Meteor);
