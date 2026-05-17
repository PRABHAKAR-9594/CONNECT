'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types/app'

interface HeaderProps {
  profile: Profile | null
}

export function Header({ profile }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  // Hide mobile header on active chat pages for an immersive chat experience
  if (pathname.startsWith('/chat/') && pathname !== '/chat') {
    return null
  }

  async function handleSignOut() {
    try {
      setLoggingOut(true)
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (err) {
      toast.error('Failed to sign out.')
      setLoggingOut(false)
    }
  }

  return (
    <header className="md:hidden sticky top-0 z-40 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg shadow-black/20 shrink-0">
      {/* Brand */}
      <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/30 shrink-0">
          <span className="font-bold text-white text-base tracking-wider">C</span>
        </div>
        <span className="font-bold text-lg text-slate-50 tracking-tight truncate">Connect</span>
      </Link>

      {/* User Profile & Sign Out */}
      {profile ? (
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <Link href="/settings" className="flex items-center gap-2 min-w-0 group">
            <Avatar src={profile.avatar_url} name={profile.full_name} size={32} />
            <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-brand-400 transition-colors max-w-[90px] sm:max-w-[150px]">
              {profile.full_name?.split(' ')[0]}
            </span>
          </Link>
          <button
            onClick={handleSignOut}
            disabled={loggingOut}
            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
            title="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </header>
  )
}
