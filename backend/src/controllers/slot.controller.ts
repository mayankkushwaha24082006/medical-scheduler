import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from '../middleware/auth.middleware'
import dayjs from 'dayjs'

// Generate slots for a doctor for the next N days
export const generateSlots = async (req: AuthRequest, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.userId },
      include: { availability: true },
    })

    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })

    const daysAhead = 14 // generate 2 weeks of slots
    const slots = []

    for (let i = 0; i < daysAhead; i++) {
      const date = dayjs().add(i, 'day')
      const dayOfWeek = date.day() // 0=Sunday

      const availability = doctor.availability.find(a => a.dayOfWeek === dayOfWeek && a.isActive)
      if (!availability) continue

      const [startHour, startMin] = availability.startTime.split(':').map(Number)
      const [endHour, endMin] = availability.endTime.split(':').map(Number)

      let current = date.hour(startHour).minute(startMin).second(0).millisecond(0)
      const end = date.hour(endHour).minute(endMin).second(0).millisecond(0)

      while (current.isBefore(end)) {
        const slotEnd = current.add(availability.slotDuration, 'minute')
        if (slotEnd.isAfter(end)) break

        // Check if slot already exists
        const existing = await prisma.timeSlot.findFirst({
          where: {
            doctorId: doctor.id,
            startTime: current.toDate(),
          },
        })

        if (!existing) {
          slots.push({
            doctorId: doctor.id,
            startTime: current.toDate(),
            endTime: slotEnd.toDate(),
          })
        }

        current = slotEnd
      }
    }

    if (slots.length > 0) {
      await prisma.timeSlot.createMany({ data: slots })
    }

    return res.json({
      success: true,
      message: `Generated ${slots.length} new slots`,
      data: { count: slots.length },
    })
  } catch (error) {
    console.error('Generate slots error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Get available slots for a doctor on a specific date
export const getDoctorSlots = async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params
    const { date } = req.query // YYYY-MM-DD

    if (!date) return res.status(400).json({ success: false, message: 'Date is required' })

    const startOfDay = dayjs(date as string).startOf('day').toDate()
    const endOfDay = dayjs(date as string).endOf('day').toDate()

    const slots = await prisma.timeSlot.findMany({
      where: {
        doctorId,
        startTime: { gte: startOfDay, lte: endOfDay },
        isBooked: false,
        isBlocked: false,
        startTime: { gt: new Date() }, // only future slots
      },
      orderBy: { startTime: 'asc' },
    })

    return res.json({ success: true, data: { slots } })
  } catch (error) {
    console.error('Get slots error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Get doctor availability settings
export const getAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { userId: req.user!.userId },
      include: { availability: { orderBy: { dayOfWeek: 'asc' } } },
    })
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
    return res.json({ success: true, data: { availability: doctor.availability } })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Set doctor availability
export const setAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const doctor = await prisma.doctor.findUnique({ where: { userId: req.user!.userId } })
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })

    const { availability } = req.body // array of { dayOfWeek, startTime, endTime, isActive }

    for (const slot of availability) {
      await prisma.availability.upsert({
        where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: slot.dayOfWeek } },
        update: { startTime: slot.startTime, endTime: slot.endTime, isActive: slot.isActive },
        create: { doctorId: doctor.id, ...slot },
      })
    }

    return res.json({ success: true, message: 'Availability updated' })
  } catch (error) {
    console.error('Set availability error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}