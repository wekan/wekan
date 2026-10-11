import { c as List, P as Pointer } from './capnp-es.CnTZV_-5.mjs';

/**
 * A generic blob of bytes. Can be converted to a DataView or Uint8Array to access its contents using `toDataView()` and
 * `toUint8Array()`. Use `copyBuffer()` to copy an entire buffer at once.
 */
declare class Data extends List<number> {
    static fromPointer(pointer: Pointer): Data;
    protected static _fromPointerUnchecked(pointer: Pointer): Data;
    /**
     * Copy the contents of `src` into this Data pointer. If `src` is smaller than the length of this pointer then the
     * remaining bytes will be zeroed out. Extra bytes in `src` are ignored.
     *
     * @param src The source buffer.
     */
    copyBuffer(src: ArrayBuffer | ArrayBufferView): void;
    /**
     * Read a byte from the specified offset.
     *
     * @param byteOffset The byte offset to read.
     * @returns The byte value.
     */
    get(byteOffset: number): number;
    /**
     * Write a byte at the specified offset.
     *
     * @param byteOffset The byte offset to set.
     * @param value The byte value to set.
     */
    set(byteOffset: number, value: number): void;
    /**
     * Creates a **copy** of the underlying buffer data and returns it as an ArrayBuffer.
     *
     * To obtain a reference to the underlying buffer instead, use `toUint8Array()` or `toDataView()`.
     *
     * @returns A copy of this data buffer.
     */
    toArrayBuffer(): ArrayBuffer;
    /**
     * Convert this Data pointer to a DataView representing the pointer's contents.
     *
     * WARNING: The DataView references memory from a message segment, so do not venture outside the bounds of the
     * DataView or else BAD THINGS.
     *
     * @returns A live reference to the underlying buffer.
     */
    toDataView(): DataView;
    [Symbol.toStringTag](): string;
    /**
     * Convert this Data pointer to a Uint8Array representing the pointer's contents.
     *
     * WARNING: The Uint8Array references memory from a message segment, so do not venture outside the bounds of the
     * Uint8Array or else BAD THINGS.
     *
     * @returns A live reference to the underlying buffer.
     */
    toUint8Array(): Uint8Array;
}

export { Data as D };
