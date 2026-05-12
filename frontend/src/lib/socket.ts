import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const connectSocket = (userId: string): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001', {
      transports: ['websocket'],
    })

    socket.on('connect', () => {
      console.log('🔌 Socket connected')
      socket?.emit('join', userId)
    })
  }
  return socket
}

export const disconnectSocket = () => {
  socket?.disconnect()
  socket = null
}

export const getSocket = () => socket