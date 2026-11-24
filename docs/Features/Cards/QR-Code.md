# Card menu / QR code

## What it is

Card menu (☰ in the opened card's header, **Card Actions**) → **QR code**
shows the card's link as a QR code, to open the card on a phone or tablet
([#2015](https://github.com/wekan/wekan/issues/2015); `cardQrCodePopup` in
`client/components/cards/cardDetails.jade`). Point the phone's camera at the
screen and the card opens there, without typing its address.

## Read more

- [QR code](https://en.wikipedia.org/wiki/QR_code) on Wikipedia - the symbol,
  its versions and error correction levels (the standard is ISO/IEC 18004).
- [Reed–Solomon error correction](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction) -
  how a QR code still reads with part of it hidden.
- In WeKan: [Board item links](../Board-Item-Links.md).

## How to use it

1. Open the card and click ☰ in its header (**Card Actions**).
2. Under **Share and history**, click **QR code**.
3. Scan the code with a phone or tablet, and sign in there if asked.

### Who sees it

Every signed-in user who can open the card. It changes nothing.

### What it shows

- The QR code of the card's absolute address (the same one **Copy link to
  clipboard** copies; see [Board item links](../Board-Item-Links.md)),
  264 × 264 pixels.
- *Scan it to open this card on a phone or tablet.* and the address as text.
- If the address is too long for the encoder: *The link of this card is too
  long for a QR code.*

The code is drawn in the browser by `models/lib/qrCode.js` (byte mode, error
correction level M, versions 1-10, up to 213 bytes). Nothing is sent
anywhere. Whoever scans it still has to sign in and have access to the
board.

## How the numbers are calculated

From [models/lib/qrCode.js](../../../models/lib/qrCode.js):

- **Version**: the smallest of versions 1-10 whose level-M byte capacity holds
  the address's UTF-8 bytes (`versionFor`). Capacity is the sum of the data
  codewords of its blocks (`BLOCKS_M`), less the mode and length bits; version 1
  holds 14 bytes, version 10 holds 213. Over 213 bytes there is no code, and the
  "too long" message is shown.
- **Size**: version × 4 + 17 modules a side (21 for version 1, 57 for version
  10), plus a quiet zone of 4 modules on every side.
- **Mask**: each of the eight masks is tried and the one with the lowest penalty
  score of the standard is used (`penalty`).
- **Error correction**: Reed–Solomon over GF(256) with the polynomial
  x^8 + x^4 + x^3 + x^2 + 1; level M restores about 15 % of the codewords.
- **Picture**: drawn as SVG at 6 pixels a module (`qrSvg(url, { scale: 6 })`)
  and shown 264 × 264 pixels.

## How it works in WeKan

- **Client**: `Template.cardQrCodePopup` in
  [client/components/cards/cardDetails.js](../../../client/components/cards/cardDetails.js)
  takes `card.absoluteUrl()`, calls `qrSvg`, and shows it as a
  `data:image/svg+xml` image. The SVG is the encoder's own markup, never the
  link's text.
- **Encoder**: [models/lib/qrCode.js](../../../models/lib/qrCode.js), pure, with
  no dependency.
- Tests: [tests/qrCode.test.cjs](../../../tests/qrCode.test.cjs) checks the
  encoder against qrcode-svg, the encoder Meteor's own accounts-2fa ships, and
  the popup's template.

## Commits

 - [Card menu grouped under headings, QR code under Share and history](https://github.com/wekan/wekan/commit/0d8f8b8d96b868a6d75b803ef105e50aad450977)
 - [Card actions menu in the maintainer's order](https://github.com/wekan/wekan/commit/65621f44cc03db9b2b98276ffd2c7bed8590b2fd)
 - [The card's link as a QR code, drawn in the browser](https://github.com/wekan/wekan/commit/326d9bbf619ed811e9db92896a67f0ea6fa60b24)
