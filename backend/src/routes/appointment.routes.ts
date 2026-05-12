import { Router } from 'express'
import { authenticate, authorize } from '../middleware/auth.middleware'
import {
  bookAppointment,
  getPatientAppointments,
  getDoctorAppointments,
  cancelAppointment,
} from '../controllers/appointment.controller'

const router = Router()

router.post('/book', authenticate, authorize('PATIENT'), bookAppointment)
router.get('/patient', authenticate, authorize('PATIENT'), getPatientAppointments)
router.get('/doctor', authenticate, authorize('DOCTOR'), getDoctorAppointments)
router.patch('/:id/cancel', authenticate, cancelAppointment)

export default router