import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

// In-memory notifications store (Phase 3 — upgrade to DB in Phase 4)
const notificationsStore: Record<string, any[]> = {}

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    const notifications = notificationsStore[userId] || []
    return res.json({ success: true, data: { notifications } })
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const markAllRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId
    if (notificationsStore[userId]) {
      notificationsStore[userId] = notificationsStore[userId].map(n => ({ ...n, read: true }))
    }
    return res.json({ success: true, message: 'Marked all as read' })
  } catch {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

export const addNotification = (userId: string, notification: any) => {
  if (!notificationsStore[userId]) notificationsStore[userId] = []
  notificationsStore[userId].unshift({ ...notification, id: Date.now().toString(), createdAt: new Date(), read: false })
  // Keep only last 20
  notificationsStore[userId] = notificationsStore[userId].slice(0, 20)
}