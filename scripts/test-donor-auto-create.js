/**
 * Test script: donor auto-create for m3xtraders@gmail.com
 * Run: node scripts/test-donor-auto-create.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const prisma = new PrismaClient();

const TEST_EMAIL = 'm3xtraders@gmail.com';
const TEST_NAME  = 'M3x Traders';
const TEST_PHONE = null;
// Set this to your GHL locationId to test org lookup
const TEST_LOCATION_ID = process.env.TEST_GHL_LOCATION_ID || null;

// ─── Email transport (same as emailService) ───────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  tls: { rejectUnauthorized: false },
});

async function run() {
  console.log('\n========================================');
  console.log('  Donor Auto-Create Test');
  console.log('========================================\n');

  // ── Step 1: Check email config ───────────────────────────────────────────
  console.log('Step 1: Verifying email config...');
  console.log('  HOST :', process.env.EMAIL_SERVER_HOST || '❌ NOT SET');
  console.log('  PORT :', process.env.EMAIL_SERVER_PORT || '❌ NOT SET');
  console.log('  USER :', process.env.EMAIL_SERVER_USER || '❌ NOT SET');
  console.log('  PASS :', process.env.EMAIL_SERVER_PASSWORD ? '✅ SET' : '❌ NOT SET');
  try {
    await transporter.verify();
    console.log('  ✅ Email connection verified\n');
  } catch (e) {
    console.error('  ❌ Email connection FAILED:', e.message, '\n');
  }

  // ── Step 2: Check existing donor ─────────────────────────────────────────
  console.log('Step 2: Checking if donor exists for', TEST_EMAIL);
  const existing = await prisma.donor.findFirst({
    where: { email: TEST_EMAIL.toLowerCase() },
    select: { id: true, name: true, email: true, organization_id: true },
  });
  if (existing) {
    console.log('  ⚠️  Donor already exists:', existing);
    console.log('\n  → Deleting existing donor so we can re-test creation...');
    await prisma.donor.delete({ where: { id: existing.id } });
    console.log('  ✅ Deleted\n');
  } else {
    console.log('  ✅ No existing donor found — will create\n');
  }

  // ── Step 3: Org lookup from locationId ───────────────────────────────────
  console.log('Step 3: Org lookup from locationId:', TEST_LOCATION_ID || '(none provided)');
  let organizationId = null;
  if (TEST_LOCATION_ID) {
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { ghlId: TEST_LOCATION_ID },
          { ghlAccounts: { some: { ghl_location_id: TEST_LOCATION_ID } } },
        ],
      },
      select: { id: true, name: true },
    });
    if (org) {
      organizationId = org.id;
      console.log('  ✅ Found org:', org);
    } else {
      console.log('  ⚠️  No org found for locationId:', TEST_LOCATION_ID);
    }
  } else {
    console.log('  ⚠️  No TEST_GHL_LOCATION_ID set — skipping org link');
    // Auto-detect: find any org with a GHL account
    const anyOrg = await prisma.organization.findFirst({
      where: { ghlId: { not: null } },
      select: { id: true, name: true, ghlId: true },
    });
    if (anyOrg) {
      console.log('  ℹ️  Using first org with ghlId for test:', anyOrg);
      organizationId = anyOrg.id;
    }
  }
  console.log('  organizationId:', organizationId, '\n');

  // ── Step 4: Create donor ──────────────────────────────────────────────────
  console.log('Step 4: Creating donor account...');
  const rawPassword = crypto.randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
  const hashedPassword = await bcrypt.hash(rawPassword, 12);

  let donor;
  try {
    donor = await prisma.donor.create({
      data: {
        name: TEST_NAME,
        email: TEST_EMAIL.toLowerCase().trim(),
        password: hashedPassword,
        phone: TEST_PHONE || null,
        country: 'US',
        status: true,
        ...(organizationId ? { organization_id: organizationId } : {}),
      },
    });
    console.log('  ✅ Donor created:', { id: donor.id, email: donor.email, organization_id: donor.organization_id });
    console.log('  🔑 Raw password (for testing):', rawPassword, '\n');
  } catch (e) {
    console.error('  ❌ Donor creation FAILED:', e.message, '\n');
    await prisma.$disconnect();
    return;
  }

  // ── Step 5: Send credentials email ───────────────────────────────────────
  console.log('Step 5: Sending credentials email to', TEST_EMAIL);
  const baseUrl = 'https://app.changeworksfund.org';
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'info@changeworksfund.org',
      to: TEST_EMAIL,
      subject: 'Your ChangeWorks Donor Account',
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff;">
          <h2 style="color:#0E0061;margin-bottom:8px;">Welcome to ChangeWorks!</h2>
          <p style="color:#374151;margin-bottom:20px;">A donor account has been created for you after your payment.</p>
          <div style="background:#f3f4f6;border-radius:8px;padding:20px;margin-bottom:24px;">
            <p style="margin:0 0 8px;color:#6b7280;font-size:13px;font-weight:600;">YOUR LOGIN DETAILS</p>
            <p style="margin:0 0 6px;font-size:15px;"><strong>Email:</strong> ${TEST_EMAIL}</p>
            <p style="margin:0;font-size:15px;"><strong>Password:</strong> ${rawPassword}</p>
          </div>
          <a href="${baseUrl}/donor/login" style="display:inline-block;background:#0E0061;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">Log In to Your Account</a>
        </div>
      `,
      text: `Welcome to ChangeWorks!\n\nEmail: ${TEST_EMAIL}\nPassword: ${rawPassword}\n\nLog in: ${baseUrl}/donor/login`,
    });
    console.log('  ✅ Email sent! MessageId:', info.messageId, '\n');
  } catch (e) {
    console.error('  ❌ Email send FAILED:', e.message, '\n');
  }

  console.log('========================================');
  console.log('  Test Complete');
  console.log('========================================\n');

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error('Fatal error:', e);
  await prisma.$disconnect();
  process.exit(1);
});
