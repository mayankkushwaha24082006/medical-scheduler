import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center max-w-2xl">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          🏥 AI-Powered Healthcare
        </div>
        <h1 className="text-5xl font-bold text-slate-900 mb-4 leading-tight">
          Medical Appointments,<br />
          <span className="text-blue-600">Made Simple</span>
        </h1>
        <p className="text-slate-600 text-lg mb-8">
          Smart scheduling with automated reminders, AI doctor recommendations, and real-time availability.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/auth/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
            Sign In
          </Link>
          <Link href="/auth/register"
            className="bg-white text-slate-700 px-6 py-3 rounded-xl font-medium border border-slate-200 hover:bg-slate-50 transition-colors">
            Create Account
          </Link>
        </div>
      </div>
    </main>
  )
}