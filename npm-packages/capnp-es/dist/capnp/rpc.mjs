import { S as Struct, O as ObjectSize, b as getUint32, s as setUint32, a as adopt, g as getPointer, d as disown, p as getStruct, i as isNull, q as initStructAt, c as copyFrom, r as getUint64, u as setUint64, e as getUint16, f as setUint16, h as getBit, j as setBit, o as getAs, t as testWhich, m as getList, n as initList, D as getUint8, E as setUint8, k as getText, l as setText } from '../shared/capnp-es.D8zdZmih.mjs';
import { a as getBitMask, b as getUint8Mask, C as CompositeList } from '../shared/capnp-es.CFSf015t.mjs';

const _capnpFileId = 0xb312981b2552a250n;
const Message_Which = {
  /**
  * The sender previously received this message from the peer but didn't understand it or doesn't
  * yet implement the functionality that was requested.  So, the sender is echoing the message
  * back.  In some cases, the receiver may be able to recover from this by pretending the sender
  * had taken some appropriate "null" action.
  *
  * For example, say `resolve` is received by a level 0 implementation (because a previous call
  * or return happened to contain a promise).  The level 0 implementation will echo it back as
  * `unimplemented`.  The original sender can then simply release the cap to which the promise
  * had resolved, thus avoiding a leak.
  *
  * For any message type that introduces a question, if the message comes back unimplemented,
  * the original sender may simply treat it as if the question failed with an exception.
  *
  * In cases where there is no sensible way to react to an `unimplemented` message (without
  * resource leaks or other serious problems), the connection may need to be aborted.  This is
  * a gray area; different implementations may take different approaches.
  *
  */
  UNIMPLEMENTED: 0,
  /**
  * Sent when a connection is being aborted due to an unrecoverable error.  This could be e.g.
  * because the sender received an invalid or nonsensical message or because the sender had an
  * internal error.  The sender will shut down the outgoing half of the connection after `abort`
  * and will completely close the connection shortly thereafter (it's up to the sender how much
  * of a time buffer they want to offer for the client to receive the `abort` before the
  * connection is reset).
  *
  */
  ABORT: 1,
  /**
  * Request the peer's bootstrap interface.
  *
  */
  BOOTSTRAP: 8,
  /**
  * Begin a method call.
  *
  */
  CALL: 2,
  /**
  * Complete a method call.
  *
  */
  RETURN: 3,
  /**
  * Release a returned answer / cancel a call.
  *
  */
  FINISH: 4,
  /**
  * Resolve a previously-sent promise.
  *
  */
  RESOLVE: 5,
  /**
  * Release a capability so that the remote object can be deallocated.
  *
  */
  RELEASE: 6,
  /**
  * Lift an embargo used to enforce E-order over promise resolution.
  *
  */
  DISEMBARGO: 13,
  /**
  * Obsolete request to save a capability, resulting in a SturdyRef. This has been replaced
  * by the `Persistent` interface defined in `persistent.capnp`. This operation was never
  * implemented.
  *
  */
  OBSOLETE_SAVE: 7,
  /**
  * Obsolete way to delete a SturdyRef. This operation was never implemented.
  *
  */
  OBSOLETE_DELETE: 9,
  /**
  * Provide a capability to a third party.
  *
  */
  PROVIDE: 10,
  /**
  * Accept a capability provided by a third party.
  *
  */
  ACCEPT: 11,
  /**
  * Directly connect to the common root of two or more proxied caps.
  *
  */
  JOIN: 12
};
class Message extends Struct {
  static UNIMPLEMENTED = Message_Which.UNIMPLEMENTED;
  static ABORT = Message_Which.ABORT;
  static BOOTSTRAP = Message_Which.BOOTSTRAP;
  static CALL = Message_Which.CALL;
  static RETURN = Message_Which.RETURN;
  static FINISH = Message_Which.FINISH;
  static RESOLVE = Message_Which.RESOLVE;
  static RELEASE = Message_Which.RELEASE;
  static DISEMBARGO = Message_Which.DISEMBARGO;
  static OBSOLETE_SAVE = Message_Which.OBSOLETE_SAVE;
  static OBSOLETE_DELETE = Message_Which.OBSOLETE_DELETE;
  static PROVIDE = Message_Which.PROVIDE;
  static ACCEPT = Message_Which.ACCEPT;
  static JOIN = Message_Which.JOIN;
  static _capnp = {
    displayName: "Message",
    id: "91b79f1f808db032",
    size: new ObjectSize(8, 1)
  };
  _adoptUnimplemented(value) {
    setUint16(0, 0, this);
    adopt(value, getPointer(0, this));
  }
  _disownUnimplemented() {
    return disown(this.unimplemented);
  }
  /**
  * The sender previously received this message from the peer but didn't understand it or doesn't
  * yet implement the functionality that was requested.  So, the sender is echoing the message
  * back.  In some cases, the receiver may be able to recover from this by pretending the sender
  * had taken some appropriate "null" action.
  *
  * For example, say `resolve` is received by a level 0 implementation (because a previous call
  * or return happened to contain a promise).  The level 0 implementation will echo it back as
  * `unimplemented`.  The original sender can then simply release the cap to which the promise
  * had resolved, thus avoiding a leak.
  *
  * For any message type that introduces a question, if the message comes back unimplemented,
  * the original sender may simply treat it as if the question failed with an exception.
  *
  * In cases where there is no sensible way to react to an `unimplemented` message (without
  * resource leaks or other serious problems), the connection may need to be aborted.  This is
  * a gray area; different implementations may take different approaches.
  *
  */
  get unimplemented() {
    testWhich("unimplemented", getUint16(0, this), 0, this);
    return getStruct(0, Message, this);
  }
  _hasUnimplemented() {
    return !isNull(getPointer(0, this));
  }
  _initUnimplemented() {
    setUint16(0, 0, this);
    return initStructAt(0, Message, this);
  }
  get _isUnimplemented() {
    return getUint16(0, this) === 0;
  }
  set unimplemented(value) {
    setUint16(0, 0, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptAbort(value) {
    setUint16(0, 1, this);
    adopt(value, getPointer(0, this));
  }
  _disownAbort() {
    return disown(this.abort);
  }
  /**
  * Sent when a connection is being aborted due to an unrecoverable error.  This could be e.g.
  * because the sender received an invalid or nonsensical message or because the sender had an
  * internal error.  The sender will shut down the outgoing half of the connection after `abort`
  * and will completely close the connection shortly thereafter (it's up to the sender how much
  * of a time buffer they want to offer for the client to receive the `abort` before the
  * connection is reset).
  *
  */
  get abort() {
    testWhich("abort", getUint16(0, this), 1, this);
    return getStruct(0, Exception, this);
  }
  _hasAbort() {
    return !isNull(getPointer(0, this));
  }
  _initAbort() {
    setUint16(0, 1, this);
    return initStructAt(0, Exception, this);
  }
  get _isAbort() {
    return getUint16(0, this) === 1;
  }
  set abort(value) {
    setUint16(0, 1, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptBootstrap(value) {
    setUint16(0, 8, this);
    adopt(value, getPointer(0, this));
  }
  _disownBootstrap() {
    return disown(this.bootstrap);
  }
  /**
  * Request the peer's bootstrap interface.
  *
  */
  get bootstrap() {
    testWhich("bootstrap", getUint16(0, this), 8, this);
    return getStruct(0, Bootstrap, this);
  }
  _hasBootstrap() {
    return !isNull(getPointer(0, this));
  }
  _initBootstrap() {
    setUint16(0, 8, this);
    return initStructAt(0, Bootstrap, this);
  }
  get _isBootstrap() {
    return getUint16(0, this) === 8;
  }
  set bootstrap(value) {
    setUint16(0, 8, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptCall(value) {
    setUint16(0, 2, this);
    adopt(value, getPointer(0, this));
  }
  _disownCall() {
    return disown(this.call);
  }
  /**
  * Begin a method call.
  *
  */
  get call() {
    testWhich("call", getUint16(0, this), 2, this);
    return getStruct(0, Call, this);
  }
  _hasCall() {
    return !isNull(getPointer(0, this));
  }
  _initCall() {
    setUint16(0, 2, this);
    return initStructAt(0, Call, this);
  }
  get _isCall() {
    return getUint16(0, this) === 2;
  }
  set call(value) {
    setUint16(0, 2, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptReturn(value) {
    setUint16(0, 3, this);
    adopt(value, getPointer(0, this));
  }
  _disownReturn() {
    return disown(this.return);
  }
  /**
  * Complete a method call.
  *
  */
  get return() {
    testWhich("return", getUint16(0, this), 3, this);
    return getStruct(0, Return, this);
  }
  _hasReturn() {
    return !isNull(getPointer(0, this));
  }
  _initReturn() {
    setUint16(0, 3, this);
    return initStructAt(0, Return, this);
  }
  get _isReturn() {
    return getUint16(0, this) === 3;
  }
  set return(value) {
    setUint16(0, 3, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptFinish(value) {
    setUint16(0, 4, this);
    adopt(value, getPointer(0, this));
  }
  _disownFinish() {
    return disown(this.finish);
  }
  /**
  * Release a returned answer / cancel a call.
  *
  */
  get finish() {
    testWhich("finish", getUint16(0, this), 4, this);
    return getStruct(0, Finish, this);
  }
  _hasFinish() {
    return !isNull(getPointer(0, this));
  }
  _initFinish() {
    setUint16(0, 4, this);
    return initStructAt(0, Finish, this);
  }
  get _isFinish() {
    return getUint16(0, this) === 4;
  }
  set finish(value) {
    setUint16(0, 4, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptResolve(value) {
    setUint16(0, 5, this);
    adopt(value, getPointer(0, this));
  }
  _disownResolve() {
    return disown(this.resolve);
  }
  /**
  * Resolve a previously-sent promise.
  *
  */
  get resolve() {
    testWhich("resolve", getUint16(0, this), 5, this);
    return getStruct(0, Resolve, this);
  }
  _hasResolve() {
    return !isNull(getPointer(0, this));
  }
  _initResolve() {
    setUint16(0, 5, this);
    return initStructAt(0, Resolve, this);
  }
  get _isResolve() {
    return getUint16(0, this) === 5;
  }
  set resolve(value) {
    setUint16(0, 5, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptRelease(value) {
    setUint16(0, 6, this);
    adopt(value, getPointer(0, this));
  }
  _disownRelease() {
    return disown(this.release);
  }
  /**
  * Release a capability so that the remote object can be deallocated.
  *
  */
  get release() {
    testWhich("release", getUint16(0, this), 6, this);
    return getStruct(0, Release, this);
  }
  _hasRelease() {
    return !isNull(getPointer(0, this));
  }
  _initRelease() {
    setUint16(0, 6, this);
    return initStructAt(0, Release, this);
  }
  get _isRelease() {
    return getUint16(0, this) === 6;
  }
  set release(value) {
    setUint16(0, 6, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptDisembargo(value) {
    setUint16(0, 13, this);
    adopt(value, getPointer(0, this));
  }
  _disownDisembargo() {
    return disown(this.disembargo);
  }
  /**
  * Lift an embargo used to enforce E-order over promise resolution.
  *
  */
  get disembargo() {
    testWhich("disembargo", getUint16(0, this), 13, this);
    return getStruct(0, Disembargo, this);
  }
  _hasDisembargo() {
    return !isNull(getPointer(0, this));
  }
  _initDisembargo() {
    setUint16(0, 13, this);
    return initStructAt(0, Disembargo, this);
  }
  get _isDisembargo() {
    return getUint16(0, this) === 13;
  }
  set disembargo(value) {
    setUint16(0, 13, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptObsoleteSave(value) {
    setUint16(0, 7, this);
    adopt(value, getPointer(0, this));
  }
  _disownObsoleteSave() {
    return disown(this.obsoleteSave);
  }
  /**
  * Obsolete request to save a capability, resulting in a SturdyRef. This has been replaced
  * by the `Persistent` interface defined in `persistent.capnp`. This operation was never
  * implemented.
  *
  */
  get obsoleteSave() {
    testWhich("obsoleteSave", getUint16(0, this), 7, this);
    return getPointer(0, this);
  }
  _hasObsoleteSave() {
    return !isNull(getPointer(0, this));
  }
  get _isObsoleteSave() {
    return getUint16(0, this) === 7;
  }
  set obsoleteSave(value) {
    setUint16(0, 7, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptObsoleteDelete(value) {
    setUint16(0, 9, this);
    adopt(value, getPointer(0, this));
  }
  _disownObsoleteDelete() {
    return disown(this.obsoleteDelete);
  }
  /**
  * Obsolete way to delete a SturdyRef. This operation was never implemented.
  *
  */
  get obsoleteDelete() {
    testWhich("obsoleteDelete", getUint16(0, this), 9, this);
    return getPointer(0, this);
  }
  _hasObsoleteDelete() {
    return !isNull(getPointer(0, this));
  }
  get _isObsoleteDelete() {
    return getUint16(0, this) === 9;
  }
  set obsoleteDelete(value) {
    setUint16(0, 9, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptProvide(value) {
    setUint16(0, 10, this);
    adopt(value, getPointer(0, this));
  }
  _disownProvide() {
    return disown(this.provide);
  }
  /**
  * Provide a capability to a third party.
  *
  */
  get provide() {
    testWhich("provide", getUint16(0, this), 10, this);
    return getStruct(0, Provide, this);
  }
  _hasProvide() {
    return !isNull(getPointer(0, this));
  }
  _initProvide() {
    setUint16(0, 10, this);
    return initStructAt(0, Provide, this);
  }
  get _isProvide() {
    return getUint16(0, this) === 10;
  }
  set provide(value) {
    setUint16(0, 10, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptAccept(value) {
    setUint16(0, 11, this);
    adopt(value, getPointer(0, this));
  }
  _disownAccept() {
    return disown(this.accept);
  }
  /**
  * Accept a capability provided by a third party.
  *
  */
  get accept() {
    testWhich("accept", getUint16(0, this), 11, this);
    return getStruct(0, Accept, this);
  }
  _hasAccept() {
    return !isNull(getPointer(0, this));
  }
  _initAccept() {
    setUint16(0, 11, this);
    return initStructAt(0, Accept, this);
  }
  get _isAccept() {
    return getUint16(0, this) === 11;
  }
  set accept(value) {
    setUint16(0, 11, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptJoin(value) {
    setUint16(0, 12, this);
    adopt(value, getPointer(0, this));
  }
  _disownJoin() {
    return disown(this.join);
  }
  /**
  * Directly connect to the common root of two or more proxied caps.
  *
  */
  get join() {
    testWhich("join", getUint16(0, this), 12, this);
    return getStruct(0, Join, this);
  }
  _hasJoin() {
    return !isNull(getPointer(0, this));
  }
  _initJoin() {
    setUint16(0, 12, this);
    return initStructAt(0, Join, this);
  }
  get _isJoin() {
    return getUint16(0, this) === 12;
  }
  set join(value) {
    setUint16(0, 12, this);
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "Message_" + super.toString();
  }
  which() {
    return getUint16(0, this);
  }
}
class Bootstrap extends Struct {
  static _capnp = {
    displayName: "Bootstrap",
    id: "e94ccf8031176ec4",
    size: new ObjectSize(8, 1)
  };
  /**
  * A new question ID identifying this request, which will eventually receive a Return message
  * containing the restored capability.
  *
  */
  get questionId() {
    return getUint32(0, this);
  }
  set questionId(value) {
    setUint32(0, value, this);
  }
  _adoptDeprecatedObjectId(value) {
    adopt(value, getPointer(0, this));
  }
  _disownDeprecatedObjectId() {
    return disown(this.deprecatedObjectId);
  }
  /**
  * ** DEPRECATED **
  *
  * A Vat may export multiple bootstrap interfaces. In this case, `deprecatedObjectId` specifies
  * which one to return. If this pointer is null, then the default bootstrap interface is returned.
  *
  * As of version 0.5, use of this field is deprecated. If a service wants to export multiple
  * bootstrap interfaces, it should instead define a single bootstrap interface that has methods
  * that return each of the other interfaces.
  *
  * **History**
  *
  * In the first version of Cap'n Proto RPC (0.4.x) the `Bootstrap` message was called `Restore`.
  * At the time, it was thought that this would eventually serve as the way to restore SturdyRefs
  * (level 2). Meanwhile, an application could offer its "main" interface on a well-known
  * (non-secret) SturdyRef.
  *
  * Since level 2 RPC was not implemented at the time, the `Restore` message was in practice only
  * used to obtain the main interface. Since most applications had only one main interface that
  * they wanted to restore, they tended to designate this with a null `objectId`.
  *
  * Unfortunately, the earliest version of the EZ RPC interfaces set a precedent of exporting
  * multiple main interfaces by allowing them to be exported under string names. In this case,
  * `objectId` was a Text value specifying the name.
  *
  * All of this proved problematic for several reasons:
  *
  * - The arrangement assumed that a client wishing to restore a SturdyRef would know exactly what
  *   machine to connect to and would be able to immediately restore a SturdyRef on connection.
  *   However, in practice, the ability to restore SturdyRefs is itself a capability that may
  *   require going through an authentication process to obtain. Thus, it makes more sense to
  *   define a "restorer service" as a full Cap'n Proto interface. If this restorer interface is
  *   offered as the vat's bootstrap interface, then this is equivalent to the old arrangement.
  *
  * - Overloading "Restore" for the purpose of obtaining well-known capabilities encouraged the
  *   practice of exporting singleton services with string names. If singleton services are desired,
  *   it is better to have one main interface that has methods that can be used to obtain each
  *   service, in order to get all the usual benefits of schemas and type checking.
  *
  * - Overloading "Restore" also had a security problem: Often, "main" or "well-known"
  *   capabilities exported by a vat are in fact not public: they are intended to be accessed only
  *   by clients who are capable of forming a connection to the vat. This can lead to trouble if
  *   the client itself has other clients and wishes to forward some `Restore` requests from those
  *   external clients -- it has to be very careful not to allow through `Restore` requests
  *   addressing the default capability.
  *
  *   For example, consider the case of a sandboxed Sandstorm application and its supervisor. The
  *   application exports a default capability to its supervisor that provides access to
  *   functionality that only the supervisor is supposed to access. Meanwhile, though, applications
  *   may publish other capabilities that may be persistent, in which case the application needs
  *   to field `Restore` requests that could come from anywhere. These requests of course have to
  *   pass through the supervisor, as all communications with the outside world must. But, the
  *   supervisor has to be careful not to honor an external request addressing the application's
  *   default capability, since this capability is privileged. Unfortunately, the default
  *   capability cannot be given an unguessable name, because then the supervisor itself would not
  *   be able to address it!
  *
  * As of Cap'n Proto 0.5, `Restore` has been renamed to `Bootstrap` and is no longer planned for
  * use in restoring SturdyRefs.
  *
  * Note that 0.4 also defined a message type called `Delete` that, like `Restore`, addressed a
  * SturdyRef, but indicated that the client would not restore the ref again in the future. This
  * operation was never implemented, so it was removed entirely. If a "delete" operation is desired,
  * it should exist as a method on the same interface that handles restoring SturdyRefs. However,
  * the utility of such an operation is questionable. You wouldn't be able to rely on it for
  * garbage collection since a client could always disappear permanently without remembering to
  * delete all its SturdyRefs, thus leaving them dangling forever. Therefore, it is advisable to
  * design systems such that SturdyRefs never represent "owned" pointers.
  *
  * For example, say a SturdyRef points to an image file hosted on some server. That image file
  * should also live inside a collection (a gallery, perhaps) hosted on the same server, owned by
  * a user who can delete the image at any time. If the user deletes the image, the SturdyRef
  * stops working. On the other hand, if the SturdyRef is discarded, this has no effect on the
  * existence of the image in its collection.
  *
  */
  get deprecatedObjectId() {
    return getPointer(0, this);
  }
  _hasDeprecatedObjectId() {
    return !isNull(getPointer(0, this));
  }
  set deprecatedObjectId(value) {
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "Bootstrap_" + super.toString();
  }
}
const Call_SendResultsTo_Which = {
  /**
  * Send the return message back to the caller (the usual).
  *
  */
  CALLER: 0,
  /**
  * **(level 1)**
  *
  * Don't actually return the results to the sender.  Instead, hold on to them and await
  * instructions from the sender regarding what to do with them.  In particular, the sender
  * may subsequently send a `Return` for some other call (which the receiver had previously made
  * to the sender) with `takeFromOtherQuestion` set.  The results from this call are then used
  * as the results of the other call.
  *
  * When `yourself` is used, the receiver must still send a `Return` for the call, but sets the
  * field `resultsSentElsewhere` in that `Return` rather than including the results.
  *
  * This feature can be used to implement tail calls in which a call from Vat A to Vat B ends up
  * returning the result of a call from Vat B back to Vat A.
  *
  * In particular, the most common use case for this feature is when Vat A makes a call to a
  * promise in Vat B, and then that promise ends up resolving to a capability back in Vat A.
  * Vat B must forward all the queued calls on that promise back to Vat A, but can set `yourself`
  * in the calls so that the results need not pass back through Vat B.
  *
  * For example:
  * - Alice, in Vat A, calls foo() on Bob in Vat B.
  * - Alice makes a pipelined call bar() on the promise returned by foo().
  * - Later on, Bob resolves the promise from foo() to point at Carol, who lives in Vat A (next
  *   to Alice).
  * - Vat B dutifully forwards the bar() call to Carol.  Let us call this forwarded call bar'().
  *   Notice that bar() and bar'() are travelling in opposite directions on the same network
  *   link.
  * - The `Call` for bar'() has `sendResultsTo` set to `yourself`.
  * - Vat B sends a `Return` for bar() with `takeFromOtherQuestion` set in place of the results,
  *   with the value set to the question ID of bar'().  Vat B does not wait for bar'() to return,
  *   as doing so would introduce unnecessary round trip latency.
  * - Vat A receives bar'() and delivers it to Carol.
  * - When bar'() returns, Vat A sends a `Return` for bar'() to Vat B, with `resultsSentElsewhere`
  *   set in place of results.
  * - Vat A sends a `Finish` for the bar() call to Vat B.
  * - Vat B receives the `Finish` for bar() and sends a `Finish` for bar'().
  *
  */
  YOURSELF: 1,
  /**
  * **(level 3)**
  *
  * The call's result should be returned to a different vat.  The receiver (the callee) expects
  * to receive an `Accept` message from the indicated vat, and should return the call's result
  * to it, rather than to the sender of the `Call`.
  *
  * This operates much like `yourself`, above, except that Carol is in a separate Vat C.  `Call`
  * messages are sent from Vat A -> Vat B and Vat B -> Vat C.  A `Return` message is sent from
  * Vat B -> Vat A that contains `acceptFromThirdParty` in place of results.  When Vat A sends
  * an `Accept` to Vat C, it receives back a `Return` containing the call's actual result.  Vat C
  * also sends a `Return` to Vat B with `resultsSentElsewhere`.
  *
  */
  THIRD_PARTY: 2
};
class Call_SendResultsTo extends Struct {
  static CALLER = Call_SendResultsTo_Which.CALLER;
  static YOURSELF = Call_SendResultsTo_Which.YOURSELF;
  static THIRD_PARTY = Call_SendResultsTo_Which.THIRD_PARTY;
  static _capnp = {
    displayName: "sendResultsTo",
    id: "dae8b0f61aab5f99",
    size: new ObjectSize(24, 3)
  };
  get _isCaller() {
    return getUint16(6, this) === 0;
  }
  set caller(_) {
    setUint16(6, 0, this);
  }
  get _isYourself() {
    return getUint16(6, this) === 1;
  }
  set yourself(_) {
    setUint16(6, 1, this);
  }
  _adoptThirdParty(value) {
    setUint16(6, 2, this);
    adopt(value, getPointer(2, this));
  }
  _disownThirdParty() {
    return disown(this.thirdParty);
  }
  /**
  * **(level 3)**
  *
  * The call's result should be returned to a different vat.  The receiver (the callee) expects
  * to receive an `Accept` message from the indicated vat, and should return the call's result
  * to it, rather than to the sender of the `Call`.
  *
  * This operates much like `yourself`, above, except that Carol is in a separate Vat C.  `Call`
  * messages are sent from Vat A -> Vat B and Vat B -> Vat C.  A `Return` message is sent from
  * Vat B -> Vat A that contains `acceptFromThirdParty` in place of results.  When Vat A sends
  * an `Accept` to Vat C, it receives back a `Return` containing the call's actual result.  Vat C
  * also sends a `Return` to Vat B with `resultsSentElsewhere`.
  *
  */
  get thirdParty() {
    testWhich("thirdParty", getUint16(6, this), 2, this);
    return getPointer(2, this);
  }
  _hasThirdParty() {
    return !isNull(getPointer(2, this));
  }
  get _isThirdParty() {
    return getUint16(6, this) === 2;
  }
  set thirdParty(value) {
    setUint16(6, 2, this);
    copyFrom(value, getPointer(2, this));
  }
  toString() {
    return "Call_SendResultsTo_" + super.toString();
  }
  which() {
    return getUint16(6, this);
  }
}
class Call extends Struct {
  static _capnp = {
    displayName: "Call",
    id: "836a53ce789d4cd4",
    size: new ObjectSize(24, 3),
    defaultAllowThirdPartyTailCall: getBitMask(false, 0),
    defaultNoPromisePipelining: getBitMask(false, 1),
    defaultOnlyPromisePipeline: getBitMask(false, 2)
  };
  /**
  * A number, chosen by the caller, that identifies this call in future messages.  This number
  * must be different from all other calls originating from the same end of the connection (but
  * may overlap with question IDs originating from the opposite end).  A fine strategy is to use
  * sequential question IDs, but the recipient should not assume this.
  *
  * A question ID can be reused once both:
  * - A matching Return has been received from the callee.
  * - A matching Finish has been sent from the caller.
  *
  */
  get questionId() {
    return getUint32(0, this);
  }
  set questionId(value) {
    setUint32(0, value, this);
  }
  _adoptTarget(value) {
    adopt(value, getPointer(0, this));
  }
  _disownTarget() {
    return disown(this.target);
  }
  /**
  * The object that should receive this call.
  *
  */
  get target() {
    return getStruct(0, MessageTarget, this);
  }
  _hasTarget() {
    return !isNull(getPointer(0, this));
  }
  _initTarget() {
    return initStructAt(0, MessageTarget, this);
  }
  set target(value) {
    copyFrom(value, getPointer(0, this));
  }
  /**
  * The type ID of the interface being called.  Each capability may implement multiple interfaces.
  *
  */
  get interfaceId() {
    return getUint64(8, this);
  }
  set interfaceId(value) {
    setUint64(8, value, this);
  }
  /**
  * The ordinal number of the method to call within the requested interface.
  *
  */
  get methodId() {
    return getUint16(4, this);
  }
  set methodId(value) {
    setUint16(4, value, this);
  }
  /**
  * Indicates whether or not the receiver is allowed to send a `Return` containing
  * `acceptFromThirdParty`.  Level 3 implementations should set this true.  Otherwise, the callee
  * will have to proxy the return in the case of a tail call to a third-party vat.
  *
  */
  get allowThirdPartyTailCall() {
    return getBit(128, this, Call._capnp.defaultAllowThirdPartyTailCall);
  }
  set allowThirdPartyTailCall(value) {
    setBit(128, value, this, Call._capnp.defaultAllowThirdPartyTailCall);
  }
  /**
  * If true, the sender promises that it won't make any promise-pipelined calls on the results of
  * this call. If it breaks this promise, the receiver may throw an arbitrary error from such
  * calls.
  *
  * The receiver may use this as an optimization, by skipping the bookkeeping needed for pipelining
  * when no pipelined calls are expected. The sender typically sets this to false when the method's
  * schema does not specify any return capabilities.
  *
  */
  get noPromisePipelining() {
    return getBit(129, this, Call._capnp.defaultNoPromisePipelining);
  }
  set noPromisePipelining(value) {
    setBit(129, value, this, Call._capnp.defaultNoPromisePipelining);
  }
  /**
  * If true, the sender only plans to use this call to make pipelined calls. The receiver need not
  * send a `Return` message (but is still allowed to do so).
  *
  * Since the sender does not know whether a `Return` will be sent, it must release all state
  * related to the call when it sends `Finish`. However, in the case that the callee does not
  * recognize this hint and chooses to send a `Return`, then technically the caller is not allowed
  * to reuse the question ID until it receives said `Return`. This creates a conundrum: How does
  * the caller decide when it's OK to reuse the ID? To sidestep the problem, the C++ implementation
  * uses high-numbered IDs (with the high-order bit set) for such calls, and cycles through the
  * IDs in order. If all 2^31 IDs in this space are used without ever seeing a `Return`, then the
  * implementation assumes that the other end is in fact honoring the hint, and the ID counter is
  * allowed to loop around. If a `Return` is ever seen when `onlyPromisePipeline` was set, then
  * the implementation stops using this hint.
  *
  */
  get onlyPromisePipeline() {
    return getBit(130, this, Call._capnp.defaultOnlyPromisePipeline);
  }
  set onlyPromisePipeline(value) {
    setBit(130, value, this, Call._capnp.defaultOnlyPromisePipeline);
  }
  _adoptParams(value) {
    adopt(value, getPointer(1, this));
  }
  _disownParams() {
    return disown(this.params);
  }
  /**
  * The call parameters.  `params.content` is a struct whose fields correspond to the parameters of
  * the method.
  *
  */
  get params() {
    return getStruct(1, Payload, this);
  }
  _hasParams() {
    return !isNull(getPointer(1, this));
  }
  _initParams() {
    return initStructAt(1, Payload, this);
  }
  set params(value) {
    copyFrom(value, getPointer(1, this));
  }
  /**
  * Where should the return message be sent?
  *
  */
  get sendResultsTo() {
    return getAs(Call_SendResultsTo, this);
  }
  _initSendResultsTo() {
    return getAs(Call_SendResultsTo, this);
  }
  toString() {
    return "Call_" + super.toString();
  }
}
const Return_Which = {
  /**
  * The result.
  *
  * For regular method calls, `results.content` points to the result struct.
  *
  * For a `Return` in response to an `Accept` or `Bootstrap`, `results` contains a single
  * capability (rather than a struct), and `results.content` is just a capability pointer with
  * index 0.  A `Finish` is still required in this case.
  *
  */
  RESULTS: 0,
  /**
  * Indicates that the call failed and explains why.
  *
  */
  EXCEPTION: 1,
  /**
  * Indicates that the call was canceled due to the caller sending a Finish message
  * before the call had completed.
  *
  */
  CANCELED: 2,
  /**
  * This is set when returning from a `Call` that had `sendResultsTo` set to something other
  * than `caller`.
  *
  * It doesn't matter too much when this is sent, as the receiver doesn't need to do anything
  * with it, but the C++ implementation appears to wait for the call to finish before sending
  * this.
  *
  */
  RESULTS_SENT_ELSEWHERE: 3,
  /**
  * The sender has also sent (before this message) a `Call` with the given question ID and with
  * `sendResultsTo.yourself` set, and the results of that other call should be used as the
  * results here.  `takeFromOtherQuestion` can only used once per question.
  *
  */
  TAKE_FROM_OTHER_QUESTION: 4,
  /**
  * **(level 3)**
  *
  * The caller should contact a third-party vat to pick up the results.  An `Accept` message
  * sent to the vat will return the result.  This pairs with `Call.sendResultsTo.thirdParty`.
  * It should only be used if the corresponding `Call` had `allowThirdPartyTailCall` set.
  *
  */
  ACCEPT_FROM_THIRD_PARTY: 5
};
class Return extends Struct {
  static RESULTS = Return_Which.RESULTS;
  static EXCEPTION = Return_Which.EXCEPTION;
  static CANCELED = Return_Which.CANCELED;
  static RESULTS_SENT_ELSEWHERE = Return_Which.RESULTS_SENT_ELSEWHERE;
  static TAKE_FROM_OTHER_QUESTION = Return_Which.TAKE_FROM_OTHER_QUESTION;
  static ACCEPT_FROM_THIRD_PARTY = Return_Which.ACCEPT_FROM_THIRD_PARTY;
  static _capnp = {
    displayName: "Return",
    id: "9e19b28d3db3573a",
    size: new ObjectSize(16, 1),
    defaultReleaseParamCaps: getBitMask(true, 0),
    defaultNoFinishNeeded: getBitMask(false, 1)
  };
  /**
  * Equal to the QuestionId of the corresponding `Call` message.
  *
  */
  get answerId() {
    return getUint32(0, this);
  }
  set answerId(value) {
    setUint32(0, value, this);
  }
  /**
  * If true, all capabilities that were in the params should be considered released.  The sender
  * must not send separate `Release` messages for them.  Level 0 implementations in particular
  * should always set this true.  This defaults true because if level 0 implementations forget to
  * set it they'll never notice (just silently leak caps), but if level >=1 implementations forget
  * to set it to false they'll quickly get errors.
  *
  * The receiver should act as if the sender had sent a release message with count=1 for each
  * CapDescriptor in the original Call message.
  *
  */
  get releaseParamCaps() {
    return getBit(32, this, Return._capnp.defaultReleaseParamCaps);
  }
  set releaseParamCaps(value) {
    setBit(32, value, this, Return._capnp.defaultReleaseParamCaps);
  }
  /**
  * If true, the sender does not need the receiver to send a `Finish` message; its answer table
  * entry has already been cleaned up. This implies that the results do not contain any
  * capabilities, since the `Finish` message would normally release those capabilities from
  * promise pipelining responsibility. The caller may still send a `Finish` message if it wants,
  * which will be silently ignored by the callee.
  *
  */
  get noFinishNeeded() {
    return getBit(33, this, Return._capnp.defaultNoFinishNeeded);
  }
  set noFinishNeeded(value) {
    setBit(33, value, this, Return._capnp.defaultNoFinishNeeded);
  }
  _adoptResults(value) {
    setUint16(6, 0, this);
    adopt(value, getPointer(0, this));
  }
  _disownResults() {
    return disown(this.results);
  }
  /**
  * The result.
  *
  * For regular method calls, `results.content` points to the result struct.
  *
  * For a `Return` in response to an `Accept` or `Bootstrap`, `results` contains a single
  * capability (rather than a struct), and `results.content` is just a capability pointer with
  * index 0.  A `Finish` is still required in this case.
  *
  */
  get results() {
    testWhich("results", getUint16(6, this), 0, this);
    return getStruct(0, Payload, this);
  }
  _hasResults() {
    return !isNull(getPointer(0, this));
  }
  _initResults() {
    setUint16(6, 0, this);
    return initStructAt(0, Payload, this);
  }
  get _isResults() {
    return getUint16(6, this) === 0;
  }
  set results(value) {
    setUint16(6, 0, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptException(value) {
    setUint16(6, 1, this);
    adopt(value, getPointer(0, this));
  }
  _disownException() {
    return disown(this.exception);
  }
  /**
  * Indicates that the call failed and explains why.
  *
  */
  get exception() {
    testWhich("exception", getUint16(6, this), 1, this);
    return getStruct(0, Exception, this);
  }
  _hasException() {
    return !isNull(getPointer(0, this));
  }
  _initException() {
    setUint16(6, 1, this);
    return initStructAt(0, Exception, this);
  }
  get _isException() {
    return getUint16(6, this) === 1;
  }
  set exception(value) {
    setUint16(6, 1, this);
    copyFrom(value, getPointer(0, this));
  }
  get _isCanceled() {
    return getUint16(6, this) === 2;
  }
  set canceled(_) {
    setUint16(6, 2, this);
  }
  get _isResultsSentElsewhere() {
    return getUint16(6, this) === 3;
  }
  set resultsSentElsewhere(_) {
    setUint16(6, 3, this);
  }
  /**
  * The sender has also sent (before this message) a `Call` with the given question ID and with
  * `sendResultsTo.yourself` set, and the results of that other call should be used as the
  * results here.  `takeFromOtherQuestion` can only used once per question.
  *
  */
  get takeFromOtherQuestion() {
    testWhich("takeFromOtherQuestion", getUint16(6, this), 4, this);
    return getUint32(8, this);
  }
  get _isTakeFromOtherQuestion() {
    return getUint16(6, this) === 4;
  }
  set takeFromOtherQuestion(value) {
    setUint16(6, 4, this);
    setUint32(8, value, this);
  }
  _adoptAcceptFromThirdParty(value) {
    setUint16(6, 5, this);
    adopt(value, getPointer(0, this));
  }
  _disownAcceptFromThirdParty() {
    return disown(this.acceptFromThirdParty);
  }
  /**
  * **(level 3)**
  *
  * The caller should contact a third-party vat to pick up the results.  An `Accept` message
  * sent to the vat will return the result.  This pairs with `Call.sendResultsTo.thirdParty`.
  * It should only be used if the corresponding `Call` had `allowThirdPartyTailCall` set.
  *
  */
  get acceptFromThirdParty() {
    testWhich("acceptFromThirdParty", getUint16(6, this), 5, this);
    return getPointer(0, this);
  }
  _hasAcceptFromThirdParty() {
    return !isNull(getPointer(0, this));
  }
  get _isAcceptFromThirdParty() {
    return getUint16(6, this) === 5;
  }
  set acceptFromThirdParty(value) {
    setUint16(6, 5, this);
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "Return_" + super.toString();
  }
  which() {
    return getUint16(6, this);
  }
}
class Finish extends Struct {
  static _capnp = {
    displayName: "Finish",
    id: "d37d2eb2c2f80e63",
    size: new ObjectSize(8, 0),
    defaultReleaseResultCaps: getBitMask(true, 0),
    defaultRequireEarlyCancellationWorkaround: getBitMask(true, 1)
  };
  /**
  * ID of the call whose result is to be released.
  *
  */
  get questionId() {
    return getUint32(0, this);
  }
  set questionId(value) {
    setUint32(0, value, this);
  }
  /**
  * If true, all capabilities that were in the results should be considered released.  The sender
  * must not send separate `Release` messages for them.  Level 0 implementations in particular
  * should always set this true.  This defaults true because if level 0 implementations forget to
  * set it they'll never notice (just silently leak caps), but if level >=1 implementations forget
  * set it false they'll quickly get errors.
  *
  */
  get releaseResultCaps() {
    return getBit(32, this, Finish._capnp.defaultReleaseResultCaps);
  }
  set releaseResultCaps(value) {
    setBit(32, value, this, Finish._capnp.defaultReleaseResultCaps);
  }
  /**
  * If true, if the RPC system receives this Finish message before the original call has even been
  * delivered, it should defer cancellation util after delivery. In particular, this gives the
  * destination object a chance to opt out of cancellation, e.g. as controlled by the
  * `allowCancellation` annotation defined in `c++.capnp`.
  *
  * This is a work-around. Versions 1.0 and up of Cap'n Proto always set this to false. However,
  * older versions of Cap'n Proto unintentionally exhibited this errant behavior by default, and
  * as a result programs built with older versions could be inadvertently relying on their peers
  * to implement the behavior. The purpose of this flag is to let newer versions know when the
  * peer is an older version, so that it can attempt to work around the issue.
  *
  * See also comments in handleFinish() in rpc.c++ for more details.
  *
  */
  get requireEarlyCancellationWorkaround() {
    return getBit(33, this, Finish._capnp.defaultRequireEarlyCancellationWorkaround);
  }
  set requireEarlyCancellationWorkaround(value) {
    setBit(33, value, this, Finish._capnp.defaultRequireEarlyCancellationWorkaround);
  }
  toString() {
    return "Finish_" + super.toString();
  }
}
const Resolve_Which = {
  /**
  * The object to which the promise resolved.
  *
  * The sender promises that from this point forth, until `promiseId` is released, it shall
  * simply forward all messages to the capability designated by `cap`.  This is true even if
  * `cap` itself happens to designate another promise, and that other promise later resolves --
  * messages sent to `promiseId` shall still go to that other promise, not to its resolution.
  * This is important in the case that the receiver of the `Resolve` ends up sending a
  * `Disembargo` message towards `promiseId` in order to control message ordering -- that
  * `Disembargo` really needs to reflect back to exactly the object designated by `cap` even
  * if that object is itself a promise.
  *
  */
  CAP: 0,
  /**
  * Indicates that the promise was broken.
  *
  */
  EXCEPTION: 1
};
class Resolve extends Struct {
  static CAP = Resolve_Which.CAP;
  static EXCEPTION = Resolve_Which.EXCEPTION;
  static _capnp = {
    displayName: "Resolve",
    id: "bbc29655fa89086e",
    size: new ObjectSize(8, 1)
  };
  /**
  * The ID of the promise to be resolved.
  *
  * Unlike all other instances of `ExportId` sent from the exporter, the `Resolve` message does
  * _not_ increase the reference count of `promiseId`.  In fact, it is expected that the receiver
  * will release the export soon after receiving `Resolve`, and the sender will not send this
  * `ExportId` again until it has been released and recycled.
  *
  * When an export ID sent over the wire (e.g. in a `CapDescriptor`) is indicated to be a promise,
  * this indicates that the sender will follow up at some point with a `Resolve` message.  If the
  * same `promiseId` is sent again before `Resolve`, still only one `Resolve` is sent.  If the
  * same ID is sent again later _after_ a `Resolve`, it can only be because the export's
  * reference count hit zero in the meantime and the ID was re-assigned to a new export, therefore
  * this later promise does _not_ correspond to the earlier `Resolve`.
  *
  * If a promise ID's reference count reaches zero before a `Resolve` is sent, the `Resolve`
  * message may or may not still be sent (the `Resolve` may have already been in-flight when
  * `Release` was sent, but if the `Release` is received before `Resolve` then there is no longer
  * any reason to send a `Resolve`).  Thus a `Resolve` may be received for a promise of which
  * the receiver has no knowledge, because it already released it earlier.  In this case, the
  * receiver should simply release the capability to which the promise resolved.
  *
  */
  get promiseId() {
    return getUint32(0, this);
  }
  set promiseId(value) {
    setUint32(0, value, this);
  }
  _adoptCap(value) {
    setUint16(4, 0, this);
    adopt(value, getPointer(0, this));
  }
  _disownCap() {
    return disown(this.cap);
  }
  /**
  * The object to which the promise resolved.
  *
  * The sender promises that from this point forth, until `promiseId` is released, it shall
  * simply forward all messages to the capability designated by `cap`.  This is true even if
  * `cap` itself happens to designate another promise, and that other promise later resolves --
  * messages sent to `promiseId` shall still go to that other promise, not to its resolution.
  * This is important in the case that the receiver of the `Resolve` ends up sending a
  * `Disembargo` message towards `promiseId` in order to control message ordering -- that
  * `Disembargo` really needs to reflect back to exactly the object designated by `cap` even
  * if that object is itself a promise.
  *
  */
  get cap() {
    testWhich("cap", getUint16(4, this), 0, this);
    return getStruct(0, CapDescriptor, this);
  }
  _hasCap() {
    return !isNull(getPointer(0, this));
  }
  _initCap() {
    setUint16(4, 0, this);
    return initStructAt(0, CapDescriptor, this);
  }
  get _isCap() {
    return getUint16(4, this) === 0;
  }
  set cap(value) {
    setUint16(4, 0, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptException(value) {
    setUint16(4, 1, this);
    adopt(value, getPointer(0, this));
  }
  _disownException() {
    return disown(this.exception);
  }
  /**
  * Indicates that the promise was broken.
  *
  */
  get exception() {
    testWhich("exception", getUint16(4, this), 1, this);
    return getStruct(0, Exception, this);
  }
  _hasException() {
    return !isNull(getPointer(0, this));
  }
  _initException() {
    setUint16(4, 1, this);
    return initStructAt(0, Exception, this);
  }
  get _isException() {
    return getUint16(4, this) === 1;
  }
  set exception(value) {
    setUint16(4, 1, this);
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "Resolve_" + super.toString();
  }
  which() {
    return getUint16(4, this);
  }
}
class Release extends Struct {
  static _capnp = {
    displayName: "Release",
    id: "ad1a6c0d7dd07497",
    size: new ObjectSize(8, 0)
  };
  /**
  * What to release.
  *
  */
  get id() {
    return getUint32(0, this);
  }
  set id(value) {
    setUint32(0, value, this);
  }
  /**
  * The amount by which to decrement the reference count.  The export is only actually released
  * when the reference count reaches zero.
  *
  */
  get referenceCount() {
    return getUint32(4, this);
  }
  set referenceCount(value) {
    setUint32(4, value, this);
  }
  toString() {
    return "Release_" + super.toString();
  }
}
const Disembargo_Context_Which = {
  /**
  * The sender is requesting a disembargo on a promise that is known to resolve back to a
  * capability hosted by the sender.  As soon as the receiver has echoed back all pipelined calls
  * on this promise, it will deliver the Disembargo back to the sender with `receiverLoopback`
  * set to the same value as `senderLoopback`.  This value is chosen by the sender, and since
  * it is also consumed be the sender, the sender can use whatever strategy it wants to make sure
  * the value is unambiguous.
  *
  * The receiver must verify that the target capability actually resolves back to the sender's
  * vat.  Otherwise, the sender has committed a protocol error and should be disconnected.
  *
  */
  SENDER_LOOPBACK: 0,
  /**
  * The receiver previously sent a `senderLoopback` Disembargo towards a promise resolving to
  * this capability, and that Disembargo is now being echoed back.
  *
  */
  RECEIVER_LOOPBACK: 1,
  /**
  * **(level 3)**
  *
  * The sender is requesting a disembargo on a promise that is known to resolve to a third-party
  * capability that the sender is currently in the process of accepting (using `Accept`).
  * The receiver of this `Disembargo` has an outstanding `Provide` on said capability.  The
  * receiver should now send a `Disembargo` with `provide` set to the question ID of that
  * `Provide` message.
  *
  * See `Accept.embargo` for an example.
  *
  */
  ACCEPT: 2,
  /**
  * **(level 3)**
  *
  * The sender is requesting a disembargo on a capability currently being provided to a third
  * party.  The question ID identifies the `Provide` message previously sent by the sender to
  * this capability.  On receipt, the receiver (the capability host) shall release the embargo
  * on the `Accept` message that it has received from the third party.  See `Accept.embargo` for
  * an example.
  *
  */
  PROVIDE: 3
};
class Disembargo_Context extends Struct {
  static SENDER_LOOPBACK = Disembargo_Context_Which.SENDER_LOOPBACK;
  static RECEIVER_LOOPBACK = Disembargo_Context_Which.RECEIVER_LOOPBACK;
  static ACCEPT = Disembargo_Context_Which.ACCEPT;
  static PROVIDE = Disembargo_Context_Which.PROVIDE;
  static _capnp = {
    displayName: "context",
    id: "d562b4df655bdd4d",
    size: new ObjectSize(8, 1)
  };
  /**
  * The sender is requesting a disembargo on a promise that is known to resolve back to a
  * capability hosted by the sender.  As soon as the receiver has echoed back all pipelined calls
  * on this promise, it will deliver the Disembargo back to the sender with `receiverLoopback`
  * set to the same value as `senderLoopback`.  This value is chosen by the sender, and since
  * it is also consumed be the sender, the sender can use whatever strategy it wants to make sure
  * the value is unambiguous.
  *
  * The receiver must verify that the target capability actually resolves back to the sender's
  * vat.  Otherwise, the sender has committed a protocol error and should be disconnected.
  *
  */
  get senderLoopback() {
    testWhich("senderLoopback", getUint16(4, this), 0, this);
    return getUint32(0, this);
  }
  get _isSenderLoopback() {
    return getUint16(4, this) === 0;
  }
  set senderLoopback(value) {
    setUint16(4, 0, this);
    setUint32(0, value, this);
  }
  /**
  * The receiver previously sent a `senderLoopback` Disembargo towards a promise resolving to
  * this capability, and that Disembargo is now being echoed back.
  *
  */
  get receiverLoopback() {
    testWhich("receiverLoopback", getUint16(4, this), 1, this);
    return getUint32(0, this);
  }
  get _isReceiverLoopback() {
    return getUint16(4, this) === 1;
  }
  set receiverLoopback(value) {
    setUint16(4, 1, this);
    setUint32(0, value, this);
  }
  get _isAccept() {
    return getUint16(4, this) === 2;
  }
  set accept(_) {
    setUint16(4, 2, this);
  }
  /**
  * **(level 3)**
  *
  * The sender is requesting a disembargo on a capability currently being provided to a third
  * party.  The question ID identifies the `Provide` message previously sent by the sender to
  * this capability.  On receipt, the receiver (the capability host) shall release the embargo
  * on the `Accept` message that it has received from the third party.  See `Accept.embargo` for
  * an example.
  *
  */
  get provide() {
    testWhich("provide", getUint16(4, this), 3, this);
    return getUint32(0, this);
  }
  get _isProvide() {
    return getUint16(4, this) === 3;
  }
  set provide(value) {
    setUint16(4, 3, this);
    setUint32(0, value, this);
  }
  toString() {
    return "Disembargo_Context_" + super.toString();
  }
  which() {
    return getUint16(4, this);
  }
}
class Disembargo extends Struct {
  static _capnp = {
    displayName: "Disembargo",
    id: "f964368b0fbd3711",
    size: new ObjectSize(8, 1)
  };
  _adoptTarget(value) {
    adopt(value, getPointer(0, this));
  }
  _disownTarget() {
    return disown(this.target);
  }
  /**
  * What is to be disembargoed.
  *
  */
  get target() {
    return getStruct(0, MessageTarget, this);
  }
  _hasTarget() {
    return !isNull(getPointer(0, this));
  }
  _initTarget() {
    return initStructAt(0, MessageTarget, this);
  }
  set target(value) {
    copyFrom(value, getPointer(0, this));
  }
  get context() {
    return getAs(Disembargo_Context, this);
  }
  _initContext() {
    return getAs(Disembargo_Context, this);
  }
  toString() {
    return "Disembargo_" + super.toString();
  }
}
class Provide extends Struct {
  static _capnp = {
    displayName: "Provide",
    id: "9c6a046bfbc1ac5a",
    size: new ObjectSize(8, 2)
  };
  /**
  * Question ID to be held open until the recipient has received the capability.  A result will be
  * returned once the third party has successfully received the capability.  The sender must at some
  * point send a `Finish` message as with any other call, and that message can be used to cancel the
  * whole operation.
  *
  */
  get questionId() {
    return getUint32(0, this);
  }
  set questionId(value) {
    setUint32(0, value, this);
  }
  _adoptTarget(value) {
    adopt(value, getPointer(0, this));
  }
  _disownTarget() {
    return disown(this.target);
  }
  /**
  * What is to be provided to the third party.
  *
  */
  get target() {
    return getStruct(0, MessageTarget, this);
  }
  _hasTarget() {
    return !isNull(getPointer(0, this));
  }
  _initTarget() {
    return initStructAt(0, MessageTarget, this);
  }
  set target(value) {
    copyFrom(value, getPointer(0, this));
  }
  _adoptRecipient(value) {
    adopt(value, getPointer(1, this));
  }
  _disownRecipient() {
    return disown(this.recipient);
  }
  /**
  * Identity of the third party that is expected to pick up the capability.
  *
  */
  get recipient() {
    return getPointer(1, this);
  }
  _hasRecipient() {
    return !isNull(getPointer(1, this));
  }
  set recipient(value) {
    copyFrom(value, getPointer(1, this));
  }
  toString() {
    return "Provide_" + super.toString();
  }
}
class Accept extends Struct {
  static _capnp = {
    displayName: "Accept",
    id: "d4c9b56290554016",
    size: new ObjectSize(8, 1)
  };
  /**
  * A new question ID identifying this accept message, which will eventually receive a Return
  * message containing the provided capability (or the call result in the case of a redirected
  * return).
  *
  */
  get questionId() {
    return getUint32(0, this);
  }
  set questionId(value) {
    setUint32(0, value, this);
  }
  _adoptProvision(value) {
    adopt(value, getPointer(0, this));
  }
  _disownProvision() {
    return disown(this.provision);
  }
  /**
  * Identifies the provided object to be picked up.
  *
  */
  get provision() {
    return getPointer(0, this);
  }
  _hasProvision() {
    return !isNull(getPointer(0, this));
  }
  set provision(value) {
    copyFrom(value, getPointer(0, this));
  }
  /**
  * If true, this accept shall be temporarily embargoed.  The resulting `Return` will not be sent,
  * and any pipelined calls will not be delivered, until the embargo is released.  The receiver
  * (the capability host) will expect the provider (the vat that sent the `Provide` message) to
  * eventually send a `Disembargo` message with the field `context.provide` set to the question ID
  * of the original `Provide` message.  At that point, the embargo is released and the queued
  * messages are delivered.
  *
  * For example:
  * - Alice, in Vat A, holds a promise P, which currently points toward Vat B.
  * - Alice calls foo() on P.  The `Call` message is sent to Vat B.
  * - The promise P in Vat B ends up resolving to Carol, in Vat C.
  * - Vat B sends a `Provide` message to Vat C, identifying Vat A as the recipient.
  * - Vat B sends a `Resolve` message to Vat A, indicating that the promise has resolved to a
  *   `ThirdPartyCapId` identifying Carol in Vat C.
  * - Vat A sends an `Accept` message to Vat C to pick up the capability.  Since Vat A knows that
  *   it has an outstanding call to the promise, it sets `embargo` to `true` in the `Accept`
  *   message.
  * - Vat A sends a `Disembargo` message to Vat B on promise P, with `context.accept` set.
  * - Alice makes a call bar() to promise P, which is now pointing towards Vat C.  Alice doesn't
  *   know anything about the mechanics of promise resolution happening under the hood, but she
  *   expects that bar() will be delivered after foo() because that is the order in which she
  *   initiated the calls.
  * - Vat A sends the bar() call to Vat C, as a pipelined call on the result of the `Accept` (which
  *   hasn't returned yet, due to the embargo).  Since calls to the newly-accepted capability
  *   are embargoed, Vat C does not deliver the call yet.
  * - At some point, Vat B forwards the foo() call from the beginning of this example on to Vat C.
  * - Vat B forwards the `Disembargo` from Vat A on to vat C.  It sets `context.provide` to the
  *   question ID of the `Provide` message it had sent previously.
  * - Vat C receives foo() before `Disembargo`, thus allowing it to correctly deliver foo()
  *   before delivering bar().
  * - Vat C receives `Disembargo` from Vat B.  It can now send a `Return` for the `Accept` from
  *   Vat A, as well as deliver bar().
  *
  */
  get embargo() {
    return getBit(32, this);
  }
  set embargo(value) {
    setBit(32, value, this);
  }
  toString() {
    return "Accept_" + super.toString();
  }
}
class Join extends Struct {
  static _capnp = {
    displayName: "Join",
    id: "fbe1980490e001af",
    size: new ObjectSize(8, 2)
  };
  /**
  * Question ID used to respond to this Join.  (Note that this ID only identifies one part of the
  * request for one hop; each part has a different ID and relayed copies of the request have
  * (probably) different IDs still.)
  *
  * The receiver will reply with a `Return` whose `results` is a JoinResult.  This `JoinResult`
  * is relayed from the joined object's host, possibly with transformation applied as needed
  * by the network.
  *
  * Like any return, the result must be released using a `Finish`.  However, this release
  * should not occur until the joiner has either successfully connected to the joined object.
  * Vats relaying a `Join` message similarly must not release the result they receive until the
  * return they relayed back towards the joiner has itself been released.  This allows the
  * joined object's host to detect when the Join operation is canceled before completing -- if
  * it receives a `Finish` for one of the join results before the joiner successfully
  * connects.  It can then free any resources it had allocated as part of the join.
  *
  */
  get questionId() {
    return getUint32(0, this);
  }
  set questionId(value) {
    setUint32(0, value, this);
  }
  _adoptTarget(value) {
    adopt(value, getPointer(0, this));
  }
  _disownTarget() {
    return disown(this.target);
  }
  /**
  * The capability to join.
  *
  */
  get target() {
    return getStruct(0, MessageTarget, this);
  }
  _hasTarget() {
    return !isNull(getPointer(0, this));
  }
  _initTarget() {
    return initStructAt(0, MessageTarget, this);
  }
  set target(value) {
    copyFrom(value, getPointer(0, this));
  }
  _adoptKeyPart(value) {
    adopt(value, getPointer(1, this));
  }
  _disownKeyPart() {
    return disown(this.keyPart);
  }
  /**
  * A part of the join key.  These combine to form the complete join key, which is used to establish
  * a direct connection.
  *
  */
  get keyPart() {
    return getPointer(1, this);
  }
  _hasKeyPart() {
    return !isNull(getPointer(1, this));
  }
  set keyPart(value) {
    copyFrom(value, getPointer(1, this));
  }
  toString() {
    return "Join_" + super.toString();
  }
}
const MessageTarget_Which = {
  /**
  * This message is to a capability or promise previously imported by the caller (exported by
  * the receiver).
  *
  */
  IMPORTED_CAP: 0,
  /**
  * This message is to a capability that is expected to be returned by another call that has not
  * yet been completed.
  *
  * At level 0, this is supported only for addressing the result of a previous `Bootstrap`, so
  * that initial startup doesn't require a round trip.
  *
  */
  PROMISED_ANSWER: 1
};
class MessageTarget extends Struct {
  static IMPORTED_CAP = MessageTarget_Which.IMPORTED_CAP;
  static PROMISED_ANSWER = MessageTarget_Which.PROMISED_ANSWER;
  static _capnp = {
    displayName: "MessageTarget",
    id: "95bc14545813fbc1",
    size: new ObjectSize(8, 1)
  };
  /**
  * This message is to a capability or promise previously imported by the caller (exported by
  * the receiver).
  *
  */
  get importedCap() {
    testWhich("importedCap", getUint16(4, this), 0, this);
    return getUint32(0, this);
  }
  get _isImportedCap() {
    return getUint16(4, this) === 0;
  }
  set importedCap(value) {
    setUint16(4, 0, this);
    setUint32(0, value, this);
  }
  _adoptPromisedAnswer(value) {
    setUint16(4, 1, this);
    adopt(value, getPointer(0, this));
  }
  _disownPromisedAnswer() {
    return disown(this.promisedAnswer);
  }
  /**
  * This message is to a capability that is expected to be returned by another call that has not
  * yet been completed.
  *
  * At level 0, this is supported only for addressing the result of a previous `Bootstrap`, so
  * that initial startup doesn't require a round trip.
  *
  */
  get promisedAnswer() {
    testWhich("promisedAnswer", getUint16(4, this), 1, this);
    return getStruct(0, PromisedAnswer, this);
  }
  _hasPromisedAnswer() {
    return !isNull(getPointer(0, this));
  }
  _initPromisedAnswer() {
    setUint16(4, 1, this);
    return initStructAt(0, PromisedAnswer, this);
  }
  get _isPromisedAnswer() {
    return getUint16(4, this) === 1;
  }
  set promisedAnswer(value) {
    setUint16(4, 1, this);
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "MessageTarget_" + super.toString();
  }
  which() {
    return getUint16(4, this);
  }
}
class Payload extends Struct {
  static _capnp = {
    displayName: "Payload",
    id: "9a0e61223d96743b",
    size: new ObjectSize(0, 2)
  };
  static _CapTable;
  _adoptContent(value) {
    adopt(value, getPointer(0, this));
  }
  _disownContent() {
    return disown(this.content);
  }
  /**
  * Some Cap'n Proto data structure.  Capability pointers embedded in this structure index into
  * `capTable`.
  *
  */
  get content() {
    return getPointer(0, this);
  }
  _hasContent() {
    return !isNull(getPointer(0, this));
  }
  set content(value) {
    copyFrom(value, getPointer(0, this));
  }
  _adoptCapTable(value) {
    adopt(value, getPointer(1, this));
  }
  _disownCapTable() {
    return disown(this.capTable);
  }
  /**
  * Descriptors corresponding to the cap pointers in `content`.
  *
  */
  get capTable() {
    return getList(1, Payload._CapTable, this);
  }
  _hasCapTable() {
    return !isNull(getPointer(1, this));
  }
  _initCapTable(length) {
    return initList(1, Payload._CapTable, length, this);
  }
  set capTable(value) {
    copyFrom(value, getPointer(1, this));
  }
  toString() {
    return "Payload_" + super.toString();
  }
}
const CapDescriptor_Which = {
  /**
  * There is no capability here.  This `CapDescriptor` should not appear in the payload content.
  * A `none` CapDescriptor can be generated when an application inserts a capability into a
  * message and then later changes its mind and removes it -- rewriting all of the other
  * capability pointers may be hard, so instead a tombstone is left, similar to the way a removed
  * struct or list instance is zeroed out of the message but the space is not reclaimed.
  * Hopefully this is unusual.
  *
  */
  NONE: 0,
  /**
  * The ID of a capability in the sender's export table (receiver's import table).  It may be a
  * newly allocated table entry, or an existing entry (increments the reference count).
  *
  */
  SENDER_HOSTED: 1,
  /**
  * A promise that the sender will resolve later.  The sender will send exactly one Resolve
  * message at a future point in time to replace this promise.  Note that even if the same
  * `senderPromise` is received multiple times, only one `Resolve` is sent to cover all of
  * them.  If `senderPromise` is released before the `Resolve` is sent, the sender (of this
  * `CapDescriptor`) may choose not to send the `Resolve` at all.
  *
  */
  SENDER_PROMISE: 2,
  /**
  * A capability (or promise) previously exported by the receiver (imported by the sender).
  *
  */
  RECEIVER_HOSTED: 3,
  /**
  * A capability expected to be returned in the results of a currently-outstanding call posed
  * by the sender.
  *
  */
  RECEIVER_ANSWER: 4,
  /**
  * **(level 3)**
  *
  * A capability that lives in neither the sender's nor the receiver's vat.  The sender needs
  * to form a direct connection to a third party to pick up the capability.
  *
  * Level 1 and 2 implementations that receive a `thirdPartyHosted` may simply send calls to its
  * `vine` instead.
  *
  */
  THIRD_PARTY_HOSTED: 5
};
class CapDescriptor extends Struct {
  static NONE = CapDescriptor_Which.NONE;
  static SENDER_HOSTED = CapDescriptor_Which.SENDER_HOSTED;
  static SENDER_PROMISE = CapDescriptor_Which.SENDER_PROMISE;
  static RECEIVER_HOSTED = CapDescriptor_Which.RECEIVER_HOSTED;
  static RECEIVER_ANSWER = CapDescriptor_Which.RECEIVER_ANSWER;
  static THIRD_PARTY_HOSTED = CapDescriptor_Which.THIRD_PARTY_HOSTED;
  static _capnp = {
    displayName: "CapDescriptor",
    id: "8523ddc40b86b8b0",
    size: new ObjectSize(8, 1),
    defaultAttachedFd: getUint8Mask(255)
  };
  get _isNone() {
    return getUint16(0, this) === 0;
  }
  set none(_) {
    setUint16(0, 0, this);
  }
  /**
  * The ID of a capability in the sender's export table (receiver's import table).  It may be a
  * newly allocated table entry, or an existing entry (increments the reference count).
  *
  */
  get senderHosted() {
    testWhich("senderHosted", getUint16(0, this), 1, this);
    return getUint32(4, this);
  }
  get _isSenderHosted() {
    return getUint16(0, this) === 1;
  }
  set senderHosted(value) {
    setUint16(0, 1, this);
    setUint32(4, value, this);
  }
  /**
  * A promise that the sender will resolve later.  The sender will send exactly one Resolve
  * message at a future point in time to replace this promise.  Note that even if the same
  * `senderPromise` is received multiple times, only one `Resolve` is sent to cover all of
  * them.  If `senderPromise` is released before the `Resolve` is sent, the sender (of this
  * `CapDescriptor`) may choose not to send the `Resolve` at all.
  *
  */
  get senderPromise() {
    testWhich("senderPromise", getUint16(0, this), 2, this);
    return getUint32(4, this);
  }
  get _isSenderPromise() {
    return getUint16(0, this) === 2;
  }
  set senderPromise(value) {
    setUint16(0, 2, this);
    setUint32(4, value, this);
  }
  /**
  * A capability (or promise) previously exported by the receiver (imported by the sender).
  *
  */
  get receiverHosted() {
    testWhich("receiverHosted", getUint16(0, this), 3, this);
    return getUint32(4, this);
  }
  get _isReceiverHosted() {
    return getUint16(0, this) === 3;
  }
  set receiverHosted(value) {
    setUint16(0, 3, this);
    setUint32(4, value, this);
  }
  _adoptReceiverAnswer(value) {
    setUint16(0, 4, this);
    adopt(value, getPointer(0, this));
  }
  _disownReceiverAnswer() {
    return disown(this.receiverAnswer);
  }
  /**
  * A capability expected to be returned in the results of a currently-outstanding call posed
  * by the sender.
  *
  */
  get receiverAnswer() {
    testWhich("receiverAnswer", getUint16(0, this), 4, this);
    return getStruct(0, PromisedAnswer, this);
  }
  _hasReceiverAnswer() {
    return !isNull(getPointer(0, this));
  }
  _initReceiverAnswer() {
    setUint16(0, 4, this);
    return initStructAt(0, PromisedAnswer, this);
  }
  get _isReceiverAnswer() {
    return getUint16(0, this) === 4;
  }
  set receiverAnswer(value) {
    setUint16(0, 4, this);
    copyFrom(value, getPointer(0, this));
  }
  _adoptThirdPartyHosted(value) {
    setUint16(0, 5, this);
    adopt(value, getPointer(0, this));
  }
  _disownThirdPartyHosted() {
    return disown(this.thirdPartyHosted);
  }
  /**
  * **(level 3)**
  *
  * A capability that lives in neither the sender's nor the receiver's vat.  The sender needs
  * to form a direct connection to a third party to pick up the capability.
  *
  * Level 1 and 2 implementations that receive a `thirdPartyHosted` may simply send calls to its
  * `vine` instead.
  *
  */
  get thirdPartyHosted() {
    testWhich("thirdPartyHosted", getUint16(0, this), 5, this);
    return getStruct(0, ThirdPartyCapDescriptor, this);
  }
  _hasThirdPartyHosted() {
    return !isNull(getPointer(0, this));
  }
  _initThirdPartyHosted() {
    setUint16(0, 5, this);
    return initStructAt(0, ThirdPartyCapDescriptor, this);
  }
  get _isThirdPartyHosted() {
    return getUint16(0, this) === 5;
  }
  set thirdPartyHosted(value) {
    setUint16(0, 5, this);
    copyFrom(value, getPointer(0, this));
  }
  /**
  * If the RPC message in which this CapDescriptor was delivered also had file descriptors
  * attached, and `fd` is a valid index into the list of attached file descriptors, then
  * that file descriptor should be attached to this capability. If `attachedFd` is out-of-bounds
  * for said list, then no FD is attached.
  *
  * For example, if the RPC message arrived over a Unix socket, then file descriptors may be
  * attached by sending an SCM_RIGHTS ancillary message attached to the data bytes making up the
  * raw message. Receivers who wish to opt into FD passing should arrange to receive SCM_RIGHTS
  * whenever receiving an RPC message. Senders who wish to send FDs need not verify whether the
  * receiver knows how to receive them, because the operating system will automatically discard
  * ancillary messages like SCM_RIGHTS if the receiver doesn't ask to receive them, including
  * automatically closing any FDs.
  *
  * It is up to the application protocol to define what capabilities are expected to have file
  * descriptors attached, and what those FDs mean. But, for example, an application could use this
  * to open a file on disk and then transmit the open file descriptor to a sandboxed process that
  * does not otherwise have permission to access the filesystem directly. This is usually an
  * optimization: the sending process could instead provide an RPC interface supporting all the
  * operations needed (such as reading and writing a file), but by passing the file descriptor
  * directly, the recipient can often perform operations much more efficiently. Application
  * designers are encouraged to provide such RPC interfaces and automatically fall back to them
  * when FD passing is not available, so that the application can still work when the parties are
  * remote over a network.
  *
  * An attached FD is most often associated with a `senderHosted` descriptor. It could also make
  * sense in the case of `thirdPartyHosted`: in this case, the sender is forwarding the FD that
  * they received from the third party, so that the receiver can start using it without first
  * interacting with the third party. This is an optional optimization -- the middleman may choose
  * not to forward capabilities, in which case the receiver will need to complete the handshake
  * with the third party directly before receiving the FD. If an implementation receives a second
  * attached FD after having already received one previously (e.g. both in a `thirdPartyHosted`
  * CapDescriptor and then later again when receiving the final capability directly from the
  * third party), the implementation should discard the later FD and stick with the original. At
  * present, there is no known reason why other capability types (e.g. `receiverHosted`) would want
  * to carry an attached FD, but we reserve the right to define a meaning for this in the future.
  *
  * Each file descriptor attached to the message must be used in no more than one CapDescriptor,
  * so that the receiver does not need to use dup() or refcounting to handle the possibility of
  * multiple capabilities using the same descriptor. If multiple CapDescriptors do point to the
  * same FD index, then the receiver can arbitrarily choose which capability ends up having the
  * FD attached.
  *
  * To mitigate DoS attacks, RPC implementations should limit the number of FDs they are willing to
  * receive in a single message to a small value. If a message happens to contain more than that,
  * the list is truncated. Moreover, in some cases, FD passing needs to be blocked entirely for
  * security or implementation reasons, in which case the list may be truncated to zero. Hence,
  * `attachedFd` might point past the end of the list, which the implementation should treat as if
  * no FD was attached at all.
  *
  * The type of this field was chosen to be UInt8 because Linux supports sending only a maximum
  * of 253 file descriptors in an SCM_RIGHTS message anyway, and CapDescriptor had two bytes of
  * padding left -- so after adding this, there is still one byte for a future feature.
  * Conveniently, this also means we're able to use 0xff as the default value, which will always
  * be out-of-range (of course, the implementation should explicitly enforce that 255 descriptors
  * cannot be sent at once, rather than relying on Linux to do so).
  *
  */
  get attachedFd() {
    return getUint8(2, this, CapDescriptor._capnp.defaultAttachedFd);
  }
  set attachedFd(value) {
    setUint8(2, value, this, CapDescriptor._capnp.defaultAttachedFd);
  }
  toString() {
    return "CapDescriptor_" + super.toString();
  }
  which() {
    return getUint16(0, this);
  }
}
const PromisedAnswer_Op_Which = {
  /**
  * Does nothing.  This member is mostly defined so that we can make `Op` a union even
  * though (as of this writing) only one real operation is defined.
  *
  */
  NOOP: 0,
  /**
  * Get a pointer field within a struct.  The number is an index into the pointer section, NOT
  * a field ordinal, so that the receiver does not need to understand the schema.
  *
  */
  GET_POINTER_FIELD: 1
};
class PromisedAnswer_Op extends Struct {
  static NOOP = PromisedAnswer_Op_Which.NOOP;
  static GET_POINTER_FIELD = PromisedAnswer_Op_Which.GET_POINTER_FIELD;
  static _capnp = {
    displayName: "Op",
    id: "f316944415569081",
    size: new ObjectSize(8, 0)
  };
  get _isNoop() {
    return getUint16(0, this) === 0;
  }
  set noop(_) {
    setUint16(0, 0, this);
  }
  /**
  * Get a pointer field within a struct.  The number is an index into the pointer section, NOT
  * a field ordinal, so that the receiver does not need to understand the schema.
  *
  */
  get getPointerField() {
    testWhich("getPointerField", getUint16(0, this), 1, this);
    return getUint16(2, this);
  }
  get _isGetPointerField() {
    return getUint16(0, this) === 1;
  }
  set getPointerField(value) {
    setUint16(0, 1, this);
    setUint16(2, value, this);
  }
  toString() {
    return "PromisedAnswer_Op_" + super.toString();
  }
  which() {
    return getUint16(0, this);
  }
}
class PromisedAnswer extends Struct {
  static Op = PromisedAnswer_Op;
  static _capnp = {
    displayName: "PromisedAnswer",
    id: "d800b1d6cd6f1ca0",
    size: new ObjectSize(8, 1)
  };
  static _Transform;
  /**
  * ID of the question (in the sender's question table / receiver's answer table) whose answer is
  * expected to contain the capability.
  *
  */
  get questionId() {
    return getUint32(0, this);
  }
  set questionId(value) {
    setUint32(0, value, this);
  }
  _adoptTransform(value) {
    adopt(value, getPointer(0, this));
  }
  _disownTransform() {
    return disown(this.transform);
  }
  /**
  * Operations / transformations to apply to the result in order to get the capability actually
  * being addressed.  E.g. if the result is a struct and you want to call a method on a capability
  * pointed to by a field of the struct, you need a `getPointerField` op.
  *
  */
  get transform() {
    return getList(0, PromisedAnswer._Transform, this);
  }
  _hasTransform() {
    return !isNull(getPointer(0, this));
  }
  _initTransform(length) {
    return initList(0, PromisedAnswer._Transform, length, this);
  }
  set transform(value) {
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "PromisedAnswer_" + super.toString();
  }
}
class ThirdPartyCapDescriptor extends Struct {
  static _capnp = {
    displayName: "ThirdPartyCapDescriptor",
    id: "d37007fde1f0027d",
    size: new ObjectSize(8, 1)
  };
  _adoptId(value) {
    adopt(value, getPointer(0, this));
  }
  _disownId() {
    return disown(this.id);
  }
  /**
  * Identifies the third-party host and the specific capability to accept from it.
  *
  */
  get id() {
    return getPointer(0, this);
  }
  _hasId() {
    return !isNull(getPointer(0, this));
  }
  set id(value) {
    copyFrom(value, getPointer(0, this));
  }
  /**
  * A proxy for the third-party object exported by the sender.  In CapTP terminology this is called
  * a "vine", because it is an indirect reference to the third-party object that snakes through the
  * sender vat.  This serves two purposes:
  *
  * * Level 1 and 2 implementations that don't understand how to connect to a third party may
  *   simply send calls to the vine.  Such calls will be forwarded to the third-party by the
  *   sender.
  *
  * * Level 3 implementations must release the vine only once they have successfully picked up the
  *   object from the third party.  This ensures that the capability is not released by the sender
  *   prematurely.
  *
  * The sender will close the `Provide` request that it has sent to the third party as soon as
  * it receives either a `Call` or a `Release` message directed at the vine.
  *
  */
  get vineId() {
    return getUint32(0, this);
  }
  set vineId(value) {
    setUint32(0, value, this);
  }
  toString() {
    return "ThirdPartyCapDescriptor_" + super.toString();
  }
}
const Exception_Type = {
  /**
  * A generic problem occurred, and it is believed that if the operation were repeated without
  * any change in the state of the world, the problem would occur again.
  *
  * A client might respond to this error by logging it for investigation by the developer and/or
  * displaying it to the user.
  *
  */
  FAILED: 0,
  /**
  * The request was rejected due to a temporary lack of resources.
  *
  * Examples include:
  * - There's not enough CPU time to keep up with incoming requests, so some are rejected.
  * - The server ran out of RAM or disk space during the request.
  * - The operation timed out (took significantly longer than it should have).
  *
  * A client might respond to this error by scheduling to retry the operation much later. The
  * client should NOT retry again immediately since this would likely exacerbate the problem.
  *
  */
  OVERLOADED: 1,
  /**
  * The method failed because a connection to some necessary capability was lost.
  *
  * Examples include:
  * - The client introduced the server to a third-party capability, the connection to that third
  *   party was subsequently lost, and then the client requested that the server use the dead
  *   capability for something.
  * - The client previously requested that the server obtain a capability from some third party.
  *   The server returned a capability to an object wrapping the third-party capability. Later,
  *   the server's connection to the third party was lost.
  * - The capability has been revoked. Revocation does not necessarily mean that the client is
  *   no longer authorized to use the capability; it is often used simply as a way to force the
  *   client to repeat the setup process, perhaps to efficiently move them to a new back-end or
  *   get them to recognize some other change that has occurred.
  *
  * A client should normally respond to this error by releasing all capabilities it is currently
  * holding related to the one it called and then re-creating them by restoring SturdyRefs and/or
  * repeating the method calls used to create them originally. In other words, disconnect and
  * start over. This should in turn cause the server to obtain a new copy of the capability that
  * it lost, thus making everything work.
  *
  * If the client receives another `disconnected` error in the process of rebuilding the
  * capability and retrying the call, it should treat this as an `overloaded` error: the network
  * is currently unreliable, possibly due to load or other temporary issues.
  *
  */
  DISCONNECTED: 2,
  /**
  * The server doesn't implement the requested method. If there is some other method that the
  * client could call (perhaps an older and/or slower interface), it should try that instead.
  * Otherwise, this should be treated like `failed`.
  *
  */
  UNIMPLEMENTED: 3
};
class Exception extends Struct {
  static Type = Exception_Type;
  static _capnp = {
    displayName: "Exception",
    id: "d625b7063acf691a",
    size: new ObjectSize(8, 2)
  };
  /**
  * Human-readable failure description.
  *
  */
  get reason() {
    return getText(0, this);
  }
  set reason(value) {
    setText(0, value, this);
  }
  /**
  * The type of the error. The purpose of this enum is not to describe the error itself, but
  * rather to describe how the client might want to respond to the error.
  *
  */
  get type() {
    return getUint16(4, this);
  }
  set type(value) {
    setUint16(4, value, this);
  }
  /**
  * OBSOLETE. Ignore.
  *
  */
  get obsoleteIsCallersFault() {
    return getBit(0, this);
  }
  set obsoleteIsCallersFault(value) {
    setBit(0, value, this);
  }
  /**
  * OBSOLETE. See `type` instead.
  *
  */
  get obsoleteDurability() {
    return getUint16(2, this);
  }
  set obsoleteDurability(value) {
    setUint16(2, value, this);
  }
  /**
  * Stack trace text from the remote server. The format is not specified. By default,
  * implementations do not provide stack traces; the application must explicitly enable them
  * when desired.
  *
  */
  get trace() {
    return getText(1, this);
  }
  set trace(value) {
    setText(1, value, this);
  }
  toString() {
    return "Exception_" + super.toString();
  }
}
Payload._CapTable = CompositeList(CapDescriptor);
PromisedAnswer._Transform = CompositeList(PromisedAnswer_Op);

export { Accept, Bootstrap, Call, Call_SendResultsTo, Call_SendResultsTo_Which, CapDescriptor, CapDescriptor_Which, Disembargo, Disembargo_Context, Disembargo_Context_Which, Exception, Exception_Type, Finish, Join, Message, MessageTarget, MessageTarget_Which, Message_Which, Payload, PromisedAnswer, PromisedAnswer_Op, PromisedAnswer_Op_Which, Provide, Release, Resolve, Resolve_Which, Return, Return_Which, ThirdPartyCapDescriptor, _capnpFileId };
