# Card menu / QR code

Card menu (☰ in the opened card's header, **Card Actions**) → **QR code**
shows the card's link as a QR code, to open the card on a phone or tablet
([#2015](https://github.com/wekan/wekan/issues/2015); `cardQrCodePopup` in
`client/components/cards/cardDetails.jade`).

## Who sees it

Every signed-in user who can open the card. It changes nothing.

## What it shows

- The QR code of the card's absolute address (the same one **Copy link to
  clipboard** copies; see [Board item links](../General/Board-Item-Links.md)),
  264 × 264 pixels.
- *Scan it to open this card on a phone or tablet.* and the address as text.
- If the address is too long for the encoder: *The link of this card is too
  long for a QR code.*

The code is drawn in the browser by `models/lib/qrCode.js` (byte mode, error
correction level M, versions 1-10, up to 213 bytes). Nothing is sent
anywhere. Whoever scans it still has to sign in and have access to the
board.
