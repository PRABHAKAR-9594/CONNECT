'use client'

import { Button } from '@/components/ui/Button'
import { AlertTriangle, Info } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  variant?: 'danger' | 'primary'
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null

  const isDanger = variant === 'danger'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6 animate-scale-up relative z-10 overflow-hidden">
        {/* Ambient glow */}
        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] pointer-events-none ${
          isDanger ? 'bg-red-600/20' : 'bg-brand-600/20'
        }`} />

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-2xl shrink-0 border ${
            isDanger ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-brand-500/10 text-brand-400 border-brand-500/20'
          }`}>
            {isDanger ? <AlertTriangle className="h-6 w-6" /> : <Info className="h-6 w-6" />}
          </div>
          <div className="space-y-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-100 tracking-tight">{title}</h3>
            <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
