import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { recommendDoctor, predictNoShow, suggestReschedule, getHealthSummary } from '../controllers/ai.controller'

const router = Router()

router.post('/recommend', authenticate, authorize('PATIENT'), recommendDoctor)
router.get('/no-show/:appointmentId', authenticate, authorize('DOCTOR', 'ADMIN'), predictNoShow)
router.post('/reschedule', authenticate, suggestReschedule)
router.get('/health-summary', authenticate, authorize('PATIENT'), getHealthSummary)

export default router