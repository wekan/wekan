import { S as Struct, O as ObjectSize, b as getUint32, s as setUint32, e as getUint16, f as setUint16, h as getBit, j as setBit, a as adopt, g as getPointer, d as disown, i as isNull, c as copyFrom } from '../shared/capnp-es.D8zdZmih.mjs';

const _capnpFileId = 0xa184c7885cdaf2a1n;
const Side = {
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
  SERVER: 0,
  /**
  * The object lives on the "client" or "confined app" end of the connection. Only the client
  * knows how to interpret the ref; to the server/supervisor, it is opaque. Most clients do not
  * actually know how to persist capabilities at all, so use of this is unusual.
  *
  */
  CLIENT: 1
};
class VatId extends Struct {
  static _capnp = {
    displayName: "VatId",
    id: "d20b909fee733a8e",
    size: new ObjectSize(8, 0)
  };
  get side() {
    return getUint16(0, this);
  }
  set side(value) {
    setUint16(0, value, this);
  }
  toString() {
    return "VatId_" + super.toString();
  }
}
class ProvisionId extends Struct {
  static _capnp = {
    displayName: "ProvisionId",
    id: "b88d09a9c5f39817",
    size: new ObjectSize(8, 0)
  };
  /**
  * The ID from `JoinKeyPart`.
  *
  */
  get joinId() {
    return getUint32(0, this);
  }
  set joinId(value) {
    setUint32(0, value, this);
  }
  toString() {
    return "ProvisionId_" + super.toString();
  }
}
class RecipientId extends Struct {
  static _capnp = {
    displayName: "RecipientId",
    id: "89f389b6fd4082c1",
    size: new ObjectSize(0, 0)
  };
  toString() {
    return "RecipientId_" + super.toString();
  }
}
class ThirdPartyCapId extends Struct {
  static _capnp = {
    displayName: "ThirdPartyCapId",
    id: "b47f4979672cb59d",
    size: new ObjectSize(0, 0)
  };
  toString() {
    return "ThirdPartyCapId_" + super.toString();
  }
}
class JoinKeyPart extends Struct {
  static _capnp = {
    displayName: "JoinKeyPart",
    id: "95b29059097fca83",
    size: new ObjectSize(8, 0)
  };
  /**
  * A number identifying this join, chosen by the sender.  May be reused once `Finish` messages are
  * sent corresponding to all of the `Join` messages.
  *
  */
  get joinId() {
    return getUint32(0, this);
  }
  set joinId(value) {
    setUint32(0, value, this);
  }
  /**
  * The number of capabilities to be joined.
  *
  */
  get partCount() {
    return getUint16(4, this);
  }
  set partCount(value) {
    setUint16(4, value, this);
  }
  /**
  * Which part this request targets -- a number in the range [0, partCount).
  *
  */
  get partNum() {
    return getUint16(6, this);
  }
  set partNum(value) {
    setUint16(6, value, this);
  }
  toString() {
    return "JoinKeyPart_" + super.toString();
  }
}
class JoinResult extends Struct {
  static _capnp = {
    displayName: "JoinResult",
    id: "9d263a3630b7ebee",
    size: new ObjectSize(8, 1)
  };
  /**
  * Matches `JoinKeyPart`.
  *
  */
  get joinId() {
    return getUint32(0, this);
  }
  set joinId(value) {
    setUint32(0, value, this);
  }
  /**
  * All JoinResults in the set will have the same value for `succeeded`.  The receiver actually
  * implements the join by waiting for all the `JoinKeyParts` and then performing its own join on
  * them, then going back and answering all the join requests afterwards.
  *
  */
  get succeeded() {
    return getBit(32, this);
  }
  set succeeded(value) {
    setBit(32, value, this);
  }
  _adoptCap(value) {
    adopt(value, getPointer(0, this));
  }
  _disownCap() {
    return disown(this.cap);
  }
  /**
  * One of the JoinResults will have a non-null `cap` which is the joined capability.
  *
  */
  get cap() {
    return getPointer(0, this);
  }
  _hasCap() {
    return !isNull(getPointer(0, this));
  }
  set cap(value) {
    copyFrom(value, getPointer(0, this));
  }
  toString() {
    return "JoinResult_" + super.toString();
  }
}

export { JoinKeyPart, JoinResult, ProvisionId, RecipientId, Side, ThirdPartyCapId, VatId, _capnpFileId };
