import { Queue } from 'bullmq'
import { createClient } from 'redis'

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
}

export const reminderQueue = new Queue('reminders', { connection })

export const scheduleReminders = async (appointmentId: string, startTime: Date, patientPhone: string, patientEmail: string, doctorName: string) => {
  const now = new Date()

  const twoHoursBefore = new Date(startTime.getTime() - 2 * 60 * 60 * 1000)
  const twentyFourHoursBefore = new Date(startTime.getTime() - 24 * 60 * 60 * 1000)

  // 24h reminder
  if (twentyFourHoursBefore > now) {
    await reminderQueue.add('send-reminder', {
      appointmentId,
      patientPhone,
      patientEmail,
      doctorName,
      startTime,
      type: '24h',
    }, {
      delay: twentyFourHoursBefore.getTime() - now.getTime(),
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })
  }

  // 2h reminder
  if (twoHoursBefore > now) {
    await reminderQueue.add('send-reminder', {
      appointmentId,
      patientPhone,
      patientEmail,
      doctorName,
      startTime,
      type: '2h',
    }, {
      delay: twoHoursBefore.getTime() - now.getTime(),
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
    })
  }

  console.log(`📅 Reminders scheduled for appointment ${appointmentId}`)
}