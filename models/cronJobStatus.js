import { Mongo } from 'meteor/mongo';

const CronJobStatus = new Mongo.Collection('cronJobStatus');

export default CronJobStatus;
