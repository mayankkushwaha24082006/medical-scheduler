import { Worker } from 'bullmq'
import { sendReminderEmail } from '../lib/mailer'
import dayjs from 'dayjs'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

export const startReminderWorker = () => {
  const worker = new Worker('reminders', async (job) => {
    const { patientEmail, patientPhone, doctorName, startTime, type, appointmentId } = job.data

    console.log(`🔔 Processing ${type} reminder for appointment ${appointmentId}`)

    // Send email reminder
    if (patientEmail) {
      await sendReminderEmail(
        patientEmail,
        'Patient',
        doctorName,
        new Date(startTime),
        type
      )
    }

    // SMS via Twilio (only if credentials exist)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && patientPhone) {
      try {
        const twilio = require('twilio')
        const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
        const timeLabel = type === '24h' ? '24 hours' : '2 hours'
        await client.messages.create({
          body: `⏰ MediSchedule Reminder: Your appointment with Dr. ${doctorName} is in ${timeLabel} — ${dayjs(startTime).format('MMM D at h:mm A')}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: patientPhone,
        })
        console.log(`📱 SMS reminder (${type}) sent to ${patientPhone}`)
      } catch (err) {
        console.error('SMS failed:', err)
      }
    }

    return { success: true, type, appointmentId }
  }, { connection })

  worker.on('completed', (job) => {
    console.log(`✅ Reminder job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Reminder job ${job?.id} failed:`, err.message)
  })

  console.log('👷 Reminder worker started')
  return worker
}