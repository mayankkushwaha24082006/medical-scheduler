import { Router } from 'express'
import { authenticate } from '../middleware/auth.middleware'
import { getNotifications, markAllRead } from '../controllers/notification.controller'

const router = Router()

router.get('/', authenticate, getNotifications)
router.patch('/read-all', authenticate, markAllRead)

export default router