import { Server } from 'socket.io'
import http from 'http'

let io: Server

export const initSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id)

    // Join user-specific room
    socket.on('join', (userId: string) => {
      socket.join(`user:${userId}`)
      console.log(`User ${userId} joined their room`)
    })

    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized')
  return io
}

export const sendNotification = (userId: string, notification: {
  type: string
  title: string
  message: string
  data?: any
}) => {
  try {
    const io = getIO()
    io.to(`user:${userId}`).emit('notification', {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date(),
      read: false,
    })
  } catch (error) {
    console.error('Socket notification failed:', error)
  }
}