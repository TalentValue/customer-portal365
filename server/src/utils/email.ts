import { Resend } from 'resend'
import { logger } from './logger'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY!)
  return _resend
}

const FROM = `${process.env.FROM_NAME ?? 'ClientPortal365'} <${process.env.FROM_EMAIL ?? 'noreply@clientportal365.com'}>`

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    logger.warn(`[email] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`)
    return
  }
  try {
    await getResend().emails.send({ from: FROM, to, subject, html })
    logger.info(`[email] Sent to ${to}: ${subject}`)
  } catch (err) {
    logger.error(`[email] Failed to send to ${to}`, { err })
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
