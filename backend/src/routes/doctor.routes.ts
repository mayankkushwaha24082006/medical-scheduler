import { Router } from 'express'
import { searchDoctors, getDoctorById, getSpecialties } from '../controllers/doctor.controller'

const router = Router()

router.get('/search', searchDoctors)
router.get('/specialties', getSpecialties)
router.get('/:id', getDoctorById)

export default router