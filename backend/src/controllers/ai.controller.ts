import { Response } from 'express'
import { AuthRequest } from '../middleware/auth.middleware'
import { prisma } from '../lib/prisma'

// Symptom to specialty mapping
const symptomSpecialtyMap: Record<string, string[]> = {
  // General Physician
  'fever': ['General Physician', 'Internal Medicine'],
  'cold': ['General Physician'],
  'cough': ['General Physician', 'Pulmonologist'],
  'flu': ['General Physician'],
  'fatigue': ['General Physician', 'Internal Medicine'],
  'headache': ['General Physician', 'Neurologist'],
  'vomiting': ['General Physician', 'Gastroenterologist'],
  'nausea': ['General Physician', 'Gastroenterologist'],
  'diarrhea': ['General Physician', 'Gastroenterologist'],
  'weakness': ['General Physician', 'Internal Medicine'],

  // Cardiologist
  'chest pain': ['Cardiologist', 'General Physician'],
  'heart': ['Cardiologist'],
  'palpitations': ['Cardiologist'],
  'blood pressure': ['Cardiologist', 'General Physician'],
  'shortness of breath': ['Cardiologist', 'Pulmonologist'],

  // Dermatologist
  'skin': ['Dermatologist'],
  'rash': ['Dermatologist', 'General Physician'],
  'acne': ['Dermatologist'],
  'itching': ['Dermatologist', 'General Physician'],
  'eczema': ['Dermatologist'],
  'hair loss': ['Dermatologist'],
  'allergy': ['Dermatologist', 'General Physician'],

  // Orthopedic
  'back pain': ['Orthopedic', 'General Physician'],
  'joint pain': ['Orthopedic', 'Rheumatologist'],
  'knee pain': ['Orthopedic'],
  'fracture': ['Orthopedic'],
  'bone': ['Orthopedic'],
  'muscle pain': ['Orthopedic', 'General Physician'],
  'neck pain': ['Orthopedic', 'Neurologist'],
  'shoulder pain': ['Orthopedic'],

  // Neurologist
  'migraine': ['Neurologist', 'General Physician'],
  'seizure': ['Neurologist'],
  'dizziness': ['Neurologist', 'General Physician'],
  'numbness': ['Neurologist'],
  'memory': ['Neurologist'],
  'tremor': ['Neurologist'],

  // Gastroenterologist
  'stomach': ['Gastroenterologist', 'General Physician'],
  'abdomen': ['Gastroenterologist'],
  'constipation': ['Gastroenterologist', 'General Physician'],
  'bloating': ['Gastroenterologist'],
  'acid reflux': ['Gastroenterologist'],
  'ulcer': ['Gastroenterologist'],

  // ENT
  'throat': ['ENT', 'General Physician'],
  'ear': ['ENT'],
  'nose': ['ENT'],
  'sinus': ['ENT'],
  'tonsil': ['ENT'],
  'hearing': ['ENT'],

  // Ophthalmologist
  'eye': ['Ophthalmologist'],
  'vision': ['Ophthalmologist'],
  'blurred vision': ['Ophthalmologist'],

  // Psychiatrist
  'anxiety': ['Psychiatrist', 'General Physician'],
  'depression': ['Psychiatrist'],
  'stress': ['Psychiatrist', 'General Physician'],
  'sleep': ['Psychiatrist', 'General Physician'],
  'insomnia': ['Psychiatrist', 'General Physician'],
  'mental': ['Psychiatrist'],

  // Pulmonologist
  'breathing': ['Pulmonologist', 'General Physician'],
  'asthma': ['Pulmonologist'],
  'lung': ['Pulmonologist'],
  'chest': ['Pulmonologist', 'Cardiologist'],

  // Gynecologist
  'menstrual': ['Gynecologist'],
  'pregnancy': ['Gynecologist'],
  'period': ['Gynecologist'],
  'ovarian': ['Gynecologist'],

  // Urologist
  'urine': ['Urologist', 'General Physician'],
  'kidney': ['Urologist', 'Nephrologist'],
  'bladder': ['Urologist'],

  // Endocrinologist
  'diabetes': ['Endocrinologist', 'General Physician'],
  'thyroid': ['Endocrinologist'],
  'weight gain': ['Endocrinologist', 'General Physician'],
  'weight loss': ['Endocrinologist', 'General Physician'],
  'hormonal': ['Endocrinologist'],

  // Dentist
  'tooth': ['Dentist'],
  'teeth': ['Dentist'],
  'gum': ['Dentist'],
  'dental': ['Dentist'],
}

const getUrgency = (symptoms: string): 'low' | 'medium' | 'high' => {
  const highUrgency = ['chest pain', 'shortness of breath', 'seizure', 'fracture', 'severe', 'emergency', 'bleeding', 'unconscious']
  const mediumUrgency = ['fever', 'vomiting', 'diarrhea', 'migraine', 'infection', 'pain']

  const lower = symptoms.toLowerCase()
  if (highUrgency.some(w => lower.includes(w))) return 'high'
  if (mediumUrgency.some(w => lower.includes(w))) return 'medium'
  return 'low'
}

const getMatchingSpecialties = (symptoms: string): string[] => {
  const lower = symptoms.toLowerCase()
  const specialtyScores: Record<string, number> = {}

  for (const [keyword, specialties] of Object.entries(symptomSpecialtyMap)) {
    if (lower.includes(keyword)) {
      specialties.forEach((specialty, index) => {
        specialtyScores[specialty] = (specialtyScores[specialty] || 0) + (index === 0 ? 3 : 1)
      })
    }
  }

  if (Object.keys(specialtyScores).length === 0) {
    return ['General Physician']
  }

  return Object.entries(specialtyScores)
    .sort((a, b) => b[1] - a[1])
    .map(([specialty]) => specialty)
    .slice(0, 3)
}

const getReasonForSymptoms = (symptoms: string, specialty: string): string => {
  const reasons: Record<string, string> = {
    'General Physician': 'Best for initial evaluation of your symptoms',
    'Cardiologist': 'Specializes in heart and cardiovascular conditions',
    'Dermatologist': 'Expert in skin, hair and nail conditions',
    'Orthopedic': 'Specializes in bone, joint and muscle problems',
    'Neurologist': 'Expert in brain and nervous system disorders',
    'Gastroenterologist': 'Specializes in digestive system issues',
    'ENT': 'Expert in ear, nose and throat conditions',
    'Psychiatrist': 'Specializes in mental health and emotional wellbeing',
    'Pulmonologist': 'Expert in lung and respiratory conditions',
    'Ophthalmologist': 'Specializes in eye and vision problems',
    'Gynecologist': 'Expert in women\'s reproductive health',
    'Urologist': 'Specializes in urinary tract conditions',
    'Endocrinologist': 'Expert in hormonal and metabolic disorders',
    'Dentist': 'Specializes in oral and dental health',
    'Rheumatologist': 'Expert in autoimmune and joint disorders',
    'Internal Medicine': 'Specializes in complex internal conditions',
  }
  return reasons[specialty] || 'Recommended based on your symptoms'
}

// AI Doctor Recommendation — rule based
export const recommendDoctor = async (req: AuthRequest, res: Response) => {
  try {
    const { symptoms } = req.body
    if (!symptoms) return res.status(400).json({ success: false, message: 'Symptoms required' })

    const matchingSpecialties = getMatchingSpecialties(symptoms)
    const urgency = getUrgency(symptoms)

    // Find doctors matching specialties
    const recommendations = []

    for (const specialty of matchingSpecialties) {
      const doctors = await prisma.doctor.findMany({
        where: {
          specialty: { contains: specialty, mode: 'insensitive' },
        },
        include: { availability: { where: { isActive: true } } },
        take: 1,
      })

      if (doctors.length > 0) {
        recommendations.push({
          doctorId: doctors[0].id,
          reason: getReasonForSymptoms(symptoms, specialty),
          urgency,
          doctor: doctors[0],
        })
      }
    }

    // If no specialty match, return all doctors
    if (recommendations.length === 0) {
      const allDoctors = await prisma.doctor.findMany({
        include: { availability: { where: { isActive: true } } },
        take: 3,
      })
      allDoctors.forEach(doctor => {
        recommendations.push({
          doctorId: doctor.id,
          reason: 'General consultation recommended for your symptoms',
          urgency: 'low' as const,
          doctor,
        })
      })
    }

    return res.json({ success: true, data: { recommendations } })
  } catch (error: any) {
    console.error('Recommend error:', error.message)
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// No-show risk prediction — rule based
export const predictNoShow = async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId } = req.params

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true, slot: true },
    })

    if (!appointment) return res.status(404).json({ success: false, message: 'Appointment not found' })

    const history = await prisma.appointment.findMany({
      where: { patientId: appointment.patientId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const total = history.length
    const cancelled = history.filter(a => a.status === 'CANCELLED').length
    const noShows = history.filter(a => a.status === 'NO_SHOW').length

    let riskScore = 10
    if (total > 0) {
      riskScore += (cancelled / total) * 40
      riskScore += (noShows / total) * 50
    }

    const riskLevel = riskScore > 60 ? 'high' : riskScore > 30 ? 'medium' : 'low'
    const reason = riskScore > 60
      ? 'High cancellation history detected'
      : riskScore > 30
        ? 'Some missed appointments in history'
        : 'Good appointment attendance history'

    return res.json({
      success: true,
      data: { prediction: { riskScore: Math.round(riskScore), riskLevel, reason }, appointmentId }
    })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Smart rescheduling suggestions
export const suggestReschedule = async (req: AuthRequest, res: Response) => {
  try {
    const { doctorId } = req.body

    const slots = await prisma.timeSlot.findMany({
      where: {
        doctorId,
        isBooked: false,
        isBlocked: false,
        startTime: { gt: new Date() },
      },
      orderBy: { startTime: 'asc' },
      take: 5,
    })

    return res.json({ success: true, data: { suggestedSlots: slots } })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}

// Health summary — rule based
export const getHealthSummary = async (req: AuthRequest, res: Response) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user!.userId },
    })
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found' })

    const appointments = await prisma.appointment.findMany({
      where: { patientId: patient.id },
      include: { doctor: true, slot: true },
      orderBy: { createdAt: 'desc' },
    })

    if (appointments.length === 0) {
      return res.json({
        success: true,
        data: { summary: 'No appointments yet. Book your first appointment to start building your health history.' }
      })
    }

    const completed = appointments.filter(a => a.status === 'COMPLETED').length
    const upcoming = appointments.filter(a => a.status === 'CONFIRMED').length
    const cancelled = appointments.filter(a => a.status === 'CANCELLED').length

    const specialties = [...new Set(appointments.map(a => a.doctor.specialty))]
    const lastVisit = appointments[0]

    const summary = `You have ${appointments.length} total appointment${appointments.length > 1 ? 's' : ''} — ${completed} completed, ${upcoming} upcoming and ${cancelled} cancelled. You have consulted ${specialties.join(', ')} specialist${specialties.length > 1 ? 's' : ''}. Your last visit was with Dr. ${lastVisit.doctor.firstName} ${lastVisit.doctor.lastName} (${lastVisit.doctor.specialty}) for ${lastVisit.reason}.`

    return res.json({ success: true, data: { summary } })
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Internal server error' })
  }
}