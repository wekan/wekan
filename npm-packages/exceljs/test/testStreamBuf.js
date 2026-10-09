const StreamBuf = require('../lib/utils/stream-buf.js');

const sb = new StreamBuf({bufSize: 64});
sb.write('Hello, World!');
console.log(`Buffer after write: ${sb.buffers[0].buffer}`);
const chunk = sb.read();
console.log(`Chunk: ${chunk}`);
console.log(`to UTF8: ${chunk.toString('UTF8')}`);
