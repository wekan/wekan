import { N as format, P as SEG_NOT_WORD_ALIGNED, Q as DEFAULT_BUFFER_SIZE, R as SEG_ID_OUT_OF_BOUNDS, T as padToWord, U as SEG_GET_NON_ZERO_SINGLE, V as MIN_SINGLE_SEGMENT_GROWTH, W as assertNever, X as MSG_PACK_NOT_WORD_ALIGNED, Y as PACK_SPAN_THRESHOLD, Z as MAX_SEGMENT_LENGTH, _ as SEG_SIZE_OVERFLOW, $ as Pointer, a0 as NATIVE_LITTLE_ENDIAN, a1 as SEG_REPLACEMENT_BUFFER_TOO_SMALL, a2 as MSG_SEGMENT_OUT_OF_BOUNDS, a3 as dumpBuffer, a4 as validate, a5 as PointerType, a6 as getTargetStructSize, a7 as resize, a8 as MSG_SEGMENT_TOO_SMALL, a9 as initStruct, aa as DEFAULT_TRAVERSE_LIMIT, c as copyFrom, ab as MSG_INVALID_FRAME_HEADER } from './capnp-es.D8zdZmih.mjs';

var ArenaKind = /* @__PURE__ */ ((ArenaKind2) => {
  ArenaKind2[ArenaKind2["SINGLE_SEGMENT"] = 0] = "SINGLE_SEGMENT";
  ArenaKind2[ArenaKind2["MULTI_SEGMENT"] = 1] = "MULTI_SEGMENT";
  return ArenaKind2;
})(ArenaKind || {});

class ArenaAllocationResult {
  /**
   * The newly allocated buffer. This buffer might be a copy of an existing segment's buffer with free space appended.
   */
  buffer;
  /**
   * The id of the newly-allocated segment.
   */
  id;
  constructor(id, buffer) {
    this.id = id;
    this.buffer = buffer;
  }
}

class MultiSegmentArena {
  constructor(buffers = [new ArrayBuffer(DEFAULT_BUFFER_SIZE)]) {
    this.buffers = buffers;
    let i = buffers.length;
    while (--i >= 0) {
      if ((buffers[i].byteLength & 7) !== 0) {
        throw new Error(format(SEG_NOT_WORD_ALIGNED, buffers[i].byteLength));
      }
    }
  }
  static allocate = allocate$2;
  static getBuffer = getBuffer$2;
  static getNumSegments = getNumSegments$2;
  kind = ArenaKind.MULTI_SEGMENT;
  toString() {
    return format("MultiSegmentArena_segments:%d", getNumSegments$2(this));
  }
}
function allocate$2(minSize, m) {
  const b = new ArrayBuffer(padToWord(Math.max(minSize, DEFAULT_BUFFER_SIZE)));
  m.buffers.push(b);
  return new ArenaAllocationResult(m.buffers.length - 1, b);
}
function getBuffer$2(id, m) {
  if (id < 0 || id >= m.buffers.length) {
    throw new Error(format(SEG_ID_OUT_OF_BOUNDS, id));
  }
  return m.buffers[id];
}
function getNumSegments$2(m) {
  return m.buffers.length;
}

class SingleSegmentArena {
  static allocate = allocate$1;
  static getBuffer = getBuffer$1;
  static getNumSegments = getNumSegments$1;
  buffer;
  kind = ArenaKind.SINGLE_SEGMENT;
  constructor(buffer = new ArrayBuffer(DEFAULT_BUFFER_SIZE)) {
    if ((buffer.byteLength & 7) !== 0) {
      throw new Error(format(SEG_NOT_WORD_ALIGNED, buffer.byteLength));
    }
    this.buffer = buffer;
  }
  toString() {
    return format("SingleSegmentArena_len:%x", this.buffer.byteLength);
  }
}
function allocate$1(minSize, segments, s) {
  const srcBuffer = segments.length > 0 ? segments[0].buffer : s.buffer;
  minSize = minSize < MIN_SINGLE_SEGMENT_GROWTH ? MIN_SINGLE_SEGMENT_GROWTH : padToWord(minSize);
  s.buffer = new ArrayBuffer(srcBuffer.byteLength + minSize);
  new Float64Array(s.buffer).set(new Float64Array(srcBuffer));
  return new ArenaAllocationResult(0, s.buffer);
}
function getBuffer$1(id, s) {
  if (id !== 0) throw new Error(format(SEG_GET_NON_ZERO_SINGLE, id));
  return s.buffer;
}
function getNumSegments$1() {
  return 1;
}

class Arena {
  static allocate = allocate;
  static copy = copy$1;
  static getBuffer = getBuffer;
  static getNumSegments = getNumSegments;
}
function allocate(minSize, segments, a) {
  switch (a.kind) {
    case ArenaKind.MULTI_SEGMENT: {
      return MultiSegmentArena.allocate(minSize, a);
    }
    case ArenaKind.SINGLE_SEGMENT: {
      return SingleSegmentArena.allocate(minSize, segments, a);
    }
    default: {
      return assertNever(a);
    }
  }
}
function copy$1(a) {
  switch (a.kind) {
    case ArenaKind.MULTI_SEGMENT: {
      let i = a.buffers.length;
      const buffers = Array.from({ length: i });
      while (--i >= 0) {
        buffers[i] = a.buffers[i].slice(0);
      }
      return new MultiSegmentArena(buffers);
    }
    case ArenaKind.SINGLE_SEGMENT: {
      return new SingleSegmentArena(a.buffer.slice(0));
    }
    default: {
      return assertNever(a);
    }
  }
}
function getBuffer(id, a) {
  switch (a.kind) {
    case ArenaKind.MULTI_SEGMENT: {
      return MultiSegmentArena.getBuffer(id, a);
    }
    case ArenaKind.SINGLE_SEGMENT: {
      return SingleSegmentArena.getBuffer(id, a);
    }
    default: {
      return assertNever(a);
    }
  }
}
function getNumSegments(a) {
  switch (a.kind) {
    case ArenaKind.MULTI_SEGMENT: {
      return MultiSegmentArena.getNumSegments(a);
    }
    case ArenaKind.SINGLE_SEGMENT: {
      return SingleSegmentArena.getNumSegments();
    }
    default: {
      return assertNever(a);
    }
  }
}

function getHammingWeight(x) {
  let w = x - (x >> 1 & 1431655765);
  w = (w & 858993459) + (w >> 2 & 858993459);
  return (w + (w >> 4) & 252645135) * 16843009 >> 24;
}
function getTagByte(a, b, c, d, e, f, g, h) {
  return (a === 0 ? 0 : 1) | (b === 0 ? 0 : 2) | (c === 0 ? 0 : 4) | (d === 0 ? 0 : 8) | (e === 0 ? 0 : 16) | (f === 0 ? 0 : 32) | (g === 0 ? 0 : 64) | (h === 0 ? 0 : 128);
}
function getUnpackedByteLength(packed) {
  const p = new Uint8Array(packed);
  let wordCount = 0;
  let lastTag = 119 /* NONZERO_NONSPAN */;
  for (let i = 0; i < p.byteLength; ) {
    const tag = p[i];
    if (lastTag === 0 /* ZERO */) {
      wordCount += tag;
      i++;
      lastTag = 119 /* NONZERO_NONSPAN */;
    } else if (lastTag === 255 /* SPAN */) {
      wordCount += tag;
      i += tag * 8 + 1;
      lastTag = 119 /* NONZERO_NONSPAN */;
    } else {
      wordCount++;
      i += getHammingWeight(tag) + 1;
      lastTag = tag;
    }
  }
  return wordCount * 8;
}
function getZeroByteCount(a, b, c, d, e, f, g, h) {
  return (a === 0 ? 1 : 0) + (b === 0 ? 1 : 0) + (c === 0 ? 1 : 0) + (d === 0 ? 1 : 0) + (e === 0 ? 1 : 0) + (f === 0 ? 1 : 0) + (g === 0 ? 1 : 0) + (h === 0 ? 1 : 0);
}
function pack(unpacked, byteOffset = 0, byteLength) {
  if (unpacked.byteLength % 8 !== 0) {
    throw new Error(MSG_PACK_NOT_WORD_ALIGNED);
  }
  const src = new Uint8Array(unpacked, byteOffset, byteLength);
  const dst = [];
  let lastTag = 119 /* NONZERO_NONSPAN */;
  let spanWordCountOffset = 0;
  let rangeWordCount = 0;
  for (let srcByteOffset = 0; srcByteOffset < src.byteLength; srcByteOffset += 8) {
    const a = src[srcByteOffset];
    const b = src[srcByteOffset + 1];
    const c = src[srcByteOffset + 2];
    const d = src[srcByteOffset + 3];
    const e = src[srcByteOffset + 4];
    const f = src[srcByteOffset + 5];
    const g = src[srcByteOffset + 6];
    const h = src[srcByteOffset + 7];
    const tag = getTagByte(a, b, c, d, e, f, g, h);
    let skipWriteWord = true;
    switch (lastTag) {
      case 0 /* ZERO */: {
        if (tag !== 0 /* ZERO */ || rangeWordCount >= 255) {
          dst.push(rangeWordCount);
          rangeWordCount = 0;
          skipWriteWord = false;
        } else {
          rangeWordCount++;
        }
        break;
      }
      case 255 /* SPAN */: {
        const zeroCount = getZeroByteCount(a, b, c, d, e, f, g, h);
        if (zeroCount >= PACK_SPAN_THRESHOLD || rangeWordCount >= 255) {
          dst[spanWordCountOffset] = rangeWordCount;
          rangeWordCount = 0;
          skipWriteWord = false;
        } else {
          dst.push(a, b, c, d, e, f, g, h);
          rangeWordCount++;
        }
        break;
      }
      default: {
        skipWriteWord = false;
        break;
      }
    }
    if (skipWriteWord) {
      continue;
    }
    dst.push(tag);
    lastTag = tag;
    if (a !== 0) dst.push(a);
    if (b !== 0) dst.push(b);
    if (c !== 0) dst.push(c);
    if (d !== 0) dst.push(d);
    if (e !== 0) dst.push(e);
    if (f !== 0) dst.push(f);
    if (g !== 0) dst.push(g);
    if (h !== 0) dst.push(h);
    if (tag === 255 /* SPAN */) {
      spanWordCountOffset = dst.length;
      dst.push(0);
    }
  }
  if (lastTag === 0 /* ZERO */) {
    dst.push(rangeWordCount);
  } else if (lastTag === 255 /* SPAN */) {
    dst[spanWordCountOffset] = rangeWordCount;
  }
  return new Uint8Array(dst).buffer;
}
function unpack(packed) {
  const src = new Uint8Array(packed);
  const dst = new Uint8Array(new ArrayBuffer(getUnpackedByteLength(packed)));
  let lastTag = 119 /* NONZERO_NONSPAN */;
  for (let srcByteOffset = 0, dstByteOffset = 0; srcByteOffset < src.byteLength; ) {
    const tag = src[srcByteOffset];
    if (lastTag === 0 /* ZERO */) {
      dstByteOffset += tag * 8;
      srcByteOffset++;
      lastTag = 119 /* NONZERO_NONSPAN */;
    } else if (lastTag === 255 /* SPAN */) {
      const spanByteLength = tag * 8;
      dst.set(
        src.subarray(srcByteOffset + 1, srcByteOffset + 1 + spanByteLength),
        dstByteOffset
      );
      dstByteOffset += spanByteLength;
      srcByteOffset += 1 + spanByteLength;
      lastTag = 119 /* NONZERO_NONSPAN */;
    } else {
      srcByteOffset++;
      for (let i = 1; i <= 128; i <<= 1) {
        if ((tag & i) !== 0) {
          dst[dstByteOffset] = src[srcByteOffset++];
        }
        dstByteOffset++;
      }
      lastTag = tag;
    }
  }
  return dst.buffer;
}

class Segment {
  constructor(id, message, buffer, byteLength = 0) {
    this.id = id;
    this.message = message;
    this.message = message;
    this.buffer = buffer;
    this._dv = new DataView(buffer);
    this.byteOffset = 0;
    this.byteLength = byteLength;
  }
  buffer;
  /** The number of bytes currently allocated in the segment. */
  byteLength;
  /**
   * This value should always be zero. It's only here to satisfy the DataView interface.
   *
   * In the future the Segment implementation (or a child class) may allow accessing the buffer from a nonzero offset,
   * but that adds a lot of extra arithmetic.
   */
  byteOffset;
  [Symbol.toStringTag] = "Segment";
  _dv;
  /**
   * Attempt to allocate the requested number of bytes in this segment. If this segment is full this method will return
   * a pointer to freshly allocated space in another segment from the same message.
   *
   * @param byteLength The number of bytes to allocate, will be rounded up to the nearest word.
   * @returns A pointer to the newly allocated space.
   */
  allocate(byteLength) {
    let segment = this;
    byteLength = padToWord(byteLength);
    if (byteLength > MAX_SEGMENT_LENGTH - 8) {
      throw new Error(format(SEG_SIZE_OVERFLOW, byteLength));
    }
    if (!segment.hasCapacity(byteLength)) {
      segment = segment.message.allocateSegment(byteLength);
    }
    const byteOffset = segment.byteLength;
    segment.byteLength += byteLength;
    return new Pointer(segment, byteOffset);
  }
  /**
   * Quickly copy a word (8 bytes) from `srcSegment` into this one at the given offset.
   *
   * @param byteOffset The offset to write the word to.
   * @param srcSegment The segment to copy the word from.
   * @param srcByteOffset The offset from the start of `srcSegment` to copy from.
   */
  copyWord(byteOffset, srcSegment, srcByteOffset) {
    const value = srcSegment._dv.getFloat64(
      srcByteOffset,
      NATIVE_LITTLE_ENDIAN
    );
    this._dv.setFloat64(byteOffset, value, NATIVE_LITTLE_ENDIAN);
  }
  /**
   * Quickly copy words from `srcSegment` into this one.
   *
   * @param byteOffset The offset to start copying into.
   * @param srcSegment The segment to copy from.
   * @param srcByteOffset The start offset to copy from.
   * @param wordLength The number of words to copy.
   */
  copyWords(byteOffset, srcSegment, srcByteOffset, wordLength) {
    const dst = new Float64Array(this.buffer, byteOffset, wordLength);
    const src = new Float64Array(srcSegment.buffer, srcByteOffset, wordLength);
    dst.set(src);
  }
  /**
   * Quickly fill a number of words in the buffer with zeroes.
   *
   * @param byteOffset The first byte to set to zero.
   * @param wordLength The number of words (not bytes!) to zero out.
   */
  fillZeroWords(byteOffset, wordLength) {
    new Float64Array(this.buffer, byteOffset, wordLength).fill(0);
  }
  getBigInt64(byteOffset, littleEndian) {
    return this._dv.getBigInt64(byteOffset, littleEndian);
  }
  getBigUint64(byteOffset, littleEndian) {
    return this._dv.getBigUint64(byteOffset, littleEndian);
  }
  /**
   * Get the total number of bytes available in this segment (the size of its underlying buffer).
   *
   * @returns The total number of bytes this segment can hold.
   */
  getCapacity() {
    return this.buffer.byteLength;
  }
  /**
   * Read a float16 value out of this segment.
   *
   * NOTE: Non functional, added to allow compilation with TS 5.9+
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getFloat16(_byteOffset) {
    throw new Error("Not implemented");
  }
  /**
   * Read a float32 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getFloat32(byteOffset) {
    return this._dv.getFloat32(byteOffset, true);
  }
  /**
   * Read a float64 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getFloat64(byteOffset) {
    return this._dv.getFloat64(byteOffset, true);
  }
  /**
   * Read an int16 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getInt16(byteOffset) {
    return this._dv.getInt16(byteOffset, true);
  }
  /**
   * Read an int32 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getInt32(byteOffset) {
    return this._dv.getInt32(byteOffset, true);
  }
  /**
   * Read an int64 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getInt64(byteOffset) {
    return this._dv.getBigInt64(byteOffset, true);
  }
  /**
   * Read an int8 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getInt8(byteOffset) {
    return this._dv.getInt8(byteOffset);
  }
  /**
   * Read a uint16 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getUint16(byteOffset) {
    return this._dv.getUint16(byteOffset, true);
  }
  /**
   * Read a uint32 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getUint32(byteOffset) {
    return this._dv.getUint32(byteOffset, true);
  }
  /**
   * Read a uint64 value (as a bigint) out of this segment.
   * NOTE: this does not copy the memory region, so updates to the underlying buffer will affect the returned value!
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getUint64(byteOffset) {
    return this._dv.getBigUint64(byteOffset, true);
  }
  /**
   * Read a uint8 value out of this segment.
   *
   * @param byteOffset The offset in bytes to the value.
   * @returns The value.
   */
  getUint8(byteOffset) {
    return this._dv.getUint8(byteOffset);
  }
  hasCapacity(byteLength) {
    return this.buffer.byteLength - this.byteLength >= byteLength;
  }
  /**
   * Quickly check the word at the given offset to see if it is equal to zero.
   *
   * PERF_V8: Fastest way to do this is by reading the whole word as a `number` (float64) in the _native_ endian format
   * and see if it's zero.
   *
   * Benchmark: http://jsben.ch/#/Pjooc
   *
   * @param byteOffset The offset to the word.
   * @returns `true` if the word is zero.
   */
  isWordZero(byteOffset) {
    return this._dv.getFloat64(byteOffset, NATIVE_LITTLE_ENDIAN) === 0;
  }
  /**
   * Swap out this segment's underlying buffer with a new one. It's assumed that the new buffer has the same content but
   * more free space, otherwise all existing pointers to this segment will be hilariously broken.
   *
   * @param buffer The new buffer to use.
   */
  replaceBuffer(buffer) {
    if (this.buffer === buffer) {
      return;
    }
    if (buffer.byteLength < this.byteLength) {
      throw new Error(SEG_REPLACEMENT_BUFFER_TOO_SMALL);
    }
    this._dv = new DataView(buffer);
    this.buffer = buffer;
  }
  setBigInt64(byteOffset, value, littleEndian) {
    this._dv.setBigInt64(byteOffset, value, littleEndian);
  }
  /** WARNING: This function is not yet implemented.  */
  setBigUint64(byteOffset, value, littleEndian) {
    this._dv.setBigUint64(byteOffset, value, littleEndian);
  }
  /**
   * Write a float16 value to the specified offset.
   *
   * NOTE: Non functional, added to allow compilation with TS 5.9+
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setFloat16(_byteOffset, _val) {
    throw new Error("Not implemented");
  }
  /**
   * Write a float32 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setFloat32(byteOffset, val) {
    this._dv.setFloat32(byteOffset, val, true);
  }
  /**
   * Write an float64 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setFloat64(byteOffset, val) {
    this._dv.setFloat64(byteOffset, val, true);
  }
  /**
   * Write an int16 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setInt16(byteOffset, val) {
    this._dv.setInt16(byteOffset, val, true);
  }
  /**
   * Write an int32 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setInt32(byteOffset, val) {
    this._dv.setInt32(byteOffset, val, true);
  }
  /**
   * Write an int8 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setInt8(byteOffset, val) {
    this._dv.setInt8(byteOffset, val);
  }
  /**
   * Write an int64 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setInt64(byteOffset, val) {
    this._dv.setBigInt64(byteOffset, val, true);
  }
  /**
   * Write a uint16 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setUint16(byteOffset, val) {
    this._dv.setUint16(byteOffset, val, true);
  }
  /**
   * Write a uint32 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setUint32(byteOffset, val) {
    this._dv.setUint32(byteOffset, val, true);
  }
  /**
   * Write a uint64 value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setUint64(byteOffset, val) {
    this._dv.setBigUint64(byteOffset, val, true);
  }
  /**
   * Write a uint8 (byte) value to the specified offset.
   *
   * @param byteOffset The offset from the beginning of the buffer.
   * @param val The value to store.
   */
  setUint8(byteOffset, val) {
    this._dv.setUint8(byteOffset, val);
  }
  /**
   * Write a zero word (8 bytes) to the specified offset. This is slightly faster than calling `setUint64` or
   * `setFloat64` with a zero value.
   *
   * Benchmark: http://jsben.ch/#/dUdPI
   *
   * @param byteOffset The offset of the word to set to zero.
   */
  setWordZero(byteOffset) {
    this._dv.setFloat64(byteOffset, 0, NATIVE_LITTLE_ENDIAN);
  }
  toString() {
    return format(
      "Segment_id:%d,off:%a,len:%a,cap:%a",
      this.id,
      this.byteLength,
      this.byteOffset,
      this.buffer.byteLength
    );
  }
}

class Message {
  static allocateSegment = allocateSegment;
  static dump = dump;
  static getRoot = getRoot;
  static getSegment = getSegment;
  static initRoot = initRoot;
  static readRawPointer = readRawPointer;
  static toArrayBuffer = toArrayBuffer;
  static toPackedArrayBuffer = toPackedArrayBuffer;
  _capnp;
  /**
   * A Cap'n Proto message.
   *
   * SECURITY WARNING: In Node.js do not pass a Buffer's internal array buffer into this constructor. Pass the buffer
   * directly and everything will be fine. If not, your message will potentially be initialized with random memory
   * contents!
   *
   * The constructor method creates a new Message, optionally using a provided arena for segment allocation, or a buffer
   * to read from.
   *
   * @param src The source for the message.
   * A value of `undefined` will cause the message to initialize with a single segment arena only big enough for the
   * root pointer; it will expand as you go. This is a reasonable choice for most messages.
   *
   * Passing an arena will cause the message to use that arena for its segment allocation. Contents will be accepted
   * as-is.
   *
   * Passing an array buffer view (like `DataView`, `Uint8Array` or `Buffer`) will create a **copy** of the source
   * buffer; beware of the potential performance cost!
   *
   * @param packed Whether or not the message is packed. If `true` (the default), the message will be
   * unpacked.
   *
   * @param singleSegment If true, `src` will be treated as a message consisting of a single segment without
   * a framing header.
   *
   */
  constructor(src, packed = true, singleSegment = false) {
    this._capnp = initMessage(src, packed, singleSegment);
    if (src) {
      preallocateSegments(this);
    }
  }
  allocateSegment(byteLength) {
    return allocateSegment(byteLength, this);
  }
  /**
   * Copies the contents of this message into an identical message with its own ArrayBuffers.
   *
   * @returns A copy of this message.
   */
  copy() {
    return copy(this);
  }
  /**
   * Create a pretty-printed string dump of this message; incredibly useful for debugging.
   *
   * WARNING: Do not call this method on large messages!
   *
   * @returns A big steaming pile of pretty hex digits.
   */
  dump() {
    return dump(this);
  }
  /**
   * Get a struct pointer for the root of this message. This is primarily used when reading a message; it will not
   * overwrite existing data.
   *
   * @param RootStruct The struct type to use as the root.
   * @returns A struct representing the root of the message.
   */
  getRoot(RootStruct) {
    return getRoot(RootStruct, this);
  }
  /**
   * Get a segment by its id.
   *
   * This will lazily allocate the first segment if it doesn't already exist.
   *
   * @param id The segment id.
   * @returns The requested segment.
   */
  getSegment(id) {
    return getSegment(id, this);
  }
  /**
   * Initialize a new message using the provided struct type as the root.
   *
   * @param RootStruct The struct type to use as the root.
   * @returns An initialized struct pointing to the root of the message.
   */
  initRoot(RootStruct) {
    return initRoot(RootStruct, this);
  }
  /**
   * Set the root of the message to a copy of the given pointer. Used internally
   * to make copies of pointers for default values.
   *
   * @param src The source pointer to copy.
   */
  setRoot(src) {
    setRoot(src, this);
  }
  /**
   * Combine the contents of this message's segments into a single array buffer and prepend a stream framing header
   * containing information about the following segment data.
   *
   * @returns An ArrayBuffer with the contents of this message.
   */
  toArrayBuffer() {
    return toArrayBuffer(this);
  }
  /**
   * Like `toArrayBuffer()`, but also applies the packing algorithm to the output. This is typically what you want to
   * use if you're sending the message over a network link or other slow I/O interface where size matters.
   *
   * @returns A packed message.
   */
  toPackedArrayBuffer() {
    return toPackedArrayBuffer(this);
  }
  addCap(client) {
    if (!this._capnp.capTable) {
      this._capnp.capTable = [];
    }
    const id = this._capnp.capTable.length;
    this._capnp.capTable.push(client);
    return id;
  }
  toString() {
    return `Message_arena:${this._capnp.arena}`;
  }
}
function initMessage(src, packed = true, singleSegment = false) {
  if (src === void 0) {
    return {
      arena: new SingleSegmentArena(),
      segments: [],
      traversalLimit: DEFAULT_TRAVERSE_LIMIT
    };
  }
  if (isAnyArena(src)) {
    return { arena: src, segments: [], traversalLimit: DEFAULT_TRAVERSE_LIMIT };
  }
  let buf = src;
  if (isArrayBufferView(buf)) {
    buf = buf.buffer.slice(
      buf.byteOffset,
      buf.byteOffset + buf.byteLength
    );
  }
  if (packed) {
    buf = unpack(buf);
  }
  if (singleSegment) {
    return {
      arena: new SingleSegmentArena(buf),
      segments: [],
      traversalLimit: DEFAULT_TRAVERSE_LIMIT
    };
  }
  return {
    arena: new MultiSegmentArena(getFramedSegments(buf)),
    segments: [],
    traversalLimit: DEFAULT_TRAVERSE_LIMIT
  };
}
function getFramedSegments(message) {
  const dv = new DataView(message);
  const segmentCount = dv.getUint32(0, true) + 1;
  const segments = Array.from({ length: segmentCount });
  let byteOffset = 4 + segmentCount * 4;
  byteOffset += byteOffset % 8;
  if (byteOffset + segmentCount * 4 > message.byteLength) {
    throw new Error(MSG_INVALID_FRAME_HEADER);
  }
  for (let i = 0; i < segmentCount; i++) {
    const byteLength = dv.getUint32(4 + i * 4, true) * 8;
    if (byteOffset + byteLength > message.byteLength) {
      throw new Error(MSG_INVALID_FRAME_HEADER);
    }
    segments[i] = message.slice(byteOffset, byteOffset + byteLength);
    byteOffset += byteLength;
  }
  return segments;
}
function preallocateSegments(m) {
  const numSegments = Arena.getNumSegments(m._capnp.arena);
  m._capnp.segments = Array.from({ length: numSegments });
  for (let i = 0; i < numSegments; i++) {
    if (i === 0 && Arena.getBuffer(i, m._capnp.arena).byteLength < 8) {
      throw new Error(MSG_SEGMENT_TOO_SMALL);
    }
    const buffer = Arena.getBuffer(i, m._capnp.arena);
    const segment = new Segment(i, m, buffer, buffer.byteLength);
    m._capnp.segments[i] = segment;
  }
}
function isArrayBufferView(src) {
  return src.byteOffset !== void 0;
}
function isAnyArena(o) {
  return o.kind !== void 0;
}
function allocateSegment(byteLength, m) {
  const res = Arena.allocate(byteLength, m._capnp.segments, m._capnp.arena);
  let s;
  if (res.id === m._capnp.segments.length) {
    s = new Segment(res.id, m, res.buffer);
    m._capnp.segments.push(s);
  } else if (res.id < 0 || res.id > m._capnp.segments.length) {
    throw new Error(format(MSG_SEGMENT_OUT_OF_BOUNDS, res.id, m));
  } else {
    s = m._capnp.segments[res.id];
    s.replaceBuffer(res.buffer);
  }
  return s;
}
function dump(m) {
  let r = "";
  if (m._capnp.segments.length === 0) {
    return "================\nNo Segments\n================\n";
  }
  for (let i = 0; i < m._capnp.segments.length; i++) {
    r += `================
Segment #${i}
================
`;
    const { buffer, byteLength } = m._capnp.segments[i];
    const b = new Uint8Array(buffer, 0, byteLength);
    r += dumpBuffer(b);
  }
  return r;
}
function getRoot(RootStruct, m) {
  const root = new RootStruct(m.getSegment(0), 0);
  validate(PointerType.STRUCT, root);
  const ts = getTargetStructSize(root);
  if (ts.dataByteLength < RootStruct._capnp.size.dataByteLength || ts.pointerLength < RootStruct._capnp.size.pointerLength) {
    resize(RootStruct._capnp.size, root);
  }
  return root;
}
function getSegment(id, m) {
  const segmentLength = m._capnp.segments.length;
  if (id === 0 && segmentLength === 0) {
    const arenaSegments = Arena.getNumSegments(m._capnp.arena);
    if (arenaSegments === 0) {
      allocateSegment(DEFAULT_BUFFER_SIZE, m);
    } else {
      m._capnp.segments[0] = new Segment(
        0,
        m,
        Arena.getBuffer(0, m._capnp.arena)
      );
    }
    if (!m._capnp.segments[0].hasCapacity(8)) {
      throw new Error(MSG_SEGMENT_TOO_SMALL);
    }
    m._capnp.segments[0].allocate(8);
    return m._capnp.segments[0];
  }
  if (id < 0 || id >= segmentLength) {
    throw new Error(format(MSG_SEGMENT_OUT_OF_BOUNDS, id, m));
  }
  return m._capnp.segments[id];
}
function initRoot(RootStruct, m) {
  const root = new RootStruct(m.getSegment(0), 0);
  initStruct(RootStruct._capnp.size, root);
  return root;
}
function readRawPointer(data) {
  return new Pointer(new Message(data).getSegment(0), 0);
}
function setRoot(src, m) {
  copyFrom(src, new Pointer(m.getSegment(0), 0));
}
function toArrayBuffer(m) {
  const streamFrame = getStreamFrame(m);
  if (m._capnp.segments.length === 0) {
    getSegment(0, m);
  }
  const { segments } = m._capnp;
  const totalLength = streamFrame.byteLength + segments.reduce((l, s) => l + padToWord(s.byteLength), 0);
  const out = new Uint8Array(new ArrayBuffer(totalLength));
  let o = streamFrame.byteLength;
  out.set(new Uint8Array(streamFrame));
  for (const s of segments) {
    const segmentLength = padToWord(s.byteLength);
    out.set(new Uint8Array(s.buffer, 0, segmentLength), o);
    o += segmentLength;
  }
  return out.buffer;
}
function toPackedArrayBuffer(m) {
  const streamFrame = pack(getStreamFrame(m));
  if (m._capnp.segments.length === 0) {
    m.getSegment(0);
  }
  const segments = m._capnp.segments.map(
    (s) => pack(s.buffer, 0, padToWord(s.byteLength))
  );
  const totalLength = streamFrame.byteLength + segments.reduce((l, s) => l + s.byteLength, 0);
  const out = new Uint8Array(new ArrayBuffer(totalLength));
  let o = streamFrame.byteLength;
  out.set(new Uint8Array(streamFrame));
  for (const s of segments) {
    out.set(new Uint8Array(s), o);
    o += s.byteLength;
  }
  return out.buffer;
}
function getStreamFrame(m) {
  const { length } = m._capnp.segments;
  if (length === 0) {
    return new Float64Array(1).buffer;
  }
  const frameLength = 4 + length * 4 + (1 - length % 2) * 4;
  const out = new DataView(new ArrayBuffer(frameLength));
  out.setUint32(0, length - 1, true);
  for (const [i, s] of m._capnp.segments.entries()) {
    out.setUint32(i * 4 + 4, s.byteLength / 8, true);
  }
  return out.buffer;
}
function copy(m) {
  return new Message(Arena.copy(m._capnp.arena));
}

export { Message as M, readRawPointer as r };
