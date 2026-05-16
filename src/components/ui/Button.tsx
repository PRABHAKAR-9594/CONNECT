import { cn } from '@/lib/utils'
import { type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500 disabled:bg-brand-600/50 disabled:text-white/70 shadow-lg shadow-brand-600/20 disabled:shadow-none',
  secondary: 'bg-slate-800 text-slate-200 hover:bg-slate-700 disabled:bg-slate-800/50 disabled:text-slate-400 border border-slate-700/50 disabled:border-slate-800',
  ghost: 'text-slate-400 hover:text-white hover:bg-slate-800/50 disabled:text-slate-600 disabled:hover:bg-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-500 disabled:bg-red-600/50 disabled:text-white/70 shadow-lg shadow-red-600/20 disabled:shadow-none',
}
const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-xl',
  md: 'px-4 py-2.5 text-sm rounded-2xl',
  lg: 'px-6 py-3.5 text-base rounded-2xl',
}

export function Button({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:cursor-not-allowed active:scale-[0.98] disabled:active:scale-100',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" />}
      {children}
    </button>
  )
}
