// n lowercase hex digits from the platform's cryptographic generator (Web
// Crypto, in Node and in browsers alike) - never Math.random, whose output
// predicts the rest of it (CodeQL js/insecure-randomness, alert #605: SandChat's
// users.uid). Each byte is two whole hex digits, so there is no folding onto an
// alphabet and no modulo bias. Its own module so the RandomBleed scanner in
// tests/fixedVulnerabilityClasses.test.cjs reads this alone.
export function randomHex(n) {
  const bytes = new Uint8Array(Math.ceil(n / 2));
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('').slice(0, n);
}
