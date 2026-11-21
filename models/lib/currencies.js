'use strict';

// How many decimals ("minor unit") each currency has, from ISO 4217: most
// have 2 (1 EUR = 100 cents), some none (1 JPY is the smallest), some 3
// (1 KWD = 1000 fils). Money in WeKan is kept as an integer of the minor unit
// (models/lib/billing.js), so 1 000 JPY is 1000 and 1.500 KWD is 1500 - never
// a float, and never a currency forced into cents it does not have.
// Pure: tests/currencies.test.cjs.

// ISO 4217 currencies whose minor unit is not 2. Every other code has 2.
const MINOR_UNITS = Object.freeze({
  // No decimals.
  BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0, PYG: 0, RWF: 0,
  UGX: 0, UYI: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
  // Three decimals.
  BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
  // Four decimals.
  CLF: 4, UYW: 4,
  // Not ISO 4217, kept to the satoshi (bitcoin) or the wei-like 18 is too
  // many for a safe integer: crypto amounts in WeKan are to 8 decimals.
  BTC: 8, LTC: 8, ETH: 8,
});

function minorUnits(currency) {
  const code = String(currency || '').toUpperCase();
  return Object.prototype.hasOwnProperty.call(MINOR_UNITS, code) ? MINOR_UNITS[code] : 2;
}

function factor(currency) {
  return 10 ** minorUnits(currency);
}

// A major-unit amount (12.5 EUR, 1000 JPY) to the integer of its minor unit.
function toMinorUnits(amount, currency) {
  return Math.round(amount * factor(currency));
}

// The integer back as a major-unit number.
function fromMinorUnits(minor, currency) {
  return minor / factor(currency);
}

// "12.50", "1000", "1.500" - as a payment code or a file writes an amount.
function minorToText(minor, currency) {
  const units = minorUnits(currency);
  const negative = minor < 0;
  const digits = String(Math.abs(Math.trunc(minor))).padStart(units + 1, '0');
  const text = units ? `${digits.slice(0, -units)}.${digits.slice(-units)}` : digits;
  return negative ? `-${text}` : text;
}

module.exports = { MINOR_UNITS, minorUnits, toMinorUnits, fromMinorUnits, minorToText };
