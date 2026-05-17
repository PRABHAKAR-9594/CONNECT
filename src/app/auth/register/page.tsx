import { RegisterForm } from '@/components/auth/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute top-1/4 -right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md animate-fade-in z-10 relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50">Join Connect</h1>
          <p className="text-slate-400 mt-2">Create your account to connect with others.</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  )
}
