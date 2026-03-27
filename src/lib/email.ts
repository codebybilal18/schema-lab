import nodemailer, { type Transporter } from "nodemailer";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!process.env.SMTP_HOST) {
    return null;
  }
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT ?? 587);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

const FROM = process.env.EMAIL_FROM ?? "Schema Lab <no-reply@schema-lab.local>";

export async function sendEmail({ to, subject, text, html }: SendEmailInput) {
  const activeTransporter = getTransporter();

  if (!activeTransporter) {
    // No SMTP configured (development): log the message so the flow is testable.
    console.log(
      [
        "",
        "===== EMAIL (dev, no SMTP configured) =====",
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        text,
        "===========================================",
        "",
      ].join("\n"),
    );
    return;
  }

  await activeTransporter.sendMail({ from: FROM, to, subject, text, html });
}
