'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Calendar, Users, Clock, Star } from 'lucide-react'
import api from '@/lib/api'
import dayjs from 'dayjs'

export default function DoctorDashboard() {
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()
  const [appointments, setAppointments] = useState<any[]>([])
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState('')

  useEffect(() => {
    if (!user) router.push('/auth/login')
    if (user && user.role !== 'DOCTOR') router.push(`/dashboard/${user.role.toLowerCase()}`)
  }, [user, router])

  useEffect(() => {
    if (user?.role === 'DOCTOR') {
      const today = new Date().toISOString().split('T')[0]
      api.get(`/appointments/doctor?date=${today}`)
        .then(r => setAppointments(r.data.data.appointments))
        .catch(console.error)
    }
  }, [user])

  const generateSlots = async () => {
    try {
      setGenerating(true)
      setGenMsg('')
      const res = await api.post('/slots/generate')
      setGenMsg(`✅ ${res.data.message}`)
    } catch {
      setGenMsg('❌ Failed to generate slots')
    } finally {
      setGenerating(false)
    }
  }

  if (!user) return null
  const name = user.doctor ? `Dr. ${user.doctor.firstName} ${user.doctor.lastName}` : user.email

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <span className="font-semibold text-slate-900">MediSchedule</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">Doctor</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-700">{name}</span>
          <button onClick={() => { clearAuth(); router.push('/auth/login') }}
            className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Good morning, {user.doctor?.firstName} 👨‍⚕️</h1>
            <p className="text-slate-500">{user.doctor?.specialty}</p>
          </div>
          <div className="text-right">
            <button onClick={generateSlots} disabled={generating}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {generating ? 'Generating...' : '⚡ Generate Slots'}
            </button>
            {genMsg && <p className="text-xs mt-1 text-slate-500">{genMsg}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Today's patients", value: appointments.length.toString(), icon: Users, color: 'blue' },
            { label: 'This week', value: '0', icon: Calendar, color: 'green' },
            { label: 'Avg. duration', value: '30m', icon: Clock, color: 'orange' },
            { label: 'Rating', value: '—', icon: Star, color: 'yellow' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className={`w-8 h-8 rounded-lg bg-${color}-100 flex items-center justify-center mb-3`}>
                <Icon size={16} className={`text-${color}-600`} />
              </div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Today's schedule</h2>
          {appointments.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No appointments today</p>
              <p className="text-xs mt-1">Click "Generate Slots" to make yourself available for bookings</p>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {apt.patient.firstName} {apt.patient.lastName}
                    </p>
                    <p className="text-xs text-slate-500">{apt.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-slate-700">
                      {dayjs(apt.slot.startTime).format('h:mm A')}
                    </p>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {apt.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}