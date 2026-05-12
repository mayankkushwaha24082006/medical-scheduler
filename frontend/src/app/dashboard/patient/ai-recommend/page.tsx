'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'

interface Recommendation {
  doctorId: string
  reason: string
  urgency: 'low' | 'medium' | 'high'
  doctor: {
    firstName: string
    lastName: string
    specialty: string
    experience: number
    consultFee: number
    avgRating: number
  }
}

const urgencyColors = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

export default function AIRecommendPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [symptoms, setSymptoms] = useState('')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) router.push('/auth/login')
  }, [user, router])

  const handleSubmit = async () => {
    if (!symptoms.trim()) return
    try {
      setLoading(true)
      setError('')
      setRecommendations([])
      const res = await api.post('/ai/recommend', { symptoms })
      setRecommendations(res.data.data.recommendations)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exampleSymptoms = [
    'Fever and sore throat',
    'Lower back pain',
    'Anxiety and sleep problems',
    'Skin rash on arms',
    'Chest pain and shortness of breath',
    'Stomach pain and nausea',
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/patient')}
          className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
        <div>
          <h1 className="font-semibold text-slate-900">AI Doctor Recommendation</h1>
          <p className="text-xs text-slate-500">Smart symptom-based matching</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="font-semibold text-slate-900">Describe your symptoms</h2>
          </div>
          <textarea
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="e.g. I have been having fever, sore throat and headache for the past 2 days..."
            rows={4}
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
          />

          <div className="mb-4">
            <p className="text-xs text-slate-500 mb-2">Quick examples — click to use:</p>
            <div className="flex flex-wrap gap-2">
              {exampleSymptoms.map(s => (
                <button key={s} onClick={() => setSymptoms(s)}
                  className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:text-blue-700 transition">
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleSubmit} disabled={loading || !symptoms.trim()}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2">
            {loading ? '⚙️ Finding doctors...' : '🔍 Find Best Doctors'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">
            {error}
          </div>
        )}

        {recommendations.length > 0 && (
          <div>
            <h3 className="font-semibold text-slate-900 mb-4">
              🎯 Recommended doctors for: <span className="text-blue-600">"{symptoms}"</span>
            </h3>
            <div className="space-y-4">
              {recommendations.map((rec, i) => (
                <div key={rec.doctorId}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-200 transition">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                        #{i + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">
                          Dr. {rec.doctor?.firstName} {rec.doctor?.lastName}
                        </h4>
                        <p className="text-sm text-blue-600">{rec.doctor?.specialty}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${urgencyColors[rec.urgency]}`}>
                      {rec.urgency} urgency
                    </span>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <p className="text-sm text-blue-800">
                      <span className="font-medium">🤖 Reason:</span> {rec.reason}
                    </p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex gap-4 text-sm text-slate-500">
                      <span>⭐ {rec.doctor?.avgRating > 0 ? rec.doctor.avgRating.toFixed(1) : 'New'}</span>
                      <span>🏥 {rec.doctor?.experience} yrs</span>
                      <span>💰 ₹{rec.doctor?.consultFee}</span>
                    </div>
                    <button onClick={() => router.push('/dashboard/patient/book')}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
                      Book Now →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}