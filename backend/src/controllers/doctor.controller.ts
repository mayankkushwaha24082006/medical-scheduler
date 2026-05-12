import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'

// Search doctors by specialty or name
export const searchDoctors = async (req: Request, res: Response) => {
  try {
    const { specialty, name, page = '1', limit = '10' } = req.query

    const where: any = {}
    if (specialty) where.specialty = { contains: specialty as string, mode: 'insensitive' }
    if (name) {
      where.OR = [
        { firstName: { contains: name as string, mode: 'insensitive' } },
        { lastName: { contains: name as string, mode: 'insensitive' } },
      ]
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string)

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take: parseInt(limit as string),
        include: {
          user: { select: { email: true, phone: true } },
          availability: { where: { isActive: true } },
        },
      }),
      prisma.doctor.count({ where }),
    ])

    return res.json({
      success: true,
      data: {
        doctors,
        pagination: {
          total,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          pages: Math.ceil(total / parseInt(limit as string)),
        },
      },
    })
  } catch (error) {
    console.error('Search doctors error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Get single doctor profile
export const getDoctorById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const doctor = await prisma.doctor.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, phone: true } },
        availability: { where: { isActive: true }, orderBy: { dayOfWeek: 'asc' } },
      },
    })
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor not found' })
    return res.json({ success: true, data: { doctor } })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Get all specialties
export const getSpecialties = async (_req: Request, res: Response) => {
  try {
    const specialties = await prisma.doctor.findMany({
      select: { specialty: true },
      distinct: ['specialty'],
    })
    return res.json({
      success: true,
      data: { specialties: specialties.map(s => s.specialty) },
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}