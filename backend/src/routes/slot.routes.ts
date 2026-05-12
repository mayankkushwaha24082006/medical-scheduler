import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import { generateSlots, getDoctorSlots, getAvailability, setAvailability } from '../controllers/slot.controller'

const router = Router()

router.post('/generate', authenticate, authorize('DOCTOR'), generateSlots)
router.get('/doctor/:doctorId', getDoctorSlots)
router.get('/availability', authenticate, authorize('DOCTOR'), getAvailability)
router.post('/availability', authenticate, authorize('DOCTOR'), setAvailability)

export default router