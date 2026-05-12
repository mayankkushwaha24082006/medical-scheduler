import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt'
import { Role } from '@prisma/client'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[A-Z])(?=.*[0-9])/, 'Must have uppercase and number'),
  role: z.enum(['PATIENT', 'DOCTOR']).default('PATIENT'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  // Doctor-specific
  specialty: z.string().optional(),
  bio: z.string().optional(),
  experience: z.number().optional(),
  consultFee: z.number().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const register = async (req: Request, res: Response) => {
  try {
    const data = registerSchema.parse(req.body)

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role as Role,
        phone: data.phone,
        ...(data.role === 'DOCTOR'
          ? {
              doctor: {
                create: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  specialty: data.specialty || 'General',
                  bio: data.bio,
                  experience: data.experience || 0,
                  consultFee: data.consultFee || 0,
                },
              },
            }
          : {
              patient: {
                create: {
                  firstName: data.firstName,
                  lastName: data.lastName,
                },
              },
            }),
      },
      include: { doctor: true, patient: true },
    })

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

    const { password: _, ...userWithoutPassword } = user

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: userWithoutPassword, accessToken, refreshToken },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors })
    }
    console.error('Register error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email },
      include: { doctor: true, patient: true },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' })
    }

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)
    await prisma.refreshToken.create({ data: { token: refreshToken, userId: user.id, expiresAt } })

    const { password: _, ...userWithoutPassword } = user

    return res.json({
      success: true,
      message: 'Login successful',
      data: { user: userWithoutPassword, accessToken, refreshToken },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ success: false, message: 'Validation error', errors: error.errors })
    }
    console.error('Login error:', error)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' })
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' })
    }

    const payload = verifyRefreshToken(refreshToken)
    const newAccessToken = signAccessToken({
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    })

    return res.json({ success: true, data: { accessToken: newAccessToken } })
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid refresh token' })
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
    }
    return res.json({ success: true, message: 'Logged out successfully' })
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const getMe = async (req: any, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { doctor: true, patient: true },
      omit: { password: true },
    })
    if (!user) return res.status(404).json({ success: false, message: 'User not found' })
    return res.json({ success: true, data: { user } })
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}