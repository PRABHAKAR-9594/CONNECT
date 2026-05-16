'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import toast from 'react-hot-toast'
import { orderPair } from '@/lib/utils'
import type { ConnectionRequest } from '@/types/app'
import { UserPlus, UserCheck, Check, X, Trash2 } from 'lucide-react'

interface ConnectionRequestsProps {
  initialIncoming: ConnectionRequest[]
  initialOutgoing: ConnectionRequest[]
  currentUserId: string
}

export function ConnectionRequests({ initialIncoming, initialOutgoing, currentUserId }: ConnectionRequestsProps) {
  const [incoming, setIncoming] = useState(initialIncoming)
  const [outgoing, setOutgoing] = useState(initialOutgoing)
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    setIncoming(initialIncoming)
    setOutgoing(initialOutgoing)
  }, [initialIncoming, initialOutgoing])

  useEffect(() => {
    const channel = supabase
      .channel(`requests_realtime:${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connection_requests', filter: `receiver_id=eq.${currentUserId}` },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connection_requests', filter: `sender_id=eq.${currentUserId}` },
        () => { router.refresh() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, router])

  async function handleAccept(req: ConnectionRequest) {
    try {
      setLoadingId(req.id)
      const { error: reqErr } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', req.id)

      if (reqErr) throw reqErr

      const [user_a, user_b] = orderPair(req.sender_id, req.receiver_id)
      const { error: connErr } = await supabase
        .from('connections')
        .insert({ user_a, user_b })

      if (connErr) throw connErr

      setIncoming(prev => prev.filter(r => r.id !== req.id))
      toast.success(`Connected with ${req.sender?.full_name}!`)
    } catch (err: any) {
      console.error('[accept]', err)
      toast.error('Failed to accept request.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleDecline(reqId: string) {
    try {
      setLoadingId(reqId)
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', reqId)

      if (error) throw error

      setIncoming(prev => prev.filter(r => r.id !== reqId))
      toast.success('Request declined.')
    } catch (err: any) {
      console.error('[decline]', err)
      toast.error('Failed to decline request.')
    } finally {
      setLoadingId(null)
    }
  }

  async function handleCancel(reqId: string) {
    try {
      setLoadingId(reqId)
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', reqId)

      if (error) throw error

      setOutgoing(prev => prev.filter(r => r.id !== reqId))
      toast.success('Connection request cancelled.')
    } catch (err: any) {
      console.error('[cancel]', err)
      toast.error('Failed to cancel request.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Connection Requests</h1>
        <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
          Manage your incoming invitations and review pending connection requests you've sent to others.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('incoming')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'incoming'
              ? 'border-brand-500 text-brand-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Incoming
          {incoming.length > 0 ? (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'incoming' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {incoming.length}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('outgoing')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 font-medium text-sm transition-all ${
            activeTab === 'outgoing'
              ? 'border-brand-500 text-brand-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Outgoing
          {outgoing.length > 0 ? (
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === 'outgoing' ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-slate-800 text-slate-400'
            }`}>
              {outgoing.length}
            </span>
          ) : null}
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'incoming' ? (
        incoming.length === 0 ? (
          <EmptyState
            icon={<UserCheck className="h-8 w-8" />}
            title="No incoming requests"
            description="You don't have any pending connection invitations right now."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incoming.map((req) => {
              const profile = req.sender
              if (!profile) return null

              const isLoading = loadingId === req.id

              return (
                <div key={req.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm shadow-xl hover:border-slate-700/80 transition-all group">
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    <Avatar src={profile.avatar_url} name={profile.full_name} size={48} />
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <p className="text-base font-semibold text-slate-100 truncate group-hover:text-brand-400 transition-colors">
                        {profile.full_name}
                      </p>
                      {profile.username ? (
                        <p className="text-xs text-slate-400 truncate">@{profile.username}</p>
                      ) : null}
                      {profile.bio ? (
                        <p className="text-xs text-slate-300 line-clamp-2 pt-1">{profile.bio}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex items-center justify-end gap-1 pt-3 sm:pt-0 border-t border-slate-800/60 sm:border-t-0 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(req)}
                      loading={isLoading}
                      className="bg-emerald-600 text-white hover:bg-emerald-500 px-3 py-2 shadow-lg shadow-emerald-600/20"
                      title="Accept"
                    >
                      <Check className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDecline(req.id)}
                      loading={isLoading}
                      className="bg-red-600 text-white hover:bg-red-500 px-3 py-2 shadow-lg shadow-red-600/20"
                      title="Decline"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        outgoing.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="h-8 w-8" />}
            title="No outgoing requests"
            description="You haven't sent any pending connection requests."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {outgoing.map((req) => {
              const profile = req.receiver
              if (!profile) return null

              const isLoading = loadingId === req.id

              return (
                <div key={req.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm shadow-xl hover:border-slate-700/80 transition-all group">
                  <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                    <Avatar src={profile.avatar_url} name={profile.full_name} size={48} />
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <p className="text-base font-semibold text-slate-100 truncate group-hover:text-brand-400 transition-colors">
                        {profile.full_name}
                      </p>
                      {profile.username ? (
                        <p className="text-xs text-slate-400 truncate">@{profile.username}</p>
                      ) : null}
                      {profile.bio ? (
                        <p className="text-xs text-slate-300 line-clamp-2 pt-1">{profile.bio}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="w-full sm:w-auto flex items-center justify-end gap-1 pt-3 sm:pt-0 border-t border-slate-800/60 sm:border-t-0 shrink-0">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleCancel(req.id)}
                      loading={isLoading}
                      className="bg-slate-800 text-red-400 hover:bg-red-500 hover:text-white border border-slate-700 px-3 py-2 shadow-lg"
                      title="Cancel Request"
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
