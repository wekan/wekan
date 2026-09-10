//#region packages/core/src/worker/transfer.ts
function e(e) {
	return e.byteOffset === 0 && e.byteLength === e.buffer.byteLength && e.buffer instanceof ArrayBuffer ? e.buffer : e.slice().buffer;
}
//#endregion
export { e as t };
