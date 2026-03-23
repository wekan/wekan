import { Mongo } from 'meteor/mongo';

// Define presences collection
const Presences = new Mongo.Collection('presences');

export default Presences;
