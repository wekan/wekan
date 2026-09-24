export const MAX_SOURCE_BYTES = 32 * 1024 * 1024;

function assertSourceSize(size) {
  if (Number.isFinite(size) && size > MAX_SOURCE_BYTES) {
    throw new RangeError('Attachment exceeds the preview size limit');
  }
}

async function readBoundedResponse(response) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new Error('Streaming attachment downloads are required for previews');
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      assertSourceSize(total);
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}

export { assertSourceSize, readBoundedResponse };
