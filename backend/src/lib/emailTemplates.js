const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Blank line = new paragraph, single line break = <br>
const paragraphs = (text) =>
  String(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;">${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");

export function announcementEmail({ perfume, headline, message, shopUrl, unsubUrl }) {
  const img = perfume && /^https:\/\//.test(perfume.imageUrl || "") ? perfume.imageUrl : null;
  const title = perfume ? perfume.name : headline;
  const label = perfume ? "New scent" : "What's new";
  const note = message ? String(message).slice(0, 600) : "";
  const desc = perfume?.description ? String(perfume.description).slice(0, 400) : "";

  const html = `<!doctype html><html><body style="margin:0;background:#f2f2f2;font-family:Arial,Helvetica,sans-serif;color:#111;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f2;"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;">
<tr><td style="padding:24px 28px 8px;font-size:13px;letter-spacing:6px;font-weight:bold;text-transform:uppercase;">Leith Essence</td></tr>
${img ? `<tr><td style="padding:16px 28px 0;"><img src="${esc(img)}" alt="${esc(perfume.name)}" width="504" style="display:block;width:100%;height:auto;"></td></tr>` : ""}
<tr><td style="padding:24px 28px 0;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#666;">${label}</td></tr>
<tr><td style="padding:6px 28px 0;font-size:30px;line-height:1.1;font-weight:bold;text-transform:uppercase;">${esc(title)}</td></tr>
${perfume?.inspiredBy ? `<tr><td style="padding:6px 28px 0;font-size:13px;color:#555;">Inspired by ${esc(perfume.inspiredBy)}</td></tr>` : ""}
${note ? `<tr><td style="padding:20px 28px 0;">${paragraphs(note)}</td></tr>` : ""}
${desc ? `<tr><td style="padding:0 28px;font-size:14px;line-height:1.6;color:#333;">${esc(desc)}</td></tr>` : ""}
<tr><td style="padding:22px 28px 8px;"><a href="${esc(shopUrl)}" style="display:inline-block;background:#111;color:#fff;padding:14px 28px;font-size:12px;letter-spacing:2px;text-transform:uppercase;text-decoration:none;">Shop now</a></td></tr>
<tr><td style="padding:28px;font-size:11px;line-height:1.5;color:#777;">You're receiving this because you subscribed to Leith Essence or have an account with us.<br><a href="${esc(unsubUrl)}" style="color:#777;">Unsubscribe</a></td></tr>
</table></td></tr></table></body></html>`;

  const text = [
    `${label.toUpperCase()}: ${title}`,
    perfume?.inspiredBy ? `Inspired by ${perfume.inspiredBy}` : "",
    note,
    desc,
    `Shop now: ${shopUrl}`,
    "",
    `Unsubscribe: ${unsubUrl}`,
  ].filter(Boolean).join("\n\n");

  return { html, text };
}