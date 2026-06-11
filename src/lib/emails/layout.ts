import { BRAND, COLORS } from "./brand";

export interface EmailButton {
  label: string;
  href: string;
  variant?: "primary" | "dark" | "outline";
}

export interface EmailLayoutOptions {
  preheader?: string;
  badge?: string;
  title: string;
  subtitle?: string;
  bodyHtml: string;
  buttons?: EmailButton[];
  footerNote?: string;
}

const buttonStyles: Record<NonNullable<EmailButton["variant"]>, string> = {
  primary: `background:linear-gradient(135deg,${COLORS.violet} 0%,${COLORS.accent} 50%,${COLORS.blue} 100%);color:${COLORS.white};`,
  dark: `background:${COLORS.darkAlt};color:${COLORS.white};`,
  outline: `background:${COLORS.white};color:${COLORS.primary};border:2px solid ${COLORS.primary};`,
};

function renderButtons(buttons: EmailButton[]): string {
  if (!buttons.length) return "";

  const cells = buttons
    .map(
      (btn) => `
        <td style="padding:6px;">
          <a href="${btn.href}"
             style="display:inline-block;padding:14px 28px;border-radius:12px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:0.03em;${buttonStyles[btn.variant ?? "primary"]}">
            ${btn.label}
          </a>
        </td>`
    )
    .join("");

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:32px auto 0 auto;">
      <tr>${cells}</tr>
    </table>`;
}

export function buildEmailLayout(options: EmailLayoutOptions): string {
  const { preheader, badge, title, subtitle, bodyHtml, buttons = [], footerNote } = options;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${title}</title>
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}</span>` : ""}
</head>
<body style="margin:0;padding:0;background-color:${COLORS.light};font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;-webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.light};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${COLORS.white};border-radius:24px;overflow:hidden;border:1px solid ${COLORS.border};box-shadow:0 25px 60px rgba(0,0,0,0.06);">

          <!-- Banner -->
          <tr>
            <td style="background-color:${COLORS.dark};padding:40px 32px;text-align:center;position:relative;">
              <img src="${BRAND.logoUrl}" alt="${BRAND.name}" width="180" style="display:block;margin:0 auto 20px auto;max-width:180px;height:auto;" />
              ${badge ? `<span style="display:inline-block;background:rgba(101,68,255,0.25);color:${COLORS.lavender};padding:6px 16px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;border:1px solid rgba(167,139,250,0.3);">${badge}</span>` : ""}
              <h1 style="margin:16px 0 0 0;color:${COLORS.white};font-size:26px;font-weight:900;font-style:italic;text-transform:uppercase;line-height:1.2;letter-spacing:-0.02em;">${title}</h1>
              ${subtitle ? `<p style="margin:12px 0 0 0;color:#94A3B8;font-size:15px;font-weight:500;line-height:1.5;">${subtitle}</p>` : ""}
            </td>
          </tr>

          <!-- Contenido -->
          <tr>
            <td style="padding:36px 32px;color:${COLORS.text};font-size:15px;line-height:1.65;">
              ${bodyHtml}
              ${renderButtons(buttons)}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:${COLORS.footer};padding:28px 32px;text-align:center;border-top:1px solid rgba(101,68,255,0.2);">
              <p style="margin:0 0 8px 0;color:#94A3B8;font-size:12px;font-weight:600;">
                ${footerNote ?? "La plataforma gratuita que te ayuda a elegir tu carrera ideal."}
              </p>
              <p style="margin:0 0 16px 0;">
                <a href="${BRAND.siteUrl}" style="color:${COLORS.lavender};font-size:13px;font-weight:700;text-decoration:none;">${BRAND.siteUrl.replace("https://", "")}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${BRAND.contactEmail}" style="color:${COLORS.lavender};font-size:13px;font-weight:700;text-decoration:none;">${BRAND.contactEmail}</a>
              </p>
              <a href="${BRAND.instagram}" style="color:#64748B;font-size:11px;text-decoration:none;font-weight:600;">@eligetufuturo.cl</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid ${COLORS.border};">
        <span style="display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${COLORS.textMuted};margin-bottom:4px;">${label}</span>
        <span style="display:block;font-size:15px;font-weight:600;color:${COLORS.darkAlt};">${value}</span>
      </td>
    </tr>`;
}

export function highlightBox(title: string, content: string, color = COLORS.primary): string {
  return `
    <div style="background:linear-gradient(135deg,${color} 0%,${COLORS.accent} 100%);color:${COLORS.white};padding:20px 24px;border-radius:16px;margin:24px 0;text-align:center;">
      <p style="margin:0;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;opacity:0.85;font-weight:700;">${title}</p>
      <p style="margin:6px 0 0 0;font-size:22px;font-weight:900;font-style:italic;">${content}</p>
    </div>`;
}

export function tagList(items: string[]): string {
  return items
    .map(
      (item) =>
        `<span style="display:inline-block;background:${COLORS.light};color:${COLORS.darkAlt};padding:8px 14px;border-radius:10px;font-size:13px;font-weight:700;margin:4px 4px 4px 0;border-left:4px solid ${COLORS.primary};">${item}</span>`
    )
    .join("");
}

export function messageBox(text: string): string {
  return `
    <div style="background:${COLORS.light};border:1px solid ${COLORS.border};border-radius:16px;padding:18px 20px;margin:20px 0;">
      <p style="margin:0 0 6px 0;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;color:${COLORS.textMuted};">Mensaje</p>
      <p style="margin:0;color:${COLORS.text};font-size:14px;line-height:1.6;white-space:pre-wrap;">${text}</p>
    </div>`;
}
