'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Calendar, Clock, User, Brain } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

export default function PatientDashboard() {
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!user) router.push('/auth/login')
    if (user && user.role !== 'PATIENT') router.push(`/dashboard/${user.role.toLowerCase()}`)
  }, [user, router])

  if (!user) return null
  const name = user.patient ? `${user.patient.firstName} ${user.patient.lastName}` : user.email

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <span className="font-semibold text-slate-900">MediSchedule</span>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm text-slate-700">{name}</span>
          </div>
          <button onClick={() => { clearAuth(); router.push('/auth/login') }}
            className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Welcome back, {user.patient?.firstName || 'Patient'} 👋
        </h1>
        <p className="text-slate-500 mb-8">Manage your appointments and health records.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Upcoming', value: '0', icon: Calendar, color: 'blue' },
            { label: 'Completed', value: '0', icon: Clock, color: 'green' },
            { label: 'Doctors seen', value: '0', icon: User, color: 'purple' },
            { label: 'AI Insights', value: '✨', icon: Brain, color: 'orange' },
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
          <h2 className="font-semibold text-slate-900 mb-4">Quick actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            <button onClick={() => router.push('/dashboard/patient/book')}
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left">
              <Calendar size={20} className="text-blue-500" />
              <div>
                <div className="text-sm font-medium text-slate-800">Book appointment</div>
                <div className="text-xs text-slate-500">Find a doctor near you</div>
              </div>
            </button>

            <button onClick={() => router.push('/dashboard/patient/ai-recommend')}
              className="flex items-center gap-3 p-4 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition text-left">
              <Brain size={20} className="text-blue-600" />
              <div>
                <div className="text-sm font-medium text-blue-800">AI Doctor Match 🤖</div>
                <div className="text-xs text-blue-600">Get recommendation by symptoms</div>
              </div>
            </button>

            <button onClick={() => router.push('/dashboard/patient/appointments')}
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left">
              <Clock size={20} className="text-green-500" />
              <div>
                <div className="text-sm font-medium text-slate-800">My appointments</div>
                <div className="text-xs text-slate-500">View upcoming & past</div>
              </div>
            </button>

            <button onClick={() => router.push('/dashboard/patient/history')}
              className="flex items-center gap-3 p-4 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-left">
              <User size={20} className="text-purple-500" />
              <div>
                <div className="text-sm font-medium text-slate-800">Health history</div>
                <div className="text-xs text-slate-500">Timeline + AI summary</div>
              </div>
            </button>

          </div>
        </div>

        <div className="mt-4 text-center text-xs text-slate-400 bg-blue-50 rounded-lg p-3 border border-blue-100">
          ✅ Phase 4 — AI Doctor Recommendation + Health History active!
        </div>
      </main>
    </div>
  )
}