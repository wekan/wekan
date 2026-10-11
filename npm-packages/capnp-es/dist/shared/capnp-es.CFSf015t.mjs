import { L as List, M as ListElementSize, c as copyFrom } from './capnp-es.D8zdZmih.mjs';

function CompositeList(CompositeClass) {
  return class extends List {
    static _capnp = {
      compositeSize: CompositeClass._capnp.size,
      displayName: `List<${CompositeClass._capnp.displayName}>`,
      size: ListElementSize.COMPOSITE
    };
    get(index) {
      return new CompositeClass(
        this.segment,
        this.byteOffset,
        this._capnp.depthLimit - 1,
        index
      );
    }
    set(index, value) {
      copyFrom(value, this.get(index));
    }
    [Symbol.toStringTag]() {
      return `Composite_${super.toString()},cls:${CompositeClass.toString()}`;
    }
  };
}

function _makePrimitiveMaskFn(byteLength, setter) {
  return (x) => {
    const dv = new DataView(new ArrayBuffer(byteLength));
    setter.call(dv, 0, x, true);
    return dv;
  };
}
const getFloat32Mask = _makePrimitiveMaskFn(
  4,
  DataView.prototype.setFloat32
);
const getFloat64Mask = _makePrimitiveMaskFn(
  8,
  DataView.prototype.setFloat64
);
const getInt16Mask = _makePrimitiveMaskFn(
  2,
  DataView.prototype.setInt16
);
const getInt32Mask = _makePrimitiveMaskFn(
  4,
  DataView.prototype.setInt32
);
const getInt64Mask = _makePrimitiveMaskFn(
  8,
  DataView.prototype.setBigInt64
);
const getInt8Mask = _makePrimitiveMaskFn(1, DataView.prototype.setInt8);
const getUint16Mask = _makePrimitiveMaskFn(
  2,
  DataView.prototype.setUint16
);
const getUint32Mask = _makePrimitiveMaskFn(
  4,
  DataView.prototype.setUint32
);
const getUint64Mask = _makePrimitiveMaskFn(
  8,
  DataView.prototype.setBigUint64
);
const getUint8Mask = _makePrimitiveMaskFn(
  1,
  DataView.prototype.setUint8
);
function getBitMask(value, bitOffset) {
  const dv = new DataView(new ArrayBuffer(1));
  if (!value) {
    return dv;
  }
  dv.setUint8(0, 1 << bitOffset % 8);
  return dv;
}

export { CompositeList as C, getBitMask as a, getUint8Mask as b, getFloat32Mask as c, getFloat64Mask as d, getInt16Mask as e, getInt32Mask as f, getUint16Mask as g, getInt64Mask as h, getInt8Mask as i, getUint32Mask as j, getUint64Mask as k };
