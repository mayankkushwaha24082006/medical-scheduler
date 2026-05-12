import { Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import { createClient } from 'redis'
import { z } from 'zod'
import { scheduleReminders } from '../lib/queue'
import { sendBookingConfirmation } from '../lib/mailer'
import { sendNotification } from '../lib/socket'
import { addNotification } from './notification.controller'

const redisClient = createClient({ url: process.env.REDIS_URL })
redisClient.connect().catch(console.error)

const bookSchema = z.object({
  doctorId: z.string(),
  slotId: z.string(),
  reason: z.string().min(5),
})

export const bookAppointment = async (req: AuthRequest, res: Response) => {
  const lockKey = `slot_lock:${req.body.slotId}`

  try {
    const data = bookSchema.parse(req.body)

    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } })
    if (!patient) return res.status(404).json({ success: false, message: 'Patient profile not found' })

    // Redis lock — prevent double booking
    const lock = await redisClient.set(lockKey, req.user!.userId, { NX: true, EX: 300 })
    if (!lock) {
      return res.status(409).json({ success: false, message: 'Slot is being booked by someone else. Try another slot.' })
    }

    // Check slot is still available
    const slot = await prisma.timeSlot.findUnique({ where: { id: data.slotId } })
    if (!slot || slot.isBooked || slot.isBlocked) {
      await redisClient.del(lockKey)
      return res.status(409).json({ success: false, message: 'Slot is no longer available' })
    }

    // Create appointment in a transaction
    const appointment = await prisma.$transaction(async (tx) => {
      await tx.timeSlot.update({ where: { id: data.slotId }, data: { isBooked: true } })
      return tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: data.doctorId,
          slotId: data.slotId,
          reason: data.reason,
          status: 'CONFIRMED',
        },
        include: { slot: true, doctor: true, patient: true },
      })
    })

    await redisClient.del(lockKey)

    // Get patient user details
    const patientUser = await prisma.user.findUnique({ where: { id: req.user!.userId } })
    const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`

    // Send confirmation email
    if (patientUser?.email) {
      await sendBookingConfirmation(
        patientUser.email,
        `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        doctorName,
        appointment.slot.startTime,
        appointment.reason
      )
    }

    // Schedule reminders (24h + 2h before appointment)
    await scheduleReminders(
      appointment.id,
      appointment.slot.startTime,
      patientUser?.phone || '',
      patientUser?.email || '',
      doctorName
    )

    // Real-time in-app notification
    sendNotification(req.user!.userId, {
      type: 'BOOKING_CONFIRMED',
      title: 'Appointment Confirmed! ✅',
      message: `Your appointment with Dr. ${doctorName} on ${new Date(appointment.slot.startTime).toLocaleDateString()} is confirmed.`,
    })

    addNotification(req.user!.userId, {
      type: 'BOOKING_CONFIRMED',
      title: 'Appointment Confirmed! ✅',
      message: `Appointment with Dr. ${doctorName} confirmed.`,
    })

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully!',
      data: { appointment },
    })
  } catch (error) {
    await redisClient.del(lockKey).catch(() => {})
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors })
    }
    console.error('Book appointment error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const getPatientAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user!.userId } })
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' })

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { slot: true, doctor: true },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ success: true, data: { appointments } })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const getDoctorAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.userId } })
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })

    const { date } = req.query
    const where: any = { doctorId: doctor.id }

    if (date) {
      const start = new Date(date as string)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date as string)
      end.setHours(23, 59, 59, 999)
      where.slot = { startTime: { gte: start, lte: end } }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { slot: true, patient: true },
      orderBy: { createdAt: 'desc' },
    })

    return res.json({ success: true, data: { appointments } })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params
    const appointment = await prisma.appointment.findUnique({ where: { id } })

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })

    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id }, data: { status: 'CANCELLED' } })
      await tx.timeSlot.update({ where: { id: appointment.slotId }, data: { isBooked: false } })
    })

    return res.json({ success: true, message: 'Appointment cancelled' })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}