import { S as Struct, O as ObjectSize, a as Orphan, P as Pointer } from '../shared/capnp-es.CnTZV_-5.mjs';

declare const _capnpFileId = 11638646725519536801n;
declare const Side: {
    /**
  * The object lives on the "server" or "supervisor" end of the connection. Only the
  * server/supervisor knows how to interpret the ref; to the client, it is opaque.
  *
  * Note that containers intending to implement strong confinement should rewrite SturdyRefs
  * received from the external network before passing them on to the confined app. The confined
  * app thus does not ever receive the raw bits of the SturdyRef (which it could perhaps
  * maliciously leak), but instead receives only a thing that it can pass back to the container
  * later to restore the ref. See:
  * http://www.erights.org/elib/capability/dist-confine.html
  *
  */
    readonly SERVER: 0;
    /**
  * The object lives on the "client" or "confined app" end of the connection. Only the client
  * knows how to interpret the ref; to the server/supervisor, it is opaque. Most clients do not
  * actually know how to persist capabilities at all, so use of this is unusual.
  *
  */
    readonly CLIENT: 1;
};
type Side = (typeof Side)[keyof typeof Side];
declare class VatId extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    get side(): Side;
    set side(value: Side);
    toString(): string;
}
/**
* Only used for joins, since three-way introductions never happen on a two-party network.
*
*/
declare class ProvisionId extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * The ID from `JoinKeyPart`.
  *
  */
    get joinId(): number;
    set joinId(value: number);
    toString(): string;
}
/**
* Never used, because there are only two parties.
*
*/
declare class RecipientId extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    toString(): string;
}
/**
* Never used, because there is no third party.
*
*/
declare class ThirdPartyCapId extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    toString(): string;
}
/**
* Joins in the two-party case are simplified by a few observations.
*
* First, on a two-party network, a Join only ever makes sense if the receiving end is also
* connected to other networks.  A vat which is not connected to any other network can safely
* reject all joins.
*
* Second, since a two-party connection bisects the network -- there can be no other connections
* between the networks at either end of the connection -- if one part of a join crosses the
* connection, then _all_ parts must cross it.  Therefore, a vat which is receiving a Join request
* off some other network which needs to be forwarded across the two-party connection can
* collect all the parts on its end and only forward them across the two-party connection when all
* have been received.
*
* For example, imagine that Alice and Bob are vats connected over a two-party connection, and
* each is also connected to other networks.  At some point, Alice receives one part of a Join
* request off her network.  The request is addressed to a capability that Alice received from
* Bob and is proxying to her other network.  Alice goes ahead and responds to the Join part as
* if she hosted the capability locally (this is important so that if not all the Join parts end
* up at Alice, the original sender can detect the failed Join without hanging).  As other parts
* trickle in, Alice verifies that each part is addressed to a capability from Bob and continues
* to respond to each one.  Once the complete set of join parts is received, Alice checks if they
* were all for the exact same capability.  If so, she doesn't need to send anything to Bob at
* all.  Otherwise, she collects the set of capabilities (from Bob) to which the join parts were
* addressed and essentially initiates a _new_ Join request on those capabilities to Bob.  Alice
* does not forward the Join parts she received herself, but essentially forwards the Join as a
* whole.
*
* On Bob's end, since he knows that Alice will always send all parts of a Join together, he
* simply waits until he's received them all, then performs a join on the respective capabilities
* as if it had been requested locally.
*
*/
declare class JoinKeyPart extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * A number identifying this join, chosen by the sender.  May be reused once `Finish` messages are
  * sent corresponding to all of the `Join` messages.
  *
  */
    get joinId(): number;
    set joinId(value: number);
    /**
  * The number of capabilities to be joined.
  *
  */
    get partCount(): number;
    set partCount(value: number);
    /**
  * Which part this request targets -- a number in the range [0, partCount).
  *
  */
    get partNum(): number;
    set partNum(value: number);
    toString(): string;
}
declare class JoinResult extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    /**
  * Matches `JoinKeyPart`.
  *
  */
    get joinId(): number;
    set joinId(value: number);
    /**
  * All JoinResults in the set will have the same value for `succeeded`.  The receiver actually
  * implements the join by waiting for all the `JoinKeyParts` and then performing its own join on
  * them, then going back and answering all the join requests afterwards.
  *
  */
    get succeeded(): boolean;
    set succeeded(value: boolean);
    _adoptCap(value: Orphan<Pointer>): void;
    _disownCap(): Orphan<Pointer>;
    /**
  * One of the JoinResults will have a non-null `cap` which is the joined capability.
  *
  */
    get cap(): Pointer;
    _hasCap(): boolean;
    set cap(value: Pointer);
    toString(): string;
}

export { JoinKeyPart, JoinResult, ProvisionId, RecipientId, Side, ThirdPartyCapId, VatId, _capnpFileId };
