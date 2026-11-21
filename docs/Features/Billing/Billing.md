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

## Invoices

**Create invoice** bills the billable hours not invoiced yet: per card and
person, at the rates of that moment. A card is billable unless *Billable* is
unticked in its Time popup (beside spent time and estimated hours). WeKan
keeps a card's spent time as a total, so what is not invoiced yet is that total
less the hours of the card already on invoices that are not void.

An invoice gets the next number of its year (`INV-2027-0042`) and a status:
**Draft** → **Sent** → **Paid**, or **Void**. A sent invoice can go back to
draft; paid and void are final, and voiding an invoice frees its hours for a
new one. The lines of an invoice are a record: they stay as they were when it
was made. **Print** shows the invoice alone for printing (or saving as PDF),
and **CSV** downloads its lines; a cell that begins like a formula is written as
text, so a spreadsheet does not run it.

## Who sees what

Money is the business of a board's active admins: members, even with write
access, do not see rates, budgets or invoices, and neither does an admin who
sees only the cards assigned to them. Site administrators may manage every
board. Everything goes through server methods; nothing is published to the
browser, and the collections take no client writes. Admin Panel → Features →
Budget and billing turns the page and its methods off.

Amounts are kept in minor units (cents) as integers, so an invoice adds up
exactly.

## Code

| | |
| --- | --- |
| `models/lib/billing.js` | the rules, as pure functions: rates, cost, forecast, budget, invoice lines, status, CSV |
| `models/billing.js` | the collections `billingBudgets`, `billingRates`, `billingInvoices` |
| `server/billing.js` | the methods, with who may call them |
| `client/components/main/billing.*` | the page |
| `tests/billing.test.cjs` | the rules; `tests/billingAccess.test.cjs` who may do what |
