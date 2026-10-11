import { $ as Pointer, ac as MAX_DEPTH, N as format, a5 as PointerType, ad as getTargetPointerType, a9 as initStruct, S as Struct, g as getPointer, ae as FixedAnswer, af as getInterfaceClientOrNull, ag as ErrorAnswer, ah as RPC_CALL_QUEUE_FULL, ai as INVARIANT_UNREACHABLE_CODE, aj as RPC_QUEUE_CALL_CANCEL, ak as RPC_NULL_CLIENT, c as copyFrom, o as getAs, al as RPC_METHOD_ERROR, am as RPC_METHOD_NOT_IMPLEMENTED } from './capnp-es.D8zdZmih.mjs';
import { M as Message } from './capnp-es.BlZmb8ia.mjs';

class Interface extends Pointer {
  static _capnp = {
    displayName: "Interface"
  };
  static getCapID = getCapID;
  static getAsInterface = getAsInterface;
  static isInterface = isInterface;
  static getClient = getClient;
  constructor(segment, byteOffset, depthLimit = MAX_DEPTH) {
    super(segment, byteOffset, depthLimit);
  }
  static fromPointer(p) {
    return getAsInterface(p);
  }
  getCapId() {
    return getCapID(this);
  }
  getClient() {
    return getClient(this);
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return format(
      "Interface_%d@%a,%d,limit:%x",
      this.segment.id,
      this.byteOffset,
      this.getCapId(),
      this._capnp.depthLimit
    );
  }
}
function getAsInterface(p) {
  if (getTargetPointerType(p) === PointerType.OTHER) {
    return new Interface(p.segment, p.byteOffset, p._capnp.depthLimit);
  }
  return null;
}
function isInterface(p) {
  return getTargetPointerType(p) === PointerType.OTHER;
}
function getCapID(i) {
  if (i.segment.getUint32(i.byteOffset) !== PointerType.OTHER) {
    return -1;
  }
  return i.segment.getUint32(i.byteOffset + 4);
}
function getClient(i) {
  const capID = getCapID(i);
  const { capTable } = i.segment.message._capnp;
  if (!capTable) {
    return null;
  }
  return capTable[capID];
}

function isFuncCall(call) {
  return !isDataCall(call);
}
function isDataCall(call) {
  return !!call.params;
}
function copyCall(call) {
  if (isDataCall(call)) {
    return call;
  }
  return {
    method: call.method,
    params: placeParams(call, void 0)
  };
}
function placeParams(call, contentPtr) {
  if (isDataCall(call)) {
    return call.params;
  }
  let p;
  if (contentPtr) {
    p = new call.method.ParamsClass(
      contentPtr.segment,
      contentPtr.byteOffset,
      contentPtr._capnp.depthLimit
    );
  } else {
    const msg = new Message();
    p = new call.method.ParamsClass(msg.getSegment(0), 0);
  }
  initStruct(call.method.ParamsClass._capnp.size, p);
  if (call.paramsFunc) {
    call.paramsFunc(p);
  }
  return p;
}

function pointerToStruct(p) {
  if (getTargetPointerType(p) === PointerType.STRUCT) {
    return new Struct(
      p.segment,
      p.byteOffset,
      p._capnp.depthLimit,
      p._capnp.compositeIndex
    );
  }
  return null;
}

function transformPtr(p, transform) {
  if (transform.length === 0) {
    return p;
  }
  let s = pointerToStruct(p);
  if (!s) {
    return p;
  }
  for (const op of transform) {
    s = getPointer(op.field, s);
  }
  return s;
}

class Deferred {
  static fromPromise(p) {
    const d = new Deferred();
    p.then(d.resolve, d.reject);
    return d;
  }
  promise;
  reject;
  resolve;
  constructor() {
    this.promise = new Promise((a, b) => {
      this.resolve = a;
      this.reject = b;
    });
  }
}

class ImmediateAnswer extends FixedAnswer {
  constructor(s) {
    super();
    this.s = s;
  }
  structSync() {
    return this.s;
  }
  findClient(transform) {
    const p = transformPtr(this.s, transform);
    return getInterfaceClientOrNull(p);
  }
  pipelineCall(transform, call) {
    return this.findClient(transform).call(call);
  }
  pipelineClose(transform) {
    this.findClient(transform).close();
  }
}

class Queue {
  // creates a new queue that starts with n elements.
  // The interface's length must not change over the course of
  // the queue's usage.
  constructor(q, n) {
    this.q = q;
    this.n = n;
    this.cap = q.len();
  }
  start = 0;
  cap;
  // len returns the length of the queue. This is different from the underlying
  // interface's length, which is the queue's capacity.
  len() {
    return this.n;
  }
  // push reserves space for an element on the queue, returning its index.
  // if the queue is full, push returns -1.
  push() {
    if (this.n >= this.cap) {
      return -1;
    }
    const i = (this.start + this.n) % this.cap;
    this.n++;
    return i;
  }
  // front returns the index of the front of the queue, or -1 if the queue is empty.
  front() {
    if (this.n === 0) {
      return -1;
    }
    return this.start;
  }
  // pop pops an element from the queue, returning whether it succeeded.
  pop() {
    if (this.n === 0) {
      return false;
    }
    this.q.clear(this.start);
    this.start = (this.start + 1) % this.cap;
    this.n--;
    return true;
  }
}

class EmbargoClient {
  _client;
  q;
  calls;
  constructor(client, queue) {
    this._client = client;
    this.calls = queue.copy();
    this.q = new Queue(this.calls, this.calls.len());
    this.flushQueue();
  }
  flushQueue() {
    let c = null;
    {
      const i = this.q.front();
      if (i !== -1) {
        c = this.calls.data[i];
      }
    }
    while (c && c.call) {
      const ans = this._client.call(c.call);
      void (async (f, ans2) => {
        try {
          f.fulfill(await ans2.struct());
        } catch (error_) {
          f.reject(error_);
        }
      })(c.f, ans);
      this.q.pop();
      {
        const i = this.q.front();
        c = i === -1 ? null : this.calls.data[i];
      }
    }
  }
  // client returns the underlying client if the embargo has
  // been lifted and null otherwise
  client() {
    return this.isPassthrough() ? this._client : null;
  }
  isPassthrough() {
    return this.q.len() === 0;
  }
  // call either queues a call to the underlying client or starts a
  // call if the embargo has been lifted
  call(call) {
    if (this.isPassthrough()) {
      return this._client.call(call);
    }
    return this.push(call);
  }
  push(_call) {
    const f = new Fulfiller();
    const call = copyCall(_call);
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
  close() {
    while (this.q.len() > 0) {
      const first = this.calls.data[this.q.front()];
      if (!first) {
        throw new Error(INVARIANT_UNREACHABLE_CODE);
      }
      first.f.reject(new Error(RPC_QUEUE_CALL_CANCEL));
      this.q.pop();
    }
    this._client.close();
  }
}

class Ecalls {
  data;
  constructor(data) {
    this.data = data;
  }
  static copyOf(data) {
    return new Ecalls([...data]);
  }
  len() {
    return this.data.length;
  }
  clear(i) {
    this.data[i] = null;
  }
  copy() {
    return Ecalls.copyOf(this.data);
  }
}

const callQueueSize = 64;
class Fulfiller {
  resolved = false;
  answer;
  queue = [];
  queueCap = callQueueSize;
  deferred = new Deferred();
  fulfill(s) {
    this.answer = new ImmediateAnswer(s);
    const queues = this.emptyQueue(s);
    const msgcap = s.segment.message._capnp;
    if (!msgcap.capTable) {
      msgcap.capTable = [];
    }
    const ctab = msgcap.capTable;
    for (const _capIdx of Object.keys(queues)) {
      const capIdx = +_capIdx;
      const q = queues[capIdx];
      const client = ctab[capIdx];
      if (!client) {
        throw new Error(INVARIANT_UNREACHABLE_CODE);
      }
      ctab[capIdx] = new EmbargoClient(client, q);
    }
    this.deferred.resolve(s);
  }
  reject(err) {
    this.deferred.reject(err);
  }
  peek() {
    return this.answer;
  }
  async struct() {
    return await this.deferred.promise;
  }
  // pipelineCall calls pipelineCall on the fulfilled answer or
  // queues the call if f has not been fulfilled
  pipelineCall(transform, call) {
    {
      const a = this.peek();
      if (a) {
        return a.pipelineCall(transform, call);
      }
    }
    if (this.queue.length === this.queueCap) {
      return new ErrorAnswer(new Error(RPC_CALL_QUEUE_FULL));
    }
    const cc = copyCall(call);
    const g = new Fulfiller();
    this.queue.push({
      call: cc,
      f: g,
      transform
    });
    return g;
  }
  // pipelineClose waits until f is resolved and then calls
  // pipelineClose on the fulfilled answer
  // FIXME: should this be async?
  pipelineClose(transform) {
    const onFinally = () => {
      if (this.answer) {
        this.answer.pipelineClose(transform);
      }
    };
    this.deferred.promise.then(onFinally, onFinally);
  }
  // emptyQueue splits the queue by which capability it targets and
  // drops any invalid calls.  Once this function returns, f.queue will
  // be nil.
  emptyQueue(s) {
    const qs = {};
    for (let i = 0; i < this.queue.length; i++) {
      const pc = this.queue[i];
      let c;
      try {
        c = transformPtr(s, pc.transform);
      } catch (error_) {
        pc.f.reject(error_);
        continue;
      }
      const iface = Interface.fromPointer(c);
      if (!iface) {
        pc.f.reject(new Error(RPC_NULL_CLIENT));
        continue;
      }
      const cn = iface.getCapId();
      if (!qs[cn]) {
        qs[cn] = new Ecalls([]);
      }
      qs[cn].data.push(pc);
    }
    this.queue = [];
    return qs;
  }
}

class PipelineClient {
  constructor(pipeline) {
    this.pipeline = pipeline;
  }
  transform() {
    return this.pipeline.transform();
  }
  call(call) {
    return this.pipeline.answer.pipelineCall(this.transform(), call);
  }
  close() {
    this.pipeline.answer.pipelineClose(this.transform());
  }
}

class Pipeline {
  // Returns a new Pipeline based on an answer
  constructor(ResultsClass, answer, op, parent) {
    this.ResultsClass = ResultsClass;
    this.answer = answer;
    this.parent = parent;
    this.op = op || { field: 0 };
  }
  op;
  pipelineClient;
  // transform returns the operations needed to transform the root answer
  // into the value p represents.
  transform() {
    const xform = [];
    for (let q = this; q.parent; q = q.parent) {
      xform.unshift(q.op);
    }
    return xform;
  }
  // Struct waits until the answer is resolved and returns the struct
  // this pipeline represents.
  async struct() {
    const s = await this.answer.struct();
    const t = transformPtr(s, this.transform());
    if (!t) {
      if (this.op.defaultValue) {
        copyFrom(this.op.defaultValue, t);
      } else {
        initStruct(this.ResultsClass._capnp.size, t);
      }
    }
    return getAs(this.ResultsClass, t);
  }
  // client returns the client version of this pipeline
  client() {
    if (!this.pipelineClient) {
      this.pipelineClient = new PipelineClient(this);
    }
    return this.pipelineClient;
  }
  // getPipeline returns a derived pipeline which yields the pointer field given
  getPipeline(ResultsClass, off, defaultValue) {
    return new Pipeline(
      ResultsClass,
      this.answer,
      { field: off, defaultValue },
      this
    );
  }
}

class MethodError extends Error {
  constructor(method, message) {
    super(
      format(
        RPC_METHOD_ERROR,
        method.interfaceName,
        method.methodName,
        message
      )
    );
    this.method = method;
  }
}

class Registry {
  static interfaces = /* @__PURE__ */ new Map();
  static register(id, def) {
    this.interfaces.set(id, def);
  }
  static lookup(id) {
    return this.interfaces.get(id);
  }
}

class Server {
  constructor(target, methods) {
    this.target = target;
    this.methods = methods;
  }
  startCall(call) {
    const msg = new Message();
    const results = msg.initRoot(call.method.ResultsClass);
    call.serverMethod.impl.call(this.target, call.params, results).then(() => call.answer.fulfill(results)).catch((error_) => call.answer.reject(error_));
  }
  call(call) {
    const serverMethod = this.methods[call.method.methodId];
    if (!serverMethod) {
      return new ErrorAnswer(
        new MethodError(call.method, RPC_METHOD_NOT_IMPLEMENTED)
      );
    }
    const serverCall = {
      ...copyCall(call),
      answer: new Fulfiller(),
      serverMethod
    };
    this.startCall(serverCall);
    return serverCall.answer;
  }
  close() {
  }
}

export { Deferred as D, Fulfiller as F, Interface as I, MethodError as M, Pipeline as P, Queue as Q, Registry as R, Server as S, PipelineClient as a, isFuncCall as b, copyCall as c, isDataCall as i, placeParams as p, transformPtr as t };
