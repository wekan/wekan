// Board View / Shop: an order as a Budget and billing invoice
// (docs/Features/Board-Header/Board-Views/Shop.md, docs/Features/Billing/Billing.md).
//
// When Budget and billing is on for the shop's owner - the board admin whose
// settings take the orders - server/shop.js shopPlaceOrder makes the order an
// invoice of the shop's board as well as a card: billing's own invoice
// collection, numbering (INV-<year>-<number>, counted over every invoice of
// the year, exactly as server/billing.js insertNumbered counts), issuer
// profile, VAT and due date, with the ORDER's payment reference, so the card,
// the invoice and the payment all name the same reference. The invoice is
// marked sent: the buyer has it, in the order's confirmation. Its lines are
// product lines naming the product cards (models/lib/shop.js invoiceLinesOf).
import { BillingInvoices, BillingProfiles } from '/models/billing';

const { normalizeProfile, invoiceNumber, defaultDueDate, isInvoiceLineKind } = require('/models/lib/billing');
const { invoiceLinesOf } = require('/models/lib/shop');

function compact(doc) {
  const out = {};
  for (const [k, v] of Object.entries(doc)) if (v !== undefined && v !== null && v !== '') out[k] = v;
  return out;
}

async function boardProfile(boardId) {
  const doc = await BillingProfiles.findOneAsync({ boardId });
  return doc ? doc.profile : normalizeProfile({});
}

/**
 * @param {Object} order  { number, reference, currency, netMinor, vatPercent, vatMinor, totalMinor, lines }
 * @returns {{ invoiceId, number }}
 */
export async function createOrderInvoice({ boardId, ownerId, order, contact, today = new Date().toISOString().slice(0, 10) }) {
  const profile = await boardProfile(boardId);
  const lines = invoiceLinesOf(order).map(compact);
  if (!lines.every(line => isInvoiceLineKind(line.kind))) throw new Error('Unknown invoice line kind');
  const year = today.slice(0, 4);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const count = await BillingInvoices.find({ number: { $regex: `^(INV|CRN)-${year}-` } }).countAsync();
    const number = invoiceNumber(year, count + 1 + attempt, 'invoice');
    const doc = compact({
      boardId,
      number,
      kind: 'invoice',
      status: 'sent',
      statusChangedAt: new Date(),
      currency: order.currency,
      issueDate: today,
      dueDate: defaultDueDate(today, profile.paymentTermsDays),
      customer: String(contact.name || '').slice(0, 500),
      reference: order.number,
      notes: `${order.number}`,
      lines,
      netMinor: order.netMinor,
      vatPercent: order.vatPercent || 0,
      vatMinor: order.vatMinor,
      totalMinor: order.totalMinor,
      totalHours: 0,
      paymentReference: order.reference || undefined,
      issuer: profile,
      payments: [],
      createdBy: ownerId,
    });
    try {
      const invoiceId = await BillingInvoices.insertAsync(doc);
      return { invoiceId, number };
    } catch (e) {
      if (!/duplicate key|E11000/i.test(String(e && e.message))) throw e;
    }
  }
  throw new Error('Could not number the invoice');
}

export async function removeOrderInvoice(invoiceId) {
  if (invoiceId) await BillingInvoices.removeAsync({ _id: invoiceId });
}
