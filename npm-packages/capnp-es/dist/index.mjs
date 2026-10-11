import { S as Struct, O as ObjectSize, ao as PointerAllocationResult, ap as add, a as adopt, aq as checkDataBounds, ar as checkPointerBounds, c as copyFrom, as as copyFromInterface, at as copyFromList, au as copyFromStruct, d as disown, av as dump, aw as erase, ax as erasePointer, ay as followFar, az as followFars, o as getAs, h as getBit, aA as getCapabilityId, aB as getContent, J as getData, aC as getDataSection, aD as getFarSegmentId, F as getFloat32, H as getFloat64, x as getInt16, z as getInt32, B as getInt64, v as getInt8, af as getInterfaceClientOrNull, aE as getInterfaceClientOrNullAt, aF as getInterfacePointer, m as getList, aG as getListByteLength, aH as getListElementByteLength, aI as getListElementSize, aJ as getListLength, aK as getOffsetWords, g as getPointer, aL as getPointerAs, aM as getPointerSection, aN as getPointerType, aO as getSize, p as getStruct, aP as getStructDataWords, aQ as getStructPointerLength, aR as getStructSize, aS as getTargetCompositeListSize, aT as getTargetCompositeListTag, aU as getTargetListElementSize, aV as getTargetListLength, ad as getTargetPointerType, a6 as getTargetStructSize, k as getText, e as getUint16, b as getUint32, r as getUint64, D as getUint8, K as initData, n as initList, aW as initPointer, a9 as initStruct, q as initStructAt, aX as isDoubleFar, i as isNull, aY as relocateTo, a7 as resize, j as setBit, aZ as setFarPointer, G as setFloat32, I as setFloat64, y as setInt16, A as setInt32, C as setInt64, w as setInt8, a_ as setInterfacePointer, a$ as setListPointer, b0 as setStructPointer, l as setText, f as setUint16, s as setUint32, u as setUint64, E as setUint8, t as testWhich, b1 as trackPointerAllocation, a4 as validate, L as List, M as ListElementSize, $ as Pointer, b2 as Data, b3 as Text, b4 as ErrorClient, b5 as RPC_ZERO_REF, N as format, b6 as RPC_ERROR, ai as INVARIANT_UNREACHABLE_CODE, b7 as RPC_FULFILL_ALREADY_CALLED, b8 as NOT_IMPLEMENTED, ag as ErrorAnswer, ah as RPC_CALL_QUEUE_FULL, ak as RPC_NULL_CLIENT, b9 as RPC_IMPORT_CLOSED, ba as AnyStruct, bb as RPC_QUESTION_ID_REUSED, bc as RPC_NO_MAIN_INTERFACE, bd as RPC_FINISH_UNKNOWN_ANSWER, be as RPC_RETURN_FOR_UNKNOWN_QUESTION, bf as RPC_BAD_TARGET, bg as RPC_UNKNOWN_CAP_DESCRIPTOR, bh as RPC_UNKNOWN_ANSWER_ID, bi as RPC_UNKNOWN_EXPORT_ID, ae as FixedAnswer } from './shared/capnp-es.D8zdZmih.mjs';
export { bj as Orphan, a5 as PointerType, bk as clientOrNull } from './shared/capnp-es.D8zdZmih.mjs';
export { C as CompositeList, a as getBitMask, c as getFloat32Mask, d as getFloat64Mask, e as getInt16Mask, f as getInt32Mask, h as getInt64Mask, i as getInt8Mask, g as getUint16Mask, j as getUint32Mask, k as getUint64Mask, b as getUint8Mask } from './shared/capnp-es.CFSf015t.mjs';
import { I as Interface, t as transformPtr, D as Deferred, Q as Queue, c as copyCall, F as Fulfiller, P as Pipeline, M as MethodError, R as Registry, p as placeParams, a as PipelineClient } from './shared/capnp-es.BVG6upt7.mjs';
export { S as Server, i as isDataCall, b as isFuncCall } from './shared/capnp-es.BVG6upt7.mjs';
import { Exception, Message as Message$1, Disembargo_Context_Which, PromisedAnswer_Op, Return, MessageTarget, CapDescriptor, Resolve, Call_SendResultsTo } from './capnp/rpc.mjs';
import { M as Message } from './shared/capnp-es.BlZmb8ia.mjs';
export { r as readRawPointer } from './shared/capnp-es.BlZmb8ia.mjs';

class Void extends Struct {
  static _capnp = {
    displayName: "Void",
    id: "0",
    size: new ObjectSize(0, 0)
  };
}

const utils = {
  __proto__: null,
  PointerAllocationResult: PointerAllocationResult,
  add: add,
  adopt: adopt,
  checkDataBounds: checkDataBounds,
  checkPointerBounds: checkPointerBounds,
  copyFrom: copyFrom,
  copyFromInterface: copyFromInterface,
  copyFromList: copyFromList,
  copyFromStruct: copyFromStruct,
  disown: disown,
  dump: dump,
  erase: erase,
  erasePointer: erasePointer,
  followFar: followFar,
  followFars: followFars,
  getAs: getAs,
  getBit: getBit,
  getCapabilityId: getCapabilityId,
  getContent: getContent,
  getData: getData,
  getDataSection: getDataSection,
  getFarSegmentId: getFarSegmentId,
  getFloat32: getFloat32,
  getFloat64: getFloat64,
  getInt16: getInt16,
  getInt32: getInt32,
  getInt64: getInt64,
  getInt8: getInt8,
  getInterfaceClientOrNull: getInterfaceClientOrNull,
  getInterfaceClientOrNullAt: getInterfaceClientOrNullAt,
  getInterfacePointer: getInterfacePointer,
  getList: getList,
  getListByteLength: getListByteLength,
  getListElementByteLength: getListElementByteLength,
  getListElementSize: getListElementSize,
  getListLength: getListLength,
  getOffsetWords: getOffsetWords,
  getPointer: getPointer,
  getPointerAs: getPointerAs,
  getPointerSection: getPointerSection,
  getPointerType: getPointerType,
  getSize: getSize,
  getStruct: getStruct,
  getStructDataWords: getStructDataWords,
  getStructPointerLength: getStructPointerLength,
  getStructSize: getStructSize,
  getTargetCompositeListSize: getTargetCompositeListSize,
  getTargetCompositeListTag: getTargetCompositeListTag,
  getTargetListElementSize: getTargetListElementSize,
  getTargetListLength: getTargetListLength,
  getTargetPointerType: getTargetPointerType,
  getTargetStructSize: getTargetStructSize,
  getText: getText,
  getUint16: getUint16,
  getUint32: getUint32,
  getUint64: getUint64,
  getUint8: getUint8,
  initData: initData,
  initList: initList,
  initPointer: initPointer,
  initStruct: initStruct,
  initStructAt: initStructAt,
  isDoubleFar: isDoubleFar,
  isNull: isNull,
  relocateTo: relocateTo,
  resize: resize,
  setBit: setBit,
  setFarPointer: setFarPointer,
  setFloat32: setFloat32,
  setFloat64: setFloat64,
  setInt16: setInt16,
  setInt32: setInt32,
  setInt64: setInt64,
  setInt8: setInt8,
  setInterfacePointer: setInterfacePointer,
  setListPointer: setListPointer,
  setStructPointer: setStructPointer,
  setText: setText,
  setUint16: setUint16,
  setUint32: setUint32,
  setUint64: setUint64,
  setUint8: setUint8,
  testWhich: testWhich,
  trackPointerAllocation: trackPointerAllocation,
  validate: validate
};

function PointerList(PointerClass) {
  return class extends List {
    static _capnp = {
      displayName: `List<${PointerClass._capnp.displayName}>`,
      size: ListElementSize.POINTER
    };
    get(index) {
      const c = getContent(this);
      return new PointerClass(
        c.segment,
        c.byteOffset + index * 8,
        this._capnp.depthLimit - 1
      );
    }
    set(index, value) {
      copyFrom(value, this.get(index));
    }
    [Symbol.toStringTag]() {
      return `Pointer_${super.toString()},cls:${PointerClass.toString()}`;
    }
  };
}

const AnyPointerList = PointerList(Pointer);

class BoolList extends List {
  static _capnp = {
    displayName: "List<boolean>",
    size: ListElementSize.BIT
  };
  get(index) {
    const bitMask = 1 << index % 8;
    const byteOffset = index >>> 3;
    const c = getContent(this);
    const v = c.segment.getUint8(c.byteOffset + byteOffset);
    return (v & bitMask) !== 0;
  }
  set(index, value) {
    const bitMask = 1 << index % 8;
    const c = getContent(this);
    const byteOffset = c.byteOffset + (index >>> 3);
    const v = c.segment.getUint8(byteOffset);
    c.segment.setUint8(byteOffset, value ? v | bitMask : v & ~bitMask);
  }
  [Symbol.toStringTag]() {
    return `Bool_${super.toString()}`;
  }
}

const DataList = PointerList(Data);

class Float32List extends List {
  static _capnp = {
    displayName: "List<Float32>",
    size: ListElementSize.BYTE_4
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getFloat32(c.byteOffset + index * 4);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setFloat32(c.byteOffset + index * 4, value);
  }
  [Symbol.toStringTag]() {
    return `Float32_${super.toString()}`;
  }
}

class Float64List extends List {
  static _capnp = {
    displayName: "List<Float64>",
    size: ListElementSize.BYTE_8
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getFloat64(c.byteOffset + index * 8);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setFloat64(c.byteOffset + index * 8, value);
  }
  [Symbol.toStringTag]() {
    return `Float64_${super.toString()}`;
  }
}

class Int8List extends List {
  static _capnp = {
    displayName: "List<Int8>",
    size: ListElementSize.BYTE
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getInt8(c.byteOffset + index);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setInt8(c.byteOffset + index, value);
  }
  [Symbol.toStringTag]() {
    return `Int8_${super.toString()}`;
  }
}

class Int16List extends List {
  static _capnp = {
    displayName: "List<Int16>",
    size: ListElementSize.BYTE_2
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getInt16(c.byteOffset + index * 2);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setInt16(c.byteOffset + index * 2, value);
  }
  [Symbol.toStringTag]() {
    return `Int16_${super.toString()}`;
  }
}

class Int32List extends List {
  static _capnp = {
    displayName: "List<Int32>",
    size: ListElementSize.BYTE_4
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getInt32(c.byteOffset + index * 4);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setInt32(c.byteOffset + index * 4, value);
  }
  [Symbol.toStringTag]() {
    return `Int32_${super.toString()}`;
  }
}

class Int64List extends List {
  static _capnp = {
    displayName: "List<Int64>",
    size: ListElementSize.BYTE_8
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getInt64(c.byteOffset + index * 8);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setInt64(c.byteOffset + index * 8, value);
  }
  [Symbol.toStringTag]() {
    return `Int64_${super.toString()}`;
  }
}

const InterfaceList = PointerList(Interface);

class TextList extends List {
  static _capnp = {
    displayName: "List<Text>",
    size: ListElementSize.POINTER
  };
  get(index) {
    const c = getContent(this);
    c.byteOffset += index * 8;
    return Text.fromPointer(c).get(0);
  }
  set(index, value) {
    const c = getContent(this);
    c.byteOffset += index * 8;
    Text.fromPointer(c).set(0, value);
  }
  [Symbol.toStringTag]() {
    return `Text_${super.toString()}`;
  }
}

class Uint8List extends List {
  static _capnp = {
    displayName: "List<Uint8>",
    size: ListElementSize.BYTE
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getUint8(c.byteOffset + index);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setUint8(c.byteOffset + index, value);
  }
  [Symbol.toStringTag]() {
    return `Uint8_${super.toString()}`;
  }
}

class Uint16List extends List {
  static _capnp = {
    displayName: "List<Uint16>",
    size: ListElementSize.BYTE_2
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getUint16(c.byteOffset + index * 2);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setUint16(c.byteOffset + index * 2, value);
  }
  [Symbol.toStringTag]() {
    return `Uint16_${super.toString()}`;
  }
}

class Uint32List extends List {
  static _capnp = {
    displayName: "List<Uint32>",
    size: ListElementSize.BYTE_4
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getUint32(c.byteOffset + index * 4);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setUint32(c.byteOffset + index * 4, value);
  }
  [Symbol.toStringTag]() {
    return `Uint32_${super.toString()}`;
  }
}

class Uint64List extends List {
  static _capnp = {
    displayName: "List<Uint64>",
    size: ListElementSize.BYTE_8
  };
  get(index) {
    const c = getContent(this);
    return c.segment.getUint64(c.byteOffset + index * 8);
  }
  set(index, value) {
    const c = getContent(this);
    c.segment.setUint64(c.byteOffset + index * 8, value);
  }
  [Symbol.toStringTag]() {
    return `Uint64_${super.toString()}`;
  }
}

const VoidList = PointerList(Void);

function isSameClient(c, d) {
  const norm = (c2) => {
    return c2;
  };
  return norm(c) === norm(d);
}
function clientFromResolution(transform, obj, err) {
  if (err) {
    return new ErrorClient(err);
  }
  if (!obj) {
    return new ErrorClient(new Error(`null obj!`));
  }
  const out = transformPtr(obj, transform);
  return getInterfaceClientOrNull(out);
}

class IDGen {
  i = 0;
  free = [];
  next() {
    return this.free.pop() ?? this.i++;
  }
  remove(i) {
    this.free.push(i);
  }
}

class Ref {
  constructor(rc, finalize) {
    this.rc = rc;
    const closeState = { closed: false };
    this.closeState = closeState;
    finalize(this, () => {
      if (!closeState.closed) {
        closeState.closed = true;
        rc.decref();
      }
    });
  }
  closeState;
  call(cl) {
    return this.rc.call(cl);
  }
  client() {
    return this.rc._client;
  }
  close() {
    if (!this.closeState.closed) {
      this.closeState.closed = true;
      this.rc.decref();
    }
  }
}

class RefCount {
  refs;
  finalize;
  _client;
  constructor(c, _finalize) {
    this._client = c;
    this.finalize = _finalize;
    this.refs = 1;
  }
  // New creates a reference counter and the first client reference.
  static new(c, finalize) {
    const rc = new RefCount(c, finalize);
    const ref = rc.newRef();
    return [rc, ref];
  }
  call(cl) {
    return this._client.call(cl);
  }
  client() {
    return this._client;
  }
  close() {
    this._client.close();
  }
  ref() {
    if (this.refs <= 0) {
      return new ErrorClient(new Error(RPC_ZERO_REF));
    }
    this.refs++;
    return this.newRef();
  }
  newRef() {
    return new Ref(this, this.finalize);
  }
  decref() {
    this.refs--;
    if (this.refs === 0) {
      this._client.close();
    }
  }
}

class RPCError extends Error {
  constructor(exception) {
    super(format(RPC_ERROR, exception.reason));
    this.exception = exception;
  }
}
function toException(exc, err) {
  if (err instanceof RPCError) {
    exc.reason = err.exception.reason;
    exc.type = err.exception.type;
    return;
  }
  exc.reason = err.message;
  exc.type = Exception.Type.FAILED;
}

function newMessage() {
  return new Message().initRoot(Message$1);
}
function newFinishMessage(questionID, release) {
  const m = newMessage();
  const f = m._initFinish();
  f.questionId = questionID;
  f.releaseResultCaps = release;
  return m;
}
function newUnimplementedMessage(m) {
  const n = newMessage();
  n.unimplemented = m;
  return n;
}
function newReturnMessage(id) {
  const m = newMessage();
  const ret = m._initReturn();
  ret.answerId = id;
  return m;
}
function setReturnException(ret, err) {
  const exc = ret._initException();
  toException(exc, err);
  return exc;
}
function newDisembargoMessage(which, id) {
  const m = newMessage();
  const dis = m._initDisembargo();
  const ctx = dis._initContext();
  switch (which) {
    case Disembargo_Context_Which.SENDER_LOOPBACK: {
      ctx.senderLoopback = id;
      break;
    }
    case Disembargo_Context_Which.RECEIVER_LOOPBACK: {
      ctx.receiverLoopback = id;
      break;
    }
    default: {
      throw new Error(INVARIANT_UNREACHABLE_CODE);
    }
  }
  return m;
}

function transformToPromisedAnswer(answer, transform) {
  const opList = answer._initTransform(transform.length);
  for (const [i, op] of transform.entries()) {
    opList.get(i).getPointerField = op.field;
  }
}
function promisedAnswerOpsToTransform(list) {
  const transform = [];
  for (const op of list) {
    switch (op.which()) {
      case PromisedAnswer_Op.GET_POINTER_FIELD: {
        transform.push({
          field: op.getPointerField
        });
        break;
      }
      case PromisedAnswer_Op.NOOP: {
        break;
      }
    }
  }
  return transform;
}

var QuestionState = /* @__PURE__ */ ((QuestionState2) => {
  QuestionState2[QuestionState2["IN_PROGRESS"] = 0] = "IN_PROGRESS";
  QuestionState2[QuestionState2["RESOLVED"] = 1] = "RESOLVED";
  QuestionState2[QuestionState2["CANCELED"] = 2] = "CANCELED";
  return QuestionState2;
})(QuestionState || {});
class Question {
  constructor(conn, id, method) {
    this.conn = conn;
    this.id = id;
    this.method = method;
  }
  paramCaps = [];
  state = 0 /* IN_PROGRESS */;
  obj;
  err;
  derived = [];
  deferred = new Deferred();
  async struct() {
    return await this.deferred.promise;
  }
  // start signals the question has been sent
  start() {
  }
  // fulfill is called to resolve a question successfully.
  // The caller must be holding onto q.conn.mu.
  fulfill(obj) {
    if (this.state !== 0 /* IN_PROGRESS */) {
      throw new Error(RPC_FULFILL_ALREADY_CALLED);
    }
    if (this.method) {
      this.obj = getAs(this.method.ResultsClass, obj);
    } else {
      this.obj = obj;
    }
    this.state = 1 /* RESOLVED */;
    this.deferred.resolve(this.obj);
  }
  // reject is called to resolve a question with failure
  reject(err) {
    if (!err) {
      throw new Error(`Question.reject called with null`);
    }
    if (this.state !== 0 /* IN_PROGRESS */) {
      throw new Error(`Question.reject called more than once`);
    }
    this.err = err;
    this.state = 1 /* RESOLVED */;
    this.deferred.reject(err);
  }
  // cancel is called to resolve a question with cancellation.
  cancel(err) {
    if (this.state === 0 /* IN_PROGRESS */) {
      this.err = err;
      this.state = 2 /* CANCELED */;
      this.deferred.reject(err);
      return true;
    }
    return false;
  }
  pipelineCall(transform, call) {
    if (this.conn.findQuestion(this.id) !== this) {
      if (this.state === 0 /* IN_PROGRESS */) {
        throw new Error(`question popped but not done`);
      }
      const client = clientFromResolution(transform, this.obj, this.err);
      return client.call(call);
    }
    const pipeq = this.conn.newQuestion(call.method);
    const msg = newMessage();
    const msgCall = msg._initCall();
    msgCall.questionId = pipeq.id;
    msgCall.interfaceId = call.method.interfaceId;
    msgCall.methodId = call.method.methodId;
    const target = msgCall._initTarget();
    const a = target._initPromisedAnswer();
    a.questionId = this.id;
    transformToPromisedAnswer(a, transform);
    const payload = msgCall._initParams();
    pipeq.paramCaps = this.conn.fillParams(payload, call);
    this.conn.sendMessage(msg);
    this.addPromise(transform);
    return pipeq;
  }
  addPromise(transform) {
    for (const d of this.derived) {
      if (transformsEqual(transform, d)) {
        return;
      }
    }
    this.derived.push(transform);
  }
  pipelineClose() {
    throw new Error(NOT_IMPLEMENTED);
  }
}
function transformsEqual(t, u) {
  if (t.length !== u.length) {
    return false;
  }
  for (const [i, element_] of t.entries()) {
    if (element_.field !== u[i].field) {
      return false;
    }
  }
  return true;
}

class Qcalls {
  constructor(data) {
    this.data = data;
  }
  static copyOf(data) {
    return new Qcalls([...data]);
  }
  len() {
    return this.data.length;
  }
  clear(i) {
    this.data[i] = null;
  }
  copy() {
    return Qcalls.copyOf(this.data);
  }
}

function joinAnswer(fl, answer) {
  answer.struct().then((obj) => {
    fl.fulfill(obj);
  }).catch((error_) => {
    fl.reject(error_);
  });
}

const callQueueSize = 64;
class QueueClient {
  constructor(conn, client, calls) {
    this.conn = conn;
    this._client = client;
    this.calls = Qcalls.copyOf(calls);
    this.q = new Queue(this.calls, callQueueSize);
  }
  _client;
  calls;
  q;
  pushCall(call) {
    const f = new Fulfiller();
    try {
      call = copyCall(call);
    } catch (error_) {
      return new ErrorAnswer(error_);
    }
    const i = this.q.push();
    if (i === -1) {
      return new ErrorAnswer(new Error(RPC_CALL_QUEUE_FULL));
    }
    this.calls.data[i] = {
      call,
      f
    };
    return f;
  }
  pushEmbargo(id, tgt) {
    const i = this.q.push();
    if (i === -1) {
      throw new Error(RPC_CALL_QUEUE_FULL);
    }
    this.calls.data[i] = {
      embargoID: id,
      embargoTarget: tgt
    };
  }
  flushQueue() {
    let c = null;
    {
      const i = this.q.front();
      if (i !== -1) {
        c = this.calls.data[i];
      }
    }
    while (c) {
      this.handle(c);
      this.q.pop();
      {
        const i = this.q.front();
        c = i === -1 ? null : this.calls.data[i];
      }
    }
  }
  handle(c) {
    if (!c) {
      return;
    }
    if (isRemoteCall(c)) {
      const answer = this._client.call(c.call);
      joinAnswer(c.a, answer);
    } else if (isLocalCall(c)) {
      const answer = this._client.call(c.call);
      joinAnswer(c.f, answer);
    } else if (isDisembargo(c)) {
      const msg = newDisembargoMessage(
        Disembargo_Context_Which.RECEIVER_LOOPBACK,
        c.embargoID
      );
      msg.disembargo.target = c.embargoTarget;
      this.conn.sendMessage(msg);
    }
  }
  isPassthrough() {
    return this.q.len() === 0;
  }
  call(call) {
    if (this.isPassthrough()) {
      return this._client.call(call);
    }
    return this.pushCall(call);
  }
  // close releases any resources associated with this client.
  // No further calls to the client should be made after calling Close.
  close() {
  }
}

class AnswerEntry {
  id;
  conn;
  resultCaps = [];
  done = false;
  obj;
  err;
  deferred = new Deferred();
  queue = [];
  constructor(conn, id) {
    this.conn = conn;
    this.id = id;
  }
  // fulfill is called to resolve an answer successfully.
  fulfill(obj) {
    if (this.done) {
      throw new Error(`answer.fulfill called more than once`);
    }
    this.done = true;
    this.obj = obj;
    const retmsg = newReturnMessage(this.id);
    const ret = retmsg.return;
    let firstErr;
    try {
      if (this.resultsToYourself) {
        // WeKan fork: tail call. The peer sent this call with
        // sendResultsTo.yourself - it forwarded one of OUR calls back to us -
        // so the results stay here, for the Return.takeFromOtherQuestion it
        // sends for our original question.
        ret.resultsSentElsewhere = true;
      } else {
        const payload = ret._initResults();
        payload.content = obj;
        this.resultCaps = this.conn.makeCapTable(ret.segment, (len) => payload._initCapTable(len));
      }
      this.deferred.resolve(obj);
      this.conn.sendMessage(retmsg);
    } catch (error_) {
      if (!firstErr) {
        firstErr = error_;
      }
    }
    const [queues, queuesErr] = this.emptyQueue(obj);
    if (queuesErr && !firstErr) {
      firstErr = queuesErr;
    }
    const objcap = obj.segment.message._capnp;
    if (!objcap.capTable) {
      objcap.capTable = [];
    }
    for (const capIdxStr of Object.keys(queues)) {
      const capIdx = Number(capIdxStr);
      const q = queues[capIdx];
      if (objcap.capTable === null) throw new Error(INVARIANT_UNREACHABLE_CODE);
      objcap.capTable[capIdx] = new QueueClient(
        this.conn,
        objcap.capTable[capIdx],
        q
      );
    }
    if (firstErr) {
      throw firstErr;
    }
  }
  // reject is called to resolve an answer with failure.
  reject(err) {
    if (!err) {
      throw new Error(`answer.reject called with nil`);
    }
    if (this.done) {
      throw new Error(`answer.reject claled more than once`);
    }
    const m = newReturnMessage(this.id);
    const mret = m.return;
    setReturnException(mret, err);
    this.err = err;
    this.done = true;
    this.deferred.reject(err);
    let firstErr;
    try {
      this.conn.sendMessage(m);
    } catch (error_) {
      firstErr = error_;
    }
    for (let i = 0; i < this.queue.length; i++) {
      const qa = this.queue[i];
      try {
        if (qa.qcall && isRemoteCall(qa.qcall)) {
          qa.qcall.a.reject(err);
        }
      } catch (error_) {
        if (!firstErr) {
          firstErr = error_;
        }
      }
    }
    this.queue = [];
    if (firstErr) {
      throw firstErr;
    }
  }
  // emptyQueue splits the queue by which capability it targets
  // and drops any invalid calls. Once this function returns,
  // this.queue will be empty.
  emptyQueue(obj) {
    let firstErr;
    const qs = {};
    for (let i = 0; i < this.queue.length; i++) {
      const pc = this.queue[i];
      if (!isRemoteCall(pc.qcall)) {
        continue;
      }
      if (!pc.qcall.a) {
        continue;
      }
      let c;
      try {
        c = transformPtr(obj, pc.transform);
      } catch (error_) {
        try {
          pc.qcall.a.reject(error_);
        } catch (error_2) {
          if (!firstErr) {
            firstErr = error_2;
          }
        }
        continue;
      }
      const ci = Interface.fromPointer(c);
      if (!ci) {
        try {
          pc.qcall.a.reject(new Error(RPC_NULL_CLIENT));
        } catch (error_) {
          if (!firstErr) {
            firstErr = error_;
          }
        }
        continue;
      }
      const cn = ci.getCapId();
      if (!qs[cn]) {
        qs[cn] = [];
      }
      qs[cn].push(pc.qcall);
    }
    this.queue = [];
    return [qs, firstErr];
  }
  queueCall(call, transform, a) {
    if (this.queue.length >= callQueueSize) {
      throw new Error(RPC_CALL_QUEUE_FULL);
    }
    const qcall = {
      a,
      call: copyCall(call)
    };
    const pcall = {
      qcall,
      transform
    };
    this.queue.push(pcall);
  }
}
function isRemoteCall(a) {
  return !!a.a;
}
function isLocalCall(a) {
  return !!a.f;
}
function isDisembargo(a) {
  return !!a.embargoTarget;
}

// WeKan fork: ErrorClient.close() throws its error by design. A resolution is
// closed from ImportClient.close(), which can run in a FinalizationRegistry
// callback, where a throw is an uncaught exception that ends the process.
function closeQuietly(client) {
  try {
    client?.close?.();
  } catch {
  }
}
class ImportClient {
  constructor(conn, id) {
    this.conn = conn;
    this.id = id;
  }
  closed = false;
  // WeKan fork: Resolve support. A senderPromise import is redirected to the
  // capability the peer resolves it to. `callsSent` records whether any call
  // went through the promise itself, which decides whether a local resolution
  // needs an embargo (see resolve()).
  resolution = null;
  embargo = null;
  callsSent = false;
  call(cl) {
    if (this.resolution) {
      if (this.embargo) {
        const f = new Fulfiller();
        this.embargo.queue.push({ cl, f });
        return f;
      }
      return this.resolution.call(cl);
    }
    if (this.closed) {
      return new ErrorAnswer(new Error(RPC_IMPORT_CLOSED));
    }
    const q = this.conn.newQuestion(cl.method);
    const msg = newMessage();
    const msgCall = msg._initCall();
    msgCall.questionId = q.id;
    msgCall.interfaceId = cl.method.interfaceId;
    msgCall.methodId = cl.method.methodId;
    const target = msgCall._initTarget();
    target.importedCap = this.id;
    const payload = msgCall._initParams();
    q.paramCaps = this.conn.fillParams(payload, cl);
    this.conn.sendMessage(msg);
    this.callsSent = true;
    return q;
  }
  // WeKan fork: Resolve support. Mirrors the C++ PromiseClient::resolve: a
  // resolution still hosted by the peer takes calls directly, because the peer
  // forwards calls already sent to the promise ahead of them. A resolution
  // hosted HERE, after calls went through the promise, could overtake those
  // calls - so new calls are held until a senderLoopback Disembargo has
  // travelled through the peer and back.
  resolve(client) {
    if (this.resolution || this.closed) {
      closeQuietly(client);
      return;
    }
    this.resolution = client;
    if (this.callsSent && !(client instanceof ErrorClient) && !this.conn.isPeerHosted(client)) {
      const embargoId = this.conn.embargoID.next();
      this.embargo = { id: embargoId, queue: [] };
      this.conn.embargoes[embargoId] = this;
      const msg = newDisembargoMessage(Disembargo_Context_Which.SENDER_LOOPBACK, embargoId);
      msg.disembargo._initTarget().importedCap = this.id;
      this.conn.sendMessage(msg);
    }
  }
  liftEmbargo() {
    const embargo = this.embargo;
    if (!embargo) {
      return;
    }
    this.embargo = null;
    for (const { cl, f } of embargo.queue) {
      joinAnswer(f, this.resolution ? this.resolution.call(cl) : new ErrorAnswer(new Error(RPC_IMPORT_CLOSED)));
    }
  }
  // WeKan fork: Release support. Upstream left this empty, so no import was
  // ever released and the peer kept every capability it had sent. The last
  // local reference closing tells the peer, with the exact number of times it
  // sent this ID.
  close() {
    if (this.closed) {
      return;
    }
    this.closed = true;
    const resolution = this.resolution;
    this.resolution = null;
    if (this.embargo) {
      const embargo = this.embargo;
      this.embargo = null;
      delete this.conn.embargoes[embargo.id];
      this.conn.embargoID.remove(embargo.id);
      for (const { f } of embargo.queue) {
        f.reject(new Error(RPC_IMPORT_CLOSED));
      }
    }
    this.conn.releaseImport(this.id);
    closeQuietly(resolution);
  }
}

class LocalAnswerClient {
  constructor(a, transform) {
    this.a = a;
    this.transform = transform;
  }
  call(call) {
    if (this.a.done) {
      return clientFromResolution(this.transform, this.a.obj, this.a.err).call(
        call
      );
    }
    return new Fulfiller();
  }
  close() {
    throw new Error(NOT_IMPLEMENTED);
  }
}

const ConnWeakRefRegistry = globalThis.FinalizationRegistry ? new FinalizationRegistry((cb) => cb()) : void 0;
const ConDefaultFinalize = (obj, finalizer) => {
  ConnWeakRefRegistry?.register(obj, finalizer);
};
class Conn {
  /**
   * Create a new connection
   * @param transport The transport used to receive/send messages.
   * @param finalize Weak reference implementation. Compatible with
   * the 'weak' module on node.js (just add weak as a dependency and pass
   * require("weak")), but alternative implementations can be provided for
   * other platforms like Electron. Defaults to using FinalizationRegistry if
   * available.
   * @returns A new connection.
   */
  constructor(transport, finalize = ConDefaultFinalize) {
    this.transport = transport;
    this.finalize = finalize;
    this.startWork();
  }
  questionID = new IDGen();
  questions = [];
  answers = {};
  exportID = new IDGen();
  exports = [];
  imports = {};
  // WeKan fork: Resolve support - promise imports waiting for a Disembargo echo.
  embargoID = new IDGen();
  embargoes = {};
  onError;
  main;
  working = false;
  bootstrap(InterfaceClass) {
    const q = this.newQuestion();
    const msg = newMessage();
    const boot = msg._initBootstrap();
    boot.questionId = q.id;
    this.sendMessage(msg);
    return new InterfaceClass.Client(new Pipeline(AnyStruct, q).client());
  }
  initMain(InterfaceClass, target) {
    this.main = new InterfaceClass.Server(target);
    this.addExport(this.main);
  }
  startWork() {
    this.work().catch((error_) => {
      if (this.onError) {
        this.onError(error_);
      } else if (error_ !== void 0) {
        throw error_;
      }
    });
  }
  sendReturnException(id, err) {
    const m = newReturnMessage(id);
    setReturnException(m.return, err);
    this.sendMessage(m);
  }
  handleBootstrapMessage(m) {
    const boot = m.bootstrap;
    const id = boot.questionId;
    const ret = newReturnMessage(id);
    ret.return.releaseParamCaps = false;
    const a = this.insertAnswer(id);
    if (a === null) {
      return this.sendReturnException(id, new Error(RPC_QUESTION_ID_REUSED));
    }
    if (this.main === void 0) {
      return a.reject(new Error(RPC_NO_MAIN_INTERFACE));
    }
    const msg = new Message();
    const capId = msg.addCap(this.main);
    const root = new Interface(msg.getSegment(0), 0);
    // WeKan fork: upstream added the cap but never pointed the root at it, so
    // the Return carried a null pointer and an empty cap table.
    setInterfacePointer(capId, root);
    a.fulfill(root);
  }
  handleFinishMessage(m) {
    const { finish } = m;
    const id = finish.questionId;
    const a = this.popAnswer(id);
    if (a === null) {
      throw new Error(format(RPC_FINISH_UNKNOWN_ANSWER, id));
    }
    if (finish.releaseResultCaps) {
      // WeKan fork: Release support. Upstream passed the loop INDEX as the
      // export ID and never filled resultCaps, so nothing was released.
      for (const id of a.resultCaps) {
        this.releaseExport(id, 1);
      }
    }
  }
  handleMessage(m) {
    switch (m.which()) {
      case Message$1.UNIMPLEMENTED: {
        this.handleUnimplementedMessage(m);
        break;
      }
      case Message$1.BOOTSTRAP: {
        this.handleBootstrapMessage(m);
        break;
      }
      case Message$1.ABORT: {
        this.shutdown(new RPCError(m.abort));
        break;
      }
      case Message$1.FINISH: {
        this.handleFinishMessage(m);
        break;
      }
      case Message$1.RETURN: {
        this.handleReturnMessage(m);
        break;
      }
      case Message$1.CALL: {
        this.handleCallMessage(m);
        break;
      }
      // WeKan fork: the rest were dropped silently upstream.
      case Message$1.RESOLVE: {
        this.handleResolveMessage(m);
        break;
      }
      case Message$1.RELEASE: {
        const rel = m.release;
        this.releaseExport(rel.id, rel.referenceCount);
        break;
      }
      case Message$1.DISEMBARGO: {
        this.handleDisembargoMessage(m);
        break;
      }
      default: {
        // The protocol requires an Unimplemented echo for anything the
        // receiver does not handle, so the peer can clean up after it.
        this.sendMessage(newUnimplementedMessage(m));
        break;
      }
    }
  }
  handleUnimplementedMessage(m) {
    const um = m.unimplemented;
    switch (um.which()) {
      case Message$1.CALL: {
        this.popQuestion(um.call.questionId)?.reject(new Error("peer does not implement this call"));
        break;
      }
      case Message$1.BOOTSTRAP: {
        this.popQuestion(um.bootstrap.questionId)?.reject(new Error("peer does not implement bootstrap"));
        break;
      }
      default: {
        // Finish, Release and Disembargo need no recovery; this Conn never
        // sends Resolve (its exports are always settled).
        break;
      }
    }
  }
  // WeKan fork: Resolve support.
  handleResolveMessage(m) {
    const res = m.resolve;
    const id = res.promiseId;
    let client;
    try {
      client = res.which() === Resolve.EXCEPTION ? new ErrorClient(new RPCError(res.exception)) : this.clientForDescriptor(res.cap);
    } catch (error_) {
      client = new ErrorClient(error_);
    }
    const entry = this.imports[id];
    if (!entry) {
      // Already released: the reference the resolution carries is ours to drop.
      closeQuietly(client);
      return;
    }
    entry.rc._client.resolve(client || new ErrorClient(new Error(RPC_NULL_CLIENT)));
  }
  // WeKan fork: Resolve support.
  handleDisembargoMessage(m) {
    const dis = m.disembargo;
    const ctx = dis.context;
    switch (ctx.which()) {
      case Disembargo_Context_Which.RECEIVER_LOOPBACK: {
        const id = ctx.receiverLoopback;
        const importClient = this.embargoes[id];
        if (!importClient) {
          this.error(`warning: Disembargo for unknown embargo ${id}`);
          return;
        }
        delete this.embargoes[id];
        this.embargoID.remove(id);
        importClient.liftEmbargo();
        break;
      }
      case Disembargo_Context_Which.SENDER_LOOPBACK: {
        // The peer's promise - an answer of ours, or an export - resolved to a
        // capability the peer hosts. Calls are delivered in order as they
        // arrive, so everything sent before this Disembargo has been
        // delivered: echo it straight back, aimed at that capability.
        const target = this.resolveTargetClient(dis.target);
        const peerCap = target instanceof Ref ? target.client() : target;
        if (!(peerCap instanceof ImportClient) || peerCap.conn !== this) {
          this.sendMessage(newUnimplementedMessage(m));
          return;
        }
        const msg = newDisembargoMessage(Disembargo_Context_Which.RECEIVER_LOOPBACK, ctx.senderLoopback);
        msg.disembargo._initTarget().importedCap = peerCap.id;
        this.sendMessage(msg);
        break;
      }
      default: {
        this.sendMessage(newUnimplementedMessage(m));
      }
    }
  }
  resolveTargetClient(mt) {
    switch (mt.which()) {
      case MessageTarget.IMPORTED_CAP: {
        const e = this.findExport(mt.importedCap);
        return e ? e.client : null;
      }
      case MessageTarget.PROMISED_ANSWER: {
        const pa = mt.promisedAnswer;
        const a = this.answers[pa.questionId];
        if (!a || !a.done) {
          return null;
        }
        return clientFromResolution(promisedAnswerOpsToTransform(pa.transform), a.obj, a.err);
      }
      default: {
        return null;
      }
    }
  }
  // Whether a client is a capability hosted by the peer on this connection.
  isPeerHosted(client) {
    const c = client instanceof Ref ? client.client() : client;
    return c instanceof ImportClient && c.conn === this;
  }
  releaseImport(id) {
    const entry = this.imports[id];
    if (!entry) {
      return;
    }
    delete this.imports[id];
    if (this.transport.closed) {
      return;
    }
    const msg = newMessage();
    const rel = msg._initRelease();
    rel.id = id;
    rel.referenceCount = entry.refs;
    this.sendMessage(msg);
  }
  handleReturnMessage(m) {
    const ret = m.return;
    const id = ret.answerId;
    const q = this.popQuestion(id);
    if (!q) {
      throw new Error(format(RPC_RETURN_FOR_UNKNOWN_QUESTION, id));
    }
    if (ret.releaseParamCaps) {
      // WeKan fork: upstream released the QUESTION id once per cap.
      for (const exportId of q.paramCaps) {
        this.releaseExport(exportId, 1);
      }
    }
    let releaseResultCaps = true;
    switch (ret.which()) {
      case Return.RESULTS: {
        releaseResultCaps = false;
        const { results } = ret;
        this.populateMessageCapTable(results);
        const { content } = results;
        q.fulfill(content);
        break;
      }
      case Return.EXCEPTION: {
        const exc = ret.exception;
        const err = q.method ? new MethodError(q.method, exc.reason) : new RPCError(exc);
        q.reject(err);
        break;
      }
      // WeKan fork: upstream ignored these, which left the question pending
      // forever. TAKE_FROM_OTHER_QUESTION is how a C++ peer answers a call it
      // forwarded back to us as a tail call - every call made on a promise
      // that turns out to resolve to one of our own capabilities.
      case Return.TAKE_FROM_OTHER_QUESTION: {
        const a = this.answers[ret.takeFromOtherQuestion];
        if (!a) {
          q.reject(new Error(format(RPC_UNKNOWN_ANSWER_ID, ret.takeFromOtherQuestion)));
          break;
        }
        a.deferred.promise.then((obj) => q.fulfill(obj), (error_) => q.reject(error_));
        break;
      }
      case Return.CANCELED: {
        q.reject(new Error("call canceled by the peer"));
        break;
      }
      default: {
        // RESULTS_SENT_ELSEWHERE (never requested here) and
        // ACCEPT_FROM_THIRD_PARTY (Level 3).
        q.reject(new Error(`unsupported Return (${ret.which()})`));
        break;
      }
    }
    // WeKan fork: noFinishNeeded means the peer has already forgotten this
    // answer; a Finish for it would be a protocol error there.
    if (!ret.noFinishNeeded) {
      const fin = newFinishMessage(id, releaseResultCaps);
      this.sendMessage(fin);
    }
  }
  handleCallMessage(m) {
    const mcall = m.call;
    const mt = mcall.target;
    if (mt.which() !== MessageTarget.IMPORTED_CAP && mt.which() !== MessageTarget.PROMISED_ANSWER) {
      const um = newUnimplementedMessage(m);
      this.sendMessage(um);
      return;
    }
    const mparams = mcall.params;
    try {
      this.populateMessageCapTable(mparams);
    } catch {
      const um = newUnimplementedMessage(m);
      this.sendMessage(um);
      return;
    }
    // WeKan fork: tail calls. `yourself` keeps the results here (see
    // AnswerEntry.fulfill); a third-party destination is Level 3, which this
    // implementation does not speak.
    const sendTo = mcall.sendResultsTo.which();
    if (sendTo === Call_SendResultsTo.THIRD_PARTY) {
      this.sendMessage(newUnimplementedMessage(m));
      return;
    }
    const id = mcall.questionId;
    const a = this.insertAnswer(id);
    if (!a) {
      throw new Error(format(RPC_QUESTION_ID_REUSED, id));
    }
    a.resultsToYourself = sendTo === Call_SendResultsTo.YOURSELF;
    const interfaceDef = Registry.lookup(mcall.interfaceId);
    if (!interfaceDef) {
      const um = newUnimplementedMessage(m);
      this.sendMessage(um);
      return;
    }
    const method = interfaceDef.methods[mcall.methodId];
    if (!method) {
      const um = newUnimplementedMessage(m);
      this.sendMessage(um);
      return;
    }
    const paramContent = mparams.content;
    const call = {
      method,
      params: getAs(method.ParamsClass, paramContent)
    };
    try {
      this.routeCallMessage(a, mt, call);
    } catch (error_) {
      a.reject(error_);
    }
  }
  routeCallMessage(result, mt, cl) {
    switch (mt.which()) {
      case MessageTarget.IMPORTED_CAP: {
        const id = mt.importedCap;
        const e = this.findExport(id);
        if (!e) {
          throw new Error(RPC_BAD_TARGET);
        }
        const answer = this.call(e.client, cl);
        joinAnswer(result, answer);
        break;
      }
      case MessageTarget.PROMISED_ANSWER: {
        const mpromise = mt.promisedAnswer;
        const id = mpromise.questionId;
        if (id === result.id) {
          throw new Error(RPC_BAD_TARGET);
        }
        const pa = this.answers[id];
        if (!pa) {
          throw new Error(RPC_BAD_TARGET);
        }
        const mtrans = mpromise.transform;
        const transform = promisedAnswerOpsToTransform(mtrans);
        if (pa.done) {
          const { obj, err } = pa;
          const client = clientFromResolution(transform, obj, err);
          const answer = this.call(client, cl);
          joinAnswer(result, answer);
        } else {
          pa.queueCall(cl, transform, result);
        }
        break;
      }
      default: {
        throw new Error(INVARIANT_UNREACHABLE_CODE);
      }
    }
  }
  populateMessageCapTable(payload) {
    const msg = payload.segment.message;
    const ctab = payload.capTable;
    for (const desc of ctab) {
      msg.addCap(this.clientForDescriptor(desc));
    }
  }
  // The client a CapDescriptor names (WeKan fork: shared by payloads and Resolve).
  clientForDescriptor(desc) {
    switch (desc.which()) {
      case CapDescriptor.NONE: {
        return null;
      }
      case CapDescriptor.SENDER_HOSTED: {
        return this.addImport(desc.senderHosted);
      }
      case CapDescriptor.SENDER_PROMISE: {
        return this.addImport(desc.senderPromise);
      }
      case CapDescriptor.RECEIVER_HOSTED: {
        const id = desc.receiverHosted;
        const e = this.findExport(id);
        if (!e) {
          throw new Error(format(RPC_UNKNOWN_EXPORT_ID, id));
        }
        return e.rc.ref();
      }
      case CapDescriptor.RECEIVER_ANSWER: {
        const recvAns = desc.receiverAnswer;
        const id = recvAns.questionId;
        const a = this.answers[id];
        if (!a) {
          throw new Error(format(RPC_UNKNOWN_ANSWER_ID, id));
        }
        const transform = promisedAnswerOpsToTransform(recvAns.transform);
        return answerPipelineClient(a, transform);
      }
      default: {
        throw new Error(format(RPC_UNKNOWN_CAP_DESCRIPTOR, desc.which()));
      }
    }
  }
  addImport(id) {
    const importEntry = this.imports[id];
    if (importEntry && !importEntry.rc._client.closed) {
      importEntry.refs++;
      return importEntry.rc.ref();
    }
    const client = new ImportClient(this, id);
    const [rc, ref] = RefCount.new(client, this.finalize);
    this.imports[id] = {
      rc,
      refs: 1
    };
    return ref;
  }
  findExport(id) {
    if (id >= this.exports.length) {
      return null;
    }
    return this.exports[id];
  }
  addExport(client) {
    for (let i = 0; i < this.exports.length; i++) {
      const e = this.exports[i];
      if (e && isSameClient(e.rc._client, client)) {
        e.wireRefs++;
        return i;
      }
    }
    const id = this.exportID.next();
    const [rc, ref] = RefCount.new(client, this.finalize);
    const _export = {
      client: ref,
      id,
      rc,
      wireRefs: 1
    };
    if (id === this.exports.length) {
      this.exports.push(_export);
    } else {
      this.exports[id] = _export;
    }
    return id;
  }
  releaseExport(id, refs) {
    const e = this.findExport(id);
    if (!e) {
      return;
    }
    e.wireRefs -= refs;
    if (e.wireRefs > 0) {
      return;
    }
    if (e.wireRefs < 0) {
      this.error(`warning: export ${id} has negative refcount (${e.wireRefs})`);
    }
    e.client.close();
    this.exports[id] = null;
    this.exportID.remove(id);
  }
  error(s) {
    console.error(s);
  }
  newQuestion(method) {
    const id = this.questionID.next();
    const q = new Question(this, id, method);
    if (id === this.questions.length) {
      this.questions.push(q);
    } else {
      this.questions[id] = q;
    }
    return q;
  }
  findQuestion(id) {
    if (id > this.questions.length) {
      return null;
    }
    return this.questions[id];
  }
  popQuestion(id) {
    const q = this.findQuestion(id);
    if (!q) {
      return q;
    }
    this.questions[id] = null;
    this.questionID.remove(id);
    return q;
  }
  // TODO: cancel context?
  insertAnswer(id) {
    if (this.answers[id]) {
      return null;
    }
    const a = new AnswerEntry(this, id);
    this.answers[id] = a;
    return a;
  }
  popAnswer(id) {
    const a = this.answers[id];
    delete this.answers[id];
    return a;
  }
  shutdown(_err) {
    this.transport.close();
    // WeKan fork: nothing will answer them now.
    const err = _err || new Error(RPC_IMPORT_CLOSED);
    for (const q of this.questions) {
      if (q && q.state === QuestionState.IN_PROGRESS) {
        q.reject(err);
      }
    }
  }
  call(client, call) {
    return client.call(call);
  }
  fillParams(payload, cl) {
    const params = placeParams(cl, payload.content);
    payload.content = params;
    // WeKan fork: the exported IDs, so Return.releaseParamCaps can release them.
    return this.makeCapTable(
      payload.segment,
      (length) => payload._initCapTable(length)
    );
  }
  makeCapTable(s, init) {
    const msgtab = s.message._capnp.capTable;
    if (!msgtab) {
      return [];
    }
    const t = init(msgtab.length);
    const exported = [];
    for (const [i, client] of msgtab.entries()) {
      const desc = t.get(i);
      if (!client) {
        desc.none = true;
        continue;
      }
      const id = this.descriptorForClient(desc, client);
      if (id !== void 0) {
        exported.push(id);
      }
    }
    return exported;
  }
  // descriptorForClient fills desc for client, adding it to the export
  // table if necessary.  The caller must be holding onto c.mu.
  descriptorForClient(desc, _client) {
    {
      dig: for (let client = _client; ; ) {
        if (client instanceof ImportClient) {
          if (client.conn !== this) {
            break dig;
          }
          desc.receiverHosted = client.id;
          return;
        } else if (client instanceof Ref) {
          client = client.client();
        } else if (client instanceof PipelineClient) {
          const p = client.pipeline;
          const ans = p.answer;
          const transform = p.transform();
          if (ans instanceof FixedAnswer) {
            let s;
            let err;
            try {
              s = ans.structSync();
            } catch (error_) {
              err = error_;
            }
            client = clientFromResolution(transform, s, err);
          } else if (ans instanceof Question) {
            if (ans.state !== QuestionState.IN_PROGRESS) {
              client = clientFromResolution(transform, ans.obj, ans.err);
              continue;
            }
            if (ans.conn !== this) {
              break dig;
            }
            const a = desc._initReceiverAnswer();
            a.questionId = ans.id;
            transformToPromisedAnswer(a, p.transform());
            return;
          } else {
            break dig;
          }
        } else {
          break dig;
        }
      }
    }
    const id = this.addExport(_client);
    desc.senderHosted = id;
    return id;
  }
  sendMessage(msg) {
    this.transport.sendMessage(msg);
  }
  async work() {
    this.working = true;
    while (this.working) {
      try {
        const m = await this.transport.recvMessage();
        this.handleMessage(m);
      } catch (error_) {
        if (error_ !== void 0) {
          throw error_;
        }
        this.working = false;
      }
    }
  }
}
function answerPipelineClient(a, transform) {
  return new LocalAnswerClient(a, transform);
}

class DeferredTransport {
  // WeKan fork: messages are QUEUED. Upstream kept a single Deferred, so a
  // second message arriving before work() asked for the next one replaced
  // the first, and a call to recvMessage() rejected the one still pending.
  d;
  queue = [];
  closed = false;
  error;
  close() {
    this.closed = true;
    const d = this.d;
    this.d = void 0;
    d?.reject(this.error);
  }
  recvMessage() {
    if (this.queue.length > 0) {
      return Promise.resolve(this.queue.shift());
    }
    if (this.closed) {
      return Promise.reject(this.error);
    }
    this.d = new Deferred();
    return this.d.promise;
  }
  reject = (err) => {
    this.error = err;
    this.close();
  };
  resolve = (buf) => {
    let m;
    try {
      m = new Message(buf, false).getRoot(Message$1);
    } catch (error_) {
      this.reject(error_);
      return;
    }
    const d = this.d;
    if (d) {
      this.d = void 0;
      d.resolve(m);
    } else {
      this.queue.push(m);
    }
  };
}

export { AnyPointerList, BoolList, Conn, Data, DataList, Deferred, DeferredTransport, ErrorClient, Float32List, Float64List, Int16List, Int32List, Int64List, Int8List, Interface, InterfaceList, List, ListElementSize, Message, ObjectSize, Pipeline, Pointer, PointerList, Registry, Struct, Text, TextList, Uint16List, Uint32List, Uint64List, Uint8List, Void, VoidList, answerPipelineClient, clientFromResolution, copyCall, isSameClient, placeParams, utils };
