'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import dayjs from 'dayjs'

interface Appointment {
  id: string
  status: string
  reason: string
  slot: { startTime: string; endTime: string }
  doctor: { firstName: string; lastName: string; specialty: string }
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  NO_SHOW: 'bg-slate-100 text-slate-600',
}

export default function PatientAppointmentsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) router.push('/auth/login')
    fetchAppointments()
  }, [])

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/patient')
      setAppointments(res.data.data.appointments)
    } catch { } finally { setLoading(false) }
  }

  const cancel = async (id: string) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await api.patch(`/appointments/${id}/cancel`)
      fetchAppointments()
    } catch { alert('Failed to cancel') }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/patient')} className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
        <h1 className="font-semibold text-slate-900">My Appointments</h1>
      </header>
      <main className="max-w-3xl mx-auto px-6 py-8">
        {loading ? <p className="text-slate-400">Loading...</p> : (
          <div className="space-y-4">
            {appointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-slate-900">Dr. {apt.doctor.firstName} {apt.doctor.lastName}</h3>
                    <p className="text-sm text-blue-600 mb-1">{apt.doctor.specialty}</p>
                    <p className="text-sm text-slate-500">📅 {dayjs(apt.slot.startTime).format('MMM D, YYYY')} at {dayjs(apt.slot.startTime).format('h:mm A')}</p>
                    <p className="text-sm text-slate-500 mt-1">Reason: {apt.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[apt.status]}`}>{apt.status}</span>
                    {apt.status === 'CONFIRMED' && (
                      <button onClick={() => cancel(apt.id)} className="text-xs text-red-500 hover:text-red-700">Cancel</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {appointments.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <p className="text-4xl mb-3">📅</p>
                <p className="font-medium">No appointments yet</p>
                <button onClick={() => router.push('/dashboard/patient/book')}
                  className="mt-4 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
                  Book your first appointment
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}