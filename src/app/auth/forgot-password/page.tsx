'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { getAuthErrorMessage } from '@/lib/errors'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email address.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })

      if (error) throw error

      setSuccess(true)
      toast.success('Reset link sent!')
    } catch (err: any) {
      console.error('[forgot-password]', err)
      toast.error(getAuthErrorMessage(err.code) || 'Failed to send reset link.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md animate-fade-in text-center z-10 relative">
          <h3 className="text-xl font-semibold text-slate-50 mb-2">Check your email</h3>
          <p className="text-slate-400 mb-6">
            If an account exists for {email}, you will receive a password reset link shortly.
          </p>
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Return to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-800 w-full max-w-md animate-fade-in z-10 relative">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-50">Reset Password</h1>
          <p className="text-slate-400 mt-2">Enter your email to receive a reset link.</p>
        </div>

        <form onSubmit={handleReset} className="flex flex-col gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button type="submit" className="w-full mt-2" loading={loading}>
            Send Reset Link
          </Button>

          <p className="text-center text-sm text-slate-400 mt-4">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
