var ListElementSize = /* @__PURE__ */ ((ListElementSize2) => {
  ListElementSize2[ListElementSize2["VOID"] = 0] = "VOID";
  ListElementSize2[ListElementSize2["BIT"] = 1] = "BIT";
  ListElementSize2[ListElementSize2["BYTE"] = 2] = "BYTE";
  ListElementSize2[ListElementSize2["BYTE_2"] = 3] = "BYTE_2";
  ListElementSize2[ListElementSize2["BYTE_4"] = 4] = "BYTE_4";
  ListElementSize2[ListElementSize2["BYTE_8"] = 5] = "BYTE_8";
  ListElementSize2[ListElementSize2["POINTER"] = 6] = "POINTER";
  ListElementSize2[ListElementSize2["COMPOSITE"] = 7] = "COMPOSITE";
  return ListElementSize2;
})(ListElementSize || {});

const tmpWord = new DataView(new ArrayBuffer(8));
new Uint16Array(tmpWord.buffer)[0] = 258;
const DEFAULT_BUFFER_SIZE = 4096;
const DEFAULT_TRAVERSE_LIMIT = 64 << 20;
const LIST_SIZE_MASK = 7;
const MAX_BUFFER_DUMP_BYTES = 8192;
const MAX_INT32 = 2147483647;
const MAX_UINT32 = 4294967295;
const MIN_SINGLE_SEGMENT_GROWTH = 4096;
const NATIVE_LITTLE_ENDIAN = tmpWord.getUint8(0) === 2;
const PACK_SPAN_THRESHOLD = 2;
const POINTER_DOUBLE_FAR_MASK = 4;
const POINTER_TYPE_MASK = 3;
const MAX_DEPTH = MAX_INT32;
const MAX_SEGMENT_LENGTH = MAX_UINT32;

const INVARIANT_UNREACHABLE_CODE = "CAPNP-TS000 Unreachable code detected.";
function assertNever(n) {
  throw new Error(INVARIANT_UNREACHABLE_CODE + ` (never block hit with: ${n})`);
}
const MSG_INVALID_FRAME_HEADER = "CAPNP-TS001 Attempted to parse an invalid message frame header; are you sure this is a Cap'n Proto message?";
const MSG_PACK_NOT_WORD_ALIGNED = "CAPNP-TS003 Attempted to pack a message that was not word-aligned.";
const MSG_SEGMENT_OUT_OF_BOUNDS = "CAPNP-TS004 Segment ID %X is out of bounds for message %s.";
const MSG_SEGMENT_TOO_SMALL = "CAPNP-TS005 First segment must have at least enough room to hold the root pointer (8 bytes).";
const NOT_IMPLEMENTED = "CAPNP-TS006 %s is not implemented.";
const PTR_ADOPT_WRONG_MESSAGE = "CAPNP-TS008 Attempted to adopt %s into a pointer in a different message %s.";
const PTR_ALREADY_ADOPTED = "CAPNP-TS009 Attempted to adopt %s more than once.";
const PTR_COMPOSITE_SIZE_UNDEFINED = "CAPNP-TS010 Attempted to set a composite list without providing a composite element size.";
const PTR_DEPTH_LIMIT_EXCEEDED = "CAPNP-TS011 Nesting depth limit exceeded for %s.";
const PTR_INIT_COMPOSITE_STRUCT = "CAPNP-TS013 Attempted to initialize a struct member from a composite list (%s).";
const PTR_INVALID_FAR_TARGET = "CAPNP-TS015 Target of a far pointer (%s) is another far pointer.";
const PTR_INVALID_LIST_SIZE = "CAPNP-TS016 Invalid list element size: %x.";
const PTR_INVALID_POINTER_TYPE = "CAPNP-TS017 Invalid pointer type: %x.";
const PTR_INVALID_UNION_ACCESS = "CAPNP-TS018 Attempted to access getter on %s for union field %s that is not currently set (wanted: %d, found: %d).";
const PTR_OFFSET_OUT_OF_BOUNDS = "CAPNP-TS019 Pointer offset %a is out of bounds for underlying buffer.";
const PTR_STRUCT_DATA_OUT_OF_BOUNDS = "CAPNP-TS020 Attempted to access out-of-bounds struct data (struct: %s, %d bytes at %a, data words: %d).";
const PTR_STRUCT_POINTER_OUT_OF_BOUNDS = "CAPNP-TS021 Attempted to access out-of-bounds struct pointer (%s, index: %d, length: %d).";
const PTR_TRAVERSAL_LIMIT_EXCEEDED = "CAPNP-TS022 Traversal limit exceeded! Slow down! %s";
const PTR_WRONG_LIST_TYPE = "CAPNP-TS023 Cannot convert %s to a %s list.";
const PTR_WRONG_POINTER_TYPE = "CAPNP-TS024 Attempted to convert pointer %s to a %s type.";
const SEG_GET_NON_ZERO_SINGLE = "CAPNP-TS035 Attempted to get a segment other than 0 (%d) from a single segment arena.";
const SEG_ID_OUT_OF_BOUNDS = "CAPNP-TS036 Attempted to get an out-of-bounds segment (%d).";
const SEG_NOT_WORD_ALIGNED = "CAPNP-TS037 Segment buffer length %d is not a multiple of 8.";
const SEG_REPLACEMENT_BUFFER_TOO_SMALL = "CAPNP-TS038 Attempted to replace a segment buffer with one that is smaller than the allocated space.";
const SEG_SIZE_OVERFLOW = `CAPNP-TS039 Requested size %x exceeds maximum value (${MAX_SEGMENT_LENGTH}).`;
const TYPE_COMPOSITE_SIZE_UNDEFINED = "CAPNP-TS040 Must provide a composite element size for composite list pointers.";
const LIST_NO_MUTABLE = "CAPNP-TS045: Cannot call mutative methods on an immutable list.";
const LIST_NO_SEARCH = "CAPNP-TS046: Search is not supported for list.";
const RPC_NULL_CLIENT = "CAPNP-TS100 Call on null client.";
const RPC_CALL_QUEUE_FULL = "CAPNP-TS101 Promised answer call queue full.";
const RPC_QUEUE_CALL_CANCEL = "CAPNP-TS102 Queue call canceled.";
const RPC_ZERO_REF = "CAPNP-TS105 Ref() called on zeroed refcount.";
const RPC_IMPORT_CLOSED = "CAPNP-TS106 Call on closed import.";
const RPC_METHOD_NOT_IMPLEMENTED = "CAPNP-TS107 Method not implemented.";
const RPC_BAD_TARGET = "CAPNP-TS109 Target not found.";
const RPC_RETURN_FOR_UNKNOWN_QUESTION = "CAPNP-TS111 Received return for unknown question (id=%s).";
const RPC_QUESTION_ID_REUSED = "CAPNP-TS112 Attempted to re-use question id (%s).";
const RPC_UNKNOWN_EXPORT_ID = "CAPNP-TS113 Capability table references unknown export ID (%s).";
const RPC_UNKNOWN_ANSWER_ID = "CAPNP-TS114 Capability table references unknown answer ID (%s).";
const RPC_UNKNOWN_CAP_DESCRIPTOR = "CAPNP-TS115 Unknown cap descriptor type (which: %s).";
const RPC_METHOD_ERROR = "CAPNP-TS116 RPC method failed at %s.%s(): %s";
const RPC_ERROR = "CAPNP-TS117 RPC call failed, reason: %s";
const RPC_NO_MAIN_INTERFACE = "CAPNP-TS118 Received bootstrap message without main interface set.";
const RPC_FINISH_UNKNOWN_ANSWER = "CAPNP-TS119 Received finish message for unknown answer ID (%s).";
const RPC_FULFILL_ALREADY_CALLED = "CAPNP-TS120 Fulfill called more than once for question (%s).";

function bufferToHex(buffer) {
  const a = new Uint8Array(buffer);
  const h = [];
  for (let i = 0; i < a.byteLength; i++) {
    h.push(pad(a[i].toString(16), 2));
  }
  return `[${h.join(" ")}]`;
}
function dumpBuffer(buffer) {
  const b = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  const byteLength = Math.min(b.byteLength, MAX_BUFFER_DUMP_BYTES);
  let r = format("\n=== buffer[%d] ===", byteLength);
  for (let j = 0; j < byteLength; j += 16) {
    r += `
${pad(j.toString(16), 8)}: `;
    let s = "";
    let k;
    for (k = 0; k < 16 && j + k < b.byteLength; k++) {
      const v = b[j + k];
      r += `${pad(v.toString(16), 2)} `;
      s += v > 31 && v < 255 ? String.fromCharCode(v) : "\xB7";
      if (k === 7) {
        r += " ";
      }
    }
    r += `${" ".repeat((17 - k) * 3)}${s}`;
  }
  r += "\n";
  if (byteLength !== b.byteLength) {
    r += format("=== (truncated %d bytes) ===\n", b.byteLength - byteLength);
  }
  return r;
}
function format(s, ...args) {
  const n = s.length;
  let arg;
  let argIndex = 0;
  let c;
  let escaped = false;
  let i = 0;
  let leadingZero = false;
  let precision;
  let result = "";
  function nextArg() {
    return args[argIndex++];
  }
  function slurpNumber() {
    let digits = "";
    while (/\d/.test(s[i])) {
      digits += s[i++];
      c = s[i];
    }
    return digits.length > 0 ? Number.parseInt(digits, 10) : null;
  }
  for (; i < n; ++i) {
    c = s[i];
    if (escaped) {
      escaped = false;
      if (c === ".") {
        leadingZero = false;
        c = s[++i];
      } else if (c === "0" && s[i + 1] === ".") {
        leadingZero = true;
        i += 2;
        c = s[i];
      } else {
        leadingZero = true;
      }
      precision = slurpNumber();
      switch (c) {
        case "a": {
          result += "0x" + pad(Number.parseInt(String(nextArg()), 10).toString(16), 8);
          break;
        }
        case "b": {
          result += Number.parseInt(String(nextArg()), 10).toString(2);
          break;
        }
        case "c": {
          arg = nextArg();
          result += typeof arg === "string" || arg instanceof String ? arg : String.fromCharCode(Number.parseInt(String(arg), 10));
          break;
        }
        case "d": {
          result += Number.parseInt(String(nextArg()), 10);
          break;
        }
        case "f": {
          const tmp = Number.parseFloat(String(nextArg())).toFixed(
            precision || 6
          );
          result += leadingZero ? tmp : tmp.replace(/^0/, "");
          break;
        }
        case "j": {
          result += JSON.stringify(nextArg());
          break;
        }
        case "o": {
          result += "0" + Number.parseInt(String(nextArg()), 10).toString(8);
          break;
        }
        case "s": {
          result += nextArg();
          break;
        }
        case "x": {
          result += "0x" + Number.parseInt(String(nextArg()), 10).toString(16);
          break;
        }
        case "X": {
          result += "0x" + Number.parseInt(String(nextArg()), 10).toString(16).toUpperCase();
          break;
        }
        default: {
          result += c;
          break;
        }
      }
    } else if (c === "%") {
      escaped = true;
    } else {
      result += c;
    }
  }
  return result;
}
function pad(v, width, pad2 = "0") {
  return v.length >= width ? v : Array.from({ length: width - v.length + 1 }).join(pad2) + v;
}
function padToWord$1(size) {
  return size + 7 & -8;
}

class ObjectSize {
  /**
   * Creates a new ObjectSize instance.
   *
   * @param dataByteLength - The number of bytes in the data section of the struct
   * @param pointerLength - The number of pointers in the pointer section of the struct
   */
  constructor(dataByteLength, pointerLength) {
    this.dataByteLength = dataByteLength;
    this.pointerLength = pointerLength;
  }
  toString() {
    return format(
      "ObjectSize_dw:%d,pc:%d",
      getDataWordLength(this),
      this.pointerLength
    );
  }
}
function getByteLength(o) {
  return o.dataByteLength + o.pointerLength * 8;
}
function getDataWordLength(o) {
  return o.dataByteLength / 8;
}
function getWordLength(o) {
  return o.dataByteLength / 8 + o.pointerLength;
}
function padToWord(o) {
  return new ObjectSize(padToWord$1(o.dataByteLength), o.pointerLength);
}

class Orphan {
  /** If this member is not present then the orphan has already been adopted, or something went very wrong. */
  _capnp;
  byteOffset;
  segment;
  constructor(src) {
    const c = getContent(src);
    this.segment = c.segment;
    this.byteOffset = c.byteOffset;
    this._capnp = {};
    this._capnp.type = getTargetPointerType(src);
    switch (this._capnp.type) {
      case PointerType.STRUCT: {
        this._capnp.size = getTargetStructSize(src);
        break;
      }
      case PointerType.LIST: {
        this._capnp.length = getTargetListLength(src);
        this._capnp.elementSize = getTargetListElementSize(src);
        if (this._capnp.elementSize === ListElementSize.COMPOSITE) {
          this._capnp.size = getTargetCompositeListSize(src);
        }
        break;
      }
      case PointerType.OTHER: {
        this._capnp.capId = getCapabilityId(src);
        break;
      }
      default: {
        throw new Error(PTR_INVALID_POINTER_TYPE);
      }
    }
    erasePointer(src);
  }
  /**
   * Adopt (move) this orphan into the target pointer location. This will allocate far pointers in `dst` as needed.
   *
   * @param dst The destination pointer.
   */
  _moveTo(dst) {
    if (this._capnp === void 0) {
      throw new Error(format(PTR_ALREADY_ADOPTED, this));
    }
    if (this.segment.message !== dst.segment.message) {
      throw new Error(format(PTR_ADOPT_WRONG_MESSAGE, this, dst));
    }
    erase(dst);
    const res = initPointer(this.segment, this.byteOffset, dst);
    switch (this._capnp.type) {
      case PointerType.STRUCT: {
        setStructPointer(res.offsetWords, this._capnp.size, res.pointer);
        break;
      }
      case PointerType.LIST: {
        let { offsetWords } = res;
        if (this._capnp.elementSize === ListElementSize.COMPOSITE) {
          offsetWords--;
        }
        setListPointer(
          offsetWords,
          this._capnp.elementSize,
          this._capnp.length,
          res.pointer,
          this._capnp.size
        );
        break;
      }
      case PointerType.OTHER: {
        setInterfacePointer(this._capnp.capId, res.pointer);
        break;
      }
      /* istanbul ignore next */
      default: {
        throw new Error(PTR_INVALID_POINTER_TYPE);
      }
    }
    this._capnp = void 0;
  }
  dispose() {
    if (this._capnp === void 0) {
      return;
    }
    switch (this._capnp.type) {
      case PointerType.STRUCT: {
        this.segment.fillZeroWords(
          this.byteOffset,
          getWordLength(this._capnp.size)
        );
        break;
      }
      case PointerType.LIST: {
        const byteLength = getListByteLength(
          this._capnp.elementSize,
          this._capnp.length,
          this._capnp.size
        );
        this.segment.fillZeroWords(this.byteOffset, byteLength);
        break;
      }
    }
    this._capnp = void 0;
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return format(
      "Orphan_%d@%a,type:%s",
      this.segment.id,
      this.byteOffset,
      this._capnp && this._capnp.type
    );
  }
}

function adopt(src, p) {
  src._moveTo(p);
}
function disown(p) {
  return new Orphan(p);
}
function dump(p) {
  return bufferToHex(p.segment.buffer.slice(p.byteOffset, p.byteOffset + 8));
}
function getListByteLength(elementSize, length, compositeSize) {
  switch (elementSize) {
    case ListElementSize.BIT: {
      return padToWord$1(length + 7 >>> 3);
    }
    case ListElementSize.BYTE:
    case ListElementSize.BYTE_2:
    case ListElementSize.BYTE_4:
    case ListElementSize.BYTE_8:
    case ListElementSize.POINTER:
    case ListElementSize.VOID: {
      return padToWord$1(getListElementByteLength(elementSize) * length);
    }
    /* istanbul ignore next */
    case ListElementSize.COMPOSITE: {
      if (compositeSize === void 0) {
        throw new Error(format(PTR_INVALID_LIST_SIZE, Number.NaN));
      }
      return length * padToWord$1(getByteLength(compositeSize));
    }
    /* istanbul ignore next */
    default: {
      throw new Error(PTR_INVALID_LIST_SIZE);
    }
  }
}
function getListElementByteLength(elementSize) {
  switch (elementSize) {
    /* istanbul ignore next */
    case ListElementSize.BIT: {
      return Number.NaN;
    }
    case ListElementSize.BYTE: {
      return 1;
    }
    case ListElementSize.BYTE_2: {
      return 2;
    }
    case ListElementSize.BYTE_4: {
      return 4;
    }
    case ListElementSize.BYTE_8:
    case ListElementSize.POINTER: {
      return 8;
    }
    /* istanbul ignore next */
    case ListElementSize.COMPOSITE: {
      return Number.NaN;
    }
    /* istanbul ignore next */
    case ListElementSize.VOID: {
      return 0;
    }
    /* istanbul ignore next */
    default: {
      throw new Error(format(PTR_INVALID_LIST_SIZE, elementSize));
    }
  }
}
function add(offset, p) {
  return new Pointer(p.segment, p.byteOffset + offset, p._capnp.depthLimit);
}
function copyFrom(src, p) {
  if (p.segment === src.segment && p.byteOffset === src.byteOffset) {
    return;
  }
  erase(p);
  if (isNull(src)) return;
  switch (getTargetPointerType(src)) {
    case PointerType.STRUCT: {
      copyFromStruct(src, p);
      break;
    }
    case PointerType.LIST: {
      copyFromList(src, p);
      break;
    }
    case PointerType.OTHER: {
      copyFromInterface(src, p);
      break;
    }
    /* istanbul ignore next */
    default: {
      throw new Error(
        format(PTR_INVALID_POINTER_TYPE, getTargetPointerType(p))
      );
    }
  }
}
function erase(p) {
  if (isNull(p)) return;
  let c;
  switch (getTargetPointerType(p)) {
    case PointerType.STRUCT: {
      const size = getTargetStructSize(p);
      c = getContent(p);
      c.segment.fillZeroWords(c.byteOffset, size.dataByteLength / 8);
      for (let i = 0; i < size.pointerLength; i++) {
        erase(add(i * 8, c));
      }
      break;
    }
    case PointerType.LIST: {
      const elementSize = getTargetListElementSize(p);
      const length = getTargetListLength(p);
      let contentWords = padToWord$1(
        length * getListElementByteLength(elementSize)
      );
      c = getContent(p);
      if (elementSize === ListElementSize.POINTER) {
        for (let i = 0; i < length; i++) {
          erase(
            new Pointer(
              c.segment,
              c.byteOffset + i * 8,
              p._capnp.depthLimit - 1
            )
          );
        }
        break;
      } else if (elementSize === ListElementSize.COMPOSITE) {
        const tag = add(-8, c);
        const compositeSize = getStructSize(tag);
        const compositeByteLength = getByteLength(compositeSize);
        contentWords = getOffsetWords(tag);
        c.segment.setWordZero(c.byteOffset - 8);
        for (let i = 0; i < length; i++) {
          for (let j = 0; j < compositeSize.pointerLength; j++) {
            erase(
              new Pointer(
                c.segment,
                c.byteOffset + i * compositeByteLength + j * 8,
                p._capnp.depthLimit - 1
              )
            );
          }
        }
      }
      c.segment.fillZeroWords(c.byteOffset, contentWords);
      break;
    }
    case PointerType.OTHER: {
      break;
    }
    default: {
      throw new Error(
        format(PTR_INVALID_POINTER_TYPE, getTargetPointerType(p))
      );
    }
  }
  erasePointer(p);
}
function erasePointer(p) {
  if (getPointerType(p) === PointerType.FAR) {
    const landingPad = followFar(p);
    if (isDoubleFar(p)) {
      landingPad.segment.setWordZero(landingPad.byteOffset + 8);
    }
    landingPad.segment.setWordZero(landingPad.byteOffset);
  }
  p.segment.setWordZero(p.byteOffset);
}
function followFar(p) {
  const targetSegment = p.segment.message.getSegment(
    p.segment.getUint32(p.byteOffset + 4)
  );
  const targetWordOffset = p.segment.getUint32(p.byteOffset) >>> 3;
  return new Pointer(
    targetSegment,
    targetWordOffset * 8,
    p._capnp.depthLimit - 1
  );
}
function followFars(p) {
  if (getPointerType(p) === PointerType.FAR) {
    const landingPad = followFar(p);
    if (isDoubleFar(p)) {
      landingPad.byteOffset += 8;
    }
    return landingPad;
  }
  return p;
}
function getCapabilityId(p) {
  return p.segment.getUint32(p.byteOffset + 4);
}
function isCompositeList(p) {
  return getTargetPointerType(p) === PointerType.LIST && getTargetListElementSize(p) === ListElementSize.COMPOSITE;
}
function getContent(p, ignoreCompositeIndex) {
  let c;
  if (isDoubleFar(p)) {
    const landingPad = followFar(p);
    c = new Pointer(
      p.segment.message.getSegment(getFarSegmentId(landingPad)),
      getOffsetWords(landingPad) * 8
    );
  } else {
    const target = followFars(p);
    c = new Pointer(
      target.segment,
      target.byteOffset + 8 + getOffsetWords(target) * 8
    );
  }
  if (isCompositeList(p)) {
    c.byteOffset += 8;
  }
  if (!ignoreCompositeIndex && p._capnp.compositeIndex !== void 0) {
    c.byteOffset -= 8;
    c.byteOffset += 8 + p._capnp.compositeIndex * getByteLength(padToWord(getStructSize(c)));
  }
  return c;
}
function getFarSegmentId(p) {
  return p.segment.getUint32(p.byteOffset + 4);
}
function getListElementSize(p) {
  return p.segment.getUint32(p.byteOffset + 4) & LIST_SIZE_MASK;
}
function getListLength(p) {
  return p.segment.getUint32(p.byteOffset + 4) >>> 3;
}
function getOffsetWords(p) {
  const o = p.segment.getInt32(p.byteOffset);
  return o & 2 ? o >> 3 : o >> 2;
}
function getPointerType(p) {
  return p.segment.getUint32(p.byteOffset) & POINTER_TYPE_MASK;
}
function getStructDataWords(p) {
  return p.segment.getUint16(p.byteOffset + 4);
}
function getStructPointerLength(p) {
  return p.segment.getUint16(p.byteOffset + 6);
}
function getStructSize(p) {
  return new ObjectSize(getStructDataWords(p) * 8, getStructPointerLength(p));
}
function getTargetCompositeListTag(p) {
  const c = getContent(p);
  c.byteOffset -= 8;
  return c;
}
function getTargetCompositeListSize(p) {
  return getStructSize(getTargetCompositeListTag(p));
}
function getTargetListElementSize(p) {
  return getListElementSize(followFars(p));
}
function getTargetListLength(p) {
  const t = followFars(p);
  if (getListElementSize(t) === ListElementSize.COMPOSITE) {
    return getOffsetWords(getTargetCompositeListTag(p));
  }
  return getListLength(t);
}
function getTargetPointerType(p) {
  const t = getPointerType(followFars(p));
  if (t === PointerType.FAR) {
    throw new Error(format(PTR_INVALID_FAR_TARGET, p));
  }
  return t;
}
function getTargetStructSize(p) {
  return getStructSize(followFars(p));
}
function initPointer(contentSegment, contentOffset, p) {
  if (p.segment !== contentSegment) {
    if (!contentSegment.hasCapacity(8)) {
      const landingPad2 = p.segment.allocate(16);
      setFarPointer(true, landingPad2.byteOffset / 8, landingPad2.segment.id, p);
      setFarPointer(false, contentOffset / 8, contentSegment.id, landingPad2);
      landingPad2.byteOffset += 8;
      return new PointerAllocationResult(landingPad2, 0);
    }
    const landingPad = contentSegment.allocate(8);
    if (landingPad.segment.id !== contentSegment.id) {
      throw new Error(INVARIANT_UNREACHABLE_CODE);
    }
    setFarPointer(false, landingPad.byteOffset / 8, landingPad.segment.id, p);
    return new PointerAllocationResult(
      landingPad,
      (contentOffset - landingPad.byteOffset - 8) / 8
    );
  }
  return new PointerAllocationResult(p, (contentOffset - p.byteOffset - 8) / 8);
}
function isDoubleFar(p) {
  return getPointerType(p) === PointerType.FAR && (p.segment.getUint32(p.byteOffset) & POINTER_DOUBLE_FAR_MASK) !== 0;
}
function isNull(p) {
  return p.segment.isWordZero(p.byteOffset);
}
function relocateTo(dst, src) {
  const t = followFars(src);
  const lo = t.segment.getUint8(t.byteOffset) & 3;
  const hi = t.segment.getUint32(t.byteOffset + 4);
  erase(dst);
  const res = initPointer(
    t.segment,
    t.byteOffset + 8 + getOffsetWords(t) * 8,
    dst
  );
  res.pointer.segment.setUint32(
    res.pointer.byteOffset,
    lo | res.offsetWords << 2
  );
  res.pointer.segment.setUint32(res.pointer.byteOffset + 4, hi);
  erasePointer(src);
}
function setFarPointer(doubleFar, offsetWords, segmentId, p) {
  const A = PointerType.FAR;
  const B = doubleFar ? 1 : 0;
  const C = offsetWords;
  const D = segmentId;
  p.segment.setUint32(p.byteOffset, A | B << 2 | C << 3);
  p.segment.setUint32(p.byteOffset + 4, D);
}
function setInterfacePointer(capId, p) {
  p.segment.setUint32(p.byteOffset, PointerType.OTHER);
  p.segment.setUint32(p.byteOffset + 4, capId);
}
function getInterfacePointer(p) {
  return p.segment.getUint32(p.byteOffset + 4);
}
function setListPointer(offsetWords, size, length, p, compositeSize) {
  const A = PointerType.LIST;
  const B = offsetWords;
  const C = size;
  let D = length;
  if (size === ListElementSize.COMPOSITE) {
    if (compositeSize === void 0) {
      throw new TypeError(TYPE_COMPOSITE_SIZE_UNDEFINED);
    }
    D *= getWordLength(compositeSize);
  }
  p.segment.setUint32(p.byteOffset, A | B << 2);
  p.segment.setUint32(p.byteOffset + 4, C | D << 3);
}
function setStructPointer(offsetWords, size, p) {
  const A = PointerType.STRUCT;
  const B = offsetWords;
  const C = getDataWordLength(size);
  const D = size.pointerLength;
  p.segment.setUint32(p.byteOffset, A | B << 2);
  p.segment.setUint16(p.byteOffset + 4, C);
  p.segment.setUint16(p.byteOffset + 6, D);
}
function validate(pointerType, p, elementSize) {
  if (isNull(p)) {
    return;
  }
  const t = followFars(p);
  const A = t.segment.getUint32(t.byteOffset) & POINTER_TYPE_MASK;
  if (A !== pointerType) {
    throw new Error(format(PTR_WRONG_POINTER_TYPE, p, pointerType));
  }
  if (elementSize !== void 0) {
    const C = t.segment.getUint32(t.byteOffset + 4) & LIST_SIZE_MASK;
    if (C !== elementSize) {
      throw new Error(
        format(PTR_WRONG_LIST_TYPE, p, ListElementSize[elementSize])
      );
    }
  }
}
function copyFromInterface(src, dst) {
  const srcCapId = getInterfacePointer(src);
  if (srcCapId < 0) {
    return;
  }
  const srcCapTable = src.segment.message._capnp.capTable;
  if (!srcCapTable) {
    return;
  }
  const client = srcCapTable[srcCapId];
  if (!client) {
    return;
  }
  const dstCapId = dst.segment.message.addCap(client);
  setInterfacePointer(dstCapId, dst);
}
function copyFromList(src, dst) {
  if (dst._capnp.depthLimit <= 0) {
    throw new Error(PTR_DEPTH_LIMIT_EXCEEDED);
  }
  const srcContent = getContent(src);
  const srcElementSize = getTargetListElementSize(src);
  const srcLength = getTargetListLength(src);
  let srcCompositeSize;
  let srcStructByteLength;
  let dstContent;
  if (srcElementSize === ListElementSize.POINTER) {
    dstContent = dst.segment.allocate(srcLength << 3);
    for (let i = 0; i < srcLength; i++) {
      const srcPtr = new Pointer(
        srcContent.segment,
        srcContent.byteOffset + (i << 3),
        src._capnp.depthLimit - 1
      );
      const dstPtr = new Pointer(
        dstContent.segment,
        dstContent.byteOffset + (i << 3),
        dst._capnp.depthLimit - 1
      );
      copyFrom(srcPtr, dstPtr);
    }
  } else if (srcElementSize === ListElementSize.COMPOSITE) {
    srcCompositeSize = padToWord(getTargetCompositeListSize(src));
    srcStructByteLength = getByteLength(srcCompositeSize);
    dstContent = dst.segment.allocate(
      getByteLength(srcCompositeSize) * srcLength + 8
    );
    dstContent.segment.copyWord(
      dstContent.byteOffset,
      srcContent.segment,
      srcContent.byteOffset - 8
    );
    if (srcCompositeSize.dataByteLength > 0) {
      const wordLength = getWordLength(srcCompositeSize) * srcLength;
      dstContent.segment.copyWords(
        dstContent.byteOffset + 8,
        srcContent.segment,
        srcContent.byteOffset,
        wordLength
      );
    }
    for (let i = 0; i < srcLength; i++) {
      for (let j = 0; j < srcCompositeSize.pointerLength; j++) {
        const offset = i * srcStructByteLength + srcCompositeSize.dataByteLength + (j << 3);
        const srcPtr = new Pointer(
          srcContent.segment,
          srcContent.byteOffset + offset,
          src._capnp.depthLimit - 1
        );
        const dstPtr = new Pointer(
          dstContent.segment,
          dstContent.byteOffset + offset + 8,
          dst._capnp.depthLimit - 1
        );
        copyFrom(srcPtr, dstPtr);
      }
    }
  } else {
    const byteLength = padToWord$1(
      srcElementSize === ListElementSize.BIT ? srcLength + 7 >>> 3 : getListElementByteLength(srcElementSize) * srcLength
    );
    const wordLength = byteLength >>> 3;
    dstContent = dst.segment.allocate(byteLength);
    dstContent.segment.copyWords(
      dstContent.byteOffset,
      srcContent.segment,
      srcContent.byteOffset,
      wordLength
    );
  }
  const res = initPointer(dstContent.segment, dstContent.byteOffset, dst);
  setListPointer(
    res.offsetWords,
    srcElementSize,
    srcLength,
    res.pointer,
    srcCompositeSize
  );
}
function copyFromStruct(src, dst) {
  if (dst._capnp.depthLimit <= 0) {
    throw new Error(PTR_DEPTH_LIMIT_EXCEEDED);
  }
  const srcContent = getContent(src);
  const srcSize = getTargetStructSize(src);
  const srcDataWordLength = getDataWordLength(srcSize);
  const dstContent = dst.segment.allocate(getByteLength(srcSize));
  dstContent.segment.copyWords(
    dstContent.byteOffset,
    srcContent.segment,
    srcContent.byteOffset,
    srcDataWordLength
  );
  for (let i = 0; i < srcSize.pointerLength; i++) {
    const offset = srcSize.dataByteLength + i * 8;
    const srcPtr = new Pointer(
      srcContent.segment,
      srcContent.byteOffset + offset,
      src._capnp.depthLimit - 1
    );
    const dstPtr = new Pointer(
      dstContent.segment,
      dstContent.byteOffset + offset,
      dst._capnp.depthLimit - 1
    );
    copyFrom(srcPtr, dstPtr);
  }
  if (dst._capnp.compositeList) {
    return;
  }
  const res = initPointer(dstContent.segment, dstContent.byteOffset, dst);
  setStructPointer(res.offsetWords, srcSize, res.pointer);
}
function trackPointerAllocation(message, p) {
  message._capnp.traversalLimit -= 8;
  if (message._capnp.traversalLimit <= 0) {
    throw new Error(format(PTR_TRAVERSAL_LIMIT_EXCEEDED, p));
  }
}
class PointerAllocationResult {
  constructor(pointer, offsetWords) {
    this.pointer = pointer;
    this.offsetWords = offsetWords;
  }
}

var PointerType = /* @__PURE__ */ ((PointerType2) => {
  PointerType2[PointerType2["STRUCT"] = 0] = "STRUCT";
  PointerType2[PointerType2["LIST"] = 1] = "LIST";
  PointerType2[PointerType2["FAR"] = 2] = "FAR";
  PointerType2[PointerType2["OTHER"] = 3] = "OTHER";
  return PointerType2;
})(PointerType || {});
class Pointer {
  static _capnp = {
    displayName: "Pointer"
  };
  _capnp;
  /** Offset, in bytes, from the start of the segment to the beginning of this pointer. */
  byteOffset;
  /**
   * The starting segment for this pointer's data. In the case of a far pointer, the actual content this pointer is
   * referencing will be in another segment within the same message.
   */
  segment;
  constructor(segment, byteOffset, depthLimit = MAX_DEPTH) {
    this._capnp = { compositeList: false, depthLimit };
    this.segment = segment;
    this.byteOffset = byteOffset;
    if (depthLimit < 1) {
      throw new Error(format(PTR_DEPTH_LIMIT_EXCEEDED, this));
    }
    trackPointerAllocation(segment.message, this);
    if (byteOffset < 0 || byteOffset > segment.byteLength) {
      throw new Error(format(PTR_OFFSET_OUT_OF_BOUNDS, byteOffset));
    }
  }
  [Symbol.toStringTag]() {
    return format("Pointer_%d", this.segment.id);
  }
  toString() {
    return format("->%d@%a%s", this.segment.id, this.byteOffset, dump(this));
  }
}

class List extends Pointer {
  static _capnp = {
    displayName: "List<Generic>",
    size: ListElementSize.VOID
  };
  constructor(segment, byteOffset, depthLimit) {
    super(segment, byteOffset, depthLimit);
    return new Proxy(this, List.#proxyHandler);
  }
  static #proxyHandler = {
    get(target, prop, receiver) {
      const val = Reflect.get(target, prop, receiver);
      if (val !== void 0) {
        return val;
      }
      if (typeof prop === "string") {
        return target.get(+prop);
      }
    }
  };
  get length() {
    return getTargetListLength(this);
  }
  toArray() {
    const { length } = this;
    const res = Array.from({ length });
    for (let i = 0; i < length; i++) {
      res[i] = this.at(i);
    }
    return res;
  }
  get(_index) {
    throw new TypeError("Cannot get from a generic list.");
  }
  set(_index, _value) {
    throw new TypeError("Cannot set on a generic list.");
  }
  at(index) {
    return this.get(index < 0 ? this.length + index : index);
  }
  concat(other) {
    const { length } = this;
    const otherLength = other.length;
    const res = Array.from({ length: length + otherLength });
    for (let i = 0; i < length; i++) res[i] = this.at(i);
    for (let i = 0; i < otherLength; i++) res[i + length] = other.at(i);
    return res;
  }
  some(cb, _this) {
    for (let i = 0; i < this.length; i++) {
      if (cb.call(_this, this.at(i), i, this)) {
        return true;
      }
    }
    return false;
  }
  filter(cb, _this) {
    const res = [];
    for (let i = 0; i < this.length; i++) {
      const value = this.at(i);
      if (cb.call(_this, value, i, this)) {
        res.push(value);
      }
    }
    return res;
  }
  find(cb, _this) {
    for (let i = 0; i < this.length; i++) {
      const value = this.at(i);
      if (cb.call(_this, value, i, this)) {
        return value;
      }
    }
    return void 0;
  }
  findIndex(cb, _this) {
    for (let i = 0; i < this.length; i++) {
      const value = this.at(i);
      if (cb.call(_this, value, i, this)) {
        return i;
      }
    }
    return -1;
  }
  forEach(cb, _this) {
    for (let i = 0; i < this.length; i++) {
      cb.call(_this, this.at(i), i, this);
    }
  }
  map(cb, _this) {
    const { length } = this;
    const res = Array.from({ length });
    for (let i = 0; i < length; i++) {
      res[i] = cb.call(_this, this.at(i), i, this);
    }
    return res;
  }
  flatMap(cb, _this) {
    const res = [];
    for (let i = 0; i < this.length; i++) {
      const r = cb.call(_this, this.at(i), i, this);
      res.push(...Array.isArray(r) ? r : [r]);
    }
    return res;
  }
  every(cb, _this) {
    for (let i = 0; i < this.length; i++) {
      if (!cb.call(_this, this.at(i), i, this)) {
        return false;
      }
    }
    return true;
  }
  reduce(cb, initialValue) {
    let i = 0;
    let res;
    if (initialValue === void 0) {
      res = this.at(0);
      i++;
    } else {
      res = initialValue;
    }
    for (; i < this.length; i++) {
      res = cb(res, this.at(i), i, this);
    }
    return res;
  }
  reduceRight(cb, initialValue) {
    let i = this.length - 1;
    let res;
    if (initialValue === void 0) {
      res = this.at(i);
      i--;
    } else {
      res = initialValue;
    }
    for (; i >= 0; i--) {
      res = cb(res, this.at(i), i, this);
    }
    return res;
  }
  slice(start = 0, end) {
    const length = end ? Math.min(this.length, end) : this.length;
    const res = Array.from({ length: length - start });
    for (let i = start; i < length; i++) {
      res[i] = this.at(i);
    }
    return res;
  }
  join(separator) {
    return this.toArray().join(separator);
  }
  toReversed() {
    return this.toArray().reverse();
  }
  toSorted(compareFn) {
    return this.toArray().sort(compareFn);
  }
  toSpliced(start, deleteCount, ...items) {
    return this.toArray().splice(start, deleteCount, ...items);
  }
  fill(value, start, end) {
    const { length } = this;
    const s = Math.max(start ?? 0, 0);
    const e = Math.min(end ?? length, length);
    for (let i = s; i < e; i++) {
      this.set(i, value);
    }
    return this;
  }
  copyWithin(target, start, end) {
    const { length } = this;
    const e = end ?? length;
    const s = start < 0 ? Math.max(length + start, 0) : start;
    const t = target < 0 ? Math.max(length + target, 0) : target;
    const len = Math.min(e - s, length - t);
    for (let i = 0; i < len; i++) {
      this.set(t + i, this.at(s + i));
    }
    return this;
  }
  keys() {
    return Array.from({ length: this.length }, (_, i) => i)[Symbol.iterator]();
  }
  values() {
    return this.toArray().values();
  }
  entries() {
    return this.toArray().entries();
  }
  flat(depth) {
    return this.toArray().flat(depth);
  }
  with(index, value) {
    return this.toArray().with(index, value);
  }
  includes(_searchElement, _fromIndex) {
    throw new Error(LIST_NO_SEARCH);
  }
  findLast(_cb, _thisArg) {
    throw new Error(LIST_NO_SEARCH);
  }
  findLastIndex(_cb, _t) {
    throw new Error(LIST_NO_SEARCH);
  }
  indexOf(_searchElement, _fromIndex) {
    throw new Error(LIST_NO_SEARCH);
  }
  lastIndexOf(_searchElement, _fromIndex) {
    throw new Error(LIST_NO_SEARCH);
  }
  pop() {
    throw new Error(LIST_NO_MUTABLE);
  }
  push(..._items) {
    throw new Error(LIST_NO_MUTABLE);
  }
  reverse() {
    throw new Error(LIST_NO_MUTABLE);
  }
  shift() {
    throw new Error(LIST_NO_MUTABLE);
  }
  unshift(..._items) {
    throw new Error(LIST_NO_MUTABLE);
  }
  splice(_start, _deleteCount, ..._rest) {
    throw new Error(LIST_NO_MUTABLE);
  }
  sort(_fn) {
    throw new Error(LIST_NO_MUTABLE);
  }
  get [Symbol.unscopables]() {
    return Array.prototype[Symbol.unscopables];
  }
  [Symbol.iterator]() {
    return this.values();
  }
  toJSON() {
    return this.toArray();
  }
  toString() {
    return this.join(",");
  }
  toLocaleString(_locales, _options) {
    return this.toString();
  }
  [Symbol.toStringTag]() {
    return "[object Array]";
  }
  static [Symbol.toStringTag]() {
    return this._capnp.displayName;
  }
}
function initList$1(elementSize, length, list, compositeSize) {
  let c;
  switch (elementSize) {
    case ListElementSize.BIT: {
      c = list.segment.allocate(Math.ceil(length / 8));
      break;
    }
    case ListElementSize.BYTE:
    case ListElementSize.BYTE_2:
    case ListElementSize.BYTE_4:
    case ListElementSize.BYTE_8:
    case ListElementSize.POINTER: {
      c = list.segment.allocate(length * getListElementByteLength(elementSize));
      break;
    }
    case ListElementSize.COMPOSITE: {
      if (compositeSize === void 0) {
        throw new Error(format(PTR_COMPOSITE_SIZE_UNDEFINED));
      }
      compositeSize = padToWord(compositeSize);
      const byteLength = getByteLength(compositeSize) * length;
      c = list.segment.allocate(byteLength + 8);
      setStructPointer(length, compositeSize, c);
      break;
    }
    case ListElementSize.VOID: {
      setListPointer(0, elementSize, length, list);
      return;
    }
    default: {
      throw new Error(format(PTR_INVALID_LIST_SIZE, elementSize));
    }
  }
  const res = initPointer(c.segment, c.byteOffset, list);
  setListPointer(
    res.offsetWords,
    elementSize,
    length,
    res.pointer,
    compositeSize
  );
}

class Data extends List {
  static fromPointer(pointer) {
    validate(PointerType.LIST, pointer, ListElementSize.BYTE);
    return this._fromPointerUnchecked(pointer);
  }
  static _fromPointerUnchecked(pointer) {
    return new this(
      pointer.segment,
      pointer.byteOffset,
      pointer._capnp.depthLimit
    );
  }
  /**
   * Copy the contents of `src` into this Data pointer. If `src` is smaller than the length of this pointer then the
   * remaining bytes will be zeroed out. Extra bytes in `src` are ignored.
   *
   * @param src The source buffer.
   */
  // TODO: Would be nice to have a way to zero-copy a buffer by allocating a new segment into the message with that
  // buffer data.
  copyBuffer(src) {
    const c = getContent(this);
    const dstLength = this.length;
    const srcLength = src.byteLength;
    const i = src instanceof ArrayBuffer ? new Uint8Array(src) : new Uint8Array(
      src.buffer,
      src.byteOffset,
      Math.min(dstLength, srcLength)
    );
    const o = new Uint8Array(c.segment.buffer, c.byteOffset, this.length);
    o.set(i);
    if (dstLength > srcLength) {
      o.fill(0, srcLength, dstLength);
    }
  }
  /**
   * Read a byte from the specified offset.
   *
   * @param byteOffset The byte offset to read.
   * @returns The byte value.
   */
  get(byteOffset) {
    const c = getContent(this);
    return c.segment.getUint8(c.byteOffset + byteOffset);
  }
  /**
   * Write a byte at the specified offset.
   *
   * @param byteOffset The byte offset to set.
   * @param value The byte value to set.
   */
  set(byteOffset, value) {
    const c = getContent(this);
    c.segment.setUint8(c.byteOffset + byteOffset, value);
  }
  /**
   * Creates a **copy** of the underlying buffer data and returns it as an ArrayBuffer.
   *
   * To obtain a reference to the underlying buffer instead, use `toUint8Array()` or `toDataView()`.
   *
   * @returns A copy of this data buffer.
   */
  toArrayBuffer() {
    const c = getContent(this);
    return c.segment.buffer.slice(c.byteOffset, c.byteOffset + this.length);
  }
  /**
   * Convert this Data pointer to a DataView representing the pointer's contents.
   *
   * WARNING: The DataView references memory from a message segment, so do not venture outside the bounds of the
   * DataView or else BAD THINGS.
   *
   * @returns A live reference to the underlying buffer.
   */
  toDataView() {
    const c = getContent(this);
    return new DataView(c.segment.buffer, c.byteOffset, this.length);
  }
  [Symbol.toStringTag]() {
    return `Data_${super.toString()}`;
  }
  /**
   * Convert this Data pointer to a Uint8Array representing the pointer's contents.
   *
   * WARNING: The Uint8Array references memory from a message segment, so do not venture outside the bounds of the
   * Uint8Array or else BAD THINGS.
   *
   * @returns A live reference to the underlying buffer.
   */
  toUint8Array() {
    const c = getContent(this);
    return new Uint8Array(c.segment.buffer, c.byteOffset, this.length);
  }
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();
class Text extends List {
  static fromPointer(pointer) {
    validate(PointerType.LIST, pointer, ListElementSize.BYTE);
    return textFromPointerUnchecked(pointer);
  }
  /**
   * Read a utf-8 encoded string value from this pointer.
   *
   * @param index The index at which to start reading; defaults to zero.
   * @returns The string value.
   */
  get(index = 0) {
    if (isNull(this)) {
      return "";
    }
    const c = getContent(this);
    return textDecoder.decode(
      new Uint8Array(
        c.segment.buffer,
        c.byteOffset + index,
        this.length - index
      )
    );
  }
  /**
   * Get the number of utf-8 encoded bytes in this text. This does **not** include the NUL byte.
   *
   * @returns The number of bytes allocated for the text.
   */
  get length() {
    return super.length - 1;
  }
  /**
   * Write a utf-8 encoded string value starting at the specified index.
   *
   * @param index The index at which to start copying the string. Note that if this is not zero the bytes
   * before `index` will be left as-is. All bytes after `index` will be overwritten.
   * @param value The string value to set.
   */
  set(index, value) {
    const src = textEncoder.encode(value);
    const dstLength = src.byteLength + index;
    let c;
    let original;
    if (!isNull(this)) {
      c = getContent(this);
      const originalLength = Math.min(this.length, index);
      original = new Uint8Array(
        c.segment.buffer.slice(c.byteOffset, c.byteOffset + originalLength)
      );
      erase(this);
    }
    initList$1(ListElementSize.BYTE, dstLength + 1, this);
    c = getContent(this);
    const dst = new Uint8Array(c.segment.buffer, c.byteOffset, dstLength);
    if (original) {
      dst.set(original);
    }
    dst.set(src, index);
  }
  toString() {
    return this.get();
  }
  toJSON() {
    return this.get();
  }
  [Symbol.toPrimitive]() {
    return this.get();
  }
  [Symbol.toStringTag]() {
    return `Text_${super.toString()}`;
  }
}
function textFromPointerUnchecked(pointer) {
  return new Text(
    pointer.segment,
    pointer.byteOffset,
    pointer._capnp.depthLimit
  );
}

class Struct extends Pointer {
  static _capnp = {
    displayName: "Struct"
  };
  /**
   * Create a new pointer to a struct.
   *
   * @param segment The segment the pointer resides in.
   * @param byteOffset The offset from the beginning of the segment to the beginning of the pointer data.
   * @param depthLimit The nesting depth limit for this object.
   * @param compositeIndex If set, then this pointer is actually a reference to a composite list
   * (`this._getPointerTargetType() === PointerType.LIST`), and this number is used as the index of the struct within
   * the list. It is not valid to call `initStruct()` on a composite struct – the struct contents are initialized when
   * the list pointer is initialized.
   */
  constructor(segment, byteOffset, depthLimit = MAX_DEPTH, compositeIndex) {
    super(segment, byteOffset, depthLimit);
    this._capnp.compositeIndex = compositeIndex;
    this._capnp.compositeList = compositeIndex !== void 0;
  }
  static [Symbol.toStringTag]() {
    return this._capnp.displayName;
  }
  [Symbol.toStringTag]() {
    return `Struct_${super.toString()}${this._capnp.compositeIndex === void 0 ? "" : `,ci:${this._capnp.compositeIndex}`} > ${getContent(this).toString()}`;
  }
}
class AnyStruct extends Struct {
  static _capnp = {
    displayName: "AnyStruct",
    id: "0",
    size: new ObjectSize(0, 0)
  };
}

class FixedAnswer {
  struct() {
    return Promise.resolve(this.structSync());
  }
}

class ErrorAnswer extends FixedAnswer {
  constructor(err) {
    super();
    this.err = err;
  }
  structSync() {
    throw this.err;
  }
  pipelineCall(_transform, _call) {
    return this;
  }
  pipelineClose(_transform) {
    throw this.err;
  }
}

class ErrorClient {
  constructor(err) {
    this.err = err;
  }
  call(_call) {
    return new ErrorAnswer(this.err);
  }
  close() {
    throw this.err;
  }
}
function clientOrNull(client) {
  return client ?? new ErrorClient(new Error(RPC_NULL_CLIENT));
}

const TMP_WORD = new DataView(new ArrayBuffer(8));
function initStruct(size, s) {
  if (s._capnp.compositeIndex !== void 0) {
    throw new Error(format(PTR_INIT_COMPOSITE_STRUCT, s));
  }
  erase(s);
  const c = s.segment.allocate(getByteLength(size));
  const res = initPointer(c.segment, c.byteOffset, s);
  setStructPointer(res.offsetWords, size, res.pointer);
}
function initStructAt(index, StructClass, p) {
  const s = getPointerAs(index, StructClass, p);
  initStruct(StructClass._capnp.size, s);
  return s;
}
function checkPointerBounds(index, s) {
  const { pointerLength } = getSize(s);
  if (index < 0 || index >= pointerLength) {
    throw new Error(
      format(PTR_STRUCT_POINTER_OUT_OF_BOUNDS, s, index, pointerLength)
    );
  }
}
function getInterfaceClientOrNullAt(index, s) {
  return getInterfaceClientOrNull(getPointer(index, s));
}
function getInterfaceClientOrNull(p) {
  let client = null;
  const capId = getInterfacePointer(p);
  const { capTable } = p.segment.message._capnp;
  if (capTable && capId >= 0 && capId < capTable.length) {
    client = capTable[capId];
  }
  return clientOrNull(client);
}
function resize(dstSize, s) {
  const srcSize = getSize(s);
  const srcContent = getContent(s);
  const dstContent = s.segment.allocate(getByteLength(dstSize));
  dstContent.segment.copyWords(
    dstContent.byteOffset,
    srcContent.segment,
    srcContent.byteOffset,
    Math.min(getDataWordLength(srcSize), getDataWordLength(dstSize))
  );
  const res = initPointer(dstContent.segment, dstContent.byteOffset, s);
  setStructPointer(res.offsetWords, dstSize, res.pointer);
  for (let i = 0; i < Math.min(srcSize.pointerLength, dstSize.pointerLength); i++) {
    const srcPtr = new Pointer(
      srcContent.segment,
      srcContent.byteOffset + srcSize.dataByteLength + i * 8
    );
    if (isNull(srcPtr)) {
      continue;
    }
    const srcPtrTarget = followFars(srcPtr);
    const srcPtrContent = getContent(srcPtr);
    const dstPtr = new Pointer(
      dstContent.segment,
      dstContent.byteOffset + dstSize.dataByteLength + i * 8
    );
    if (getTargetPointerType(srcPtr) === PointerType.LIST && getTargetListElementSize(srcPtr) === ListElementSize.COMPOSITE) {
      srcPtrContent.byteOffset -= 8;
    }
    const r = initPointer(
      srcPtrContent.segment,
      srcPtrContent.byteOffset,
      dstPtr
    );
    const a = srcPtrTarget.segment.getUint8(srcPtrTarget.byteOffset) & 3;
    const b = srcPtrTarget.segment.getUint32(srcPtrTarget.byteOffset + 4);
    r.pointer.segment.setUint32(r.pointer.byteOffset, a | r.offsetWords << 2);
    r.pointer.segment.setUint32(r.pointer.byteOffset + 4, b);
  }
  srcContent.segment.fillZeroWords(
    srcContent.byteOffset,
    getWordLength(srcSize)
  );
}
function getAs(StructClass, s) {
  return new StructClass(
    s.segment,
    s.byteOffset,
    s._capnp.depthLimit,
    s._capnp.compositeIndex
  );
}
function getBit(bitOffset, s, defaultMask) {
  const byteOffset = Math.floor(bitOffset / 8);
  const bitMask = 1 << bitOffset % 8;
  checkDataBounds(byteOffset, 1, s);
  const ds = getDataSection(s);
  const v = ds.segment.getUint8(ds.byteOffset + byteOffset);
  if (defaultMask === void 0) {
    return (v & bitMask) !== 0;
  }
  const defaultValue = defaultMask.getUint8(0);
  return ((v ^ defaultValue) & bitMask) !== 0;
}
function getData(index, s, defaultValue) {
  checkPointerBounds(index, s);
  const ps = getPointerSection(s);
  ps.byteOffset += index * 8;
  const l = new Data(ps.segment, ps.byteOffset, s._capnp.depthLimit - 1);
  if (isNull(l)) {
    if (defaultValue) {
      copyFrom(defaultValue, l);
    } else {
      initList$1(ListElementSize.BYTE, 0, l);
    }
  }
  return l;
}
function getDataSection(s) {
  return getContent(s);
}
function getFloat32(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 4, s);
  const ds = getDataSection(s);
  if (defaultMask === void 0) {
    return ds.segment.getFloat32(ds.byteOffset + byteOffset);
  }
  const v = ds.segment.getUint32(ds.byteOffset + byteOffset) ^ defaultMask.getUint32(0, true);
  TMP_WORD.setUint32(0, v, NATIVE_LITTLE_ENDIAN);
  return TMP_WORD.getFloat32(0, NATIVE_LITTLE_ENDIAN);
}
function getFloat64(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 8, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    const lo = ds.segment.getUint32(ds.byteOffset + byteOffset) ^ defaultMask.getUint32(0, true);
    const hi = ds.segment.getUint32(ds.byteOffset + byteOffset + 4) ^ defaultMask.getUint32(4, true);
    TMP_WORD.setUint32(0, lo, NATIVE_LITTLE_ENDIAN);
    TMP_WORD.setUint32(4, hi, NATIVE_LITTLE_ENDIAN);
    return TMP_WORD.getFloat64(0, NATIVE_LITTLE_ENDIAN);
  }
  return ds.segment.getFloat64(ds.byteOffset + byteOffset);
}
function getInt16(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 2, s);
  const ds = getDataSection(s);
  if (defaultMask === void 0) {
    return ds.segment.getInt16(ds.byteOffset + byteOffset);
  }
  const v = ds.segment.getUint16(ds.byteOffset + byteOffset) ^ defaultMask.getUint16(0, true);
  TMP_WORD.setUint16(0, v, NATIVE_LITTLE_ENDIAN);
  return TMP_WORD.getInt16(0, NATIVE_LITTLE_ENDIAN);
}
function getInt32(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 4, s);
  const ds = getDataSection(s);
  if (defaultMask === void 0) {
    return ds.segment.getInt32(ds.byteOffset + byteOffset);
  }
  const v = ds.segment.getUint32(ds.byteOffset + byteOffset) ^ defaultMask.getUint16(0, true);
  TMP_WORD.setUint32(0, v, NATIVE_LITTLE_ENDIAN);
  return TMP_WORD.getInt32(0, NATIVE_LITTLE_ENDIAN);
}
function getInt64(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 8, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    const lo = ds.segment.getUint32(ds.byteOffset + byteOffset) ^ defaultMask.getUint32(0, true);
    const hi = ds.segment.getUint32(ds.byteOffset + byteOffset + 4) ^ defaultMask.getUint32(4, true);
    TMP_WORD.setUint32(NATIVE_LITTLE_ENDIAN ? 0 : 4, lo, NATIVE_LITTLE_ENDIAN);
    TMP_WORD.setUint32(NATIVE_LITTLE_ENDIAN ? 4 : 0, hi, NATIVE_LITTLE_ENDIAN);
    return TMP_WORD.getBigInt64(0, NATIVE_LITTLE_ENDIAN);
  }
  return ds.segment.getInt64(ds.byteOffset + byteOffset);
}
function getInt8(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 1, s);
  const ds = getDataSection(s);
  if (defaultMask === void 0) {
    return ds.segment.getInt8(ds.byteOffset + byteOffset);
  }
  const v = ds.segment.getUint8(ds.byteOffset + byteOffset) ^ defaultMask.getUint8(0);
  TMP_WORD.setUint8(0, v);
  return TMP_WORD.getInt8(0);
}
function getList(index, ListClass, s, defaultValue) {
  checkPointerBounds(index, s);
  const ps = getPointerSection(s);
  ps.byteOffset += index * 8;
  const l = new ListClass(ps.segment, ps.byteOffset, s._capnp.depthLimit - 1);
  if (isNull(l)) {
    if (defaultValue) {
      copyFrom(defaultValue, l);
    } else {
      initList$1(ListClass._capnp.size, 0, l, ListClass._capnp.compositeSize);
    }
  } else if (ListClass._capnp.compositeSize !== void 0) {
    const srcSize = getTargetCompositeListSize(l);
    const dstSize = ListClass._capnp.compositeSize;
    if (dstSize.dataByteLength > srcSize.dataByteLength || dstSize.pointerLength > srcSize.pointerLength) {
      const srcContent = getContent(l);
      const srcLength = getTargetListLength(l);
      const dstContent = l.segment.allocate(
        getByteLength(dstSize) * srcLength + 8
      );
      const res = initPointer(dstContent.segment, dstContent.byteOffset, l);
      setListPointer(
        res.offsetWords,
        ListClass._capnp.size,
        srcLength,
        res.pointer,
        dstSize
      );
      setStructPointer(srcLength, dstSize, dstContent);
      dstContent.byteOffset += 8;
      for (let i = 0; i < srcLength; i++) {
        const srcElementOffset = srcContent.byteOffset + i * getByteLength(srcSize);
        const dstElementOffset = dstContent.byteOffset + i * getByteLength(dstSize);
        dstContent.segment.copyWords(
          dstElementOffset,
          srcContent.segment,
          srcElementOffset,
          getWordLength(srcSize)
        );
        for (let j = 0; j < srcSize.pointerLength; j++) {
          const srcPtr = new Pointer(
            srcContent.segment,
            srcElementOffset + srcSize.dataByteLength + j * 8
          );
          const dstPtr = new Pointer(
            dstContent.segment,
            dstElementOffset + dstSize.dataByteLength + j * 8
          );
          const srcPtrTarget = followFars(srcPtr);
          const srcPtrContent = getContent(srcPtr);
          if (getTargetPointerType(srcPtr) === PointerType.LIST && getTargetListElementSize(srcPtr) === ListElementSize.COMPOSITE) {
            srcPtrContent.byteOffset -= 8;
          }
          const r = initPointer(
            srcPtrContent.segment,
            srcPtrContent.byteOffset,
            dstPtr
          );
          const a = srcPtrTarget.segment.getUint8(srcPtrTarget.byteOffset) & 3;
          const b = srcPtrTarget.segment.getUint32(srcPtrTarget.byteOffset + 4);
          r.pointer.segment.setUint32(
            r.pointer.byteOffset,
            a | r.offsetWords << 2
          );
          r.pointer.segment.setUint32(r.pointer.byteOffset + 4, b);
        }
      }
      srcContent.segment.fillZeroWords(
        srcContent.byteOffset,
        getWordLength(srcSize) * srcLength
      );
    }
  }
  return l;
}
function getPointer(index, s) {
  checkPointerBounds(index, s);
  const ps = getPointerSection(s);
  ps.byteOffset += index * 8;
  return new Pointer(ps.segment, ps.byteOffset, s._capnp.depthLimit - 1);
}
function getPointerAs(index, PointerClass, s) {
  checkPointerBounds(index, s);
  const ps = getPointerSection(s);
  ps.byteOffset += index * 8;
  return new PointerClass(ps.segment, ps.byteOffset, s._capnp.depthLimit - 1);
}
function getPointerSection(s) {
  const ps = getContent(s);
  ps.byteOffset += padToWord$1(getSize(s).dataByteLength);
  return ps;
}
function getSize(s) {
  if (s._capnp.compositeIndex !== void 0) {
    const c = getContent(s, true);
    c.byteOffset -= 8;
    return getStructSize(c);
  }
  return getTargetStructSize(s);
}
function getStruct(index, StructClass, s, defaultValue) {
  const t = getPointerAs(index, StructClass, s);
  if (isNull(t)) {
    if (defaultValue) {
      copyFrom(defaultValue, t);
    } else {
      initStruct(StructClass._capnp.size, t);
    }
  } else {
    validate(PointerType.STRUCT, t);
    const ts = getTargetStructSize(t);
    if (ts.dataByteLength < StructClass._capnp.size.dataByteLength || ts.pointerLength < StructClass._capnp.size.pointerLength) {
      resize(StructClass._capnp.size, t);
    }
  }
  return t;
}
function getText(index, s, defaultValue) {
  const t = Text.fromPointer(getPointer(index, s));
  if (isNull(t) && defaultValue) {
    t.set(0, defaultValue);
  }
  return t.get(0);
}
function getUint16(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 2, s);
  const ds = getDataSection(s);
  if (defaultMask === void 0) {
    return ds.segment.getUint16(ds.byteOffset + byteOffset);
  }
  return ds.segment.getUint16(ds.byteOffset + byteOffset) ^ defaultMask.getUint16(0, true);
}
function getUint32(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 4, s);
  const ds = getDataSection(s);
  if (defaultMask === void 0) {
    return ds.segment.getUint32(ds.byteOffset + byteOffset);
  }
  return ds.segment.getUint32(ds.byteOffset + byteOffset) ^ defaultMask.getUint32(0, true);
}
function getUint64(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 8, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    const lo = ds.segment.getUint32(ds.byteOffset + byteOffset) ^ defaultMask.getUint32(0, true);
    const hi = ds.segment.getUint32(ds.byteOffset + byteOffset + 4) ^ defaultMask.getUint32(4, true);
    TMP_WORD.setUint32(NATIVE_LITTLE_ENDIAN ? 0 : 4, lo, NATIVE_LITTLE_ENDIAN);
    TMP_WORD.setUint32(NATIVE_LITTLE_ENDIAN ? 4 : 0, hi, NATIVE_LITTLE_ENDIAN);
    return TMP_WORD.getBigUint64(0, NATIVE_LITTLE_ENDIAN);
  }
  return ds.segment.getUint64(ds.byteOffset + byteOffset);
}
function getUint8(byteOffset, s, defaultMask) {
  checkDataBounds(byteOffset, 1, s);
  const ds = getDataSection(s);
  if (defaultMask === void 0) {
    return ds.segment.getUint8(ds.byteOffset + byteOffset);
  }
  return ds.segment.getUint8(ds.byteOffset + byteOffset) ^ defaultMask.getUint8(0);
}
function initData(index, length, s) {
  checkPointerBounds(index, s);
  const ps = getPointerSection(s);
  ps.byteOffset += index * 8;
  const l = new Data(ps.segment, ps.byteOffset, s._capnp.depthLimit - 1);
  erase(l);
  initList$1(ListElementSize.BYTE, length, l);
  return l;
}
function initList(index, ListClass, length, s) {
  checkPointerBounds(index, s);
  const ps = getPointerSection(s);
  ps.byteOffset += index * 8;
  const l = new ListClass(ps.segment, ps.byteOffset, s._capnp.depthLimit - 1);
  erase(l);
  initList$1(ListClass._capnp.size, length, l, ListClass._capnp.compositeSize);
  return l;
}
function setBit(bitOffset, value, s, defaultMask) {
  const byteOffset = Math.floor(bitOffset / 8);
  const bitMask = 1 << bitOffset % 8;
  checkDataBounds(byteOffset, 1, s);
  const ds = getDataSection(s);
  const b = ds.segment.getUint8(ds.byteOffset + byteOffset);
  if (defaultMask !== void 0) {
    value = (defaultMask.getUint8(0) & bitMask) === 0 ? value : !value;
  }
  ds.segment.setUint8(
    ds.byteOffset + byteOffset,
    value ? b | bitMask : b & ~bitMask
  );
}
function setFloat32(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 4, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    TMP_WORD.setFloat32(0, value, NATIVE_LITTLE_ENDIAN);
    const v = TMP_WORD.getUint32(0, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(0, true);
    ds.segment.setUint32(ds.byteOffset + byteOffset, v);
    return;
  }
  ds.segment.setFloat32(ds.byteOffset + byteOffset, value);
}
function setFloat64(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 8, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    TMP_WORD.setFloat64(0, value, NATIVE_LITTLE_ENDIAN);
    const lo = TMP_WORD.getUint32(0, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(0, true);
    const hi = TMP_WORD.getUint32(4, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(4, true);
    ds.segment.setUint32(ds.byteOffset + byteOffset, lo);
    ds.segment.setUint32(ds.byteOffset + byteOffset + 4, hi);
    return;
  }
  ds.segment.setFloat64(ds.byteOffset + byteOffset, value);
}
function setInt16(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 2, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    TMP_WORD.setInt16(0, value, NATIVE_LITTLE_ENDIAN);
    const v = TMP_WORD.getUint16(0, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint16(0, true);
    ds.segment.setUint16(ds.byteOffset + byteOffset, v);
    return;
  }
  ds.segment.setInt16(ds.byteOffset + byteOffset, value);
}
function setInt32(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 4, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    TMP_WORD.setInt32(0, value, NATIVE_LITTLE_ENDIAN);
    const v = TMP_WORD.getUint32(0, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(0, true);
    ds.segment.setUint32(ds.byteOffset + byteOffset, v);
    return;
  }
  ds.segment.setInt32(ds.byteOffset + byteOffset, value);
}
function setInt64(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 8, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    TMP_WORD.setBigInt64(0, value, NATIVE_LITTLE_ENDIAN);
    const lo = TMP_WORD.getUint32(NATIVE_LITTLE_ENDIAN ? 0 : 4, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(0, true);
    const hi = TMP_WORD.getUint32(NATIVE_LITTLE_ENDIAN ? 4 : 0, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(4, true);
    ds.segment.setUint32(ds.byteOffset + byteOffset, lo);
    ds.segment.setUint32(ds.byteOffset + byteOffset + 4, hi);
    return;
  }
  ds.segment.setInt64(ds.byteOffset + byteOffset, value);
}
function setInt8(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 1, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    TMP_WORD.setInt8(0, value);
    const v = TMP_WORD.getUint8(0) ^ defaultMask.getUint8(0);
    ds.segment.setUint8(ds.byteOffset + byteOffset, v);
    return;
  }
  ds.segment.setInt8(ds.byteOffset + byteOffset, value);
}
function setText(index, value, s) {
  Text.fromPointer(getPointer(index, s)).set(0, value);
}
function setUint16(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 2, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    value ^= defaultMask.getUint16(0, true);
  }
  ds.segment.setUint16(ds.byteOffset + byteOffset, value);
}
function setUint32(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 4, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    value ^= defaultMask.getUint32(0, true);
  }
  ds.segment.setUint32(ds.byteOffset + byteOffset, value);
}
function setUint64(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 8, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    TMP_WORD.setBigUint64(0, value, NATIVE_LITTLE_ENDIAN);
    const lo = TMP_WORD.getUint32(NATIVE_LITTLE_ENDIAN ? 0 : 4, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(0, true);
    const hi = TMP_WORD.getUint32(NATIVE_LITTLE_ENDIAN ? 4 : 0, NATIVE_LITTLE_ENDIAN) ^ defaultMask.getUint32(4, true);
    ds.segment.setUint32(ds.byteOffset + byteOffset, lo);
    ds.segment.setUint32(ds.byteOffset + byteOffset + 4, hi);
    return;
  }
  ds.segment.setUint64(ds.byteOffset + byteOffset, value);
}
function setUint8(byteOffset, value, s, defaultMask) {
  checkDataBounds(byteOffset, 1, s);
  const ds = getDataSection(s);
  if (defaultMask !== void 0) {
    value ^= defaultMask.getUint8(0);
  }
  ds.segment.setUint8(ds.byteOffset + byteOffset, value);
}
function testWhich(name, found, wanted, s) {
  if (found !== wanted) {
    throw new Error(format(PTR_INVALID_UNION_ACCESS, s, name, found, wanted));
  }
}
function checkDataBounds(byteOffset, byteLength, s) {
  const { dataByteLength } = getSize(s);
  if (byteOffset < 0 || byteLength < 0 || byteOffset + byteLength > dataByteLength) {
    throw new Error(
      format(
        PTR_STRUCT_DATA_OUT_OF_BOUNDS,
        s,
        byteLength,
        byteOffset,
        dataByteLength
      )
    );
  }
}

export { Pointer as $, setInt32 as A, getInt64 as B, setInt64 as C, getUint8 as D, setUint8 as E, getFloat32 as F, setFloat32 as G, getFloat64 as H, setFloat64 as I, getData as J, initData as K, List as L, ListElementSize as M, format as N, ObjectSize as O, SEG_NOT_WORD_ALIGNED as P, DEFAULT_BUFFER_SIZE as Q, SEG_ID_OUT_OF_BOUNDS as R, Struct as S, padToWord$1 as T, SEG_GET_NON_ZERO_SINGLE as U, MIN_SINGLE_SEGMENT_GROWTH as V, assertNever as W, MSG_PACK_NOT_WORD_ALIGNED as X, PACK_SPAN_THRESHOLD as Y, MAX_SEGMENT_LENGTH as Z, SEG_SIZE_OVERFLOW as _, adopt as a, setListPointer as a$, NATIVE_LITTLE_ENDIAN as a0, SEG_REPLACEMENT_BUFFER_TOO_SMALL as a1, MSG_SEGMENT_OUT_OF_BOUNDS as a2, dumpBuffer as a3, validate as a4, PointerType as a5, getTargetStructSize as a6, resize as a7, MSG_SEGMENT_TOO_SMALL as a8, initStruct as a9, getCapabilityId as aA, getContent as aB, getDataSection as aC, getFarSegmentId as aD, getInterfaceClientOrNullAt as aE, getInterfacePointer as aF, getListByteLength as aG, getListElementByteLength as aH, getListElementSize as aI, getListLength as aJ, getOffsetWords as aK, getPointerAs as aL, getPointerSection as aM, getPointerType as aN, getSize as aO, getStructDataWords as aP, getStructPointerLength as aQ, getStructSize as aR, getTargetCompositeListSize as aS, getTargetCompositeListTag as aT, getTargetListElementSize as aU, getTargetListLength as aV, initPointer as aW, isDoubleFar as aX, relocateTo as aY, setFarPointer as aZ, setInterfacePointer as a_, DEFAULT_TRAVERSE_LIMIT as aa, MSG_INVALID_FRAME_HEADER as ab, MAX_DEPTH as ac, getTargetPointerType as ad, FixedAnswer as ae, getInterfaceClientOrNull as af, ErrorAnswer as ag, RPC_CALL_QUEUE_FULL as ah, INVARIANT_UNREACHABLE_CODE as ai, RPC_QUEUE_CALL_CANCEL as aj, RPC_NULL_CLIENT as ak, RPC_METHOD_ERROR as al, RPC_METHOD_NOT_IMPLEMENTED as am, pad as an, PointerAllocationResult as ao, add as ap, checkDataBounds as aq, checkPointerBounds as ar, copyFromInterface as as, copyFromList as at, copyFromStruct as au, dump as av, erase as aw, erasePointer as ax, followFar as ay, followFars as az, getUint32 as b, setStructPointer as b0, trackPointerAllocation as b1, Data as b2, Text as b3, ErrorClient as b4, RPC_ZERO_REF as b5, RPC_ERROR as b6, RPC_FULFILL_ALREADY_CALLED as b7, NOT_IMPLEMENTED as b8, RPC_IMPORT_CLOSED as b9, AnyStruct as ba, RPC_QUESTION_ID_REUSED as bb, RPC_NO_MAIN_INTERFACE as bc, RPC_FINISH_UNKNOWN_ANSWER as bd, RPC_RETURN_FOR_UNKNOWN_QUESTION as be, RPC_BAD_TARGET as bf, RPC_UNKNOWN_CAP_DESCRIPTOR as bg, RPC_UNKNOWN_ANSWER_ID as bh, RPC_UNKNOWN_EXPORT_ID as bi, Orphan as bj, clientOrNull as bk, copyFrom as c, disown as d, getUint16 as e, setUint16 as f, getPointer as g, getBit as h, isNull as i, setBit as j, getText as k, setText as l, getList as m, initList as n, getAs as o, getStruct as p, initStructAt as q, getUint64 as r, setUint32 as s, testWhich as t, setUint64 as u, getInt8 as v, setInt8 as w, getInt16 as x, setInt16 as y, getInt32 as z };
