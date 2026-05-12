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
  notes: string | null
  createdAt: string
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

export default function PatientHistoryPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [summary, setSummary] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    if (!user) router.push('/auth/login')
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await api.get('/appointments/patient')
      setAppointments(res.data.data.appointments)
    } catch { } finally { setLoading(false) }
  }

  const fetchAISummary = async () => {
    try {
      setLoadingSummary(true)
      const res = await api.get('/ai/health-summary')
      setSummary(res.data.data.summary)
    } catch {
      setSummary('Unable to generate summary at this time.')
    } finally { setLoadingSummary(false) }
  }

  const filtered = filter === 'ALL'
    ? appointments
    : appointments.filter(a => a.status === filter)

  const stats = {
    total: appointments.length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    upcoming: appointments.filter(a => a.status === 'CONFIRMED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/patient')}
          className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
        <h1 className="font-semibold text-slate-900">Health History</h1>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'slate' },
            { label: 'Completed', value: stats.completed, color: 'blue' },
            { label: 'Upcoming', value: stats.upcoming, color: 'green' },
            { label: 'Cancelled', value: stats.cancelled, color: 'red' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-slate-900">🤖 AI Health Summary</h3>
              <p className="text-xs text-slate-500 mt-0.5">Generated from your appointment history</p>
            </div>
            <button onClick={fetchAISummary} disabled={loadingSummary}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition">
              {loadingSummary ? 'Generating...' : '✨ Generate'}
            </button>
          </div>
          {summary && (
            <div className="mt-3 bg-white rounded-lg p-3 border border-blue-100">
              <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {['ALL', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
                ${filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-slate-400 text-sm">Loading...</p>
        ) : (
          <div className="space-y-3">
            {filtered.map((apt, i) => (
              <div key={apt.id} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Dr. {apt.doctor.firstName} {apt.doctor.lastName}
                      </h3>
                      <p className="text-sm text-blue-600">{apt.doctor.specialty}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        📅 {dayjs(apt.slot.startTime).format('MMM D, YYYY')} at {dayjs(apt.slot.startTime).format('h:mm A')}
                      </p>
                      <p className="text-sm text-slate-600 mt-1">
                        <span className="font-medium">Reason:</span> {apt.reason}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusColors[apt.status]}`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                <p className="text-4xl mb-2">📋</p>
                <p>No appointments found</p>
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