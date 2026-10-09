/* eslint-disable max-classes-per-file */
const Stream = require('readable-stream');

const utils = require('./utils');
const StringBuf = require('./string-buf');

// =============================================================================
// data chunks - encapsulating incoming data
class StringChunk {
  constructor(data, encoding) {
    this._data = data;
    this._encoding = encoding;
  }

  get length() {
    return this.toBuffer().length;
  }

  // copy to target buffer
  copy(target, targetOffset, offset, length) {
    return this.toBuffer().copy(target, targetOffset, offset, length);
  }

  toBuffer() {
    if (!this._buffer) {
      this._buffer = Buffer.from(this._data, this._encoding);
    }
    return this._buffer;
  }
}

class StringBufChunk {
  constructor(data) {
    this._data = data;
  }

  get length() {
    return this._data.length;
  }

  // copy to target buffer
  copy(target, targetOffset, offset, length) {
    // eslint-disable-next-line no-underscore-dangle
    return this._data._buf.copy(target, targetOffset, offset, length);
  }

  toBuffer() {
    return this._data.toBuffer();
  }
}

class BufferChunk {
  constructor(data) {
    this._data = data;
  }

  get length() {
    return this._data.length;
  }

  // copy to target buffer
  copy(target, targetOffset, offset, length) {
    this._data.copy(target, targetOffset, offset, length);
  }

  toBuffer() {
    return this._data;
  }
}

// =============================================================================
// ReadWriteBuf - a single buffer supporting simple read-write
class ReadWriteBuf {
  constructor(size) {
    this.size = size;
    // the buffer
    this.buffer = Buffer.alloc(size);
    // read index
    this.iRead = 0;
    // write index
    this.iWrite = 0;
  }

  toBuffer() {
    if (this.iRead === 0 && this.iWrite === this.size) {
      return this.buffer;
    }

    const buf = Buffer.alloc(this.iWrite - this.iRead);
    this.buffer.copy(buf, 0, this.iRead, this.iWrite);
    return buf;
  }

  get length() {
    return this.iWrite - this.iRead;
  }

  get eod() {
    return this.iRead === this.iWrite;
  }

  get full() {
    return this.iWrite === this.size;
  }

  read(size) {
    let buf;
    // read size bytes from buffer and return buffer
    if (size === 0) {
      // special case - return null if no data requested
      return null;
    }

    if (size === undefined || size >= this.length) {
      // if no size specified or size is at least what we have then return all of the bytes
      buf = this.toBuffer();
      this.iRead = this.iWrite;
      return buf;
    }

    // otherwise return a chunk
    buf = Buffer.alloc(size);
    this.buffer.copy(buf, 0, this.iRead, size);
    this.iRead += size;
    return buf;
  }

  write(chunk, offset, length) {
    // write as many bytes from data from optional source offset
    // and return number of bytes written
    const size = Math.min(length, this.size - this.iWrite);
    chunk.copy(this.buffer, this.iWrite, offset, offset + size);
    this.iWrite += size;
    return size;
  }
}

// =============================================================================
// StreamBuf - a multi-purpose read-write stream
//  As MemBuf - write as much data as you like. Then call toBuffer() to consolidate
//  As StreamHub - pipe to multiple writables
//  As readable stream - feed data into the writable part and have some other code read from it.

// Note: Not sure why but StreamBuf does not like JS "class" sugar. It fails the
// integration tests
const StreamBuf = function(options) {
  options = options || {};
  this.bufSize = options.bufSize || 1024 * 1024;
  this.buffers = [];

  // batch mode fills a buffer completely before passing the data on
  // to pipes or 'readable' event listeners
  this.batch = options.batch || false;

  this.corked = false;
  // where in the current writable buffer we're up to
  this.inPos = 0;

  // where in the current readable buffer we've read up to
  this.outPos = 0;

  // consuming pipe streams go here
  this.pipes = [];

  // controls emit('data')
  this.paused = false;

  this.encoding = null;
};

utils.inherits(StreamBuf, Stream.Duplex, {
  toBuffer() {
    switch (this.buffers.length) {
      case 0:
        return null;
      case 1:
        return this.buffers[0].toBuffer();
      default:
        return Buffer.concat(this.buffers.map(rwBuf => rwBuf.toBuffer()));
    }
  },

  // writable
  // event drain - if write returns false (which it won't), indicates when safe to write again.
  // finish - end() has been called
  // pipe(src) - pipe() has been called on readable
  // unpipe(src) - unpipe() has been called on readable
  // error - duh

  _getWritableBuffer() {
    if (this.buffers.length) {
      const last = this.buffers[this.buffers.length - 1];
      if (!last.full) {
        return last;
      }
    }
    const buf = new ReadWriteBuf(this.bufSize);
    this.buffers.push(buf);
    return buf;
  },

  async _pipe(chunk) {
    const write = function(pipe) {
      return new Promise(resolve => {
        pipe.write(chunk.toBuffer(), () => {
          resolve();
        });
      });
    };
    await Promise.all(this.pipes.map(write));
  },
  _writeToBuffers(chunk) {
    let inPos = 0;
    const inLen = chunk.length;
    while (inPos < inLen) {
      // find writable buffer
      const buffer = this._getWritableBuffer();

      // write some data
      inPos += buffer.write(chunk, inPos, inLen - inPos);
    }
  },
  async write(data, encoding, callback) {
    if (encoding instanceof Function) {
      callback = encoding;
      encoding = 'utf8';
    }
    callback = callback || utils.nop;

    // encapsulate data into a chunk
    let chunk;
    if (data instanceof StringBuf) {
      chunk = new StringBufChunk(data);
    } else if (data instanceof Buffer) {
      chunk = new BufferChunk(data);
    } else if (typeof data === 'string' || data instanceof String || data instanceof ArrayBuffer) {
      chunk = new StringChunk(data, encoding);
    } else {
      throw new Error('Chunk must be one of type String, Buffer or StringBuf.');
    }

    // now, do something with the chunk
    if (this.pipes.length) {
      if (this.batch) {
        this._writeToBuffers(chunk);
        while (!this.corked && this.buffers.length > 1) {
          this._pipe(this.buffers.shift());
        }
      } else if (!this.corked) {
        await this._pipe(chunk);
        callback();
      } else {
        this._writeToBuffers(chunk);
        process.nextTick(callback);
      }
    } else {
      if (!this.paused) {
        this.emit('data', chunk.toBuffer());
      }

      this._writeToBuffers(chunk);
      this.emit('readable');
    }

    return true;
  },
  cork() {
    this.corked = true;
  },
  _flush(/* destination */) {
    // if we have comsumers...
    if (this.pipes.length) {
      // and there's stuff not written
      while (this.buffers.length) {
        this._pipe(this.buffers.shift());
      }
    }
  },
  uncork() {
    this.corked = false;
    this._flush();
  },
  end(chunk, encoding, callback) {
    const writeComplete = error => {
      if (error) {
        callback(error);
      } else {
        this._flush();
        this.pipes.forEach(pipe => {
          pipe.end();
        });
        this.emit('finish');
      }
    };
    if (chunk) {
      this.write(chunk, encoding, writeComplete);
    } else {
      writeComplete();
    }
  },

  // readable
  // event readable - some data is now available
  // event data - switch to flowing mode - feeds chunks to handler
  // event end - no more data
  // event close - optional, indicates upstream close
  // event error - duh
  read(size) {
    let buffers;
    // read min(buffer, size || infinity)
    if (size) {
      buffers = [];
      while (size && this.buffers.length && !this.buffers[0].eod) {
        const first = this.buffers[0];
        const buffer = first.read(size);
        size -= buffer.length;
        buffers.push(buffer);
        if (first.eod && first.full) {
          this.buffers.shift();
        }
      }
      return Buffer.concat(buffers);
    }

    buffers = this.buffers.map(buf => buf.toBuffer()).filter(Boolean);
    this.buffers = [];
    return Buffer.concat(buffers);
  },
  setEncoding(encoding) {
    // causes stream.read or stream.on('data) to return strings of encoding instead of Buffer objects
    this.encoding = encoding;
  },
  pause() {
    this.paused = true;
  },
  resume() {
    this.paused = false;
  },
  isPaused() {
    return !!this.paused;
  },
  pipe(destination) {
    // add destination to pipe list & write current buffer
    this.pipes.push(destination);
    if (!this.paused && this.buffers.length) {
      this.end();
    }
    // A stream's pipe() returns its destination, so pipes can be chained.
    // archiver 8 relies on it: it pipes every source it is given into a
    // PassThrough and uses what pipe() returns as the entry's source.
    return destination;
  },
  unpipe(destination) {
    // remove destination from pipe list
    this.pipes = this.pipes.filter(pipe => pipe !== destination);
  },
  unshift(/* chunk */) {
    // some numpty has read some data that's not for them and they want to put it back!
    // Might implement this some day
    throw new Error('Not Implemented');
  },
  wrap(/* stream */) {
    // not implemented
    throw new Error('Not Implemented');
  },
});

module.exports = StreamBuf;
