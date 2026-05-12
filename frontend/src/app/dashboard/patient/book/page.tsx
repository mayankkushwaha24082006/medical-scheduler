'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import api from '@/lib/api'
import dayjs from 'dayjs'

interface Doctor {
  id: string
  firstName: string
  lastName: string
  specialty: string
  experience: number
  consultFee: number
  avgRating: number
  availability: { dayOfWeek: number }[]
}

interface Slot {
  id: string
  startTime: string
  endTime: string
}

export default function BookAppointmentPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [reason, setReason] = useState('')
  const [search, setSearch] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [specialties, setSpecialties] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!user) router.push('/auth/login')
    fetchDoctors()
    fetchSpecialties()
  }, [])

  useEffect(() => {
    if (selectedDoctor && selectedDate) fetchSlots()
  }, [selectedDoctor, selectedDate])

  const fetchDoctors = async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.append('name', search)
      if (specialty) params.append('specialty', specialty)
      const res = await api.get(`/doctors/search?${params}`)
      setDoctors(res.data.data.doctors)
    } catch { setError('Failed to load doctors') }
  }

  const fetchSpecialties = async () => {
    try {
      const res = await api.get('/doctors/specialties')
      setSpecialties(res.data.data.specialties)
    } catch {}
  }

  const fetchSlots = async () => {
    try {
      setLoading(true)
      const res = await api.get(`/slots/doctor/${selectedDoctor!.id}?date=${selectedDate}`)
      setSlots(res.data.data.slots)
    } catch { setError('Failed to load slots') }
    finally { setLoading(false) }
  }

  const handleBook = async () => {
    if (!selectedSlot || !selectedDoctor || !reason) return
    try {
      setLoading(true)
      setError('')
      await api.post('/appointments/book', {
        doctorId: selectedDoctor.id,
        slotId: selectedSlot.id,
        reason,
      })
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (success) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-slate-200 max-w-md">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Appointment Booked!</h2>
        <p className="text-slate-500 mb-2">With Dr. {selectedDoctor?.firstName} {selectedDoctor?.lastName}</p>
        <p className="text-slate-500 mb-6">{dayjs(selectedSlot?.startTime).format('MMM D, YYYY')} at {dayjs(selectedSlot?.startTime).format('h:mm A')}</p>
        <button onClick={() => router.push('/dashboard/patient')}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition">
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : router.push('/dashboard/patient')}
          className="text-slate-500 hover:text-slate-700 text-sm">← Back</button>
        <h1 className="font-semibold text-slate-900">Book Appointment</h1>
        <div className="ml-auto flex gap-2">
          {[1, 2, 3].map(s => (
            <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium
              ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{s}</div>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4 border border-red-100">{error}</div>}

        {/* Step 1 — Choose doctor */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Choose a Doctor</h2>
            <div className="flex gap-3 mb-6">
              <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && fetchDoctors()}
                placeholder="Search by name..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={specialty} onChange={e => { setSpecialty(e.target.value); fetchDoctors() }}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All specialties</option>
                {specialties.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={fetchDoctors} className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">Search</button>
            </div>
            <div className="grid gap-4">
              {doctors.map(doc => (
                <div key={doc.id} onClick={() => { setSelectedDoctor(doc); setStep(2) }}
                  className="bg-white border border-slate-200 rounded-xl p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                          {doc.firstName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">Dr. {doc.firstName} {doc.lastName}</h3>
                          <p className="text-sm text-blue-600">{doc.specialty}</p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-2 text-sm text-slate-500">
                        <span>⭐ {doc.avgRating > 0 ? doc.avgRating.toFixed(1) : 'New'}</span>
                        <span>🏥 {doc.experience} yrs exp</span>
                        <span>📅 {doc.availability.map(a => days[a.dayOfWeek]).join(', ')}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">₹{doc.consultFee}</div>
                      <div className="text-xs text-slate-500">per visit</div>
                    </div>
                  </div>
                </div>
              ))}
              {doctors.length === 0 && (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-4xl mb-2">🔍</p>
                  <p>No doctors found. Try a different search.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2 — Choose date & slot */}
        {step === 2 && selectedDoctor && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Choose Date & Time</h2>
            <p className="text-slate-500 mb-6">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName} — {selectedDoctor.specialty}</p>

            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
              <label className="text-sm font-medium text-slate-700 block mb-2">Select Date</label>
              <input type="date" value={selectedDate}
                min={dayjs().format('YYYY-MM-DD')}
                max={dayjs().add(14, 'day').format('YYYY-MM-DD')}
                onChange={e => setSelectedDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {selectedDate && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-medium text-slate-900 mb-4">Available Slots for {dayjs(selectedDate).format('MMM D, YYYY')}</h3>
                {loading ? <p className="text-slate-400 text-sm">Loading slots...</p> : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 px-3 rounded-lg text-sm font-medium border transition
                          ${selectedSlot?.id === slot.id
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'}`}>
                        {dayjs(slot.startTime).format('h:mm A')}
                      </button>
                    ))}
                    {slots.length === 0 && <p className="col-span-4 text-slate-400 text-sm py-4 text-center">No slots available for this date. Try another date.</p>}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <button onClick={() => setStep(3)} disabled={!selectedSlot}
                className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Confirm */}
        {step === 3 && selectedDoctor && selectedSlot && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-6">Confirm Appointment</h2>
            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <h3 className="font-medium text-slate-900 mb-4">Appointment Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Doctor</span><span className="font-medium">Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Specialty</span><span>{selectedDoctor.specialty}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Date</span><span className="font-medium">{dayjs(selectedSlot.startTime).format('MMM D, YYYY')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Time</span><span className="font-medium">{dayjs(selectedSlot.startTime).format('h:mm A')} – {dayjs(selectedSlot.endTime).format('h:mm A')}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Fee</span><span className="font-bold text-slate-900">₹{selectedDoctor.consultFee}</span></div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
              <label className="text-sm font-medium text-slate-700 block mb-2">Reason for visit <span className="text-red-500">*</span></label>
              <textarea value={reason} onChange={e => setReason(e.target.value)}
                placeholder="Describe your symptoms or reason for the visit..."
                rows={4} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <button onClick={handleBook} disabled={loading || !reason}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
              {loading ? 'Booking...' : '✅ Confirm Appointment'}
            </button>
          </div>
        )}
      </main>
    </div>
  )
}