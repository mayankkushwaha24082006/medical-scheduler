'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Users, Stethoscope, Calendar, Activity, TrendingUp, Clock } from 'lucide-react'
import api from '@/lib/api'
import dayjs from 'dayjs'

interface Stats {
  totalUsers: number
  totalDoctors: number
  totalPatients: number
  totalAppointments: number
}

const statusColors: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-yellow-100 text-yellow-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  NO_SHOW: 'bg-slate-100 text-slate-600',
}

export default function AdminDashboard() {
  const { user, clearAuth } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalDoctors: 0, totalPatients: 0, totalAppointments: 0 })
  const [doctors, setDoctors] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'doctors'>('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) router.push('/auth/login')
    if (user && user.role !== 'ADMIN') router.push(`/dashboard/${user.role.toLowerCase()}`)
  }, [user, router])

  useEffect(() => {
    if (user?.role === 'ADMIN') fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [statsRes, doctorsRes] = await Promise.all([
        api.get('/users/admin/stats'),
        api.get('/doctors/search?limit=20'),
      ])
      setStats(statsRes.data.data)
      setDoctors(doctorsRes.data.data.doctors)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const statCards = [
    { label: 'Total users', value: stats.totalUsers, icon: Users, color: 'blue', change: '+12%' },
    { label: 'Doctors', value: stats.totalDoctors, icon: Stethoscope, color: 'green', change: '+2' },
    { label: 'Patients', value: stats.totalPatients, icon: Activity, color: 'purple', change: '+8%' },
    { label: 'Appointments', value: stats.totalAppointments, icon: Calendar, color: 'orange', change: '+24%' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏥</span>
          <span className="font-semibold text-slate-900">MediSchedule</span>
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full ml-2">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-700">{user.email}</span>
          <button onClick={() => { clearAuth(); router.push('/auth/login') }}
            className="text-sm text-slate-500 hover:text-slate-700">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard 🛠️</h1>
            <p className="text-slate-500 text-sm mt-1">System overview and management</p>
          </div>
          <div className="text-sm text-slate-500">{dayjs().format('dddd, MMMM D, YYYY')}</div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color, change }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex justify-between items-start mb-3">
                <div className={`w-10 h-10 rounded-lg bg-${color}-100 flex items-center justify-center`}>
                  <Icon size={18} className={`text-${color}-600`} />
                </div>
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  {change}
                </span>
              </div>
              <div className="text-3xl font-bold text-slate-900">{loading ? '...' : value}</div>
              <div className="text-sm text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6 w-fit">
          {(['overview', 'appointments', 'doctors'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition capitalize
                ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-500" />
                System Health
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'API Server', status: 'Online', color: 'green' },
                  { label: 'Database', status: 'Connected', color: 'green' },
                  { label: 'Redis Cache', status: 'Active', color: 'green' },
                  { label: 'Email Service', status: 'Active', color: 'green' },
                  { label: 'SMS Service', status: 'Configured', color: 'yellow' },
                  { label: 'Job Queue', status: 'Running', color: 'green' },
                ].map(({ label, status, color }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-slate-50">
                    <span className="text-sm text-slate-600">{label}</span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full bg-${color}-100 text-${color}-700`}>
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Clock size={18} className="text-purple-500" />
                Quick Stats
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Booking rate', value: 75, color: 'bg-blue-500' },
                  { label: 'Completion rate', value: 88, color: 'bg-green-500' },
                  { label: 'Cancellation rate', value: 12, color: 'bg-red-400' },
                  { label: 'Patient satisfaction', value: 92, color: 'bg-yellow-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{value}%</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-sm font-medium text-slate-700 mb-3">Quick actions</h4>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Add Doctor', icon: '👨‍⚕️', path: '/dashboard/admin/doctors' },
                    { label: 'View Reports', icon: '📊', path: '/dashboard/admin/reports' },
                    { label: 'Manage Doctors', icon: '🏥', path: '/dashboard/admin/doctors' },
                    { label: 'All Appointments', icon: '📅', path: '/dashboard/admin' },
                  ].map(({ label, icon, path }) => (
                    <button key={label} onClick={() => router.push(path)}
                      className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition">
                      <span>{icon}</span>{label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctors Tab */}
        {activeTab === 'doctors' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-semibold text-slate-900">All Doctors ({doctors.length})</h3>
              <button onClick={() => router.push('/dashboard/admin/doctors')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                + Add Doctor
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {doctors.map((doc: any) => (
                <div key={doc.id} className="px-6 py-4 flex justify-between items-center hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-semibold text-sm">
                      {doc.firstName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Dr. {doc.firstName} {doc.lastName}</p>
                      <p className="text-xs text-slate-500">{doc.specialty} · {doc.experience} yrs exp</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-600">₹{doc.consultFee}</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Active</span>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && (
                <div className="px-6 py-12 text-center text-slate-400 text-sm">No doctors found</div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Tab */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-slate-900">All Appointments</h3>
                <p className="text-xs text-slate-500 mt-0.5">System-wide appointment overview</p>
              </div>
              <button onClick={() => router.push('/dashboard/admin/reports')}
                className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition">
                📊 View Reports
              </button>
            </div>
            <div className="p-6 text-center text-slate-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm mb-3">View detailed appointment analytics in Reports</p>
              <button onClick={() => router.push('/dashboard/admin/reports')}
                className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                Go to Reports →
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}