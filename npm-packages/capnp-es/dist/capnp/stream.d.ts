import { Struct, ObjectSize } from "../index.mjs";

declare const _capnpFileId: bigint;
/** Empty struct that serves as the return type for "streaming" methods. */
declare class StreamResult extends Struct {
    static readonly _capnp: {
        displayName: string;
        id: string;
        size: ObjectSize;
    };
    toString(): string;
}

export { StreamResult, _capnpFileId };
