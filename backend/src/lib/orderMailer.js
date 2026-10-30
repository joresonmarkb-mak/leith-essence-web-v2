import nodemailer from "nodemailer";
import { orderEmail } from "./orderEmails.js";

let transport;
function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 2525,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transport;
}

// kind: "paid" | "cancelled". Never throws into the order flow (callers .catch it).
export async function sendOrderEmail(order, kind, previousStatus) {
  if (!order.buyerEmail) return;            // admin-added orders may have no email
  const t = getTransport();
  if (!t) { console.warn("Order email skipped: SMTP is not configured."); return; }
  const { subject, html, text } = orderEmail(order, kind, previousStatus);
  await t.sendMail({
    from: process.env.MAIL_FROM ?? process.env.SMTP_USER,
    to: order.buyerEmail,
    subject, html, text,
  });
}