const events = require('events');

// =============================================================================
// StutteredPipe - Used to slow down streaming so GC can get a look in
class StutteredPipe extends events.EventEmitter {
  constructor(readable, writable, options) {
    super();

    options = options || {};

    this.readable = readable;
    this.writable = writable;
    this.bufSize = options.bufSize || 16384;
    this.autoPause = options.autoPause || false;

    this.paused = false;
    this.eod = false;
    this.scheduled = null;

    readable.on('end', () => {
      this.eod = true;
      writable.end();
    });

    // need to have some way to communicate speed of stream
    // back from the consumer
    readable.on('readable', () => {
      if (!this.paused) {
        this.resume();
      }
    });
    this._schedule();
  }

  pause() {
    this.paused = true;
  }

  resume() {
    if (!this.eod) {
      if (this.scheduled !== null) {
        clearImmediate(this.scheduled);
      }
      this._schedule();
    }
  }

  _schedule() {
    this.scheduled = setImmediate(() => {
      this.scheduled = null;
      if (!this.eod && !this.paused) {
        const data = this.readable.read(this.bufSize);
        if (data && data.length) {
          this.writable.write(data);

          if (!this.paused && !this.autoPause) {
            this._schedule();
          }
        } else if (!this.paused) {
          this._schedule();
        }
      }
    });
  }
}

module.exports = StutteredPipe;
