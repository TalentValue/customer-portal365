import { SendMailClient } from 'zeptomail'
import { logger } from './logger'
import fs from 'fs'
import path from 'path'

const DEV_MAIL_DIR = path.join(__dirname, '../../dev-emails')
const FROM_ADDRESS = process.env.FROM_EMAIL ?? 'noreply@clientportal365.com'
const FROM_NAME = process.env.FROM_NAME ?? 'ClientPortal365'

function getClient(): SendMailClient {
  return new SendMailClient({
    url: 'api.zeptomail.in/',
    token: process.env.ZEPTOMAIL_TOKEN!,
  })
}

function saveDevEmail(to: string, subject: string, html: string): void {
  fs.mkdirSync(DEV_MAIL_DIR, { recursive: true })
  const filename = `${Date.now()}-${to.replace(/[^a-z0-9]/gi, '_')}.html`
  const filepath = path.join(DEV_MAIL_DIR, filename)
  fs.writeFileSync(filepath, `
    <html><head><meta charset="utf-8">
    <style>body{font-family:sans-serif;max-width:700px;margin:40px auto;padding:0 20px}
    .meta{background:#f0f4ff;border:1px solid #c7d2fe;border-radius:8px;padding:12px 16px;margin-bottom:24px;font-size:13px;color:#4338ca}
    .meta strong{display:inline-block;width:60px}</style></head><body>
    <div class="meta">
      <div><strong>To:</strong> ${to}</div>
      <div><strong>From:</strong> ${FROM_NAME} &lt;${FROM_ADDRESS}&gt;</div>
      <div><strong>Subject:</strong> ${subject}</div>
    </div>
    ${html}
    </body></html>
  `)
  logger.info(`[email] DEV — saved to file://${filepath.replace(/\\/g, '/')}`)
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.ZEPTOMAIL_TOKEN) {
    saveDevEmail(to, subject, html)
    if (process.env.NODE_ENV === 'production') {
      logger.warn(`[email] ZEPTOMAIL_TOKEN not set — skipping email to ${to}: ${subject}`)
    }
    return
  }
  try {
    await getClient().sendMail({
      from: { address: FROM_ADDRESS, name: FROM_NAME },
      to: [{ email_address: { address: to, name: to } }],
      subject,
      htmlbody: html,
    })
    logger.info(`[email] Sent to ${to}: ${subject}`)
  } catch (err) {
    logger.error(`[email] Failed to send to ${to}`, { err })
    saveDevEmail(to, subject, html)
  }
}

export const EmailTemplates = {
  invite: (firstName: string, inviteUrl: string) => ({
    subject: 'You\'ve been invited to ClientPortal365',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Welcome to ClientPortal365</h2>
        <p>Hi${firstName ? ` ${firstName}` : ''},</p>
        <p>You've been invited to access your client portal. Click the button below to set up your account.</p>
        <a href="${inviteUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Accept Invitation</a>
        <p style="color:#666;font-size:14px;margin-top:24px">This link expires in 48 hours.</p>
      </div>
    `,
  }),

  passwordReset: (resetUrl: string) => ({
    subject: 'Reset your ClientPortal365 password',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Reset your password</h2>
        <p>Click the button below to reset your password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">Reset Password</a>
        <p style="color:#666;font-size:14px;margin-top:24px">If you didn't request this, ignore this email.</p>
      </div>
    `,
  }),

  ticketUpdate: (ticketTitle: string, message: string, ticketUrl: string) => ({
    subject: `Update on ticket: ${ticketTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Ticket Update</h2>
        <p>${message}</p>
        <a href="${ticketUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Ticket</a>
      </div>
    `,
  }),

  reminder: (ticketTitle: string, companyName: string, ticketUrl: string) => ({
    subject: `Reminder: Action required on "${ticketTitle}"`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2>Action Required</h2>
        <p>This is a reminder that the following ticket from <strong>${companyName}</strong> is awaiting your response:</p>
        <h3>${ticketTitle}</h3>
        <a href="${ticketUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600">View Ticket</a>
      </div>
    `,
  }),
}
