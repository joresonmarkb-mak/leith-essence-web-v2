import nodemailer from "nodemailer";

let transporter;

export const mailerReady = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.MAIL_FROM);

function get() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export const sendMail = ({ to, subject, html, text, headers }) =>
  get().sendMail({ from: process.env.MAIL_FROM, to, subject, html, text, headers });