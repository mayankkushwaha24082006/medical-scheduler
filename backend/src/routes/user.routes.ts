import { Router, Response } from 'express'
import { authenticate, authorize, AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

const router = Router()

// Admin: get all users
router.get('/', authenticate, authorize('ADMIN'), async (_req, res: Response) => {
  const users = await prisma.user.findMany({
    include: { doctor: true, patient: true },
    omit: { password: true },
  })
  res.json({ success: true, data: { users } })
})

// Admin: get dashboard stats
router.get('/admin/stats', authenticate, authorize('ADMIN'), async (_req, res: Response) => {
  const [totalUsers, totalDoctors, totalPatients, totalAppointments] = await Promise.all([
    prisma.user.count(),
    prisma.doctor.count(),
    prisma.patient.count(),
    prisma.appointment.count(),
  ])
  res.json({ success: true, data: { totalUsers, totalDoctors, totalPatients, totalAppointments } })
})

// Doctor: get own profile
router.get('/doctor/profile', authenticate, authorize('DOCTOR'), async (req: AuthRequest, res: Response) => {
  const doctor = await prisma.doctor.findUnique({
    where: { userId: req.user!.userId },
    include: { availability: true },
  })
  res.json({ success: true, data: { doctor } })
})

// Patient: get own profile
router.get('/patient/profile', authenticate, authorize('PATIENT'), async (req: AuthRequest, res: Response) => {
  const patient = await prisma.patient.findUnique({
    where: { userId: req.user!.userId },
  })
  res.json({ success: true, data: { patient } })
})

export default router