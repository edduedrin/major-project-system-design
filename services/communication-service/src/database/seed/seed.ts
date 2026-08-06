import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

const defaultTemplates = [
  {
    templateName: "welcome",
    subject: "Welcome to Our Platform, {{name}}!",
    htmlBody: "<h1>Welcome {{name}}!</h1><p>We are thrilled to have you onboard.</p>",
    textBody: "Welcome {{name}}! We are thrilled to have you onboard."
  },
  {
    templateName: "otp",
    subject: "Your OTP Code",
    htmlBody: "<h2>Verification Code</h2><p>Your OTP code is <strong>{{otp}}</strong>. It expires in {{expiryMinutes}} minutes.</p>",
    textBody: "Your OTP code is {{otp}}. It expires in {{expiryMinutes}} minutes."
  },
  {
    templateName: "password-reset",
    subject: "Password Reset Request",
    htmlBody: "<p>Hello {{name}},</p><p>Click <a href='{{resetUrl}}'>here</a> to reset your password or use code: <strong>{{otp}}</strong>.</p>",
    textBody: "Hello {{name}}, reset your password using link: {{resetUrl}} or code: {{otp}}."
  },
  {
    templateName: "wallet-redemption",
    subject: "Wallet Redemption Request Submitted",
    htmlBody: "<h2>Redemption Submitted</h2><p>Hi {{name}}, your redemption request of ₹{{amount}} has been received.</p>",
    textBody: "Hi {{name}}, your redemption request of {{amount}} has been received."
  },
  {
    templateName: "redemption-approved",
    subject: "Wallet Redemption Approved",
    htmlBody: "<h2>Redemption Approved</h2><p>Hi {{name}}, your redemption of ₹{{amount}} has been approved!</p>",
    textBody: "Hi {{name}}, your redemption of {{amount}} has been approved!"
  },
  {
    templateName: "redemption-rejected",
    subject: "Wallet Redemption Update",
    htmlBody: "<h2>Redemption Status</h2><p>Hi {{name}}, your redemption of ₹{{amount}} was rejected. Reason: {{reason}}</p>",
    textBody: "Hi {{name}}, your redemption of {{amount}} was rejected. Reason: {{reason}}"
  },
  {
    templateName: "voucher-issued",
    subject: "Your Voucher is Ready!",
    htmlBody: "<h2>Voucher Issued</h2><p>Hi {{name}}, your voucher code is <strong>{{voucherCode}}</strong> for value ₹{{value}}.</p>",
    textBody: "Hi {{name}}, your voucher code is {{voucherCode}} for value {{value}}."
  },
  {
    templateName: "campaign-notification",
    subject: "{{title}}",
    htmlBody: "<h2>{{title}}</h2><p>{{message}}</p>",
    textBody: "{{title}}\n\n{{message}}"
  },
  {
    templateName: "promotion",
    subject: "Exclusive Offer for You!",
    htmlBody: "<h2>Special Offer</h2><p>Hi {{name}}, enjoy {{discount}}% off with code <strong>{{promoCode}}</strong>.</p>",
    textBody: "Hi {{name}}, enjoy {{discount}}% off with code {{promoCode}}."
  }
];

async function seed() {
  const dbUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/communication_db";
  console.log(`Seeding database templates at ${dbUrl}...`);
  const sql = postgres(dbUrl);

  try {
    for (const t of defaultTemplates) {
      await sql`
        INSERT INTO email_templates (template_name, subject, html_body, text_body)
        VALUES (${t.templateName}, ${t.subject}, ${t.htmlBody}, ${t.textBody})
        ON CONFLICT (template_name) DO UPDATE
        SET subject = EXCLUDED.subject,
            html_body = EXCLUDED.html_body,
            text_body = EXCLUDED.text_body,
            updated_at = NOW();
      `;
    }
    console.log("Email templates seeded successfully ✅");
  } catch (error) {
    console.error("Seeding failed ❌", error);
  } finally {
    await sql.end();
  }
}

seed();
