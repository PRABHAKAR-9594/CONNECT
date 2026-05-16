'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { LayoutDashboard, Users, UserPlus, UserCheck, MessageSquare, Settings, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import type { Profile } from '@/types/app'

interface SidebarProps {
  profile: Profile | null
  initialRequestsCount: number
}

export function Sidebar({ profile, initialRequestsCount }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [requestsCount, setRequestsCount] = useState(initialRequestsCount)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!profile) return

    // Real-time subscription for incoming connection requests count
    const channel = supabase
      .channel(`sidebar_requests:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `receiver_id=eq.${profile.id}`,
        },
        async () => {
          const { count } = await supabase
            .from('connection_requests')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', profile.id)
            .eq('status', 'pending')
          
          if (count !== null) {
            setRequestsCount(count)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile])

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

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Discover', href: '/people', icon: Users },
    { name: 'Requests', href: '/requests', icon: UserPlus, badge: requestsCount },
    { name: 'Connections', href: '/connections', icon: UserCheck },
    { name: 'Messages', href: '/chat', icon: MessageSquare },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/80 border-r border-slate-800 backdrop-blur-md h-screen sticky top-0 shrink-0 z-40">
        {/* Brand */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-brand-500/30 shrink-0">
            <span className="font-bold text-white text-lg tracking-wider">C</span>
          </div>
          <span className="font-bold text-xl text-slate-50 tracking-tight truncate">ConnectApp</span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{item.name}</span>
                </div>
                {item.badge ? (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                    isActive ? 'bg-white text-brand-600' : 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>

        {/* User Profile & Signout */}
        {profile ? (
          <div className="p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar src={profile.avatar_url} name={profile.full_name} size={36} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-200 truncate">{profile.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{profile.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        ) : null}
      </aside>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xl z-50 px-1 pt-2 pb-4 sm:pb-2 flex items-center justify-around shadow-lg shadow-black/50">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center py-1 px-2 rounded-xl relative transition-all duration-200 ${
                isActive ? 'text-brand-400 scale-105 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : ''}`} />
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[56px] text-center">{item.name}</span>
              {item.badge ? (
                <span className="absolute -top-1 right-1 px-1.5 py-0.5 bg-brand-500 text-white rounded-full text-[9px] font-bold shadow-sm">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          )
        })}
      </div>
    </>
  )
}
