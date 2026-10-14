// #2460: SQRL in the browser (the server side is server/sqrl.js). A session
// shows its sqrl:// link and QR code, then waits for the member's SQRL client
// to answer; the sign-in page then signs in with the session's secret.
import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import qrcode from 'qrcode-generator';

const POLL_MS = 2000;

export function sqrlOffered(setting) {
  return !!(setting && setting.sqrlEnabled === true) && !Meteor.settings?.public?.sandstorm;
}

// The link as a QR code, for a SQRL app on a phone. The SVG is made from the
// link alone, which the server built.
export function sqrlQrSvg(link) {
  const qr = qrcode(0, 'M');
  qr.addData(link);
  qr.make();
  return qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

function login(sqrl) {
  return new Promise((resolve, reject) => {
    Accounts.callLoginMethod({ methodArguments: [{ sqrl }], userCallback: error => (error ? reject(error) : resolve()) });
  });
}

// Runs one session. `show({ link, svg })` is called once there is something
// to scan; resolves to how it ended: 'signed-in' (a sign-in session), 'done'
// (an identity was added), 'cps' (the SQRL client signed in another browser
// tab on this device), 'expired' or 'cancelled'.
export async function runSqrlSession(purpose, { show, cancelled }) {
  const { session, secret, link } = await Meteor.callAsync('sqrlStart', purpose);
  show({ link, svg: sqrlQrSvg(link) });
  while (!cancelled()) {
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
    if (cancelled()) break;
    const state = await Meteor.callAsync('sqrlPoll', session, secret);
    if (state === 'ready') {
      await login({ session, secret });
      return 'signed-in';
    }
    if (state !== 'pending') return state === 'used' ? 'expired' : state;
  }
  return 'cancelled';
}

// The page a SQRL client opened on this device (cps): /sign-in?sqrl=<token>.
export function signInWithSqrlToken(token) {
  return login({ cps: String(token) });
}
