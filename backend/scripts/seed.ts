/**
 * Demo seed — creates a user + organization with a few expenses/invoices so you
 * can exercise the API immediately. Safe to run repeatedly (uses a fixed email).
 *
 *   npm run db:seed
 */
import 'dotenv/config';
import { signup } from '../src/services/auth.service.js';
import * as org from '../src/services/organization.service.js';
import * as expenseSvc from '../src/services/expense.service.js';
import * as invoiceSvc from '../src/services/invoice.service.js';
import * as revenueSvc from '../src/services/revenue.service.js';
import { findUserByEmail } from '../src/repositories/user.repository.js';
import { closeDb } from '../src/config/db.js';

const EMAIL = 'demo@financeai.test';
const PASSWORD = 'demo-password-123';

async function main() {
  let userId: string;
  const existing = await findUserByEmail(EMAIL);
  if (existing) {
    userId = existing.id;
    console.log(`Using existing demo user ${EMAIL}`);
  } else {
    const res = await signup({ email: EMAIL, password: PASSWORD, fullName: 'Demo Founder' });
    userId = res.user.id;
    console.log(`Created demo user ${EMAIL} / ${PASSWORD}`);
  }

  const organization = await org.create({ ownerId: userId, name: 'Acme Studio', currency: 'USD' });
  console.log(`Created org ${organization.name} (${organization.id})`);

  await expenseSvc.create({
    userId,
    orgId: organization.id,
    amount: 52.99,
    rawDescription: 'ADOBE *CREATIVE CLOUD',
  });
  await expenseSvc.create({
    userId,
    orgId: organization.id,
    amount: 18.4,
    rawDescription: 'UBER *TRIP 8H2K',
  });
  await revenueSvc.create({
    userId,
    orgId: organization.id,
    amount: 4000,
    source: 'Client retainer',
  });
  const invoice = await invoiceSvc.create({
    userId,
    orgId: organization.id,
    clientName: 'Globex Inc',
    clientEmail: 'ap@globex.test',
    lineItems: [{ description: 'Website redesign', quantity: 1, unitPrice: 3500 }],
    taxRate: 8.5,
    dueDate: '2026-08-01',
  });

  console.log(`Seeded 2 expenses, 1 revenue, invoice ${invoice.invoice_number}.`);
  console.log(`\nNext: log in and use header  X-Org-Id: ${organization.id}`);
  await closeDb();
}

main().catch(async (err) => {
  console.error(err);
  await closeDb();
  process.exit(1);
});
