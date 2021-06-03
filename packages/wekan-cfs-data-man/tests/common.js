// ab2str = function ab2str(buf) {
//   return String.fromCharCode(new Uint8Array(buf));
// }

bin2str = function bin2str(bufView) {
  var length = bufView.length;
  var result = '';
  for (var i = 0; i<length; i+=65535) {
    var addition = 65535;
    if(i + 65535 > length) {
      addition = length - i;
    }
    try {
      // this fails on phantomjs due to old webkit bug; hence the try/catch
      result += String.fromCharCode.apply(null, bufView.subarray(i,i+addition));
    } catch (e) {
      var dataArray = [];
      for (var j = i; j < i+addition; j++) {
        dataArray.push(bufView[j]);
      }
      result += String.fromCharCode.apply(null, dataArray);
    }
  }
  return result;
};

ab2str = function ab2str(buffer) {
  return bin2str(new Uint8Array(buffer));
};

str2ab = function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
};
