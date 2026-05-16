import { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-slate-900/20 border border-slate-800/50 rounded-2xl backdrop-blur-sm my-6 w-full max-w-md mx-auto animate-fade-in">
      <div className="mb-4 text-slate-400 p-4 bg-slate-800/50 rounded-full border border-slate-700/50 shadow-inner">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-slate-100 mb-2">{title}</h3>
      <p className="text-sm text-slate-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action}
    </div>
  )
}
