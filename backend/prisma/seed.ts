import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  const hashedAdmin = await bcrypt.hash('Admin123!', 12)
  const hashedDoctor = await bcrypt.hash('Doctor123!', 12)
  const hashedPatient = await bcrypt.hash('Patient123!', 12)

  // Admin
  await prisma.user.upsert({
    where: { email: 'admin@clinic.com' },
    update: {},
    create: {
      email: 'admin@clinic.com',
      password: hashedAdmin,
      role: Role.ADMIN,
      phone: '+1234567890',
    },
  })

  // Doctor
  const doctorUser = await prisma.user.upsert({
    where: { email: 'dr.smith@clinic.com' },
    update: {},
    create: {
      email: 'dr.smith@clinic.com',
      password: hashedDoctor,
      role: Role.DOCTOR,
      phone: '+1234567891',
      doctor: {
        create: {
          firstName: 'John',
          lastName: 'Smith',
          specialty: 'General Physician',
          bio: 'Experienced GP with 10+ years of practice.',
          experience: 10,
          consultFee: 50,
          availability: {
            create: [
              { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 3, startTime: '09:00', endTime: '13:00' },
              { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
              { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
            ],
          },
        },
      },
    },
  })

  // Patient
  await prisma.user.upsert({
    where: { email: 'patient@example.com' },
    update: {},
    create: {
      email: 'patient@example.com',
      password: hashedPatient,
      role: Role.PATIENT,
      phone: '+1234567892',
      patient: {
        create: {
          firstName: 'Jane',
          lastName: 'Doe',
          dateOfBirth: new Date('1990-05-15'),
          bloodGroup: 'O+',
        },
      },
    },
  })

  console.log('✅ Seeding complete!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())