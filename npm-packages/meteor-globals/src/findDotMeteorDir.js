import path from 'path';
import fs from 'fs';

export default function findDotMeteorDir(depth = 0) {
  if (path.resolve(process.env.PWD).split('/').length < depth) return null;
  const filePath = `${Array(depth + 1).join('../')}.meteor/packages`;
  const dotMeteor = path.resolve(process.env.PWD, filePath);
  if (fs.existsSync(dotMeteor)) return path.resolve(process.env.PWD, `${Array(depth + 1).join('../')}.meteor`);
  return findDotMeteorDir(depth + 1);
}
