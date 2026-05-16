import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Users, UserPlus, UserCheck, MessageSquare, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user!.id)
    .single()

  // Fetch counts
  const { count: connectionsCount } = await supabase
    .from('connections')
    .select('*', { count: 'exact', head: true })
    .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)

  const { count: pendingCount } = await supabase
    .from('connection_requests')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user!.id)
    .eq('status', 'pending')

  const { count: conversationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .or(`participant_a.eq.${user!.id},participant_b.eq.${user!.id}`)

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Welcome back,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-indigo-400 font-black">
              {profile?.full_name?.split(' ')[0] || 'User'}! 👋
            </span>
          </h1>
          <p className="text-slate-400 text-base max-w-xl leading-relaxed">
            Here's an overview of your professional network. Discover new people, manage your connection requests, and jump into your latest conversations.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 shrink-0 pt-4 md:pt-0">
          <Link href="/people">
            <Button size="lg" className="animate-glow text-white shadow-lg shadow-brand-500/20">
              Discover People <ArrowRight className="h-5 w-5 ml-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Connections Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm flex items-center justify-between shadow-xl hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-400">Total Connections</p>
            <p className="text-3xl font-bold text-white">{connectionsCount ?? 0}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
            <UserCheck className="h-7 w-7" />
          </div>
        </div>

        {/* Pending Requests Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm flex items-center justify-between shadow-xl hover:border-slate-700 transition-all">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-400">Pending Requests</p>
            <p className="text-3xl font-bold text-white">{pendingCount ?? 0}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <UserPlus className="h-7 w-7" />
          </div>
        </div>

        {/* Conversations Card */}
        <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-2xl backdrop-blur-sm flex items-center justify-between shadow-xl hover:border-slate-700 transition-all sm:col-span-2 lg:col-span-1">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-400">Active Chats</p>
            <p className="text-3xl font-bold text-white">{conversationsCount ?? 0}</p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
            <MessageSquare className="h-7 w-7" />
          </div>
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/30 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6 shadow-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/5 rounded-full blur-2xl group-hover:bg-brand-500/10 transition-all pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
            <Users className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Expand Your Network</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Browse through professional profiles, discover peers in your industry, and send connection requests to start collaborating.
            </p>
          </div>
          <Link href="/people" className="inline-block">
            <Button variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 group-hover:border-slate-600 transition-all">
              Browse Profiles <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="bg-gradient-to-br from-slate-900/80 to-slate-900/30 border border-slate-800 p-6 sm:p-8 rounded-3xl backdrop-blur-md space-y-6 shadow-2xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all pointer-events-none" />
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner">
            <UserPlus className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">Review Pending Requests</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Check your incoming connection invitations. Accept requests to open up direct messaging and grow your trusted network.
            </p>
          </div>
          <Link href="/requests" className="inline-block">
            <Button variant="secondary" className="bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 group-hover:border-slate-600 transition-all">
              View Requests ({pendingCount ?? 0}) <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
