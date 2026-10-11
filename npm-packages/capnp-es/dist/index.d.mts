import { T as Transport, D as Deferred, h as Message, C as Client, S as Struct, f as Call, A as Answer, M as Method, c as List, P as Pointer, _ as _StructCtor, g as StructCtor, L as ListCtor, i as PointerCtor, O as ObjectSize, a as Orphan, j as ListElementSize, k as PointerType, l as Segment, d as Message$1, m as _ListCtor, I as Interface } from './shared/capnp-es.CnTZV_-5.mjs';
export { B as BaseCall, n as Conn, o as DataCall, F as FuncCall, p as ImportEntry, b as Server, q as ServerCall, r as ServerMethod, s as _Pointer, t as answerPipelineClient, u as clientFromResolution, v as copyCall, w as isDataCall, x as isFuncCall, y as isSameClient, z as placeParams, E as readRawPointer } from './shared/capnp-es.CnTZV_-5.mjs';
import { D as Data } from './shared/capnp-es.D8uferQ3.mjs';
export { P as Pipeline } from './shared/capnp-es.Bmo_Tegm.mjs';

declare abstract class DeferredTransport implements Transport {
    protected d?: Deferred<Message>;
    protected closed: boolean;
    abstract sendMessage(msg: Message): void;
    close(): void;
    recvMessage(): Promise<Message>;
    protected reject: (err: unknown) => void;
    protected resolve: (buf: ArrayBuffer) => void;
}

declare class ErrorClient implements Client {
    err: Error;
    constructor(err: Error);
    call<P extends Struct, R extends Struct>(_call: Call<P, R>): Answer<R>;
    close(): void;
}
declare function clientOrNull(client: Client | null): Client;

interface InterfaceDefinition {
    methods: Array<Method<any, any>>;
}
declare class Registry {
    static readonly interfaces: Map<bigint, InterfaceDefinition>;
    static register(id: bigint, def: InterfaceDefinition): void;
    static lookup(id: bigint): InterfaceDefinition | undefined;
}

declare class Text extends List<string> {
    static fromPointer(pointer: Pointer): Text;
    /**
     * Read a utf-8 encoded string value from this pointer.
     *
     * @param index The index at which to start reading; defaults to zero.
     * @returns The string value.
     */
    get(index?: number): string;
    /**
     * Get the number of utf-8 encoded bytes in this text. This does **not** include the NUL byte.
     *
     * @returns The number of bytes allocated for the text.
     */
    get length(): number;
    /**
     * Write a utf-8 encoded string value starting at the specified index.
     *
     * @param index The index at which to start copying the string. Note that if this is not zero the bytes
     * before `index` will be left as-is. All bytes after `index` will be overwritten.
     * @param value The string value to set.
     */
    set(index: number, value: string): void;
    toString(): string;
    toJSON(): string;
    [Symbol.toPrimitive](): string;
    [Symbol.toStringTag](): string;
}

declare class Void extends Struct {
    static readonly _capnp: _StructCtor;
}

/**
 * Initialize a struct with the provided object size. This will allocate new space for the struct contents, ideally in
 * the same segment as this pointer.
 *
 * @param size An object describing the size of the struct's data and pointer sections.
 * @param s The struct to initialize.
 */
declare function initStruct(size: ObjectSize, s: Struct): void;
declare function initStructAt<T extends Struct>(index: number, StructClass: StructCtor<T>, p: Pointer): T;
declare function checkPointerBounds(index: number, s: Struct): void;
declare function getInterfaceClientOrNullAt(index: number, s: Struct): Client;
declare function getInterfaceClientOrNull(p: Pointer): Client;
/**
 * Make a shallow copy of a struct's contents and update the pointer to point to the new content. The data and pointer
 * sections will be resized to the provided size.
 *
 * WARNING: This method can cause data loss if `dstSize` is smaller than the original size!
 *
 * @param dstSize The desired size for the struct contents.
 * @param s The struct to resize.
 */
declare function resize(dstSize: ObjectSize, s: Struct): void;
/**
 * Convert a struct to a struct of the provided class. Particularly useful when casting to nested group types.
 *
 * @param StructClass The struct class to convert to. Not particularly useful if `Struct`.
 * @param s The struct to convert.
 * @returns A new instance of the desired struct class pointing to the same location.
 */
declare function getAs<T extends Struct>(StructClass: StructCtor<T>, s: Struct): T;
/**
 * Read a boolean (bit) value out of a struct.
 *
 * @param bitOffset The offset in **bits** from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getBit(bitOffset: number, s: Struct, defaultMask?: DataView): boolean;
declare function getData(index: number, s: Struct, defaultValue?: Pointer): Data;
declare function getDataSection(s: Struct): Pointer;
/**
 * Read a float32 value out of a struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getFloat32(byteOffset: number, s: Struct, defaultMask?: DataView): number;
/**
 * Read a float64 value out of this segment.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getFloat64(byteOffset: number, s: Struct, defaultMask?: DataView): number;
/**
 * Read an int16 value out of this segment.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getInt16(byteOffset: number, s: Struct, defaultMask?: DataView): number;
/**
 * Read an int32 value out of this segment.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getInt32(byteOffset: number, s: Struct, defaultMask?: DataView): number;
/**
 * Read an int64 value out of this segment.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getInt64(byteOffset: number, s: Struct, defaultMask?: DataView): bigint;
/**
 * Read an int8 value out of this segment.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getInt8(byteOffset: number, s: Struct, defaultMask?: DataView): number;
declare function getList<T>(index: number, ListClass: ListCtor<T>, s: Struct, defaultValue?: Pointer): List<T>;
declare function getPointer(index: number, s: Struct): Pointer;
declare function getPointerAs<T extends Pointer>(index: number, PointerClass: PointerCtor<T>, s: Struct): T;
declare function getPointerSection(s: Struct): Pointer;
declare function getSize(s: Struct): ObjectSize;
declare function getStruct<T extends Struct>(index: number, StructClass: StructCtor<T>, s: Struct, defaultValue?: Pointer): T;
declare function getText(index: number, s: Struct, defaultValue?: string): string;
/**
 * Read an uint16 value out of a struct..
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getUint16(byteOffset: number, s: Struct, defaultMask?: DataView): number;
/**
 * Read an uint32 value out of a struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getUint32(byteOffset: number, s: Struct, defaultMask?: DataView): number;
/**
 * Read an uint64 value out of a struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getUint64(byteOffset: number, s: Struct, defaultMask?: DataView): bigint;
/**
 * Read an uint8 value out of a struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param s The struct to read from.
 * @param defaultMask The default value as a DataView.
 * @returns The value.
 */
declare function getUint8(byteOffset: number, s: Struct, defaultMask?: DataView): number;
declare function initData(index: number, length: number, s: Struct): Data;
declare function initList<T>(index: number, ListClass: ListCtor<T>, length: number, s: Struct): List<T>;
/**
 * Write a boolean (bit) value to the struct.
 *
 * @param bitOffset The offset in **bits** from the start of the data section.
 * @param value The value to write (writes a 0 for `false`, 1 for `true`).
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setBit(bitOffset: number, value: boolean, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive float32 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setFloat32(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive float64 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setFloat64(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive int16 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setInt16(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive int32 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setInt32(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive int64 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setInt64(byteOffset: number, value: bigint, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive int8 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setInt8(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
declare function setText(index: number, value: string, s: Struct): void;
/**
 * Write a primitive uint16 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setUint16(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive uint32 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setUint32(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive uint64 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setUint64(byteOffset: number, value: bigint, s: Struct, defaultMask?: DataView): void;
/**
 * Write a primitive uint8 value to the struct.
 *
 * @param byteOffset The offset in bytes from the start of the data section.
 * @param value The value to write.
 * @param s The struct to write to.
 * @param defaultMask The default value as a DataView.
 */
declare function setUint8(byteOffset: number, value: number, s: Struct, defaultMask?: DataView): void;
declare function testWhich(name: string, found: number, wanted: number, s: Struct): void;
declare function checkDataBounds(byteOffset: number, byteLength: number, s: Struct): void;

declare function adopt<T extends Pointer>(src: Orphan<T>, p: T): void;
/**
 * Convert a pointer to an Orphan, zeroing out the pointer and leaving its content untouched. If the content is no
 * longer needed, call `disown()` on the orphaned pointer to erase the contents as well.
 *
 * Call `adopt()` on the orphan with the new target pointer location to move it back into the message; the orphan
 * object is then invalidated after adoption (can only adopt once!).
 *
 * @param p The pointer to turn into an Orphan.
 * @returns An orphaned pointer.
 */
declare function disown<T extends Pointer>(p: T): Orphan<T>;
declare function dump(p: Pointer): string;
/**
 * Get the total number of bytes required to hold a list of the provided size with the given length, rounded up to the
 * nearest word.
 *
 * @param elementSize A number describing the size of the list elements.
 * @param length The length of the list.
 * @param compositeSize The size of each element in a composite list; required if
 * `elementSize === ListElementSize.COMPOSITE`.
 * @returns The number of bytes required to hold an element of that size, or `NaN` if that is undefined.
 */
declare function getListByteLength(elementSize: ListElementSize, length: number, compositeSize?: ObjectSize): number;
/**
 * Get the number of bytes required to hold a list element of the provided size. `COMPOSITE` elements do not have a
 * fixed size, and `BIT` elements are packed into exactly a single bit, so these both return `NaN`.
 *
 * @param elementSize A number describing the size of the list elements.
 * @returns The number of bytes required to hold an element of that size, or `NaN` if that is undefined.
 */
declare function getListElementByteLength(elementSize: ListElementSize): number;
/**
 * Add an offset to the pointer's offset and return a new Pointer for that address.
 *
 * @param offset The number of bytes to add to the offset.
 * @param p The pointer to add from.
 * @returns A new pointer to the address.
 */
declare function add(offset: number, p: Pointer): Pointer;
/**
 * Replace a pointer with a deep copy of the pointer at `src` and all of its contents.
 *
 * @param src The pointer to copy.
 * @param p The pointer to copy into.
 */
declare function copyFrom(src: Pointer, p: Pointer): void;
/**
 * Recursively erase a pointer, any far pointers/landing pads/tag words, and the content it points to.
 *
 * Note that this will leave "holes" of zeroes in the message, since the space cannot be reclaimed. With packing this
 * will have a negligible effect on the final message size.
 *
 * FIXME: This may need protection against infinite recursion...
 *
 * @param p The pointer to erase.
 */
declare function erase(p: Pointer): void;
/**
 * Set the pointer (and far pointer landing pads, if applicable) to zero. Does not touch the pointer's content.
 *
 * @param p The pointer to erase.
 */
declare function erasePointer(p: Pointer): void;
/**
 * Interpret the pointer as a far pointer, returning its target segment and offset.
 *
 * @param p The pointer to read from.
 * @returns A pointer to the far target.
 */
declare function followFar(p: Pointer): Pointer;
/**
 * If the pointer address references a far pointer, follow it to the location where the actual pointer data is written.
 * Otherwise, returns the pointer unmodified.
 *
 * @param p The pointer to read from.
 * @returns A new pointer representing the target location, or `p` if it is not a far pointer.
 */
declare function followFars(p: Pointer): Pointer;
declare function getCapabilityId(p: Pointer): number;
/**
 * Obtain the location of the pointer's content, following far pointers as needed.
 * If the pointer is a struct pointer and `compositeIndex` is set, it will be offset by a multiple of the struct's size.
 *
 * @param p The pointer to read from.
 * @param ignoreCompositeIndex If true, will not follow the composite struct pointer's composite index and
 * instead return a pointer to the parent list's contents (also the beginning of the first struct).
 * @returns A pointer to the beginning of the pointer's content.
 */
declare function getContent(p: Pointer, ignoreCompositeIndex?: boolean): Pointer;
/**
 * Read the target segment ID from a far pointer.
 *
 * @param p The pointer to read from.
 * @returns The target segment ID.
 */
declare function getFarSegmentId(p: Pointer): number;
/**
 * Get a number indicating the size of the list's elements.
 *
 * @param p The pointer to read from.
 * @returns The size of the list's elements.
 */
declare function getListElementSize(p: Pointer): ListElementSize;
/**
 * Get the number of elements in a list pointer. For composite lists, it instead represents the total number of words in
 * the list (not counting the tag word).
 *
 * This method does **not** attempt to distinguish between composite and non-composite lists. To get the correct
 * length for composite lists use `getTargetListLength()` instead.
 *
 * @param p The pointer to read from.
 * @returns The length of the list, or total number of words for composite lists.
 */
declare function getListLength(p: Pointer): number;
/**
 * Get the offset (in words) from the end of a pointer to the start of its content. For struct pointers, this is the
 * beginning of the data section, and for list pointers it is the location of the first element. The value should
 * always be zero for interface pointers.
 *
 * @param p The pointer to read from.
 * @returns The offset, in words, from the end of the pointer to the start of the data section.
 */
declare function getOffsetWords(p: Pointer): number;
/**
 * Look up the pointer's type.
 *
 * @param p The pointer to read from.
 * @returns The type of pointer.
 */
declare function getPointerType(p: Pointer): PointerType;
/**
 * Read the number of data words from this struct pointer.
 *
 * @param p The pointer to read from.
 * @returns The number of data words in the struct.
 */
declare function getStructDataWords(p: Pointer): number;
/**
 * Read the number of pointers contained in this struct pointer.
 *
 * @param p The pointer to read from.
 * @returns The number of pointers in this struct.
 */
declare function getStructPointerLength(p: Pointer): number;
/**
 * Get an object describing this struct pointer's size.
 *
 * @param p The pointer to read from.
 * @returns The size of the struct.
 */
declare function getStructSize(p: Pointer): ObjectSize;
/**
 * Get a pointer to this pointer's composite list tag word, following far pointers as needed.
 *
 * @param p The pointer to read from.
 * @returns A pointer to the list's composite tag word.
 */
declare function getTargetCompositeListTag(p: Pointer): Pointer;
/**
 * Get the object size for the target composite list, following far pointers as needed.
 *
 * @param p The pointer to read from.
 * @returns An object describing the size of each struct in the list.
 */
declare function getTargetCompositeListSize(p: Pointer): ObjectSize;
/**
 * Get the size of the list elements referenced by this pointer, following far pointers if necessary.
 *
 * @param p The pointer to read from.
 * @returns The size of the elements in the list.
 */
declare function getTargetListElementSize(p: Pointer): ListElementSize;
/**
 * Get the length of the list referenced by this pointer, following far pointers if necessary. If the list is a
 * composite list, it will look up the tag word and read the length from there.
 *
 * @param p The pointer to read from.
 * @returns The number of elements in the list.
 */
declare function getTargetListLength(p: Pointer): number;
/**
 * Get the type of a pointer, following far pointers if necessary. For non-far pointers this is equivalent to calling
 * `getPointerType()`.
 *
 * The target of a far pointer can never be another far pointer, and this method will throw if such a situation is
 * encountered.
 *
 * @param p The pointer to read from.
 * @returns The type of pointer referenced by this pointer.
 */
declare function getTargetPointerType(p: Pointer): PointerType;
/**
 * Get the size of the struct referenced by a pointer, following far pointers if necessary.
 *
 * @param p The pointer to read from.
 * @returns The size of the struct referenced by this pointer.
 */
declare function getTargetStructSize(p: Pointer): ObjectSize;
/**
 * Initialize a pointer to point at the data in the content segment. If the content segment is not the same as the
 * pointer's segment, this will allocate and write far pointers as needed. Nothing is written otherwise.
 *
 * The return value includes a pointer to write the pointer's actual data to (the eventual far target), and the offset
 * value (in words) to use for that pointer. In the case of double-far pointers this offset will always be zero.
 *
 * @param contentSegment The segment containing this pointer's content.
 * @param contentOffset The offset within the content segment for the beginning of this pointer's content.
 * @param p The pointer to initialize.
 * @returns An object containing a pointer (where the pointer data should be written), and
 * the value to use as the offset for that pointer.
 */
declare function initPointer(contentSegment: Segment, contentOffset: number, p: Pointer): PointerAllocationResult;
/**
 * Check if the pointer is a double-far pointer.
 *
 * @param p The pointer to read from.
 * @returns `true` if it is a double-far pointer, `false` otherwise.
 */
declare function isDoubleFar(p: Pointer): boolean;
/**
 * Quickly check to see if the pointer is "null". A "null" pointer is a zero word, equivalent to an empty struct
 * pointer.
 *
 * @param p The pointer to read from.
 * @returns `true` if the pointer is "null".
 */
declare function isNull(p: Pointer): boolean;
/**
 * Relocate a pointer to the given destination, ensuring that it points to the same content. This will create far
 * pointers as needed if the content is in a different segment than the destination. After the relocation the source
 * pointer will be erased and is no longer valid.
 *
 * @param dst The desired location for the `src` pointer. Any existing contents will be erased before
 * relocating!
 * @param src The pointer to relocate.
 */
declare function relocateTo(dst: Pointer, src: Pointer): void;
/**
 * Write a far pointer.
 *
 * @param doubleFar Set to `true` if this is a double far pointer.
 * @param offsetWords The offset, in words, to the target pointer.
 * @param segmentId The segment the target pointer is located in.
 * @param p The pointer to write to.
 */
declare function setFarPointer(doubleFar: boolean, offsetWords: number, segmentId: number, p: Pointer): void;
/**
 * Write a raw interface pointer.
 *
 * @param capId The capability ID.
 * @param p The pointer to write to.
 */
declare function setInterfacePointer(capId: number, p: Pointer): void;
/**
 * Reads a raw interface pointer
 *
 * @param p The pointer to read.
 * @returns The capability ID.
 */
declare function getInterfacePointer(p: Pointer): number;
/**
 * Write a raw list pointer.
 *
 * @param offsetWords The number of words from the end of this pointer to the beginning of the list content.
 * @param size The size of each element in the list.
 * @param length The number of elements in the list.
 * @param p The pointer to write to.
 * @param compositeSize For composite lists this describes the size of each element in this list. This
 * is required for composite lists.
 */
declare function setListPointer(offsetWords: number, size: ListElementSize, length: number, p: Pointer, compositeSize?: ObjectSize): void;
/**
 * Write a raw struct pointer.
 *
 * @param offsetWords The number of words from the end of this pointer to the beginning of the struct's data
 * section.
 * @param size An object describing the size of the struct.
 * @param p The pointer to write to.
 */
declare function setStructPointer(offsetWords: number, size: ObjectSize, p: Pointer): void;
/**
 * Read some bits off a pointer to make sure it has the right pointer data.
 *
 * @param pointerType The expected pointer type.
 * @param p The pointer to validate.
 * @param elementSize For list pointers, the expected element size. Leave this
 * undefined for struct pointers.
 */
declare function validate(pointerType: PointerType, p: Pointer, elementSize?: ListElementSize): void;
declare function copyFromInterface(src: Pointer, dst: Pointer): void;
declare function copyFromList(src: Pointer, dst: Pointer): void;
declare function copyFromStruct(src: Pointer, dst: Pointer): void;
/**
 * Track the allocation of a new Pointer object.
 *
 * This will decrement an internal counter tracking how many bytes have been traversed in the message so far. After
 * a certain limit, this method will throw an error in order to prevent a certain class of DoS attacks.
 *
 * @param message The message the pointer belongs to.
 * @param p The pointer being allocated.
 */
declare function trackPointerAllocation(message: Message$1, p: Pointer): void;
/**
 * This is used as the return value for `Pointer.prototype.initPointer`. Turns out using a class in V8 for multiple
 * return values is faster than using an array or anonymous object.
 *
 * http://jsben.ch/#/zTdbD
 */
declare class PointerAllocationResult {
    readonly pointer: Pointer;
    readonly offsetWords: number;
    constructor(pointer: Pointer, offsetWords: number);
}

type utils_PointerAllocationResult = PointerAllocationResult;
declare const utils_PointerAllocationResult: typeof PointerAllocationResult;
declare const utils_add: typeof add;
declare const utils_adopt: typeof adopt;
declare const utils_checkDataBounds: typeof checkDataBounds;
declare const utils_checkPointerBounds: typeof checkPointerBounds;
declare const utils_copyFrom: typeof copyFrom;
declare const utils_copyFromInterface: typeof copyFromInterface;
declare const utils_copyFromList: typeof copyFromList;
declare const utils_copyFromStruct: typeof copyFromStruct;
declare const utils_disown: typeof disown;
declare const utils_dump: typeof dump;
declare const utils_erase: typeof erase;
declare const utils_erasePointer: typeof erasePointer;
declare const utils_followFar: typeof followFar;
declare const utils_followFars: typeof followFars;
declare const utils_getAs: typeof getAs;
declare const utils_getBit: typeof getBit;
declare const utils_getCapabilityId: typeof getCapabilityId;
declare const utils_getContent: typeof getContent;
declare const utils_getData: typeof getData;
declare const utils_getDataSection: typeof getDataSection;
declare const utils_getFarSegmentId: typeof getFarSegmentId;
declare const utils_getFloat32: typeof getFloat32;
declare const utils_getFloat64: typeof getFloat64;
declare const utils_getInt16: typeof getInt16;
declare const utils_getInt32: typeof getInt32;
declare const utils_getInt64: typeof getInt64;
declare const utils_getInt8: typeof getInt8;
declare const utils_getInterfaceClientOrNull: typeof getInterfaceClientOrNull;
declare const utils_getInterfaceClientOrNullAt: typeof getInterfaceClientOrNullAt;
declare const utils_getInterfacePointer: typeof getInterfacePointer;
declare const utils_getList: typeof getList;
declare const utils_getListByteLength: typeof getListByteLength;
declare const utils_getListElementByteLength: typeof getListElementByteLength;
declare const utils_getListElementSize: typeof getListElementSize;
declare const utils_getListLength: typeof getListLength;
declare const utils_getOffsetWords: typeof getOffsetWords;
declare const utils_getPointer: typeof getPointer;
declare const utils_getPointerAs: typeof getPointerAs;
declare const utils_getPointerSection: typeof getPointerSection;
declare const utils_getPointerType: typeof getPointerType;
declare const utils_getSize: typeof getSize;
declare const utils_getStruct: typeof getStruct;
declare const utils_getStructDataWords: typeof getStructDataWords;
declare const utils_getStructPointerLength: typeof getStructPointerLength;
declare const utils_getStructSize: typeof getStructSize;
declare const utils_getTargetCompositeListSize: typeof getTargetCompositeListSize;
declare const utils_getTargetCompositeListTag: typeof getTargetCompositeListTag;
declare const utils_getTargetListElementSize: typeof getTargetListElementSize;
declare const utils_getTargetListLength: typeof getTargetListLength;
declare const utils_getTargetPointerType: typeof getTargetPointerType;
declare const utils_getTargetStructSize: typeof getTargetStructSize;
declare const utils_getText: typeof getText;
declare const utils_getUint16: typeof getUint16;
declare const utils_getUint32: typeof getUint32;
declare const utils_getUint64: typeof getUint64;
declare const utils_getUint8: typeof getUint8;
declare const utils_initData: typeof initData;
declare const utils_initList: typeof initList;
declare const utils_initPointer: typeof initPointer;
declare const utils_initStruct: typeof initStruct;
declare const utils_initStructAt: typeof initStructAt;
declare const utils_isDoubleFar: typeof isDoubleFar;
declare const utils_isNull: typeof isNull;
declare const utils_relocateTo: typeof relocateTo;
declare const utils_resize: typeof resize;
declare const utils_setBit: typeof setBit;
declare const utils_setFarPointer: typeof setFarPointer;
declare const utils_setFloat32: typeof setFloat32;
declare const utils_setFloat64: typeof setFloat64;
declare const utils_setInt16: typeof setInt16;
declare const utils_setInt32: typeof setInt32;
declare const utils_setInt64: typeof setInt64;
declare const utils_setInt8: typeof setInt8;
declare const utils_setInterfacePointer: typeof setInterfacePointer;
declare const utils_setListPointer: typeof setListPointer;
declare const utils_setStructPointer: typeof setStructPointer;
declare const utils_setText: typeof setText;
declare const utils_setUint16: typeof setUint16;
declare const utils_setUint32: typeof setUint32;
declare const utils_setUint64: typeof setUint64;
declare const utils_setUint8: typeof setUint8;
declare const utils_testWhich: typeof testWhich;
declare const utils_trackPointerAllocation: typeof trackPointerAllocation;
declare const utils_validate: typeof validate;
declare namespace utils {
  export {
    utils_PointerAllocationResult as PointerAllocationResult,
    utils_add as add,
    utils_adopt as adopt,
    utils_checkDataBounds as checkDataBounds,
    utils_checkPointerBounds as checkPointerBounds,
    utils_copyFrom as copyFrom,
    utils_copyFromInterface as copyFromInterface,
    utils_copyFromList as copyFromList,
    utils_copyFromStruct as copyFromStruct,
    utils_disown as disown,
    utils_dump as dump,
    utils_erase as erase,
    utils_erasePointer as erasePointer,
    utils_followFar as followFar,
    utils_followFars as followFars,
    utils_getAs as getAs,
    utils_getBit as getBit,
    utils_getCapabilityId as getCapabilityId,
    utils_getContent as getContent,
    utils_getData as getData,
    utils_getDataSection as getDataSection,
    utils_getFarSegmentId as getFarSegmentId,
    utils_getFloat32 as getFloat32,
    utils_getFloat64 as getFloat64,
    utils_getInt16 as getInt16,
    utils_getInt32 as getInt32,
    utils_getInt64 as getInt64,
    utils_getInt8 as getInt8,
    utils_getInterfaceClientOrNull as getInterfaceClientOrNull,
    utils_getInterfaceClientOrNullAt as getInterfaceClientOrNullAt,
    utils_getInterfacePointer as getInterfacePointer,
    utils_getList as getList,
    utils_getListByteLength as getListByteLength,
    utils_getListElementByteLength as getListElementByteLength,
    utils_getListElementSize as getListElementSize,
    utils_getListLength as getListLength,
    utils_getOffsetWords as getOffsetWords,
    utils_getPointer as getPointer,
    utils_getPointerAs as getPointerAs,
    utils_getPointerSection as getPointerSection,
    utils_getPointerType as getPointerType,
    utils_getSize as getSize,
    utils_getStruct as getStruct,
    utils_getStructDataWords as getStructDataWords,
    utils_getStructPointerLength as getStructPointerLength,
    utils_getStructSize as getStructSize,
    utils_getTargetCompositeListSize as getTargetCompositeListSize,
    utils_getTargetCompositeListTag as getTargetCompositeListTag,
    utils_getTargetListElementSize as getTargetListElementSize,
    utils_getTargetListLength as getTargetListLength,
    utils_getTargetPointerType as getTargetPointerType,
    utils_getTargetStructSize as getTargetStructSize,
    utils_getText as getText,
    utils_getUint16 as getUint16,
    utils_getUint32 as getUint32,
    utils_getUint64 as getUint64,
    utils_getUint8 as getUint8,
    utils_initData as initData,
    utils_initList as initList,
    utils_initPointer as initPointer,
    utils_initStruct as initStruct,
    utils_initStructAt as initStructAt,
    utils_isDoubleFar as isDoubleFar,
    utils_isNull as isNull,
    utils_relocateTo as relocateTo,
    utils_resize as resize,
    utils_setBit as setBit,
    utils_setFarPointer as setFarPointer,
    utils_setFloat32 as setFloat32,
    utils_setFloat64 as setFloat64,
    utils_setInt16 as setInt16,
    utils_setInt32 as setInt32,
    utils_setInt64 as setInt64,
    utils_setInt8 as setInt8,
    utils_setInterfacePointer as setInterfacePointer,
    utils_setListPointer as setListPointer,
    utils_setStructPointer as setStructPointer,
    utils_setText as setText,
    utils_setUint16 as setUint16,
    utils_setUint32 as setUint32,
    utils_setUint64 as setUint64,
    utils_setUint8 as setUint8,
    utils_testWhich as testWhich,
    utils_trackPointerAllocation as trackPointerAllocation,
    utils_validate as validate,
  };
}

declare const AnyPointerList: ListCtor<Pointer>;

declare class BoolList extends List<boolean> {
    static readonly _capnp: _ListCtor;
    get(index: number): boolean;
    set(index: number, value: boolean): void;
    [Symbol.toStringTag](): string;
}

declare function CompositeList<T extends Struct>(CompositeClass: StructCtor<T>): ListCtor<T>;

declare const DataList: ListCtor<Data>;

declare class Float32List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Float64List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Int8List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Int16List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Int32List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Int64List extends List<bigint> {
    static readonly _capnp: _ListCtor;
    get(index: number): bigint;
    set(index: number, value: bigint): void;
    [Symbol.toStringTag](): string;
}

declare const InterfaceList: ListCtor<Interface>;

declare function PointerList<T extends Pointer>(PointerClass: PointerCtor<T>): ListCtor<T>;

declare class TextList extends List<string> {
    static readonly _capnp: _ListCtor;
    get(index: number): string;
    set(index: number, value: string): void;
    [Symbol.toStringTag](): string;
}

declare class Uint8List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Uint16List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Uint32List extends List<number> {
    static readonly _capnp: _ListCtor;
    get(index: number): number;
    set(index: number, value: number): void;
    [Symbol.toStringTag](): string;
}

declare class Uint64List extends List<bigint> {
    static readonly _capnp: _ListCtor;
    get(index: number): bigint;
    set(index: number, value: bigint): void;
    [Symbol.toStringTag](): string;
}

declare const VoidList: ListCtor<Void>;

declare const getFloat32Mask: (x: number) => DataView;
declare const getFloat64Mask: (x: number) => DataView;
declare const getInt16Mask: (x: number) => DataView;
declare const getInt32Mask: (x: number) => DataView;
declare const getInt64Mask: (x: bigint) => DataView;
declare const getInt8Mask: (x: number) => DataView;
declare const getUint16Mask: (x: number) => DataView;
declare const getUint32Mask: (x: number) => DataView;
declare const getUint64Mask: (x: bigint) => DataView;
declare const getUint8Mask: (x: number) => DataView;
declare function getBitMask(value: boolean, bitOffset: number): DataView;

export { AnyPointerList, BoolList, Call, Client, CompositeList, Data, DataList, Deferred, DeferredTransport, ErrorClient, Float32List, Float64List, Int16List, Int32List, Int64List, Int8List, Interface, InterfaceList, List, ListCtor, ListElementSize, Message$1 as Message, Method, ObjectSize, Orphan, Pointer, PointerList, PointerType, Registry, Struct, StructCtor, Text, TextList, Transport, Uint16List, Uint32List, Uint64List, Uint8List, Void, VoidList, clientOrNull, getBitMask, getFloat32Mask, getFloat64Mask, getInt16Mask, getInt32Mask, getInt64Mask, getInt8Mask, getUint16Mask, getUint32Mask, getUint64Mask, getUint8Mask, utils };
