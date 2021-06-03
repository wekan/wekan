/**
 * @method DataMan.DataURI
 * @public
 * @constructor
 * @param {String} dataUri
 */
DataMan.DataURI = function DataManDataURI(dataUri) {
  var self = this;
  var pieces = dataUri.match(/^data:(.*);base64,(.*)$/);
  var buffer = new Buffer(pieces[2], 'base64');
  return new DataMan.Buffer(buffer, pieces[1]);
};

DataMan.DataURI.prototype = DataMan.Buffer.prototype;
