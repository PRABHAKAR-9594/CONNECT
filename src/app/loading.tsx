import { Loader2 } from 'lucide-react'

export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none">
      {/* Background glowing ambient light */}
      <div className="absolute w-96 h-96 bg-brand-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Glassmorphic loading card */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 sm:p-12 flex flex-col items-center gap-6 shadow-2xl relative z-10 max-w-sm w-full text-center animate-fade-in">
        {/* Spinner container with outer glowing ring */}
        <div className="relative flex items-center justify-center p-4">
          <div className="absolute inset-0 rounded-full bg-brand-500/10 animate-ping" />
          <Loader2 className="h-12 w-12 text-brand-400 animate-spin relative z-10" />
        </div>

        {/* Text feedback */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-slate-100 tracking-tight">Loading ConnectApp</h3>
          <p className="text-xs text-slate-400 max-w-[200px] mx-auto leading-relaxed">
            Preparing your professional network experience...
          </p>
        </div>
      </div>
    </div>
  )
}
