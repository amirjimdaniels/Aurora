import nodemailer from 'nodemailer';

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

/**
 * Send an email. Falls back to console.log if SMTP is not configured.
 */
export async function sendEmail({ to, subject, text, html }) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject,
        text,
        ...(html && { html }),
      });
      console.log(`[Email] Sent to ${to}: ${subject}`);
    } catch (err) {
      console.error('[Email] Failed to send:', err.message);
    }
  } else {
    console.log(`[Email] (no SMTP configured) To: ${to}\nSubject: ${subject}\n${text}`);
  }
}

export default transporter;
