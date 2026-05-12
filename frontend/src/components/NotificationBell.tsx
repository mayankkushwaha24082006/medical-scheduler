'use client'
import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { connectSocket } from '@/lib/socket'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

export default function NotificationBell() {
  const { user } = useAuthStore()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)

  const unread = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!user) return

    // Load existing notifications
    api.get('/notifications').then(r => setNotifications(r.data.data.notifications)).catch(() => {})

    // Connect socket for real-time
    const socket = connectSocket(user.id)
    socket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev].slice(0, 20))
    })

    return () => { socket.off('notification') }
  }, [user])

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative text-slate-500 hover:text-slate-700 p-1">
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 w-80 bg-white rounded-xl shadow-lg border border-slate-200 z-20 overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
              <span className="font-medium text-slate-900 text-sm">Notifications</span>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">No notifications yet</div>
              ) : (
                notifications.map(n => (
                  <div key={n.id} className={`px-4 py-3 border-b border-slate-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                    <p className="text-sm font-medium text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}