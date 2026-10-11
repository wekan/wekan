declare enum ListElementSize {
    VOID = 0,
    BIT = 1,
    BYTE = 2,
    BYTE_2 = 3,
    BYTE_4 = 4,
    BYTE_8 = 5,
    POINTER = 6,
    COMPOSITE = 7
}

/**
 * A simple object that describes the size of a struct.
 */
declare class ObjectSize {
    readonly dataByteLength: number;
    readonly pointerLength: number;
    /**
     * Creates a new ObjectSize instance.
     *
     * @param dataByteLength - The number of bytes in the data section of the struct
     * @param pointerLength - The number of pointers in the pointer section of the struct
     */
    constructor(dataByteLength: number, pointerLength: number);
    toString(): string;
}

interface _PointerCtor {
    readonly displayName: string;
}
interface PointerCtor<T extends Pointer> {
    readonly _capnp: _PointerCtor;
    new (segment: Segment, byteOffset: number, depthLimit?: number): T;
}
declare enum PointerType {
    STRUCT = 0,
    LIST = 1,
    FAR = 2,
    OTHER = 3
}
interface _Pointer {
    compositeIndex?: number;
    compositeList: boolean;
    /**
     * A number that is decremented as nested pointers are traversed. When this hits zero errors will be thrown.
     */
    depthLimit: number;
}
/**
 * A pointer referencing a single byte location in a segment. This is typically used for Cap'n Proto pointers, but is
 * also sometimes used to reference an offset to a pointer's content or tag words.
 */
declare class Pointer<T extends _Pointer = _Pointer> {
    static readonly _capnp: _PointerCtor;
    readonly _capnp: T;
    /** Offset, in bytes, from the start of the segment to the beginning of this pointer. */
    byteOffset: number;
    /**
     * The starting segment for this pointer's data. In the case of a far pointer, the actual content this pointer is
     * referencing will be in another segment within the same message.
     */
    segment: Segment;
    constructor(segment: Segment, byteOffset: number, depthLimit?: number);
    [Symbol.toStringTag](): string;
    toString(): string;
}

interface _ListCtor {
    readonly compositeSize?: ObjectSize;
    readonly displayName: string;
    readonly size: ListElementSize;
}
interface ListCtor<T> {
    readonly _capnp: _ListCtor;
    new (segment: Segment, byteOffset: number, depthLimit?: number): List<T>;
}
type ArrayCb<T, RT = boolean> = (this: any, value: T, index: number, array: T[]) => RT;
/**
 * A generic list class. Implements Filterable,
 */
declare class List<T> extends Pointer implements Array<T> {
    #private;
    static readonly _capnp: _ListCtor;
    [n: number]: T;
    constructor(segment: Segment, byteOffset: number, depthLimit?: number);
    get length(): number;
    toArray(): T[];
    get(_index: number): T;
    set(_index: number, _value: T): void;
    at(index: number): T;
    concat(other: T[]): T[];
    some(cb: ArrayCb<T>, _this?: any): boolean;
    filter(cb: ArrayCb<T>, _this?: any): T[];
    find(cb: ArrayCb<T>, _this?: any): T | undefined;
    findIndex(cb: (v: T, i: number, arr: T[]) => boolean, _this?: any): number;
    forEach(cb: ArrayCb<T, void>, _this?: any): void;
    map<U>(cb: ArrayCb<T, U>, _this?: any): U[];
    flatMap<U>(cb: ArrayCb<T, U | U[]>, _this?: any): U[];
    every<S extends T>(cb: (v: T, i: number) => v is S, t?: any): this is S[];
    reduce(cb: (p: T, c: T, i: number, a: T[]) => T, initialValue?: T): T;
    reduceRight(cb: (p: T, c: T, i: number, a: T[]) => T, initialValue?: T): T;
    slice(start?: number, end?: number): T[];
    join(separator?: string): string;
    toReversed(): T[];
    toSorted(compareFn?: ((a: T, b: T) => number) | undefined): T[];
    toSpliced(start: number, deleteCount: number, ...items: T[]): T[];
    fill(value: T, start?: number, end?: number): this;
    copyWithin(target: number, start: number, end?: number): this;
    keys(): ArrayIterator<number>;
    values(): ArrayIterator<T>;
    entries(): ArrayIterator<[number, T]>;
    flat<A, D extends number = 1>(this: A, depth?: D): FlatArray<A, D>[];
    with(index: number, value: T): T[];
    includes(_searchElement: T, _fromIndex?: number): boolean;
    findLast(_cb: unknown, _thisArg?: unknown): T | undefined;
    findLastIndex(_cb: (v: T, i: number, a: T[]) => unknown, _t?: any): number;
    indexOf(_searchElement: T, _fromIndex?: number): number;
    lastIndexOf(_searchElement: T, _fromIndex?: number): number;
    pop(): T | undefined;
    push(..._items: T[]): number;
    reverse(): T[];
    shift(): T | undefined;
    unshift(..._items: T[]): number;
    splice(_start: unknown, _deleteCount?: unknown, ..._rest: unknown[]): T[];
    sort(_fn?: ((a: T, b: T) => number) | undefined): this;
    get [Symbol.unscopables](): {
        [x: number]: boolean | undefined;
        length?: boolean | undefined;
        toString?: boolean | undefined;
        toLocaleString?: boolean | undefined;
        pop?: boolean | undefined;
        push?: boolean | undefined;
        concat?: boolean | undefined;
        join?: boolean | undefined;
        reverse?: boolean | undefined;
        shift?: boolean | undefined;
        slice?: boolean | undefined;
        sort?: boolean | undefined;
        splice?: boolean | undefined;
        unshift?: boolean | undefined;
        indexOf?: boolean | undefined;
        lastIndexOf?: boolean | undefined;
        every?: boolean | undefined;
        some?: boolean | undefined;
        forEach?: boolean | undefined;
        map?: boolean | undefined;
        filter?: boolean | undefined;
        reduce?: boolean | undefined;
        reduceRight?: boolean | undefined;
        find?: boolean | undefined;
        findIndex?: boolean | undefined;
        fill?: boolean | undefined;
        copyWithin?: boolean | undefined;
        entries?: boolean | undefined;
        keys?: boolean | undefined;
        values?: boolean | undefined;
        includes?: boolean | undefined;
        flatMap?: boolean | undefined;
        flat?: boolean | undefined;
        at?: boolean | undefined;
        findLast?: boolean | undefined;
        findLastIndex?: boolean | undefined;
        toReversed?: boolean | undefined;
        toSorted?: boolean | undefined;
        toSpliced?: boolean | undefined;
        with?: boolean | undefined;
        [Symbol.iterator]?: boolean | undefined;
        readonly [Symbol.unscopables]?: boolean | undefined;
    };
    [Symbol.iterator](): ArrayIterator<T>;
    toJSON(): unknown;
    toString(): string;
    toLocaleString(_locales?: unknown, _options?: unknown): string;
    [Symbol.toStringTag](): string;
    static [Symbol.toStringTag](): string;
}

declare const _capnpFileId = 12903543124727603792n;
/**
* An RPC connection is a bi-directional stream of Messages.
*
*/
declare const Message_Which: {
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
    readonly UNIMPLEMENTED: 0;
    /**
  * Sent when a connection is being aborted due to an unrecoverable error.  This could be e.g.
  * because the sender received an invalid or nonsensical message or because the sender had an
  * internal error.  The sender will shut down the outgoing half of the connection after `abort`
  * and will completely close the connection shortly thereafter (it's up to the sender how much
  * of a time buffer they want to offer for the client to receive the `abort` before the
  * connection is reset).
  *
  */
    readonly ABORT: 1;
    /**
  * Request the peer's bootstrap interface.
  *
  */
    readonly BOOTSTRAP: 8;
    /**
  * Begin a method call.
  *
  */
    readonly CALL: 2;
    /**
  * Complete a method call.
  *
  */
    readonly RETURN: 3;
    /**
  * Release a returned answer / cancel a call.
  *
  */
    readonly FINISH: 4;
    /**
  * Resolve a previously-sent promise.
  *
  */
    readonly RESOLVE: 5;
    /**
  * Release a capability so that the remote object can be deallocated.
  *
  */
    readonly RELEASE: 6;
    /**
  * Lift an embargo used to enforce E-order over promise resolution.
  *
  */
    readonly DISEMBARGO: 13;
    /**
  * Obsolete request to save a capability, resulting in a SturdyRef. This has been replaced
  * by the `Persistent` interface defined in `persistent.capnp`. This operation was never
  * implemented.
  *
  */
    readonly OBSOLETE_SAVE: 7;
    /**
  * Obsolete way to delete a SturdyRef. This operation was never implemented.
  *
  */
    readonly OBSOLETE_DELETE: 9;
    /**
  * Provide a capability to a third party.
  *
  */
    readonly PROVIDE: 10;
    /**
  * Accept a capability provided by a third party.
  *
  */
    readonly ACCEPT: 11;
    /**
  * Directly connect to the common root of two or more proxied caps.
  *
  */
    readonly JOIN: 12;
};
type Message_Which = (typeof Message_Which)[keyof typeof Message_Which];
/**
* An RPC connection is a bi-directional stream of Messages.
*
*/
declare class Message$1 extends Struct {
    static readonly UNIMPLEMENTED: 0;
    static readonly ABORT: 1;
    static readonly BOOTSTRAP: 8;
    static readonly CALL: 2;
    static readonly RETURN: 3;
    static readonly FINISH: 4;
    static readonly RESOLVE: 5;
    static readonly RELEASE: 6;
    static readonly DISEMBARGO: 13;
    static readonly OBSOLETE_SAVE: 7;
    static readonly OBSOLETE_DELETE: 9;
    static readonly PROVIDE: 10;
    static readonly ACCEPT: 11;
    static readonly JOIN: 12;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    _adoptUnimplemented(value: Orphan<Message$1>): void;
    _disownUnimplemented(): Orphan<Message$1>;
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
    get unimplemented(): Message$1;
    _hasUnimplemented(): boolean;
    _initUnimplemented(): Message$1;
    get _isUnimplemented(): boolean;
    set unimplemented(value: Message$1);
    _adoptAbort(value: Orphan<Exception>): void;
    _disownAbort(): Orphan<Exception>;
    /**
  * Sent when a connection is being aborted due to an unrecoverable error.  This could be e.g.
  * because the sender received an invalid or nonsensical message or because the sender had an
  * internal error.  The sender will shut down the outgoing half of the connection after `abort`
  * and will completely close the connection shortly thereafter (it's up to the sender how much
  * of a time buffer they want to offer for the client to receive the `abort` before the
  * connection is reset).
  *
  */
    get abort(): Exception;
    _hasAbort(): boolean;
    _initAbort(): Exception;
    get _isAbort(): boolean;
    set abort(value: Exception);
    _adoptBootstrap(value: Orphan<Bootstrap>): void;
    _disownBootstrap(): Orphan<Bootstrap>;
    /**
  * Request the peer's bootstrap interface.
  *
  */
    get bootstrap(): Bootstrap;
    _hasBootstrap(): boolean;
    _initBootstrap(): Bootstrap;
    get _isBootstrap(): boolean;
    set bootstrap(value: Bootstrap);
    _adoptCall(value: Orphan<Call$1>): void;
    _disownCall(): Orphan<Call$1>;
    /**
  * Begin a method call.
  *
  */
    get call(): Call$1;
    _hasCall(): boolean;
    _initCall(): Call$1;
    get _isCall(): boolean;
    set call(value: Call$1);
    _adoptReturn(value: Orphan<Return>): void;
    _disownReturn(): Orphan<Return>;
    /**
  * Complete a method call.
  *
  */
    get return(): Return;
    _hasReturn(): boolean;
    _initReturn(): Return;
    get _isReturn(): boolean;
    set return(value: Return);
    _adoptFinish(value: Orphan<Finish>): void;
    _disownFinish(): Orphan<Finish>;
    /**
  * Release a returned answer / cancel a call.
  *
  */
    get finish(): Finish;
    _hasFinish(): boolean;
    _initFinish(): Finish;
    get _isFinish(): boolean;
    set finish(value: Finish);
    _adoptResolve(value: Orphan<Resolve>): void;
    _disownResolve(): Orphan<Resolve>;
    /**
  * Resolve a previously-sent promise.
  *
  */
    get resolve(): Resolve;
    _hasResolve(): boolean;
    _initResolve(): Resolve;
    get _isResolve(): boolean;
    set resolve(value: Resolve);
    _adoptRelease(value: Orphan<Release>): void;
    _disownRelease(): Orphan<Release>;
    /**
  * Release a capability so that the remote object can be deallocated.
  *
  */
    get release(): Release;
    _hasRelease(): boolean;
    _initRelease(): Release;
    get _isRelease(): boolean;
    set release(value: Release);
    _adoptDisembargo(value: Orphan<Disembargo>): void;
    _disownDisembargo(): Orphan<Disembargo>;
    /**
  * Lift an embargo used to enforce E-order over promise resolution.
  *
  */
    get disembargo(): Disembargo;
    _hasDisembargo(): boolean;
    _initDisembargo(): Disembargo;
    get _isDisembargo(): boolean;
    set disembargo(value: Disembargo);
    _adoptObsoleteSave(value: Orphan<Pointer>): void;
    _disownObsoleteSave(): Orphan<Pointer>;
    /**
  * Obsolete request to save a capability, resulting in a SturdyRef. This has been replaced
  * by the `Persistent` interface defined in `persistent.capnp`. This operation was never
  * implemented.
  *
  */
    get obsoleteSave(): Pointer;
    _hasObsoleteSave(): boolean;
    get _isObsoleteSave(): boolean;
    set obsoleteSave(value: Pointer);
    _adoptObsoleteDelete(value: Orphan<Pointer>): void;
    _disownObsoleteDelete(): Orphan<Pointer>;
    /**
  * Obsolete way to delete a SturdyRef. This operation was never implemented.
  *
  */
    get obsoleteDelete(): Pointer;
    _hasObsoleteDelete(): boolean;
    get _isObsoleteDelete(): boolean;
    set obsoleteDelete(value: Pointer);
    _adoptProvide(value: Orphan<Provide>): void;
    _disownProvide(): Orphan<Provide>;
    /**
  * Provide a capability to a third party.
  *
  */
    get provide(): Provide;
    _hasProvide(): boolean;
    _initProvide(): Provide;
    get _isProvide(): boolean;
    set provide(value: Provide);
    _adoptAccept(value: Orphan<Accept>): void;
    _disownAccept(): Orphan<Accept>;
    /**
  * Accept a capability provided by a third party.
  *
  */
    get accept(): Accept;
    _hasAccept(): boolean;
    _initAccept(): Accept;
    get _isAccept(): boolean;
    set accept(value: Accept);
    _adoptJoin(value: Orphan<Join>): void;
    _disownJoin(): Orphan<Join>;
    /**
  * Directly connect to the common root of two or more proxied caps.
  *
  */
    get join(): Join;
    _hasJoin(): boolean;
    _initJoin(): Join;
    get _isJoin(): boolean;
    set join(value: Join);
    toString(): string;
    which(): Message_Which;
}
/**
* **(level 0)**
*
* Get the "bootstrap" interface exported by the remote vat.
*
* For level 0, 1, and 2 implementations, the "bootstrap" interface is simply the main interface
* exported by a vat. If the vat acts as a server fielding connections from clients, then the
* bootstrap interface defines the basic functionality available to a client when it connects.
* The exact interface definition obviously depends on the application.
*
* We call this a "bootstrap" because in an ideal Cap'n Proto world, bootstrap interfaces would
* never be used. In such a world, any time you connect to a new vat, you do so because you
* received an introduction from some other vat (see `ThirdPartyCapId`). Thus, the first message
* you send is `Accept`, and further communications derive from there. `Bootstrap` is not used.
*
* In such an ideal world, DNS itself would support Cap'n Proto -- performing a DNS lookup would
* actually return a new Cap'n Proto capability, thus introducing you to the target system via
* level 3 RPC. Applications would receive the capability to talk to DNS in the first place as
* an initial endowment or part of a Powerbox interaction. Therefore, an app can form arbitrary
* connections without ever using `Bootstrap`.
*
* Of course, in the real world, DNS is not Cap'n-Proto-based, and we don't want Cap'n Proto to
* require a whole new internet infrastructure to be useful. Therefore, we offer bootstrap
* interfaces as a way to get up and running without a level 3 introduction. Thus, bootstrap
* interfaces are used to "bootstrap" from other, non-Cap'n-Proto-based means of service discovery,
* such as legacy DNS.
*
* Note that a vat need not provide a bootstrap interface, and in fact many vats (especially those
* acting as clients) do not. In this case, the vat should either reply to `Bootstrap` with a
* `Return` indicating an exception, or should return a dummy capability with no methods.
*
*/
declare class Bootstrap extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * A new question ID identifying this request, which will eventually receive a Return message
  * containing the restored capability.
  *
  */
    get questionId(): number;
    set questionId(value: number);
    _adoptDeprecatedObjectId(value: Orphan<Pointer>): void;
    _disownDeprecatedObjectId(): Orphan<Pointer>;
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
    get deprecatedObjectId(): Pointer;
    _hasDeprecatedObjectId(): boolean;
    set deprecatedObjectId(value: Pointer);
    toString(): string;
}
/**
* Where should the return message be sent?
*
*/
declare const Call_SendResultsTo_Which: {
    /**
  * Send the return message back to the caller (the usual).
  *
  */
    readonly CALLER: 0;
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
    readonly YOURSELF: 1;
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
    readonly THIRD_PARTY: 2;
};
type Call_SendResultsTo_Which = (typeof Call_SendResultsTo_Which)[keyof typeof Call_SendResultsTo_Which];
/**
* Where should the return message be sent?
*
*/
declare class Call_SendResultsTo extends Struct {
    static readonly CALLER: 0;
    static readonly YOURSELF: 1;
    static readonly THIRD_PARTY: 2;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    get _isCaller(): boolean;
    set caller(_: true);
    get _isYourself(): boolean;
    set yourself(_: true);
    _adoptThirdParty(value: Orphan<Pointer>): void;
    _disownThirdParty(): Orphan<Pointer>;
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
    get thirdParty(): Pointer;
    _hasThirdParty(): boolean;
    get _isThirdParty(): boolean;
    set thirdParty(value: Pointer);
    toString(): string;
    which(): Call_SendResultsTo_Which;
}
/**
* **(level 0)**
*
* Message type initiating a method call on a capability.
*
*/
declare class Call$1 extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
        defaultAllowThirdPartyTailCall: DataView<ArrayBufferLike>;
        defaultNoPromisePipelining: DataView<ArrayBufferLike>;
        defaultOnlyPromisePipeline: DataView<ArrayBufferLike>;
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
    get questionId(): number;
    set questionId(value: number);
    _adoptTarget(value: Orphan<MessageTarget>): void;
    _disownTarget(): Orphan<MessageTarget>;
    /**
  * The object that should receive this call.
  *
  */
    get target(): MessageTarget;
    _hasTarget(): boolean;
    _initTarget(): MessageTarget;
    set target(value: MessageTarget);
    /**
  * The type ID of the interface being called.  Each capability may implement multiple interfaces.
  *
  */
    get interfaceId(): bigint;
    set interfaceId(value: bigint);
    /**
  * The ordinal number of the method to call within the requested interface.
  *
  */
    get methodId(): number;
    set methodId(value: number);
    /**
  * Indicates whether or not the receiver is allowed to send a `Return` containing
  * `acceptFromThirdParty`.  Level 3 implementations should set this true.  Otherwise, the callee
  * will have to proxy the return in the case of a tail call to a third-party vat.
  *
  */
    get allowThirdPartyTailCall(): boolean;
    set allowThirdPartyTailCall(value: boolean);
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
    get noPromisePipelining(): boolean;
    set noPromisePipelining(value: boolean);
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
    get onlyPromisePipeline(): boolean;
    set onlyPromisePipeline(value: boolean);
    _adoptParams(value: Orphan<Payload>): void;
    _disownParams(): Orphan<Payload>;
    /**
  * The call parameters.  `params.content` is a struct whose fields correspond to the parameters of
  * the method.
  *
  */
    get params(): Payload;
    _hasParams(): boolean;
    _initParams(): Payload;
    set params(value: Payload);
    /**
  * Where should the return message be sent?
  *
  */
    get sendResultsTo(): Call_SendResultsTo;
    _initSendResultsTo(): Call_SendResultsTo;
    toString(): string;
}
/**
* **(level 0)**
*
* Message type sent from callee to caller indicating that the call has completed.
*
*/
declare const Return_Which: {
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
    readonly RESULTS: 0;
    /**
  * Indicates that the call failed and explains why.
  *
  */
    readonly EXCEPTION: 1;
    /**
  * Indicates that the call was canceled due to the caller sending a Finish message
  * before the call had completed.
  *
  */
    readonly CANCELED: 2;
    /**
  * This is set when returning from a `Call` that had `sendResultsTo` set to something other
  * than `caller`.
  *
  * It doesn't matter too much when this is sent, as the receiver doesn't need to do anything
  * with it, but the C++ implementation appears to wait for the call to finish before sending
  * this.
  *
  */
    readonly RESULTS_SENT_ELSEWHERE: 3;
    /**
  * The sender has also sent (before this message) a `Call` with the given question ID and with
  * `sendResultsTo.yourself` set, and the results of that other call should be used as the
  * results here.  `takeFromOtherQuestion` can only used once per question.
  *
  */
    readonly TAKE_FROM_OTHER_QUESTION: 4;
    /**
  * **(level 3)**
  *
  * The caller should contact a third-party vat to pick up the results.  An `Accept` message
  * sent to the vat will return the result.  This pairs with `Call.sendResultsTo.thirdParty`.
  * It should only be used if the corresponding `Call` had `allowThirdPartyTailCall` set.
  *
  */
    readonly ACCEPT_FROM_THIRD_PARTY: 5;
};
type Return_Which = (typeof Return_Which)[keyof typeof Return_Which];
/**
* **(level 0)**
*
* Message type sent from callee to caller indicating that the call has completed.
*
*/
declare class Return extends Struct {
    static readonly RESULTS: 0;
    static readonly EXCEPTION: 1;
    static readonly CANCELED: 2;
    static readonly RESULTS_SENT_ELSEWHERE: 3;
    static readonly TAKE_FROM_OTHER_QUESTION: 4;
    static readonly ACCEPT_FROM_THIRD_PARTY: 5;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
        defaultReleaseParamCaps: DataView<ArrayBufferLike>;
        defaultNoFinishNeeded: DataView<ArrayBufferLike>;
    };
    /**
  * Equal to the QuestionId of the corresponding `Call` message.
  *
  */
    get answerId(): number;
    set answerId(value: number);
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
    get releaseParamCaps(): boolean;
    set releaseParamCaps(value: boolean);
    /**
  * If true, the sender does not need the receiver to send a `Finish` message; its answer table
  * entry has already been cleaned up. This implies that the results do not contain any
  * capabilities, since the `Finish` message would normally release those capabilities from
  * promise pipelining responsibility. The caller may still send a `Finish` message if it wants,
  * which will be silently ignored by the callee.
  *
  */
    get noFinishNeeded(): boolean;
    set noFinishNeeded(value: boolean);
    _adoptResults(value: Orphan<Payload>): void;
    _disownResults(): Orphan<Payload>;
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
    get results(): Payload;
    _hasResults(): boolean;
    _initResults(): Payload;
    get _isResults(): boolean;
    set results(value: Payload);
    _adoptException(value: Orphan<Exception>): void;
    _disownException(): Orphan<Exception>;
    /**
  * Indicates that the call failed and explains why.
  *
  */
    get exception(): Exception;
    _hasException(): boolean;
    _initException(): Exception;
    get _isException(): boolean;
    set exception(value: Exception);
    get _isCanceled(): boolean;
    set canceled(_: true);
    get _isResultsSentElsewhere(): boolean;
    set resultsSentElsewhere(_: true);
    /**
  * The sender has also sent (before this message) a `Call` with the given question ID and with
  * `sendResultsTo.yourself` set, and the results of that other call should be used as the
  * results here.  `takeFromOtherQuestion` can only used once per question.
  *
  */
    get takeFromOtherQuestion(): number;
    get _isTakeFromOtherQuestion(): boolean;
    set takeFromOtherQuestion(value: number);
    _adoptAcceptFromThirdParty(value: Orphan<Pointer>): void;
    _disownAcceptFromThirdParty(): Orphan<Pointer>;
    /**
  * **(level 3)**
  *
  * The caller should contact a third-party vat to pick up the results.  An `Accept` message
  * sent to the vat will return the result.  This pairs with `Call.sendResultsTo.thirdParty`.
  * It should only be used if the corresponding `Call` had `allowThirdPartyTailCall` set.
  *
  */
    get acceptFromThirdParty(): Pointer;
    _hasAcceptFromThirdParty(): boolean;
    get _isAcceptFromThirdParty(): boolean;
    set acceptFromThirdParty(value: Pointer);
    toString(): string;
    which(): Return_Which;
}
/**
* **(level 0)**
*
* Message type sent from the caller to the callee to indicate:
* 1) The questionId will no longer be used in any messages sent by the callee (no further
*    pipelined requests).
* 2) If the call has not returned yet, the caller no longer cares about the result.  If nothing
*    else cares about the result either (e.g. there are no other outstanding calls pipelined on
*    the result of this one) then the callee may wish to immediately cancel the operation and
*    send back a Return message with "canceled" set.  However, implementations are not required
*    to support premature cancellation -- instead, the implementation may wait until the call
*    actually completes and send a normal `Return` message.
*
* TODO(someday): Should we separate (1) and implicitly releasing result capabilities?  It would be
*   possible and useful to notify the server that it doesn't need to keep around the response to
*   service pipeline requests even though the caller still wants to receive it / hasn't yet
*   finished processing it.  It could also be useful to notify the server that it need not marshal
*   the results because the caller doesn't want them anyway, even if the caller is still sending
*   pipelined calls, although this seems less useful (just saving some bytes on the wire).
*
*/
declare class Finish extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
        defaultReleaseResultCaps: DataView<ArrayBufferLike>;
        defaultRequireEarlyCancellationWorkaround: DataView<ArrayBufferLike>;
    };
    /**
  * ID of the call whose result is to be released.
  *
  */
    get questionId(): number;
    set questionId(value: number);
    /**
  * If true, all capabilities that were in the results should be considered released.  The sender
  * must not send separate `Release` messages for them.  Level 0 implementations in particular
  * should always set this true.  This defaults true because if level 0 implementations forget to
  * set it they'll never notice (just silently leak caps), but if level >=1 implementations forget
  * set it false they'll quickly get errors.
  *
  */
    get releaseResultCaps(): boolean;
    set releaseResultCaps(value: boolean);
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
    get requireEarlyCancellationWorkaround(): boolean;
    set requireEarlyCancellationWorkaround(value: boolean);
    toString(): string;
}
/**
* **(level 1)**
*
* Message type sent to indicate that a previously-sent promise has now been resolved to some other
* object (possibly another promise) -- or broken, or canceled.
*
* Keep in mind that it's possible for a `Resolve` to be sent to a level 0 implementation that
* doesn't implement it.  For example, a method call or return might contain a capability in the
* payload.  Normally this is fine even if the receiver is level 0, because they will implicitly
* release all such capabilities on return / finish.  But if the cap happens to be a promise, then
* a follow-up `Resolve` may be sent regardless of this release.  The level 0 receiver will reply
* with an `unimplemented` message, and the sender (of the `Resolve`) can respond to this as if the
* receiver had immediately released any capability to which the promise resolved.
*
* When implementing promise resolution, it's important to understand how embargos work and the
* tricky case of the Tribble 4-way race condition. See the comments for the Disembargo message,
* below.
*
*/
declare const Resolve_Which: {
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
    readonly CAP: 0;
    /**
  * Indicates that the promise was broken.
  *
  */
    readonly EXCEPTION: 1;
};
type Resolve_Which = (typeof Resolve_Which)[keyof typeof Resolve_Which];
/**
* **(level 1)**
*
* Message type sent to indicate that a previously-sent promise has now been resolved to some other
* object (possibly another promise) -- or broken, or canceled.
*
* Keep in mind that it's possible for a `Resolve` to be sent to a level 0 implementation that
* doesn't implement it.  For example, a method call or return might contain a capability in the
* payload.  Normally this is fine even if the receiver is level 0, because they will implicitly
* release all such capabilities on return / finish.  But if the cap happens to be a promise, then
* a follow-up `Resolve` may be sent regardless of this release.  The level 0 receiver will reply
* with an `unimplemented` message, and the sender (of the `Resolve`) can respond to this as if the
* receiver had immediately released any capability to which the promise resolved.
*
* When implementing promise resolution, it's important to understand how embargos work and the
* tricky case of the Tribble 4-way race condition. See the comments for the Disembargo message,
* below.
*
*/
declare class Resolve extends Struct {
    static readonly CAP: 0;
    static readonly EXCEPTION: 1;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
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
    get promiseId(): number;
    set promiseId(value: number);
    _adoptCap(value: Orphan<CapDescriptor>): void;
    _disownCap(): Orphan<CapDescriptor>;
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
    get cap(): CapDescriptor;
    _hasCap(): boolean;
    _initCap(): CapDescriptor;
    get _isCap(): boolean;
    set cap(value: CapDescriptor);
    _adoptException(value: Orphan<Exception>): void;
    _disownException(): Orphan<Exception>;
    /**
  * Indicates that the promise was broken.
  *
  */
    get exception(): Exception;
    _hasException(): boolean;
    _initException(): Exception;
    get _isException(): boolean;
    set exception(value: Exception);
    toString(): string;
    which(): Resolve_Which;
}
/**
* **(level 1)**
*
* Message type sent to indicate that the sender is done with the given capability and the receiver
* can free resources allocated to it.
*
*/
declare class Release extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * What to release.
  *
  */
    get id(): number;
    set id(value: number);
    /**
  * The amount by which to decrement the reference count.  The export is only actually released
  * when the reference count reaches zero.
  *
  */
    get referenceCount(): number;
    set referenceCount(value: number);
    toString(): string;
}
declare const Disembargo_Context_Which: {
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
    readonly SENDER_LOOPBACK: 0;
    /**
  * The receiver previously sent a `senderLoopback` Disembargo towards a promise resolving to
  * this capability, and that Disembargo is now being echoed back.
  *
  */
    readonly RECEIVER_LOOPBACK: 1;
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
    readonly ACCEPT: 2;
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
    readonly PROVIDE: 3;
};
type Disembargo_Context_Which = (typeof Disembargo_Context_Which)[keyof typeof Disembargo_Context_Which];
declare class Disembargo_Context extends Struct {
    static readonly SENDER_LOOPBACK: 0;
    static readonly RECEIVER_LOOPBACK: 1;
    static readonly ACCEPT: 2;
    static readonly PROVIDE: 3;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
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
    get senderLoopback(): number;
    get _isSenderLoopback(): boolean;
    set senderLoopback(value: number);
    /**
  * The receiver previously sent a `senderLoopback` Disembargo towards a promise resolving to
  * this capability, and that Disembargo is now being echoed back.
  *
  */
    get receiverLoopback(): number;
    get _isReceiverLoopback(): boolean;
    set receiverLoopback(value: number);
    get _isAccept(): boolean;
    set accept(_: true);
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
    get provide(): number;
    get _isProvide(): boolean;
    set provide(value: number);
    toString(): string;
    which(): Disembargo_Context_Which;
}
/**
* **(level 1)**
*
* Message sent to indicate that an embargo on a recently-resolved promise may now be lifted.
*
* Embargos are used to enforce E-order in the presence of promise resolution.  That is, if an
* application makes two calls foo() and bar() on the same capability reference, in that order,
* the calls should be delivered in the order in which they were made.  But if foo() is called
* on a promise, and that promise happens to resolve before bar() is called, then the two calls
* may travel different paths over the network, and thus could arrive in the wrong order.  In
* this case, the call to `bar()` must be embargoed, and a `Disembargo` message must be sent along
* the same path as `foo()` to ensure that the `Disembargo` arrives after `foo()`.  Once the
* `Disembargo` arrives, `bar()` can then be delivered.
*
* There are two particular cases where embargos are important.  Consider object Alice, in Vat A,
* who holds a promise P, pointing towards Vat B, that eventually resolves to Carol.  The two
* cases are:
* - Carol lives in Vat A, i.e. next to Alice.  In this case, Vat A needs to send a `Disembargo`
*   message that echos through Vat B and back, to ensure that all pipelined calls on the promise
*   have been delivered.
* - Carol lives in a different Vat C.  When the promise resolves, a three-party handoff occurs
*   (see `Provide` and `Accept`, which constitute level 3 of the protocol).  In this case, we
*   piggyback on the state that has already been set up to handle the handoff:  the `Accept`
*   message (from Vat A to Vat C) is embargoed, as are all pipelined messages sent to it, while
*   a `Disembargo` message is sent from Vat A through Vat B to Vat C.  See `Accept.embargo` for
*   an example.
*
* Note that in the case where Carol actually lives in Vat B (i.e., the same vat that the promise
* already pointed at), no embargo is needed, because the pipelined calls are delivered over the
* same path as the later direct calls.
*
* Keep in mind that promise resolution happens both in the form of Resolve messages as well as
* Return messages (which resolve PromisedAnswers). Embargos apply in both cases.
*
* An alternative strategy for enforcing E-order over promise resolution could be for Vat A to
* implement the embargo internally.  When Vat A is notified of promise resolution, it could
* send a dummy no-op call to promise P and wait for it to complete.  Until that call completes,
* all calls to the capability are queued locally.  This strategy works, but is pessimistic:
* in the three-party case, it requires an A -> B -> C -> B -> A round trip before calls can start
* being delivered directly to from Vat A to Vat C.  The `Disembargo` message allows latency to be
* reduced.  (In the two-party loopback case, the `Disembargo` message is just a more explicit way
* of accomplishing the same thing as a no-op call, but isn't any faster.)
*
* *The Tribble 4-way Race Condition*
*
* Any implementation of promise resolution and embargos must be aware of what we call the
* "Tribble 4-way race condition", after Dean Tribble, who explained the problem in a lively
* Friam meeting.
*
* Embargos are designed to work in the case where a two-hop path is being shortened to one hop.
* But sometimes there are more hops. Imagine that Alice has a reference to a remote promise P1
* that eventually resolves to _another_ remote promise P2 (in a third vat), which _at the same
* time_ happens to resolve to Bob (in a fourth vat). In this case, we're shortening from a 3-hop
* path (with four parties) to a 1-hop path (Alice -> Bob).
*
* Extending the embargo/disembargo protocol to be able to shorted multiple hops at once seems
* difficult. Instead, we make a rule that prevents this case from coming up:
*
* One a promise P has been resolved to a remote object reference R, then all further messages
* received addressed to P will be forwarded strictly to R. Even if it turns out later that R is
* itself a promise, and has resolved to some other object Q, messages sent to P will still be
* forwarded to R, not directly to Q (R will of course further forward the messages to Q).
*
* This rule does not cause a significant performance burden because once P has resolved to R, it
* is expected that people sending messages to P will shortly start sending them to R instead and
* drop P. P is at end-of-life anyway, so it doesn't matter if it ignores chances to further
* optimize its path.
*
* Note well: the Tribble 4-way race condition does not require each vat to be *distinct*; as long
* as each resolution crosses a network boundary the race can occur -- so this concerns even level
* 1 implementations, not just level 3 implementations.
*
*/
declare class Disembargo extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    _adoptTarget(value: Orphan<MessageTarget>): void;
    _disownTarget(): Orphan<MessageTarget>;
    /**
  * What is to be disembargoed.
  *
  */
    get target(): MessageTarget;
    _hasTarget(): boolean;
    _initTarget(): MessageTarget;
    set target(value: MessageTarget);
    get context(): Disembargo_Context;
    _initContext(): Disembargo_Context;
    toString(): string;
}
/**
* **(level 3)**
*
* Message type sent to indicate that the sender wishes to make a particular capability implemented
* by the receiver available to a third party for direct access (without the need for the third
* party to proxy through the sender).
*
* (In CapTP, `Provide` and `Accept` are methods of the global `NonceLocator` object exported by
* every vat.  In Cap'n Proto, we bake this into the core protocol.)
*
*/
declare class Provide extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * Question ID to be held open until the recipient has received the capability.  A result will be
  * returned once the third party has successfully received the capability.  The sender must at some
  * point send a `Finish` message as with any other call, and that message can be used to cancel the
  * whole operation.
  *
  */
    get questionId(): number;
    set questionId(value: number);
    _adoptTarget(value: Orphan<MessageTarget>): void;
    _disownTarget(): Orphan<MessageTarget>;
    /**
  * What is to be provided to the third party.
  *
  */
    get target(): MessageTarget;
    _hasTarget(): boolean;
    _initTarget(): MessageTarget;
    set target(value: MessageTarget);
    _adoptRecipient(value: Orphan<Pointer>): void;
    _disownRecipient(): Orphan<Pointer>;
    /**
  * Identity of the third party that is expected to pick up the capability.
  *
  */
    get recipient(): Pointer;
    _hasRecipient(): boolean;
    set recipient(value: Pointer);
    toString(): string;
}
/**
* **(level 3)**
*
* Message type sent to pick up a capability hosted by the receiving vat and provided by a third
* party.  The third party previously designated the capability using `Provide`.
*
* This message is also used to pick up a redirected return -- see `Return.acceptFromThirdParty`.
*
*/
declare class Accept extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * A new question ID identifying this accept message, which will eventually receive a Return
  * message containing the provided capability (or the call result in the case of a redirected
  * return).
  *
  */
    get questionId(): number;
    set questionId(value: number);
    _adoptProvision(value: Orphan<Pointer>): void;
    _disownProvision(): Orphan<Pointer>;
    /**
  * Identifies the provided object to be picked up.
  *
  */
    get provision(): Pointer;
    _hasProvision(): boolean;
    set provision(value: Pointer);
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
    get embargo(): boolean;
    set embargo(value: boolean);
    toString(): string;
}
/**
* **(level 4)**
*
* Message type sent to implement E.join(), which, given a number of capabilities that are
* expected to be equivalent, finds the underlying object upon which they all agree and forms a
* direct connection to it, skipping any proxies that may have been constructed by other vats
* while transmitting the capability.  See:
*     http://erights.org/elib/equality/index.html
*
* Note that this should only serve to bypass fully-transparent proxies -- proxies that were
* created merely for convenience, without any intention of hiding the underlying object.
*
* For example, say Bob holds two capabilities hosted by Alice and Carol, but he expects that both
* are simply proxies for a capability hosted elsewhere.  He then issues a join request, which
* operates as follows:
* - Bob issues Join requests on both Alice and Carol.  Each request contains a different piece
*   of the JoinKey.
* - Alice is proxying a capability hosted by Dana, so forwards the request to Dana's cap.
* - Dana receives the first request and sees that the JoinKeyPart is one of two.  She notes that
*   she doesn't have the other part yet, so she records the request and responds with a
*   JoinResult.
* - Alice relays the JoinAnswer back to Bob.
* - Carol is also proxying a capability from Dana, and so forwards her Join request to Dana as
*   well.
* - Dana receives Carol's request and notes that she now has both parts of a JoinKey.  She
*   combines them in order to form information needed to form a secure connection to Bob.  She
*   also responds with another JoinResult.
* - Bob receives the responses from Alice and Carol.  He uses the returned JoinResults to
*   determine how to connect to Dana and attempts to form the connection.  Since Bob and Dana now
*   agree on a secret key that neither Alice nor Carol ever saw, this connection can be made
*   securely even if Alice or Carol is conspiring against the other.  (If Alice and Carol are
*   conspiring _together_, they can obviously reproduce the key, but this doesn't matter because
*   the whole point of the join is to verify that Alice and Carol agree on what capability they
*   are proxying.)
*
* If the two capabilities aren't actually proxies of the same object, then the join requests
* will come back with conflicting `hostId`s and the join will fail before attempting to form any
* connection.
*
*/
declare class Join extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
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
    get questionId(): number;
    set questionId(value: number);
    _adoptTarget(value: Orphan<MessageTarget>): void;
    _disownTarget(): Orphan<MessageTarget>;
    /**
  * The capability to join.
  *
  */
    get target(): MessageTarget;
    _hasTarget(): boolean;
    _initTarget(): MessageTarget;
    set target(value: MessageTarget);
    _adoptKeyPart(value: Orphan<Pointer>): void;
    _disownKeyPart(): Orphan<Pointer>;
    /**
  * A part of the join key.  These combine to form the complete join key, which is used to establish
  * a direct connection.
  *
  */
    get keyPart(): Pointer;
    _hasKeyPart(): boolean;
    set keyPart(value: Pointer);
    toString(): string;
}
/**
* The target of a `Call` or other messages that target a capability.
*
*/
declare const MessageTarget_Which: {
    /**
  * This message is to a capability or promise previously imported by the caller (exported by
  * the receiver).
  *
  */
    readonly IMPORTED_CAP: 0;
    /**
  * This message is to a capability that is expected to be returned by another call that has not
  * yet been completed.
  *
  * At level 0, this is supported only for addressing the result of a previous `Bootstrap`, so
  * that initial startup doesn't require a round trip.
  *
  */
    readonly PROMISED_ANSWER: 1;
};
type MessageTarget_Which = (typeof MessageTarget_Which)[keyof typeof MessageTarget_Which];
/**
* The target of a `Call` or other messages that target a capability.
*
*/
declare class MessageTarget extends Struct {
    static readonly IMPORTED_CAP: 0;
    static readonly PROMISED_ANSWER: 1;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * This message is to a capability or promise previously imported by the caller (exported by
  * the receiver).
  *
  */
    get importedCap(): number;
    get _isImportedCap(): boolean;
    set importedCap(value: number);
    _adoptPromisedAnswer(value: Orphan<PromisedAnswer>): void;
    _disownPromisedAnswer(): Orphan<PromisedAnswer>;
    /**
  * This message is to a capability that is expected to be returned by another call that has not
  * yet been completed.
  *
  * At level 0, this is supported only for addressing the result of a previous `Bootstrap`, so
  * that initial startup doesn't require a round trip.
  *
  */
    get promisedAnswer(): PromisedAnswer;
    _hasPromisedAnswer(): boolean;
    _initPromisedAnswer(): PromisedAnswer;
    get _isPromisedAnswer(): boolean;
    set promisedAnswer(value: PromisedAnswer);
    toString(): string;
    which(): MessageTarget_Which;
}
/**
* Represents some data structure that might contain capabilities.
*
*/
declare class Payload extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    static _CapTable: ListCtor<CapDescriptor>;
    _adoptContent(value: Orphan<Pointer>): void;
    _disownContent(): Orphan<Pointer>;
    /**
  * Some Cap'n Proto data structure.  Capability pointers embedded in this structure index into
  * `capTable`.
  *
  */
    get content(): Pointer;
    _hasContent(): boolean;
    set content(value: Pointer);
    _adoptCapTable(value: Orphan<List<CapDescriptor>>): void;
    _disownCapTable(): Orphan<List<CapDescriptor>>;
    /**
  * Descriptors corresponding to the cap pointers in `content`.
  *
  */
    get capTable(): List<CapDescriptor>;
    _hasCapTable(): boolean;
    _initCapTable(length: number): List<CapDescriptor>;
    set capTable(value: List<CapDescriptor>);
    toString(): string;
}
/**
* **(level 1)**
*
* When an application-defined type contains an interface pointer, that pointer contains an index
* into the message's capability table -- i.e. the `capTable` part of the `Payload`.  Each
* capability in the table is represented as a `CapDescriptor`.  The runtime API should not reveal
* the CapDescriptor directly to the application, but should instead wrap it in some kind of
* callable object with methods corresponding to the interface that the capability implements.
*
* Keep in mind that `ExportIds` in a `CapDescriptor` are subject to reference counting.  See the
* description of `ExportId`.
*
* Note that it is currently not possible to include a broken capability in the CapDescriptor
* table.  Instead, create a new export (`senderPromise`) for each broken capability and then
* immediately follow the payload-bearing Call or Return message with one Resolve message for each
* broken capability, resolving it to an exception.
*
*/
declare const CapDescriptor_Which: {
    /**
  * There is no capability here.  This `CapDescriptor` should not appear in the payload content.
  * A `none` CapDescriptor can be generated when an application inserts a capability into a
  * message and then later changes its mind and removes it -- rewriting all of the other
  * capability pointers may be hard, so instead a tombstone is left, similar to the way a removed
  * struct or list instance is zeroed out of the message but the space is not reclaimed.
  * Hopefully this is unusual.
  *
  */
    readonly NONE: 0;
    /**
  * The ID of a capability in the sender's export table (receiver's import table).  It may be a
  * newly allocated table entry, or an existing entry (increments the reference count).
  *
  */
    readonly SENDER_HOSTED: 1;
    /**
  * A promise that the sender will resolve later.  The sender will send exactly one Resolve
  * message at a future point in time to replace this promise.  Note that even if the same
  * `senderPromise` is received multiple times, only one `Resolve` is sent to cover all of
  * them.  If `senderPromise` is released before the `Resolve` is sent, the sender (of this
  * `CapDescriptor`) may choose not to send the `Resolve` at all.
  *
  */
    readonly SENDER_PROMISE: 2;
    /**
  * A capability (or promise) previously exported by the receiver (imported by the sender).
  *
  */
    readonly RECEIVER_HOSTED: 3;
    /**
  * A capability expected to be returned in the results of a currently-outstanding call posed
  * by the sender.
  *
  */
    readonly RECEIVER_ANSWER: 4;
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
    readonly THIRD_PARTY_HOSTED: 5;
};
type CapDescriptor_Which = (typeof CapDescriptor_Which)[keyof typeof CapDescriptor_Which];
/**
* **(level 1)**
*
* When an application-defined type contains an interface pointer, that pointer contains an index
* into the message's capability table -- i.e. the `capTable` part of the `Payload`.  Each
* capability in the table is represented as a `CapDescriptor`.  The runtime API should not reveal
* the CapDescriptor directly to the application, but should instead wrap it in some kind of
* callable object with methods corresponding to the interface that the capability implements.
*
* Keep in mind that `ExportIds` in a `CapDescriptor` are subject to reference counting.  See the
* description of `ExportId`.
*
* Note that it is currently not possible to include a broken capability in the CapDescriptor
* table.  Instead, create a new export (`senderPromise`) for each broken capability and then
* immediately follow the payload-bearing Call or Return message with one Resolve message for each
* broken capability, resolving it to an exception.
*
*/
declare class CapDescriptor extends Struct {
    static readonly NONE: 0;
    static readonly SENDER_HOSTED: 1;
    static readonly SENDER_PROMISE: 2;
    static readonly RECEIVER_HOSTED: 3;
    static readonly RECEIVER_ANSWER: 4;
    static readonly THIRD_PARTY_HOSTED: 5;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
        defaultAttachedFd: DataView<ArrayBufferLike>;
    };
    get _isNone(): boolean;
    set none(_: true);
    /**
  * The ID of a capability in the sender's export table (receiver's import table).  It may be a
  * newly allocated table entry, or an existing entry (increments the reference count).
  *
  */
    get senderHosted(): number;
    get _isSenderHosted(): boolean;
    set senderHosted(value: number);
    /**
  * A promise that the sender will resolve later.  The sender will send exactly one Resolve
  * message at a future point in time to replace this promise.  Note that even if the same
  * `senderPromise` is received multiple times, only one `Resolve` is sent to cover all of
  * them.  If `senderPromise` is released before the `Resolve` is sent, the sender (of this
  * `CapDescriptor`) may choose not to send the `Resolve` at all.
  *
  */
    get senderPromise(): number;
    get _isSenderPromise(): boolean;
    set senderPromise(value: number);
    /**
  * A capability (or promise) previously exported by the receiver (imported by the sender).
  *
  */
    get receiverHosted(): number;
    get _isReceiverHosted(): boolean;
    set receiverHosted(value: number);
    _adoptReceiverAnswer(value: Orphan<PromisedAnswer>): void;
    _disownReceiverAnswer(): Orphan<PromisedAnswer>;
    /**
  * A capability expected to be returned in the results of a currently-outstanding call posed
  * by the sender.
  *
  */
    get receiverAnswer(): PromisedAnswer;
    _hasReceiverAnswer(): boolean;
    _initReceiverAnswer(): PromisedAnswer;
    get _isReceiverAnswer(): boolean;
    set receiverAnswer(value: PromisedAnswer);
    _adoptThirdPartyHosted(value: Orphan<ThirdPartyCapDescriptor>): void;
    _disownThirdPartyHosted(): Orphan<ThirdPartyCapDescriptor>;
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
    get thirdPartyHosted(): ThirdPartyCapDescriptor;
    _hasThirdPartyHosted(): boolean;
    _initThirdPartyHosted(): ThirdPartyCapDescriptor;
    get _isThirdPartyHosted(): boolean;
    set thirdPartyHosted(value: ThirdPartyCapDescriptor);
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
    get attachedFd(): number;
    set attachedFd(value: number);
    toString(): string;
    which(): CapDescriptor_Which;
}
declare const PromisedAnswer_Op_Which: {
    /**
  * Does nothing.  This member is mostly defined so that we can make `Op` a union even
  * though (as of this writing) only one real operation is defined.
  *
  */
    readonly NOOP: 0;
    /**
  * Get a pointer field within a struct.  The number is an index into the pointer section, NOT
  * a field ordinal, so that the receiver does not need to understand the schema.
  *
  */
    readonly GET_POINTER_FIELD: 1;
};
type PromisedAnswer_Op_Which = (typeof PromisedAnswer_Op_Which)[keyof typeof PromisedAnswer_Op_Which];
declare class PromisedAnswer_Op extends Struct {
    static readonly NOOP: 0;
    static readonly GET_POINTER_FIELD: 1;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    get _isNoop(): boolean;
    set noop(_: true);
    /**
  * Get a pointer field within a struct.  The number is an index into the pointer section, NOT
  * a field ordinal, so that the receiver does not need to understand the schema.
  *
  */
    get getPointerField(): number;
    get _isGetPointerField(): boolean;
    set getPointerField(value: number);
    toString(): string;
    which(): PromisedAnswer_Op_Which;
}
/**
* **(mostly level 1)**
*
* Specifies how to derive a promise from an unanswered question, by specifying the path of fields
* to follow from the root of the eventual result struct to get to the desired capability.  Used
* to address method calls to a not-yet-returned capability or to pass such a capability as an
* input to some other method call.
*
* Level 0 implementations must support `PromisedAnswer` only for the case where the answer is
* to a `Bootstrap` message.  In this case, `path` is always empty since `Bootstrap` always returns
* a raw capability.
*
*/
declare class PromisedAnswer extends Struct {
    static readonly Op: typeof PromisedAnswer_Op;
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    static _Transform: ListCtor<PromisedAnswer_Op>;
    /**
  * ID of the question (in the sender's question table / receiver's answer table) whose answer is
  * expected to contain the capability.
  *
  */
    get questionId(): number;
    set questionId(value: number);
    _adoptTransform(value: Orphan<List<PromisedAnswer_Op>>): void;
    _disownTransform(): Orphan<List<PromisedAnswer_Op>>;
    /**
  * Operations / transformations to apply to the result in order to get the capability actually
  * being addressed.  E.g. if the result is a struct and you want to call a method on a capability
  * pointed to by a field of the struct, you need a `getPointerField` op.
  *
  */
    get transform(): List<PromisedAnswer_Op>;
    _hasTransform(): boolean;
    _initTransform(length: number): List<PromisedAnswer_Op>;
    set transform(value: List<PromisedAnswer_Op>);
    toString(): string;
}
/**
* **(level 3)**
*
* Identifies a capability in a third-party vat that the sender wants the receiver to pick up.
*
*/
declare class ThirdPartyCapDescriptor extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    _adoptId(value: Orphan<Pointer>): void;
    _disownId(): Orphan<Pointer>;
    /**
  * Identifies the third-party host and the specific capability to accept from it.
  *
  */
    get id(): Pointer;
    _hasId(): boolean;
    set id(value: Pointer);
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
    get vineId(): number;
    set vineId(value: number);
    toString(): string;
}
declare const Exception_Type: {
    /**
  * A generic problem occurred, and it is believed that if the operation were repeated without
  * any change in the state of the world, the problem would occur again.
  *
  * A client might respond to this error by logging it for investigation by the developer and/or
  * displaying it to the user.
  *
  */
    readonly FAILED: 0;
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
    readonly OVERLOADED: 1;
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
    readonly DISCONNECTED: 2;
    /**
  * The server doesn't implement the requested method. If there is some other method that the
  * client could call (perhaps an older and/or slower interface), it should try that instead.
  * Otherwise, this should be treated like `failed`.
  *
  */
    readonly UNIMPLEMENTED: 3;
};
type Exception_Type = (typeof Exception_Type)[keyof typeof Exception_Type];
/**
* **(level 0)**
*
* Describes an arbitrary error that prevented an operation (e.g. a call) from completing.
*
* Cap'n Proto exceptions always indicate that something went wrong. In other words, in a fantasy
* world where everything always works as expected, no exceptions would ever be thrown. Clients
* should only ever catch exceptions as a means to implement fault-tolerance, where "fault" can
* mean:
* - Bugs.
* - Invalid input.
* - Configuration errors.
* - Network problems.
* - Insufficient resources.
* - Version skew (unimplemented functionality).
* - Other logistical problems.
*
* Exceptions should NOT be used to flag application-specific conditions that a client is expected
* to handle in an application-specific way. Put another way, in the Cap'n Proto world,
* "checked exceptions" (where an interface explicitly defines the exceptions it throws and
* clients are forced by the type system to handle those exceptions) do NOT make sense.
*
*/
declare class Exception extends Struct {
    static readonly Type: {
        /**
      * A generic problem occurred, and it is believed that if the operation were repeated without
      * any change in the state of the world, the problem would occur again.
      *
      * A client might respond to this error by logging it for investigation by the developer and/or
      * displaying it to the user.
      *
      */
        readonly FAILED: 0;
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
        readonly OVERLOADED: 1;
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
        readonly DISCONNECTED: 2;
        /**
      * The server doesn't implement the requested method. If there is some other method that the
      * client could call (perhaps an older and/or slower interface), it should try that instead.
      * Otherwise, this should be treated like `failed`.
      *
      */
        readonly UNIMPLEMENTED: 3;
    };
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * Human-readable failure description.
  *
  */
    get reason(): string;
    set reason(value: string);
    /**
  * The type of the error. The purpose of this enum is not to describe the error itself, but
  * rather to describe how the client might want to respond to the error.
  *
  */
    get type(): Exception_Type;
    set type(value: Exception_Type);
    /**
  * OBSOLETE. Ignore.
  *
  */
    get obsoleteIsCallersFault(): boolean;
    set obsoleteIsCallersFault(value: boolean);
    /**
  * OBSOLETE. See `type` instead.
  *
  */
    get obsoleteDurability(): number;
    set obsoleteDurability(value: number);
    /**
  * Stack trace text from the remote server. The format is not specified. By default,
  * implementations do not provide stack traces; the application must explicitly enable them
  * when desired.
  *
  */
    get trace(): string;
    set trace(value: string);
    toString(): string;
}

type CapabilityID = number;

interface Method<P extends Struct, R extends Struct> {
    interfaceId: bigint;
    methodId: number;
    interfaceName?: string;
    methodName?: string;
    ParamsClass: StructCtor<P>;
    ResultsClass: StructCtor<R>;
}

type Call<P extends Struct, R extends Struct> = FuncCall<P, R> | DataCall<P, R>;
interface BaseCall<P extends Struct, R extends Struct> {
    method: Method<P, R>;
}
type FuncCall<P extends Struct, R extends Struct> = BaseCall<P, R> & {
    paramsFunc?(params: P): void;
};
type DataCall<P extends Struct, R extends Struct> = BaseCall<P, R> & {
    params: P;
};
declare function isFuncCall<P extends Struct, R extends Struct>(call: Call<P, R>): call is FuncCall<P, R>;
declare function isDataCall<P extends Struct, R extends Struct>(call: Call<P, R>): call is DataCall<P, R>;
declare function copyCall<P extends Struct, R extends Struct>(call: Call<P, R>): DataCall<P, R>;
declare function placeParams<P extends Struct, R extends Struct>(call: Call<P, R>, contentPtr: Pointer | undefined): P;

declare class IDGen {
    i: number;
    free: number[];
    next(): number;
    remove(i: number): void;
}

interface PipelineOp {
    field: number;
    defaultValue?: Pointer;
}

declare class Deferred<T> {
    static fromPromise<T>(p: Promise<T>): Deferred<T>;
    promise: Promise<T>;
    reject: (reason?: unknown) => void;
    resolve: (value: T | PromiseLike<T>) => void;
    constructor();
}

interface ecall {
    call: Call<any, any>;
    f: Fulfiller<any>;
}
interface pcall extends ecall {
    transform: PipelineOp[];
}
type ecallSlot = ecall | null;
declare class Ecalls {
    data: ecallSlot[];
    constructor(data: ecallSlot[]);
    static copyOf(data: ecallSlot[]): Ecalls;
    len(): number;
    clear(i: number): void;
    copy(): Ecalls;
}

declare class Fulfiller<R extends Struct> implements Answer<R> {
    resolved: boolean;
    answer?: Answer<R>;
    queue: pcall[];
    queueCap: number;
    deferred: Deferred<R>;
    fulfill(s: R): void;
    reject(err: Error): void;
    peek(): Answer<R> | undefined;
    struct(): Promise<R>;
    pipelineCall<CallParams extends Struct, CallResults extends Struct>(transform: PipelineOp[], call: Call<CallParams, CallResults>): Answer<CallResults>;
    pipelineClose(transform: PipelineOp[]): void;
    emptyQueue(s: Struct): Record<number, Ecalls>;
}

interface Answer<R extends Struct> {
    struct(): Promise<R>;
    pipelineCall<CallParams extends Struct, CallResults extends Struct>(transform: PipelineOp[], call: Call<CallParams, CallResults>): Answer<CallResults>;
    pipelineClose(transform: PipelineOp[]): void;
}
declare class AnswerEntry<R extends Struct> {
    id: number;
    conn: Conn;
    resultCaps: number[];
    done: boolean;
    obj?: R;
    err?: Error;
    deferred: Deferred<R>;
    queue: AnswerPCall[];
    constructor(conn: Conn, id: number);
    fulfill(obj: R): void;
    reject(err: Error): void;
    emptyQueue(obj: R): [{
        [key: number]: AnswerQCall[];
    }, Error | undefined];
    queueCall<P extends Struct, R extends Struct>(call: Call<P, R>, transform: PipelineOp[], a: AnswerEntry<R>): void;
}
type AnswerQCall = QCallRemoteCall | QCallLocalCall | QCallDisembargo;
interface QCallRemoteCall {
    call: Call<any, any>;
    a: AnswerEntry<any>;
}
interface QCallLocalCall {
    call: Call<any, any>;
    f: Fulfiller<any>;
}
interface QCallDisembargo {
    embargoID: number;
    embargoTarget: MessageTarget;
}
interface AnswerPCall {
    qcall: AnswerQCall;
    transform: PipelineOp[];
}

type Finalize = (obj: unknown, finalizer: Finalizer) => void;
type Finalizer = () => void;

declare class Ref implements Client {
    rc: RefCount;
    closeState: {
        closed: boolean;
    };
    constructor(rc: RefCount, finalize: Finalize);
    call<P extends Struct, R extends Struct>(cl: Call<P, R>): Answer<R>;
    client(): Client;
    close(): void;
}

/**
 * A RefCount will close its underlying client once all its references are
 * closed.
 */
declare class RefCount implements Client {
    refs: number;
    finalize: Finalize;
    _client: Client;
    private constructor();
    static new(c: Client, finalize: Finalize): [RefCount, Ref];
    call<P extends Struct, R extends Struct>(cl: Call<P, R>): Answer<R>;
    client(): Client;
    close(): void;
    ref(): Client;
    newRef(): Ref;
    decref(): void;
}

interface Transport {
    sendMessage(msg: Message$1): void;
    recvMessage(): Promise<Message$1>;
    close(): void;
}

declare enum QuestionState {
    IN_PROGRESS = 0,
    RESOLVED = 1,
    CANCELED = 2
}
declare class Question<P extends Struct, R extends Struct> implements Answer<R> {
    conn: Conn;
    id: number;
    method?: Method<P, R> | undefined;
    paramCaps: number[];
    state: QuestionState;
    obj?: R;
    err?: Error;
    derived: PipelineOp[][];
    deferred: Deferred<R>;
    constructor(conn: Conn, id: number, method?: Method<P, R> | undefined);
    struct(): Promise<R>;
    start(): void;
    fulfill(obj: Pointer): void;
    reject(err: Error): void;
    cancel(err: Error): boolean;
    pipelineCall<CallParams extends Struct, CallResults extends Struct>(transform: PipelineOp[], call: Call<CallParams, CallResults>): Answer<CallResults>;
    addPromise(transform: PipelineOp[]): void;
    pipelineClose(): void;
}

interface ServerMethod<P extends Struct, R extends Struct> extends Method<P, R> {
    impl(params: P, results: R): Promise<void>;
}
interface ServerCall<P extends Struct, R extends Struct> extends DataCall<P, R> {
    serverMethod: ServerMethod<P, R>;
    answer: Fulfiller<R>;
}
declare class Server implements Client {
    target: any;
    methods: Array<ServerMethod<any, any>>;
    constructor(target: any, methods: Array<ServerMethod<any, any>>);
    startCall<P extends Struct, R extends Struct>(call: ServerCall<P, R>): void;
    call<P extends Struct, R extends Struct>(call: Call<P, R>): Answer<R>;
    close(): void;
}

type QuestionSlot = Question<any, any> | null;
declare class Conn {
    transport: Transport;
    finalize: Finalize;
    questionID: IDGen;
    questions: QuestionSlot[];
    answers: {
        [key: number]: AnswerEntry<any>;
    };
    exportID: IDGen;
    exports: Array<Export | null>;
    imports: {
        [key: number]: ImportEntry;
    };
    onError?: (err?: Error) => void;
    main?: Client;
    working: boolean;
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
    constructor(transport: Transport, finalize?: Finalize);
    bootstrap<C>(InterfaceClass: InterfaceCtor<C, Server>): C;
    initMain<S extends InterfaceCtor<unknown, Server>>(InterfaceClass: S, target: ServerTarget<S>): void;
    startWork(): void;
    sendReturnException(id: number, err: Error): void;
    handleBootstrapMessage(m: Message$1): void;
    handleFinishMessage(m: Message$1): void;
    handleMessage(m: Message$1): void;
    handleReturnMessage(m: Message$1): void;
    handleCallMessage(m: Message$1): void;
    routeCallMessage<P extends Struct, R extends Struct>(result: AnswerEntry<R>, mt: MessageTarget, cl: Call<P, R>): void;
    populateMessageCapTable(payload: Payload): void;
    addImport(id: number): Client;
    findExport(id: number): Export | null;
    addExport(client: Client): number;
    releaseExport(id: number, refs: number): void;
    error(s: string): void;
    newQuestion<CallParams extends Struct, CallResults extends Struct>(method?: Method<CallParams, CallResults>): Question<CallParams, CallResults>;
    findQuestion<P extends Struct, R extends Struct>(id: number): Question<P, R> | null;
    popQuestion<P extends Struct, R extends Struct>(id: number): Question<P, R> | null;
    insertAnswer(id: number): AnswerEntry<any> | null;
    popAnswer(id: number): AnswerEntry<any> | null;
    shutdown(_err?: Error): void;
    call<P extends Struct, R extends Struct>(client: Client, call: Call<P, R>): Answer<R>;
    fillParams<P extends Struct, R extends Struct>(payload: Payload, cl: Call<P, R>): void;
    makeCapTable(s: Segment, init: (length: number) => List<CapDescriptor>): void;
    descriptorForClient(desc: CapDescriptor, _client: Client): void;
    sendMessage(msg: Message$1): void;
    private work;
}
interface Export {
    id: number;
    rc: RefCount;
    client: Client;
    wireRefs: number;
}
interface ImportEntry {
    rc: RefCount;
    refs: number;
}
declare function answerPipelineClient<T extends Struct>(a: AnswerEntry<T>, transform: PipelineOp[]): Client;

type ServerTarget<S extends InterfaceCtor<unknown, Server>> = ConstructorParameters<S["Server"]>[0];
interface InterfaceCtor<C, S extends Server> {
    readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    readonly Client: {
        new (client: Client): C;
    };
    readonly Server: {
        new (target: any): S;
    };
    new (segment: Segment, byteOffset: number, depthLimit?: number): Interface;
}
declare class Interface extends Pointer {
    static readonly _capnp: {
        displayName: string;
    };
    static readonly getCapID: typeof getCapID;
    static readonly getAsInterface: typeof getAsInterface;
    static readonly isInterface: typeof isInterface;
    static readonly getClient: typeof getClient;
    constructor(segment: Segment, byteOffset: number, depthLimit?: number);
    static fromPointer(p: Pointer): Interface | null;
    getCapId(): CapabilityID;
    getClient(): Client | null;
}
declare function getAsInterface(p: Pointer): Interface | null;
declare function isInterface(p: Pointer): boolean;
declare function getCapID(i: Interface): CapabilityID;
declare function getClient(i: Interface): Client | null;

interface _Orphan {
    capId: number;
    elementSize: ListElementSize;
    length: number;
    size: ObjectSize;
    type: PointerType;
}
/**
 * An orphaned pointer. This object itself is technically a pointer to the original pointer's content, which was left
 * untouched in its original message. The original pointer data is encoded as attributes on the Orphan object, ready to
 * be reconstructed once another pointer is ready to adopt it.
 */
declare class Orphan<T extends Pointer> {
    /** If this member is not present then the orphan has already been adopted, or something went very wrong. */
    _capnp?: _Orphan;
    byteOffset: number;
    segment: Segment;
    constructor(src: T);
    /**
     * Adopt (move) this orphan into the target pointer location. This will allocate far pointers in `dst` as needed.
     *
     * @param dst The destination pointer.
     */
    _moveTo(dst: T): void;
    dispose(): void;
}

declare class Segment implements DataView {
    readonly id: number;
    readonly message: Message;
    buffer: ArrayBuffer;
    /** The number of bytes currently allocated in the segment. */
    byteLength: number;
    /**
     * This value should always be zero. It's only here to satisfy the DataView interface.
     *
     * In the future the Segment implementation (or a child class) may allow accessing the buffer from a nonzero offset,
     * but that adds a lot of extra arithmetic.
     */
    byteOffset: number;
    readonly [Symbol.toStringTag]: "DataView";
    private _dv;
    constructor(id: number, message: Message, buffer: ArrayBuffer, byteLength?: number);
    /**
     * Attempt to allocate the requested number of bytes in this segment. If this segment is full this method will return
     * a pointer to freshly allocated space in another segment from the same message.
     *
     * @param byteLength The number of bytes to allocate, will be rounded up to the nearest word.
     * @returns A pointer to the newly allocated space.
     */
    allocate(byteLength: number): Pointer;
    /**
     * Quickly copy a word (8 bytes) from `srcSegment` into this one at the given offset.
     *
     * @param byteOffset The offset to write the word to.
     * @param srcSegment The segment to copy the word from.
     * @param srcByteOffset The offset from the start of `srcSegment` to copy from.
     */
    copyWord(byteOffset: number, srcSegment: Segment, srcByteOffset: number): void;
    /**
     * Quickly copy words from `srcSegment` into this one.
     *
     * @param byteOffset The offset to start copying into.
     * @param srcSegment The segment to copy from.
     * @param srcByteOffset The start offset to copy from.
     * @param wordLength The number of words to copy.
     */
    copyWords(byteOffset: number, srcSegment: Segment, srcByteOffset: number, wordLength: number): void;
    /**
     * Quickly fill a number of words in the buffer with zeroes.
     *
     * @param byteOffset The first byte to set to zero.
     * @param wordLength The number of words (not bytes!) to zero out.
     */
    fillZeroWords(byteOffset: number, wordLength: number): void;
    getBigInt64(byteOffset: number, littleEndian?: boolean): bigint;
    getBigUint64(byteOffset: number, littleEndian?: boolean): bigint;
    /**
     * Get the total number of bytes available in this segment (the size of its underlying buffer).
     *
     * @returns The total number of bytes this segment can hold.
     */
    getCapacity(): number;
    /**
     * Read a float16 value out of this segment.
     *
     * NOTE: Non functional, added to allow compilation with TS 5.9+
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getFloat16(_byteOffset: number): number;
    /**
     * Read a float32 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getFloat32(byteOffset: number): number;
    /**
     * Read a float64 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getFloat64(byteOffset: number): number;
    /**
     * Read an int16 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getInt16(byteOffset: number): number;
    /**
     * Read an int32 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getInt32(byteOffset: number): number;
    /**
     * Read an int64 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getInt64(byteOffset: number): bigint;
    /**
     * Read an int8 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getInt8(byteOffset: number): number;
    /**
     * Read a uint16 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getUint16(byteOffset: number): number;
    /**
     * Read a uint32 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getUint32(byteOffset: number): number;
    /**
     * Read a uint64 value (as a bigint) out of this segment.
     * NOTE: this does not copy the memory region, so updates to the underlying buffer will affect the returned value!
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getUint64(byteOffset: number): bigint;
    /**
     * Read a uint8 value out of this segment.
     *
     * @param byteOffset The offset in bytes to the value.
     * @returns The value.
     */
    getUint8(byteOffset: number): number;
    hasCapacity(byteLength: number): boolean;
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
    isWordZero(byteOffset: number): boolean;
    /**
     * Swap out this segment's underlying buffer with a new one. It's assumed that the new buffer has the same content but
     * more free space, otherwise all existing pointers to this segment will be hilariously broken.
     *
     * @param buffer The new buffer to use.
     */
    replaceBuffer(buffer: ArrayBuffer): void;
    setBigInt64(byteOffset: number, value: bigint, littleEndian?: boolean): void;
    /** WARNING: This function is not yet implemented.  */
    setBigUint64(byteOffset: number, value: bigint, littleEndian?: boolean): void;
    /**
     * Write a float16 value to the specified offset.
     *
     * NOTE: Non functional, added to allow compilation with TS 5.9+
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setFloat16(_byteOffset: number, _val: number): void;
    /**
     * Write a float32 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setFloat32(byteOffset: number, val: number): void;
    /**
     * Write an float64 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setFloat64(byteOffset: number, val: number): void;
    /**
     * Write an int16 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setInt16(byteOffset: number, val: number): void;
    /**
     * Write an int32 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setInt32(byteOffset: number, val: number): void;
    /**
     * Write an int8 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setInt8(byteOffset: number, val: number): void;
    /**
     * Write an int64 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setInt64(byteOffset: number, val: bigint): void;
    /**
     * Write a uint16 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setUint16(byteOffset: number, val: number): void;
    /**
     * Write a uint32 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setUint32(byteOffset: number, val: number): void;
    /**
     * Write a uint64 value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setUint64(byteOffset: number, val: bigint): void;
    /**
     * Write a uint8 (byte) value to the specified offset.
     *
     * @param byteOffset The offset from the beginning of the buffer.
     * @param val The value to store.
     */
    setUint8(byteOffset: number, val: number): void;
    /**
     * Write a zero word (8 bytes) to the specified offset. This is slightly faster than calling `setUint64` or
     * `setFloat64` with a zero value.
     *
     * Benchmark: http://jsben.ch/#/dUdPI
     *
     * @param byteOffset The offset of the word to set to zero.
     */
    setWordZero(byteOffset: number): void;
    toString(): string;
}

interface _StructCtor extends _PointerCtor {
    readonly id: string;
    readonly size: ObjectSize;
}
interface StructCtor<T extends Struct> {
    readonly _capnp: _StructCtor;
    new (segment: Segment, byteOffset: number, depthLimit?: number, compositeIndex?: number): T;
}
interface _Struct extends _Pointer {
    compositeIndex?: number;
}
declare class Struct extends Pointer<_Struct> {
    static readonly _capnp: {
        displayName: string;
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
    constructor(segment: Segment, byteOffset: number, depthLimit?: number, compositeIndex?: number);
    static [Symbol.toStringTag](): string;
    [Symbol.toStringTag](): string;
}

interface Client {
    call<P extends Struct, R extends Struct>(call: Call<P, R>): Answer<R>;
    close(): void;
}
declare function isSameClient(c: Client, d: Client): boolean;
declare function clientFromResolution(transform: PipelineOp[], obj?: Struct, err?: Error): Client;

declare class ArenaAllocationResult {
    /**
     * The newly allocated buffer. This buffer might be a copy of an existing segment's buffer with free space appended.
     */
    readonly buffer: ArrayBuffer;
    /**
     * The id of the newly-allocated segment.
     */
    readonly id: number;
    constructor(id: number, buffer: ArrayBuffer);
}

declare enum ArenaKind {
    SINGLE_SEGMENT = 0,
    MULTI_SEGMENT = 1
}

declare class MultiSegmentArena {
    readonly buffers: ArrayBuffer[];
    static readonly allocate: typeof allocate$1;
    static readonly getBuffer: typeof getBuffer$1;
    static readonly getNumSegments: typeof getNumSegments$1;
    readonly kind = ArenaKind.MULTI_SEGMENT;
    constructor(buffers?: ArrayBuffer[]);
    toString(): string;
}
declare function allocate$1(minSize: number, m: MultiSegmentArena): ArenaAllocationResult;
declare function getBuffer$1(id: number, m: MultiSegmentArena): ArrayBuffer;
declare function getNumSegments$1(m: MultiSegmentArena): number;

declare class SingleSegmentArena {
    static readonly allocate: typeof allocate;
    static readonly getBuffer: typeof getBuffer;
    static readonly getNumSegments: typeof getNumSegments;
    buffer: ArrayBuffer;
    readonly kind = ArenaKind.SINGLE_SEGMENT;
    constructor(buffer?: ArrayBuffer);
    toString(): string;
}
declare function allocate(minSize: number, segments: Segment[], s: SingleSegmentArena): ArenaAllocationResult;
declare function getBuffer(id: number, s: SingleSegmentArena): ArrayBuffer;
declare function getNumSegments(): number;

type AnyArena = MultiSegmentArena | SingleSegmentArena;

interface _Message {
    readonly arena: AnyArena;
    segments: Segment[];
    traversalLimit: number;
    capTable?: Array<Client | null>;
}
declare class Message {
    static readonly allocateSegment: typeof allocateSegment;
    static readonly dump: typeof dump;
    static readonly getRoot: typeof getRoot;
    static readonly getSegment: typeof getSegment;
    static readonly initRoot: typeof initRoot;
    static readonly readRawPointer: typeof readRawPointer;
    static readonly toArrayBuffer: typeof toArrayBuffer;
    static readonly toPackedArrayBuffer: typeof toPackedArrayBuffer;
    readonly _capnp: _Message;
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
    constructor(src?: AnyArena | ArrayBufferView | ArrayBuffer, packed?: boolean, singleSegment?: boolean);
    allocateSegment(byteLength: number): Segment;
    /**
     * Copies the contents of this message into an identical message with its own ArrayBuffers.
     *
     * @returns A copy of this message.
     */
    copy(): Message;
    /**
     * Create a pretty-printed string dump of this message; incredibly useful for debugging.
     *
     * WARNING: Do not call this method on large messages!
     *
     * @returns A big steaming pile of pretty hex digits.
     */
    dump(): string;
    /**
     * Get a struct pointer for the root of this message. This is primarily used when reading a message; it will not
     * overwrite existing data.
     *
     * @param RootStruct The struct type to use as the root.
     * @returns A struct representing the root of the message.
     */
    getRoot<T extends Struct>(RootStruct: StructCtor<T>): T;
    /**
     * Get a segment by its id.
     *
     * This will lazily allocate the first segment if it doesn't already exist.
     *
     * @param id The segment id.
     * @returns The requested segment.
     */
    getSegment(id: number): Segment;
    /**
     * Initialize a new message using the provided struct type as the root.
     *
     * @param RootStruct The struct type to use as the root.
     * @returns An initialized struct pointing to the root of the message.
     */
    initRoot<T extends Struct>(RootStruct: StructCtor<T>): T;
    /**
     * Set the root of the message to a copy of the given pointer. Used internally
     * to make copies of pointers for default values.
     *
     * @param src The source pointer to copy.
     */
    setRoot(src: Pointer): void;
    /**
     * Combine the contents of this message's segments into a single array buffer and prepend a stream framing header
     * containing information about the following segment data.
     *
     * @returns An ArrayBuffer with the contents of this message.
     */
    toArrayBuffer(): ArrayBuffer;
    /**
     * Like `toArrayBuffer()`, but also applies the packing algorithm to the output. This is typically what you want to
     * use if you're sending the message over a network link or other slow I/O interface where size matters.
     *
     * @returns A packed message.
     */
    toPackedArrayBuffer(): ArrayBuffer;
    addCap(client: Client | null): number;
    toString(): string;
}
declare function allocateSegment(byteLength: number, m: Message): Segment;
declare function dump(m: Message): string;
declare function getRoot<T extends Struct>(RootStruct: StructCtor<T>, m: Message): T;
declare function getSegment(id: number, m: Message): Segment;
declare function initRoot<T extends Struct>(RootStruct: StructCtor<T>, m: Message): T;
/**
 * Read a pointer in raw form (a packed message with framing headers). Does not
 * care or attempt to validate the input beyond parsing the message
 * segments.
 *
 * This is typically used by the compiler to load default values, but can be
 * useful to work with messages with an unknown schema.
 *
 * @param data The raw data to read.
 * @returns A root pointer.
 */
declare function readRawPointer(data: ArrayBuffer): Pointer;
declare function toArrayBuffer(m: Message): ArrayBuffer;
declare function toPackedArrayBuffer(m: Message): ArrayBuffer;

export { Join as $, Deferred as D, readRawPointer as E, Accept as G, Bootstrap as H, Interface as I, Call$1 as J, Call_SendResultsTo as K, Call_SendResultsTo_Which as N, ObjectSize as O, Pointer as P, CapDescriptor as Q, CapDescriptor_Which as R, Struct as S, Disembargo as U, Disembargo_Context as V, Disembargo_Context_Which as W, Exception as X, Exception_Type as Y, Finish as Z, Orphan as a, MessageTarget as a0, MessageTarget_Which as a1, Message_Which as a2, Payload as a3, PromisedAnswer as a4, PromisedAnswer_Op as a5, PromisedAnswer_Op_Which as a6, Provide as a7, Release as a8, Resolve as a9, Resolve_Which as aa, Return as ab, Return_Which as ac, ThirdPartyCapDescriptor as ad, _capnpFileId as ae, Server as b, List as c, Message as d, Message$1 as h, ListElementSize as j, PointerType as k, Segment as l, Conn as n, answerPipelineClient as t, clientFromResolution as u, copyCall as v, isDataCall as w, isFuncCall as x, isSameClient as y, placeParams as z };
export type { Answer as A, BaseCall as B, Client as C, FuncCall as F, ListCtor as L, Method as M, Transport as T, _StructCtor as _, PipelineOp as e, Call as f, StructCtor as g, PointerCtor as i, _ListCtor as m, DataCall as o, ImportEntry as p, ServerCall as q, ServerMethod as r, _Pointer as s };
