import express from 'express'
import http from 'http'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { initSocket } from './lib/socket'
import { startReminderWorker } from './workers/reminder.worker'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import slotRoutes from './routes/slot.routes'
import appointmentRoutes from './routes/appointment.routes'
import doctorRoutes from './routes/doctor.routes'
import notificationRoutes from './routes/notification.routes'
import aiRoutes from './routes/ai.routes'

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 5001

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

initSocket(server)
startReminderWorker()

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/slots', slotRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/doctors', doctorRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/ai', aiRoutes)

app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }))

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`🔌 Socket.io ready`)
  console.log(`👷 Reminder worker active`)
})

export default app