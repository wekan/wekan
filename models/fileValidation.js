import { Meteor } from 'meteor/meteor';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'fs';
import FileType from 'file-type';

let asyncExec;

if (Meteor.isServer) {
  asyncExec = promisify(exec);
}

export async function isFileValid(fileObj, mimeTypesAllowed, sizeAllowed, externalCommandLine) {
  let isValid = true;

  if (mimeTypesAllowed.length) {
    const mimeTypeResult = await FileType.fromFile(fileObj.path);

    const mimeType = (mimeTypeResult ? mimeTypeResult.mime : fileObj.type);
    const baseMimeType = mimeType.split('/', 1)[0];

    isValid = mimeTypesAllowed.includes(mimeType) || mimeTypesAllowed.includes(baseMimeType + '/*') || mimeTypesAllowed.includes('*');

    if (!isValid) {
      console.log("Validation of uploaded file failed: file " + fileObj.path + " - mimetype " + mimeType);
    }
  }

  if (isValid && sizeAllowed && fileObj.size > sizeAllowed) {
    console.log("Validation of uploaded file failed: file " + fileObj.path + " - size " + fileObj.size);
    isValid = false;
  }

  if (isValid && externalCommandLine) {
    await asyncExec(externalCommandLine.replace("{file}", '"' + fileObj.path + '"'));
    isValid = fs.existsSync(fileObj.path);

    if (!isValid) {
      console.log("Validation of uploaded file failed: file " + fileObj.path + " has been deleted externally");
    }
  }

  if (isValid) {
    console.debug("Validation of uploaded file successful: file " + fileObj.path);
  }

  return isValid;
}
