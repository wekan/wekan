'use strict';

// Use the browser's image codecs so Docker tests never load native modules
// installed for the host OS. The application still exercises its own codecs.
async function solidPng(page, width, height, color) {
  const base64 = await page.evaluate(({ width, height, color }) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, width, height);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { width, height, color });
  return Buffer.from(base64, 'base64');
}

async function imageDimensions(page, bytes, type) {
  return page.evaluate(async ({ base64, type }) => {
    const image = new Image();
    image.src = `data:${type};base64,${base64}`;
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  }, { base64: bytes.toString('base64'), type });
}

module.exports = { solidPng, imageDimensions };
