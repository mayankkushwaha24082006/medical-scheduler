import nodemailer from 'nodemailer'
import dayjs from 'dayjs'

const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export const sendBookingConfirmation = async (
  to: string,
  patientName: string,
  doctorName: string,
  startTime: Date,
  reason: string
) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #2563EB; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">🏥 MediSchedule</h1>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; margin-top: 0;">Appointment Confirmed! ✅</h2>
        <p style="color: #64748b;">Hi ${patientName}, your appointment has been booked successfully.</p>
        <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Doctor</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">Dr. ${doctorName}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Date</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${dayjs(startTime).format('MMMM D, YYYY')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Time</td><td style="padding: 8px 0; font-weight: 600; color: #1e293b;">${dayjs(startTime).format('h:mm A')}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-size: 14px;">Reason</td><td style="padding: 8px 0; color: #1e293b;">${reason}</td></tr>
          </table>
        </div>
        <p style="color: #64748b; font-size: 13px;">You will receive reminders 24 hours and 2 hours before your appointment.</p>
      </div>
    </div>
  `
  try {
    console.log('📧 Sending email to:', to)
    console.log('📧 Using SMTP user:', process.env.SMTP_USER)
    await createTransporter().sendMail({
      from: `"MediSchedule" <${process.env.SMTP_USER}>`,
      to,
      subject: `✅ Appointment Confirmed — Dr. ${doctorName} on ${dayjs(startTime).format('MMM D')}`,
      html,
    })
    console.log(`📧 Confirmation email sent to ${to}`)
  } catch (error: any) {
    console.error('Email send failed:', error.message)
  }
}

export const sendReminderEmail = async (
  to: string,
  patientName: string,
  doctorName: string,
  startTime: Date,
  type: '24h' | '2h'
) => {
  const timeLabel = type === '24h' ? '24 hours' : '2 hours'
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #F59E0B; padding: 24px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 22px;">⏰ Appointment Reminder</h1>
      </div>
      <div style="background: #f8fafc; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e293b; margin-top: 0;">Your appointment is in ${timeLabel}!</h2>
        <p style="color: #64748b;">Hi ${patientName}, just a reminder about your upcoming appointment.</p>
        <div style="background: white; border-radius: 8px; padding: 20px; border: 1px solid #e2e8f0;">
          <p style="margin: 0; font-weight: 600; color: #1e293b;">Dr. ${doctorName}</p>
          <p style="margin: 4px 0 0; color: #64748b;">${dayjs(startTime).format('MMMM D, YYYY')} at ${dayjs(startTime).format('h:mm A')}</p>
        </div>
      </div>
    </div>
  `
  try {
    await createTransporter().sendMail({
      from: `"MediSchedule" <${process.env.SMTP_USER}>`,
      to,
      subject: `⏰ Reminder: Appointment with Dr. ${doctorName} in ${timeLabel}`,
      html,
    })
    console.log(`📧 Reminder email (${type}) sent to ${to}`)
  } catch (error: any) {
    console.error('Reminder email failed:', error.message)
  }
}