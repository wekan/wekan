# Budget and billing

User menu → **Budget and billing** (`/billing`) is where a board's admins plan
and charge for the board's work: its budget, what the work has cost and will
cost, the hourly rates, and invoices of the hours spent. It builds on the time
WeKan already tracks - a card's **spent time**, and its **estimated hours**
(see [Workload](../Workload/Workload.md)).

## Rates

Each board has hourly rates, in a currency (an ISO code such as EUR or USD):
one for a member, and a board default for everybody without one of their own.
A card's hours are charged at the rates of its assignees - shared equally when
it has several - or of its members when nobody is assigned, or at the board
default when it has nobody. Hours with no rate in the board's currency are
reported as unpriced, never billed at zero without saying so.

## Budget

A board's budget is an amount of money, a number of hours, or both, for an
optional period. The page shows for each board:

- **Spent**: the time spent on its cards at their rates, and as a percent of
  the budget;
- **Still to do**: on open cards, the estimate less the time spent;
- **Forecast**: spent plus still to do, in red when it is over the budget;
- **Left of budget**, **Invoiced** and **Paid**.

## Expenses

Besides time, a board's work costs money: travel, a hotel, meals, materials,
a subcontractor, software. **Expenses** records each with its day, amount,
currency, category and description, optionally the card and the person, a
**markup** % and whether it is **billable**. An expense spends the budget at
what it cost; a billable one goes on the next invoice of its period at its
amount plus the markup, and like time it is billed once. An expense on an
invoice is a record and cannot be removed; voiding or crediting the invoice
frees it.

## Fixed fees and retainers

Not all work is billed by the hour. A **fixed fee** is billed once, from its
day on - a milestone, a deposit, a fixed price. A **retainer** is a fee billed
every month from its day until its end (on the same day of the month, or the
last day of a shorter month). The draft of an invoice takes the fees due in
its period that no standing invoice has billed; which months are billed is
read from the invoices themselves, so voiding or crediting one frees its
fees. A board whose price is fixed unticks **Bill time by the hour**: its
invoices then carry only its fees and expenses, while the time is still
tracked for the budget and the margin.

## Approving time

With **Approve time before it is invoiced** on, the board's admins see the
billable time waiting for them under **Time to approve**, and approve it or
send it back with a note. Only approved time is invoiced; the draft says how
many hours are still waiting. The person who logged the time sees the
decision in the card's Time popup. Approved time cannot be removed by the
person who logged it; time sent back can, and is logged again.

## Profitability

A rate can also have a **cost per hour** - what an hour of that person costs
(salary and overheads), never shown on an invoice. The board then shows its
**cost** (the hours at their cost rates and the expenses) and its **margin**:
the revenue - invoiced, and **unbilled work** (billable time, fees and
expenses not invoiced yet) - less the cost. Hours of somebody with no cost
rate are reported, never counted as free.

## Quotes

**Create quote** prices the work still to do - each open, billable card's
estimate less the time spent, at its people's rates - and the fees not
invoiced yet (a retainer to its end). A quote is numbered `QUO-2027-0007`,
valid for the days set on the invoicer (30 by default), and goes from draft
to sent to accepted or declined. **Accepting** it can make it the board's
budget. It downloads as PDF, SVG, Excel and CSV, without payment details.

## The board's customer

The invoicer also keeps the board's **customer** - name and address,
country, VAT ID - filled in on each invoice and quote that does not name
another.

## Time by day

A card's **Time** popup now lists its time by day - the day, the hours, who
logged them and a note - and **Log time** adds an entry on a day. A card's
spent time stays its total, so the timers, the REST API, the imports and every
report work as before: whenever the total changes, however it was written, the
server records the difference as an entry of that day by that user (a
correction when it went down). Time spent before entries were kept becomes one
undated entry, once. An entry on an invoice is a record and cannot be removed.

## Invoices

**Create invoice** bills the billable time entries of a **period** (both days
inclusive; leave it empty for all open time) that are on no invoice yet: per
card and per person who logged them, at that person's rate, with the first and
last day of each line. Time from before dates were kept is included only when
*Include time logged before dates were kept* is ticked, and is charged as the
card's assignees. A card is billable unless *Billable* is unticked in its Time
popup. The entries of an invoice are marked with it, so no hour is billed
twice; voiding an invoice frees them.

- **Invoicer**: name, address, country, business ID, VAT ID, email, phone and
  website, VAT %, reverse charge, payment terms in days (the due date), penalty
  interest % and a footer. An invoice keeps the invoicer as it was when it was
  made.
- **Numbers and references**: `INV-2027-0042`, credit notes `CRN-2027-0043`,
  one sequence a year. The payment reference is a Finnish reference number
  (7-3-1 check digit), the same digits as an ISO 11649 RF creditor reference, or
  none.
- **VAT**: the net, the VAT (rounded once, on the net) and the total. With
  reverse charge the VAT is 0 and the invoice says so.
- **Status**: Draft → Sent → Paid, or Void; a sent or paid invoice is credited
  with a **credit note**, which credits it in full and frees its time. Shown as
  *Partially paid* while payments are short of the total, and *Overdue* after
  the due date, with the days overdue and the penalty interest so far.
- **Payments**: record a payment (day, amount, method) on a sent invoice; when
  the payments reach the total it becomes Paid.
- **Files**: **PDF** (A4, paged), **SVG** (A4 wide, one page as long as the
  invoice, text as text), **Excel**, **CSV** (a cell that begins like a formula
  is written as text), and an **e-invoice**: UBL 2.1, Peppol BIS Billing 3.0
  (EN 16931), a credit note as a UBL CreditNote. **Open** shows the invoice on
  the page, to print.

## Payment methods

The invoicer lists the ways to pay; each invoice shows them with their codes,
made by their published standards (models/lib/paymentCodes.js, checked against
the standards' own examples):

| Method | On the invoice |
| --- | --- |
| SEPA credit transfer | QR code, EPC069-12 version 002 ("GiroCode"), EUR |
| Finnish bank barcode | the 54-digit *pankkiviivakoodi* (version 4, or 5 with an RF reference) as a Code 128 barcode, EUR |
| Swiss QR-bill | the SPC 0200 QR code with the Swiss cross, CHF or EUR (the QR code only, not the payment part layout) |
| Swish | the prefilled Swish QR code, SEK |
| Pix | the static BR Code (EMV, CRC16), BRL |
| UPI | the `upi://pay` link and QR code, INR |
| Bitcoin | the BIP 21 URI and QR code (an amount only on a BTC invoice) |
| PayPal | the PayPal.me link with the amount, and its QR code |
| Payment link | any https payment page - Stripe Payment Links, Mollie, Square, MobilePay, Vipps, Revolut, ... - with `{amount}`, `{currency}`, `{reference}` and `{number}` filled in, and its QR code |
| PromptPay (Thailand) | EMVCo QR to a mobile number, national ID or e-wallet, THB |
| PayNow (Singapore) | SGQR (EMVCo) to a mobile number or UEN, SGD |
| VietQR (Vietnam) | NAPAS EMVCo QR to a bank account by BIN, VND |
| FPS (Hong Kong) | EMVCo QR to an FPS ID, mobile number or email, HKD |
| QR Platba (Czechia) | Short Payment Descriptor (SPAYD), CZK, with the variable symbol |
| Polish bank QR | the ZBP 2D code, PLN (up to 9 999.99) |
| Hungary | the MNB instant transfer QR code, HUF |
| Serbia | the NBS IPS QR code, RSD |
| Denmark | the FI card +71 line, DKK |
| Ethereum, Litecoin | EIP-681 and BIP 21-style URIs and QR codes |
| Bank transfer, cash, cheque, other | the instructions, as text |

A method that does not fit an invoice - Swish on a EUR invoice, say - is left
out of it, and the invoice page says why. Nothing is sent to any payment
service: the codes are drawn on the invoice, and the payer's bank or app reads
them.

Payment references: a Finnish reference number, an ISO 11649 RF creditor
reference, a Belgian structured communication (`+++123/4567/89002+++`, put in
the text of a SEPA QR code as Belgian banks read it), a Norwegian KID or a
Swedish OCR reference.

Not included, as they need a merchant agreement or registration with the
scheme, or a contract with the service: Indonesia's QRIS, Japan's JPQR,
Nigeria's NQR, Mexico's CoDi, the Philippines' QR Ph, Alipay, WeChat Pay,
Zelle, Interac, M-Pesa. Slovenia's UPN QR, Slovakia's PAY by square,
Croatia's HUB3 and Brazil's boleto are not drawn yet. For these, a payment link
or the instructions as text work.

## Currencies

Amounts are kept in the minor unit of their currency, as ISO 4217 gives it
(models/lib/currencies.js): two decimals for most, none for JPY, KRW, VND, CLP,
ISK and the others without, three for BHD, KWD, JOD, OMR, TND and IQD. Bitcoin,
Litecoin and Ether are kept to 8 decimals.

## Who sees what

Money is the business of a board's active admins: members, even with write
access, do not see rates, budgets or invoices, and neither does an admin who
sees only the cards assigned to them. Site administrators may manage every
board. Everything goes through server methods; nothing is published to the
browser, and the collections take no client writes. Admin Panel → Features →
Budget and billing turns the page and its methods off.

Amounts are kept as integers of their currency's minor unit, so an invoice
adds up exactly.

## Professional services automation

Together with [Workload](../Workload/Workload.md), these pages cover what a
professional services automation (PSA) system does:

| PSA | In WeKan |
| --- | --- |
| Projects and tasks | boards, cards, checklists, dependencies, Gantt |
| Time tracking | time by day, timers, approval |
| Resource management | Workload: capacity, absences, holidays, allocations, placeholders |
| Skills | skills and levels, and who could fill a placeholder |
| Utilization | billable hours against working time, and a target |
| Budgets and forecasts | Budget and billing: budget, spent, still to do, forecast |
| Expenses | expenses, with markup, billable or not |
| Billing models | time and material, fixed fees, milestones, retainers |
| Quotes | quotes of the work still to do |
| Invoicing | invoices, credit notes, payments, e-invoices, payment codes |
| Profitability | cost rates, cost, margin, unbilled work |

Left to other software, on purpose: a sales pipeline and CRM (a WeKan board
works as one, but leads and contacts are not modelled), a customer portal
(share a board with the customer as a member instead), and accounting -
revenue recognition, the general ledger and payroll - which belong to the
accounting system the invoices go to as e-invoices.

## Code

| | |
| --- | --- |
| `models/lib/billing.js` | the rules, as pure functions: rates, cost, forecast, budget, invoice lines, VAT, state, references, CSV |
| `models/lib/timeEntries.js`, `server/timeEntries.js` | time by day, kept in step with a card's total |
| `models/lib/paymentCodes.js` | IBAN, references, EPC QR, Finnish barcode, Swiss QR, Swish, Pix, UPI, BIP 21, links |
| `models/lib/ublInvoice.js` | the Peppol BIS 3.0 e-invoice |
| `server/lib/invoiceFiles.js` | PDF, SVG and Excel |
| `models/billing.js`, `models/timeEntries.js` | the collections `billingBudgets`, `billingRates`, `billingProfiles`, `billingInvoices`, `billingExpenses`, `billingFees`, `billingQuotes`, `timeEntries` |
| `server/billing.js` | the methods, with who may call them |
| `client/components/main/billing.*` | the page |
| `tests/billing.test.cjs`, `tests/timeEntries.test.cjs`, `tests/paymentCodes.test.cjs`, `tests/ublInvoice.test.cjs`, `tests/invoiceFiles.test.cjs` | the rules and the files; `tests/billingAccess.test.cjs` who may do what |
