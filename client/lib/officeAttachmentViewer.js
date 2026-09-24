import { MAX_SOURCE_BYTES, assertSourceSize, readBoundedResponse } from './attachmentPreviewSource.js';

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
