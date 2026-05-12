'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import api from '@/lib/api'

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 chars'),
  phone: z.string().optional(),
  specialty: z.string().min(1, 'Required'),
  experience: z.coerce.number().min(0),
  consultFee: z.coerce.number().min(0),
  bio: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const specialties = [
  'General Physician', 'Cardiologist', 'Dermatologist', 'Orthopedic',
  'Neurologist', 'Gastroenterologist', 'ENT', 'Psychiatrist',
  'Pulmonologist', 'Ophthalmologist', 'Gynecologist', 'Urologist',
  'Endocrinologist', 'Dentist', 'Pediatrician', 'Oncologist',
]

export default function AdminDoctorsPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [doctors, setDoctors] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!user) router.push('/auth/login')
    if (user && user.role !== 'ADMIN') router.push('/dashboard/patient')
    fetchDoctors()
  }, [user])

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors/search?limit=50')
      setDoctors(res.data.data.doctors)
    } catch { }
  }

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      setError('')
      await api.post('/auth/register', { ...data, role: 'DOCTOR' })
      setSuccess(`✅ Dr. ${data.firstName} ${data.lastName} added successfully!`)
      reset()
      setShowForm(false)
      fetchDoctors()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add doctor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.push('/dashboard/admin')}
          className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
        <h1 className="font-semibold text-slate-900">Manage Doctors</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="ml-auto bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          {showForm ? 'Cancel' : '+ Add Doctor'}
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg mb-4 border border-green-100 text-sm">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 border border-red-100 text-sm">
            {error}
          </div>
        )}

        {/* Add Doctor Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h2 className="font-semibold text-slate-900 mb-6">Add New Doctor</h2>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">First name</label>
                  <input {...register('firstName')} placeholder="John"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Last name</label>
                  <input {...register('lastName')} placeholder="Smith"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Email</label>
                  <input {...register('email')} type="email" placeholder="dr.john@clinic.com"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Password</label>
                  <input {...register('password')} type="password" placeholder="Min 8 chars"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Specialty</label>
                  <select {...register('specialty')}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select specialty</option>
                    {specialties.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {errors.specialty && <p className="text-red-500 text-xs mt-1">{errors.specialty.message}</p>}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Phone</label>
                  <input {...register('phone')} placeholder="+91 9876543210"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Experience (years)</label>
                  <input {...register('experience')} type="number" placeholder="5"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-1">Consult fee (₹)</label>
                  <input {...register('consultFee')} type="number" placeholder="500"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="mb-4">
                <label className="text-sm font-medium text-slate-700 block mb-1">Bio (optional)</label>
                <textarea {...register('bio')} placeholder="Brief description..."
                  rows={2} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <button type="submit" disabled={loading}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition">
                {loading ? 'Adding...' : 'Add Doctor'}
              </button>
            </form>
          </div>
        )}

        {/* Doctors List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">All Doctors ({doctors.length})</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {doctors.map((doc: any) => (
              <div key={doc.id} className="px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                    {doc.firstName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">Dr. {doc.firstName} {doc.lastName}</p>
                    <p className="text-xs text-slate-500">{doc.specialty} · {doc.experience} yrs · ₹{doc.consultFee}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}