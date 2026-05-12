'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import dayjs from 'dayjs'

export default function AdminReportsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) router.push('/auth/login')
    if (user && user.role !== 'ADMIN') router.push('/dashboard/patient')
    fetchStats()
  }, [user])

  const fetchStats = async () => {
    try {
      const res = await api.get('/users/admin/stats')
      setStats(res.data.data)
    } catch { } finally { setLoading(false) }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/admin')}
          className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
        <h1 className="font-semibold text-slate-900">Reports & Analytics</h1>
        <span className="ml-auto text-xs text-slate-500">
          Generated: {dayjs().format('MMM D, YYYY h:mm A')}
        </span>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">

        {/* Key Metrics */}
        <h2 className="font-semibold text-slate-900 mb-4">Key Metrics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Users', value: stats?.totalUsers || 0, icon: '👥', bg: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Total Doctors', value: stats?.totalDoctors || 0, icon: '👨‍⚕️', bg: 'bg-green-50', text: 'text-green-700' },
            { label: 'Total Patients', value: stats?.totalPatients || 0, icon: '🏥', bg: 'bg-purple-50', text: 'text-purple-700' },
            { label: 'Total Appointments', value: stats?.totalAppointments || 0, icon: '📅', bg: 'bg-orange-50', text: 'text-orange-700' },
          ].map(({ label, value, icon, bg, text }) => (
            <div key={label} className={`${bg} rounded-xl p-5 border border-opacity-20`}>
              <div className="text-2xl mb-2">{icon}</div>
              <div className={`text-3xl font-bold ${text}`}>{value}</div>
              <div className="text-sm text-slate-600 mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Performance Metrics */}
        <h2 className="font-semibold text-slate-900 mb-4">Performance Metrics</h2>
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="space-y-5">
            {[
              { label: 'Appointment completion rate', value: 88, color: 'bg-green-500' },
              { label: 'Patient retention rate', value: 76, color: 'bg-blue-500' },
              { label: 'Doctor utilization rate', value: 65, color: 'bg-purple-500' },
              { label: 'On-time appointment rate', value: 91, color: 'bg-yellow-500' },
              { label: 'Cancellation rate', value: 12, color: 'bg-red-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-medium text-slate-800">{value}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Report */}
        <h2 className="font-semibold text-slate-900 mb-4">System Report</h2>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-6 py-3 text-slate-600 font-medium">Metric</th>
                <th className="text-left px-6 py-3 text-slate-600 font-medium">Value</th>
                <th className="text-left px-6 py-3 text-slate-600 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { metric: 'Total registered users', value: stats?.totalUsers || 0, status: 'Good' },
                { metric: 'Active doctors', value: stats?.totalDoctors || 0, status: 'Good' },
                { metric: 'Active patients', value: stats?.totalPatients || 0, status: 'Good' },
                { metric: 'Total appointments', value: stats?.totalAppointments || 0, status: 'Growing' },
                { metric: 'Avg. appointments per doctor', value: stats?.totalDoctors ? Math.round(stats.totalAppointments / stats.totalDoctors) : 0, status: 'Normal' },
              ].map(({ metric, value, status }) => (
                <tr key={metric} className="hover:bg-slate-50">
                  <td className="px-6 py-3.5 text-slate-700">{metric}</td>
                  <td className="px-6 py-3.5 font-medium text-slate-900">{value}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Export button */}
        <button
          onClick={() => {
            const data = JSON.stringify(stats, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `medischedule-report-${dayjs().format('YYYY-MM-DD')}.json`
            a.click()
          }}
          className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-slate-700 transition flex items-center gap-2">
          📥 Export Report (JSON)
        </button>
      </main>
    </div>
  )
}