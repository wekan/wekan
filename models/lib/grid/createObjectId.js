import { MongoInternals } from 'meteor/mongo';

// Use ObjectId (ObjectID is a deprecated alias in the bundled mongodb driver).
export const createObjectId = ({ gridFsFileId }) =>
  new MongoInternals.NpmModule.ObjectId(gridFsFileId);
