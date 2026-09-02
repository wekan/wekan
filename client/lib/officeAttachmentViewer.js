const MAX_SOURCE_BYTES = 32 * 1024 * 1024;

const VIEWER_OPTIONS = Object.freeze({
  mode: 'worker',
  enableHyperlinks: false,
  useGoogleFonts: false,
  resourceLimits: Object.freeze({
    maxArchiveEntryBytes: 32 * 1024 * 1024,
    maxTotalInflatedBytes: 96 * 1024 * 1024,
    maxArchiveEntries: 2048,
  }),
  imageResources: Object.freeze({
    decodedByteBudget: 64 * 1024 * 1024,
    strategy: 'strict',
    resolution: 'display',
  }),
});

function assertSourceSize(size) {
  if (Number.isFinite(size) && size > MAX_SOURCE_BYTES) {
    throw new RangeError('Office attachment exceeds the preview size limit');
  }
}

async function readBoundedResponse(response) {
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw new Error('Streaming attachment downloads are required for Office previews');
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

async function viewerFor(extension, container) {
  switch (extension) {
    case 'docx': {
      const { DocxScrollViewer } = await import('@wekan/office-open-xml-viewer/docx');
      return new DocxScrollViewer(container, VIEWER_OPTIONS);
    }
    case 'xlsx': {
      const { XlsxViewer } = await import('@wekan/office-open-xml-viewer/xlsx');
      return new XlsxViewer(container, VIEWER_OPTIONS);
    }
    case 'pptx': {
      const { PptxScrollViewer } = await import('@wekan/office-open-xml-viewer/pptx');
      return new PptxScrollViewer(container, VIEWER_OPTIONS);
    }
    default:
      throw new TypeError('Unsupported Office attachment type');
  }
}

async function openOfficeAttachment({ container, extension, signal, size, url }) {
  assertSourceSize(size);

  let viewer;
  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      signal,
    });
    if (!response.ok) throw new Error(`Office attachment fetch failed: ${response.status}`);

    const contentLength = Number(response.headers.get('content-length'));
    assertSourceSize(contentLength);
    const bytes = await readBoundedResponse(response);

    viewer = await viewerFor(extension, container);
    await viewer.load(bytes);
    return {
      destroy() {
        viewer.destroy();
      },
    };
  } catch (error) {
    if (viewer) viewer.destroy();
    throw error;
  }
}

export {
  MAX_SOURCE_BYTES,
  VIEWER_OPTIONS,
  assertSourceSize,
  readBoundedResponse,
  openOfficeAttachment,
};
