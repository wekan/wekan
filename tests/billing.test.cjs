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

const cards = [
  { _id: 'a', title: 'Design', assignees: ['senior'], spentTime: 10 },
  { _id: 'b', title: 'Build', assignees: ['senior', 'junior'], spentTime: 4 },
  { _id: 'c', title: 'Internal', assignees: ['junior'], spentTime: 3, billable: false },
];
const entries = [
  { _id: 'e1', cardId: 'a', userId: 'senior', date: '2027-04-03', hours: 6 },
  { _id: 'e2', cardId: 'a', userId: 'senior', date: '2027-05-02', hours: 4 },
  { _id: 'e3', cardId: 'b', userId: 'junior', date: '2027-04-10', hours: 3 },
  { _id: 'e4', cardId: 'b', userId: 'junior', date: '2027-04-11', hours: -1 },  // a correction
  { _id: 'e5', cardId: 'b', date: null, hours: 2, source: 'legacy' },           // before entries: carriers
  { _id: 'e6', cardId: 'c', userId: 'junior', date: '2027-04-12', hours: 3 },   // not billable
];

test('invoice: the entries of a period, per card and the person who logged them, at their rate', () => {
  const d = B.draftInvoiceLines({ cards, entries, rates, period: { start: '2027-04-01', end: '2027-04-30' } });
  assert.deepEqual(d.lines.map(l => [l.cardId, l.userId, l.hours, l.amountMinor, l.firstDate, l.lastDate]),
    [['b', 'junior', 2, 16000, '2027-04-10', '2027-04-11'], ['a', 'senior', 6, 72000, '2027-04-03', '2027-04-03']]);
  assert.deepEqual(d.entryIds.sort(), ['e1', 'e3', 'e4']);
  assert.equal(d.netMinor, 88000);
  assert.equal(d.totalHours, 8);
});

test('invoice: undated time from before entries is taken only when asked, as the card\'s carriers', () => {
  const d = B.draftInvoiceLines({ cards, entries, rates, period: { start: '2027-04-01', end: '2027-04-30', includeUndated: true } });
  const build = d.lines.filter(l => l.cardId === 'b').map(l => [l.userId, l.hours]);
  assert.deepEqual(build.sort(), [['junior', 3], ['senior', 1]]);
  assert.equal(d.undatedHours, 2);
});

test('invoice: with no period, every open entry; entries on an invoice are not billed twice', () => {
  const all = B.draftInvoiceLines({ cards, entries, rates });
  assert.equal(all.lines.find(l => l.cardId === 'a').hours, 10);
  const later = B.draftInvoiceLines({ cards, rates, entries: entries.map(e => (e._id === 'e1' ? { ...e, invoiceId: 'i1' } : e)) });
  assert.equal(later.lines.find(l => l.cardId === 'a').hours, 4);
});

test('negative: time with no rate is reported, never billed at zero; no rate at all is refused', () => {
  const d = B.draftInvoiceLines({ cards: [{ _id: 'a', title: 'x' }], entries: [{ _id: 'e', cardId: 'a', userId: 'x', date: '2027-04-01', hours: 2 }],
    rates: [{ userId: 'senior', hourlyRateMinor: 12000, currency: 'EUR' }] });
  assert.deepEqual(d.lines, []);
  assert.equal(d.unratedHours, 2);
  assert.throws(() => B.draftInvoiceLines({ cards: [], rates: [] }), /hourly rate/);
});

test('VAT: rounded once, on the net', () => {
  assert.deepEqual(B.invoiceTotals(88000, 25.5), { netMinor: 88000, vatPercent: 25.5, vatMinor: 22440, totalMinor: 110440 });
  assert.deepEqual(B.invoiceTotals(1, 24), { netMinor: 1, vatPercent: 24, vatMinor: 0, totalMinor: 1 });
});

test('state: partially paid, paid, overdue with penalty interest', () => {
  const inv = { status: 'sent', totalMinor: 100000, dueDate: '2027-05-14', payments: [{ amountMinor: 40000 }] };
  assert.deepEqual(B.invoiceState(inv, '2027-05-10'), { paidMinor: 40000, dueMinor: 60000, state: 'partial', daysOverdue: 0, interestMinor: 0 });
  const late = B.invoiceState(inv, '2027-06-13', 11.5);
  assert.equal(late.state, 'overdue');
  assert.equal(late.daysOverdue, 30);
  assert.equal(late.interestMinor, Math.round(60000 * 0.115 * 30 / 365));
  assert.equal(B.invoiceState({ status: 'draft', totalMinor: 1 }, '2030-01-01').state, 'draft', 'a draft is never overdue');
});

test('invoice status: draft -> sent -> paid, credited or void; paid, void and credited are final', () => {
  assert.equal(B.canChangeStatus('draft', 'sent'), true);
  assert.equal(B.canChangeStatus('sent', 'paid'), true);
  assert.equal(B.canChangeStatus('sent', 'credited'), true);
  assert.equal(B.canChangeStatus('paid', 'credited'), true, 'a paid invoice is refunded with a credit note');
  assert.equal(B.canChangeStatus('paid', 'void'), false);
  assert.equal(B.canChangeStatus('void', 'draft'), false);
  assert.equal(B.canChangeStatus('credited', 'sent'), false);
  assert.equal(B.canChangeStatus('draft', 'paid'), false);
  assert.throws(() => B.normalizeInvoiceStatus('cancelled'), /Invalid invoice status/);
});

test('payment references: a Finnish reference number or the same digits as RF', () => {
  const P = require('../models/lib/paymentCodes.js');
  const fi = B.paymentReference(2027, 42, 'fi');
  assert.equal(P.isValidFinnishReference(fi), true);
  assert.match(fi, /^202700042\d$/);
  const rf = B.paymentReference(2027, 42, 'rf');
  assert.equal(P.isValidRfReference(rf), true);
  assert.equal(rf.slice(4), fi);
  assert.equal(B.paymentReference(2027, 42, 'none'), '');
  assert.equal(B.defaultDueDate('2027-04-30', 14), '2027-05-14');
});

test('profile: issuer, VAT, terms and payment methods, each validated', () => {
  const p = B.normalizeProfile({ issuerName: 'Firma Oy', businessId: '1234567-8', vatPercent: 25.5, paymentTermsDays: 30,
    penaltyInterestPercent: 11.5, referenceType: 'fi', paymentMethods: [{ type: 'sepa', name: 'Firma Oy', iban: 'FI2112345600000785' }] });
  assert.equal(p.paymentMethods[0].iban, 'FI2112345600000785');
  assert.equal(B.normalizeProfile({}).paymentTermsDays, 14);
  assert.throws(() => B.normalizeProfile({ vatPercent: 120 }), /VAT/);
  assert.throws(() => B.normalizeProfile({ paymentTermsDays: 1.5 }), /Payment terms/);
  assert.throws(() => B.normalizeProfile({ paymentMethods: [{ type: 'sepa', name: 'x', iban: 'FI0000' }] }), /IBAN/);
  assert.throws(() => B.normalizeProfile({ referenceType: 'xx' }), /reference type/);
});

test('payments: a date and an amount over zero', () => {
  assert.deepEqual(B.normalizePayment({ date: '2027-05-10', amount: 400, method: 'sepa' }), { date: '2027-05-10', amountMinor: 40000, method: 'sepa', note: '' });
  assert.throws(() => B.normalizePayment({ amount: 1 }), /date/);
  assert.throws(() => B.normalizePayment({ date: '2027-05-10', amount: 0 }), /more than 0/);
});

test('budget: invoiced counts sent and paid invoices of the board\'s currency, less credit notes; paid is what was received', () => {
  const f = B.boardFinance({ rates, cards: [], invoices: [
    { status: 'sent', netMinor: 1000, totalMinor: 1240, currency: 'EUR', payments: [{ amountMinor: 200 }] },
    { status: 'paid', netMinor: 500, totalMinor: 620, currency: 'EUR', payments: [{ amountMinor: 620 }] },
    { status: 'sent', kind: 'credit', netMinor: 500, totalMinor: 620, currency: 'EUR' },
    { status: 'void', netMinor: 9999, currency: 'EUR' },
    { status: 'draft', netMinor: 8888, currency: 'EUR' },
    { status: 'paid', netMinor: 7777, currency: 'USD' },
  ] });
  assert.equal(f.invoicedMinor, 1000);
  assert.equal(f.paidMinor, 820);
});

test('numbers, money and CSV', () => {
  assert.equal(B.invoiceNumber(2027, 42), 'INV-2027-0042');
  assert.equal(B.invoiceNumber(2027, 43, 'credit'), 'CRN-2027-0043');
  assert.equal(B.formatMoney(1234567, 'EUR', 'en-US'), '€12,345.67');
  assert.equal(B.formatMoney(null, 'EUR'), '');
  const csv = B.invoiceCsv({ number: 'INV-2027-0001', currency: 'EUR', totalHours: 2, netMinor: 16000, vatPercent: 25.5, vatMinor: 4080, totalMinor: 20080,
    lines: [{ title: '=HYPERLINK("http://x")', userId: 'u', hours: 2, rateMinor: 8000, amountMinor: 16000 }] }, () => 'Ann "A"');
  assert.match(csv, /^"number","card","person","from","to","hours","rate","amount","currency"\r\n/);
  assert.match(csv, /"'=HYPERLINK\(""http:\/\/x""\)"/, 'negative: a formula is written as text');
  assert.match(csv, /"Ann ""A"""/);
  assert.match(csv, /"VAT 25\.5 %","","","","","","40\.80","EUR"/);
  assert.match(csv, /"total","","","","","","200\.80","EUR"\r\n$/);
});

test('fees: a milestone on its day; a retainer each month, on the last day of a shorter month', () => {
  assert.deepEqual(B.feeOccurrences({ _id: 'f', date: '2027-04-01' }, '2027-03-31'), [], 'not before its day');
  assert.deepEqual(B.feeOccurrences({ _id: 'f', date: '2027-04-01' }, '2027-04-01'), [{ key: 'f', date: '2027-04-01' }]);
  const monthly = B.feeOccurrences({ _id: 'r', date: '2027-01-31', recurring: 'monthly', end: '2027-04-30' }, '2027-12-31');
  assert.deepEqual(monthly.map(o => o.date), ['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30']);
  assert.equal(monthly[1].key, 'r:2027-02');
  assert.deepEqual(B.feeOccurrences({ _id: 'r', date: '2027-01-15', recurring: 'monthly' }, null), [], 'no end and no day: never forever');
  const keys = B.invoicedFeeKeys([{ status: 'sent', lines: [{ feeKey: 'r:2027-02' }] }, { status: 'void', lines: [{ feeKey: 'r:2027-03' }] },
    { status: 'sent', kind: 'credit', lines: [{ feeKey: 'r:2027-04' }] }]);
  assert.deepEqual([...keys], ['r:2027-02'], 'a voided invoice and a credit note free their fees');
});

test('negative: a fee and an expense are validated', () => {
  assert.throws(() => B.normalizeFee({ title: 'x', amount: 1, currency: 'EUR' }), /date/);
  assert.throws(() => B.normalizeFee({ title: 'x', amount: 1, currency: 'EUR', date: '2027-01-01', recurring: 'yearly' }), /once or monthly/);
  assert.equal(B.normalizeFee({ title: 'x', amount: 1, currency: 'EUR', date: '2027-01-01', end: '2027-02-01' }).end, null, 'a one-off fee has no end');
  assert.throws(() => B.normalizeExpense({ amount: 1, currency: 'EUR' }), /date/);
  assert.throws(() => B.normalizeExpense({ date: '2027-01-01', amount: 1, currency: 'EUR', markupPercent: 150 }), /Markup/);
  assert.throws(() => B.normalizeExpense({ date: '2027-01-01', amount: 1, currency: 'EUR', receipt: 'x' }), /Unsupported/);
  const e = B.normalizeExpense({ date: '2027-01-01', amount: 1000, currency: 'JPY', markupPercent: 15 });
  assert.equal(e.amountMinor, 1000, 'yen have no decimals');
  assert.equal(B.expenseCharge(e), 1150);
  assert.equal(e.billable, true);
  assert.equal(e.category, 'other');
});

test('profitability: revenue invoiced and unbilled, less hours at cost rates and expenses', () => {
  const f = B.boardFinance({
    rates: [{ userId: null, hourlyRateMinor: 10000, costRateMinor: 6000, currency: 'EUR' }],
    cards: [{ _id: 'a', spentTime: 10, assignees: ['x'] }],
    expenses: [{ amountMinor: 5000, currency: 'EUR' }, { amountMinor: 999, currency: 'USD' }],
    invoices: [{ status: 'sent', currency: 'EUR', netMinor: 80000, totalMinor: 80000 }],
    unbilledMinor: 20000,
  });
  assert.equal(f.spentMinor, 100000 + 5000, 'an expense in another currency is not mixed in');
  assert.equal(f.laborCostMinor, 60000);
  assert.equal(f.costMinor, 65000);
  assert.equal(f.revenueMinor, 100000);
  assert.equal(f.marginMinor, 35000);
  assert.equal(f.marginPercent, 35);
  assert.equal(B.boardFinance({ rates, cards: [{ _id: 'a', spentTime: 2 }] }).uncostedHours, 2, 'no cost rate: reported, not counted as free');
  assert.equal(B.normalizeRate({ hourlyRate: 100, costRate: 55.5, currency: 'EUR' }).costRateMinor, 5550);
});

test('approval: only approved time is billed, and what waits is reported', () => {
  const cards = [{ _id: 'c', title: 'Work', assignees: ['u'] }];
  const entries = [{ _id: '1', cardId: 'c', userId: 'u', date: '2027-04-01', hours: 3, approval: 'approved' },
    { _id: '2', cardId: 'c', userId: 'u', date: '2027-04-02', hours: 2 },
    { _id: '3', cardId: 'c', userId: 'u', date: '2027-04-03', hours: 1, approval: 'rejected' }];
  const d = B.draftInvoiceLines({ cards, entries, rates, approveTime: true });
  assert.deepEqual(d.entryIds, ['1']);
  assert.equal(d.unapprovedHours, 3);
  assert.equal(B.draftInvoiceLines({ cards, entries, rates }).totalHours, 6, 'with approval off, all of it');
  assert.equal(B.draftInvoiceLines({ cards, entries, rates, billTime: false }).lines.length, 0, 'a fixed price bills no time');
});

test('quote: the estimate still to do at the carriers\' rates, and the fees', () => {
  const q = B.draftQuoteLines({
    rates,
    cards: [{ _id: 'a', title: 'Build', estimatedHours: 10, spentTime: 4, assignees: ['senior'] },
      { _id: 'b', title: 'Done', estimatedHours: 10, dueComplete: true }, { _id: 'c', title: 'Internal', estimatedHours: 5, billable: false }],
    fees: [{ _id: 'f', title: 'Launch', amountMinor: 50000, currency: 'EUR', date: '2028-01-01' },
      { _id: 'r', title: 'Support', amountMinor: 10000, currency: 'EUR', date: '2027-01-01', recurring: 'monthly', end: '2027-03-31' }],
    invoices: [{ status: 'sent', lines: [{ feeKey: 'r:2027-01' }] }],
  });
  assert.deepEqual(q.lines.map(l => l.title), ['Build', 'Launch', 'Support', 'Support']);
  assert.equal(q.netMinor, 6 * 12000 + 50000 + 2 * 10000);
  assert.equal(q.totalHours, 6);
  assert.equal(B.quoteNumber(2027, 7), 'QUO-2027-0007');
  assert.equal(B.canChangeQuoteStatus('draft', 'accepted'), false);
  assert.equal(B.canChangeQuoteStatus('sent', 'accepted'), true);
  assert.throws(() => B.normalizeQuoteRequest({ issueDate: '2027-02-01', validUntil: '2027-01-01' }), /expire/);
  assert.equal(B.normalizeProfile({}).quoteValidDays, 30);
  assert.equal(B.normalizeProfile({}).billTime, true);
  assert.throws(() => B.normalizeProfile({ quoteValidDays: 0 }), /valid 1 to 365/);
});

test('CSV: a fee or an expense line has no hours or rate', () => {
  const csv = B.invoiceCsv({ number: 'INV-1', currency: 'EUR', netMinor: 500, vatMinor: 0, totalMinor: 500,
    lines: [{ kind: 'fee', title: 'Launch', amountMinor: 500 }] });
  assert.match(csv, /"INV-1","Launch","","","","","","5.00","EUR"/);
  assert.doesNotMatch(csv, /NaN|undefined/);
});

console.log(`\nbilling: ${passed} tests passed`);
