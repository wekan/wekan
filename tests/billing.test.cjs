'use strict';

// models/lib/billing.js: rates, budget, cost and invoices, as arithmetic.
// Run: node tests/billing.test.cjs

const assert = require('node:assert/strict');
const B = require('../models/lib/billing.js');

let passed = 0;
function test(name, fn) { fn(); passed += 1; console.log('  ok -', name); }

const rates = [
  { userId: null, hourlyRateMinor: 8000, currency: 'EUR' },   // board default 80.00
  { userId: 'senior', hourlyRateMinor: 12000, currency: 'EUR' }, // 120.00
];

test('money is integer cents: 0.1 + 0.2 adds up', () => {
  assert.equal(B.toMinor(0.1) + B.toMinor(0.2), B.toMinor(0.3));
  assert.equal(B.toMinor(12.345), 1235);
  assert.throws(() => B.toMinor(-1), /at least 0/);
  assert.throws(() => B.toMinor(NaN), /at least 0/);
  assert.throws(() => B.toMinor(1e12), /too large/);
});

test('rates: a member has their own, everybody else the board default', () => {
  assert.equal(B.rateFor(rates, 'senior', 'EUR').hourlyRateMinor, 12000);
  assert.equal(B.rateFor(rates, 'junior', 'EUR').hourlyRateMinor, 8000);
  assert.equal(B.rateFor(rates, 'senior', 'USD'), null, 'a rate in another currency is not used');
  assert.deepEqual(B.normalizeRate({ hourlyRate: 80, currency: 'eur' }), { userId: null, hourlyRateMinor: 8000, currency: 'EUR' });
});

test('negative: a rate needs a real currency and a positive number', () => {
  assert.throws(() => B.normalizeRate({ hourlyRate: 80, currency: 'EURO' }), /three-letter/);
  assert.throws(() => B.normalizeRate({ hourlyRate: '80', currency: 'EUR' }), /number/);
  assert.throws(() => B.normalizeRate({ hourlyRate: 80, currency: 'EUR', evil: 1 }), /Unsupported/);
});

test('cost: time spent at each carrier\'s rate; forecast adds the estimate still to do', () => {
  const f = B.boardFinance({
    rates,
    budget: { amountMinor: 200000, currency: 'EUR', hours: null },
    cards: [
      { _id: 'a', assignees: ['senior'], spentTime: 10, estimatedHours: 15 },  // 1200 spent, 5 h left = 600
      { _id: 'b', assignees: ['junior'], spentTime: 5, estimatedHours: 5 },    // 400 spent, nothing left
      { _id: 'c', assignees: ['senior', 'junior'], spentTime: 2 },             // 1 h @120 + 1 h @80 = 200
      { _id: 'd', spentTime: 1, estimatedHours: 3, dueComplete: true },        // nobody: default 80, done
    ],
  });
  assert.equal(f.currency, 'EUR');
  assert.equal(f.spentHours, 18);
  assert.equal(f.spentMinor, 120000 + 40000 + 20000 + 8000);
  assert.equal(f.remainingHours, 5);
  assert.equal(f.remainingMinor, 60000);
  assert.equal(f.forecastMinor, 248000);
  assert.equal(f.leftMinor, 200000 - 188000);
  assert.equal(f.usedPercent, 94);
  assert.equal(f.forecastPercent, 124);
  assert.equal(f.overBudget, true);
});

test('cost: an hours budget works without money, and within it is not over', () => {
  const f = B.boardFinance({ rates: [], budget: { amountMinor: null, currency: null, hours: 100 },
    cards: [{ _id: 'a', spentTime: 30, estimatedHours: 50 }] });
  assert.equal(f.forecastHours, 50);
  assert.equal(f.leftHours, 70);
  assert.equal(f.usedPercent, 30);
  assert.equal(f.overBudget, false);
  assert.equal(f.spentMinor, 0);
  assert.equal(f.unratedHours, 30, 'hours with no rate are counted, not priced at zero silently');
});

test('negative: a budget needs an amount or hours, and a period that runs forward', () => {
  assert.throws(() => B.normalizeBudget({}), /amount, hours, or both/);
  assert.throws(() => B.normalizeBudget({ amount: 10, currency: 'EUR', start: '2027-05-01', end: '2027-04-01' }), /not be before/);
  assert.throws(() => B.normalizeBudget({ amount: 10 }), /three-letter/);
  assert.throws(() => B.normalizeBudget({ hours: -1 }), /Hours/);
  assert.deepEqual(B.normalizeBudget({ hours: 40 }), { name: '', amountMinor: null, currency: null, hours: 40, start: null, end: null });
});

test('invoice: billable hours not invoiced yet, per person, at their rate', () => {
  const cards = [
    { _id: 'a', title: 'Design', assignees: ['senior'], spentTime: 10 },
    { _id: 'b', title: 'Build', assignees: ['senior', 'junior'], spentTime: 4 },
    { _id: 'c', title: 'Internal', assignees: ['junior'], spentTime: 3, billable: false },
  ];
  const d = B.draftInvoiceLines({ cards, rates });
  assert.deepEqual(d.lines.map(l => [l.cardId, l.userId, l.hours, l.amountMinor]),
    [['a', 'senior', 10, 120000], ['b', 'senior', 2, 24000], ['b', 'junior', 2, 16000]]);
  assert.equal(d.totalMinor, 160000);
  assert.equal(d.totalHours, 14);
  assert.equal(d.currency, 'EUR');
});

test('invoice: hours already on an invoice are not billed twice; a void invoice frees them', () => {
  const cards = [{ _id: 'a', title: 'Design', assignees: ['senior'], spentTime: 10 }];
  const first = { status: 'sent', lines: [{ cardId: 'a', hours: 6 }] };
  assert.deepEqual(B.draftInvoiceLines({ cards, rates, invoices: [first] }).lines.map(l => l.hours), [4]);
  assert.deepEqual(B.draftInvoiceLines({ cards, rates, invoices: [{ ...first, status: 'void' }] }).lines.map(l => l.hours), [10]);
  assert.deepEqual(B.draftInvoiceLines({ cards, rates, invoices: [{ status: 'paid', lines: [{ cardId: 'a', hours: 10 }] }] }).lines, []);
});

test('negative: hours with no rate are reported, never billed at zero; no rate at all is refused', () => {
  const d = B.draftInvoiceLines({ cards: [{ _id: 'a', assignees: ['x'], spentTime: 2 }],
    rates: [{ userId: 'senior', hourlyRateMinor: 12000, currency: 'EUR' }] });
  assert.deepEqual(d.lines, []);
  assert.equal(d.unratedHours, 2);
  assert.throws(() => B.draftInvoiceLines({ cards: [], rates: [] }), /hourly rate/);
});

test('invoice status: draft -> sent -> paid, or void; paid and void are final', () => {
  assert.equal(B.canChangeStatus('draft', 'sent'), true);
  assert.equal(B.canChangeStatus('sent', 'paid'), true);
  assert.equal(B.canChangeStatus('sent', 'void'), true);
  assert.equal(B.canChangeStatus('paid', 'void'), false);
  assert.equal(B.canChangeStatus('void', 'draft'), false);
  assert.equal(B.canChangeStatus('draft', 'paid'), false);
  assert.throws(() => B.normalizeInvoiceStatus('cancelled'), /Invalid invoice status/);
});

test('budget: invoiced and paid count only live invoices of the board\'s currency', () => {
  const f = B.boardFinance({ rates, cards: [], invoices: [
    { status: 'sent', totalMinor: 1000, currency: 'EUR' },
    { status: 'paid', totalMinor: 500, currency: 'EUR' },
    { status: 'void', totalMinor: 9999, currency: 'EUR' },
    { status: 'paid', totalMinor: 7777, currency: 'USD' },
  ] });
  assert.equal(f.invoicedMinor, 1500);
  assert.equal(f.paidMinor, 500);
});

test('numbers, money and CSV', () => {
  assert.equal(B.invoiceNumber(2027, 42), 'INV-2027-0042');
  assert.equal(B.formatMoney(1234567, 'EUR', 'en-US'), '€12,345.67');
  assert.equal(B.formatMoney(null, 'EUR'), '');
  const csv = B.invoiceCsv({ number: 'INV-2027-0001', currency: 'EUR', totalHours: 2, totalMinor: 16000,
    lines: [{ title: '=HYPERLINK("http://x")', userId: 'u', hours: 2, rateMinor: 8000, amountMinor: 16000 }] }, () => 'Ann "A"');
  assert.match(csv, /^"number","card","person","hours","rate","amount","currency"\r\n/);
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/x""\)"/, 'negative: a formula is written as text');
  assert.match(csv, /"Ann ""A"""/);
  assert.match(csv, /"160\.00","EUR"\r\n$/);
});

console.log(`\nbilling: ${passed} tests passed`);
