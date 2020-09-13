import { MongoInternals } from 'meteor/mongo';

export const createObjectId = ({ gridFsFileId }) =>
  new MongoInternals.NpmModule.ObjectID(gridFsFileId);
