'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { orderPair } from '@/lib/utils'
import type { Profile, ConnectionStatus } from '@/types/app'
import { UserCheck, UserPlus, Clock, MessageSquare, Check, X } from 'lucide-react'

interface ProfileViewProps {
  profile: Profile
  currentUserId: string
  initialStatus: ConnectionStatus
  requestId?: string
}

export function ProfileView({ profile, currentUserId, initialStatus, requestId }: ProfileViewProps) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [showRespond, setShowRespond] = useState(false)
  const [reqId, setReqId] = useState<string | undefined>(requestId)
  const router = useRouter()

  useEffect(() => {
    setStatus(initialStatus)
    setReqId(requestId)
  }, [initialStatus, requestId])

  useEffect(() => {
    const channel = supabase
      .channel(`profileview_realtime:${profile.id}`)
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections', filter: `user_a=eq.${currentUserId}` },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'connections', filter: `user_b=eq.${currentUserId}` },
        () => { router.refresh() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, profile.id, router])

  const isMe = profile.id === currentUserId

  async function handleConnect() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('connection_requests')
        .upsert(
          { sender_id: currentUserId, receiver_id: profile.id, status: 'pending' },
          { onConflict: 'sender_id,receiver_id' }
        )
        .select('id')
        .single()

      if (error) throw error

      setStatus('pending_sent')
      setReqId(data.id)
      toast.success(`Connection request sent to ${profile.full_name}!`)
    } catch (err: any) {
      console.error('[connect]', err)
      toast.error('Failed to send connection request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!reqId) return
    try {
      setLoading(true)
      const { error: reqErr } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', reqId)

      if (reqErr) throw reqErr

      const [user_a, user_b] = orderPair(currentUserId, profile.id)
      const { error: connErr } = await supabase
        .from('connections')
        .insert({ user_a, user_b })

      if (connErr) throw connErr

      setStatus('connected')
      setShowRespond(false)
      toast.success(`You are now connected with ${profile.full_name}!`)
    } catch (err: any) {
      console.error('[accept]', err)
      toast.error('Failed to accept connection request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDecline() {
    if (!reqId) return
    try {
      setLoading(true)
      const { error } = await supabase
        .from('connection_requests')
        .delete()
        .eq('id', reqId)

      if (error) throw error

      setStatus('none')
      setShowRespond(false)
      toast.success(`Declined request from ${profile.full_name}.`)
    } catch (err: any) {
      console.error('[decline]', err)
      toast.error('Failed to decline connection request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleMessage() {
    try {
      setLoading(true)
      const [participant_a, participant_b] = orderPair(currentUserId, profile.id)
      const { data: existing, error: fetchErr } = await supabase
        .from('conversations')
        .select('id')
        .eq('participant_a', participant_a)
        .eq('participant_b', participant_b)
        .maybeSingle()

      if (fetchErr) throw fetchErr

      if (existing) {
        router.push(`/chat/${existing.id}`)
        return
      }

      const { data: newConv, error: createErr } = await supabase
        .from('conversations')
        .insert({ participant_a, participant_b })
        .select('id')
        .single()

      if (createErr) throw createErr

      router.push(`/chat/${newConv.id}`)
    } catch (err: any) {
      console.error('[message]', err)
      toast.error('Failed to start conversation.')
      setLoading(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
          <Avatar src={profile.avatar_url} name={profile.full_name} size={112} />
          
          <div className="space-y-4 flex-1 text-center md:text-left">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">{profile.full_name}</h1>
              {profile.username ? (
                <p className="text-slate-400 text-sm mt-0.5">@{profile.username}</p>
              ) : null}
            </div>

            {profile.bio ? (
              <p className="text-slate-300 text-base leading-relaxed max-w-2xl">{profile.bio}</p>
            ) : (
              <p className="text-slate-500 text-sm italic">No bio provided.</p>
            )}

            <div className="text-xs text-slate-500 pt-2">
              Joined {format(new Date(profile.created_at), 'MMMM yyyy')}
            </div>

            {!isMe && (
              <div className="pt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                {status === 'none' ? (
                  <Button
                    onClick={handleConnect}
                    loading={loading}
                    className="bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/20"
                  >
                    <UserPlus className="h-4 w-4 mr-2" /> Connect
                  </Button>
                ) : status === 'pending_sent' ? (
                  <Button
                    variant="secondary"
                    disabled
                    className="bg-slate-800 text-slate-400 border border-slate-700"
                  >
                    <Clock className="h-4 w-4 mr-2" /> Request Pending
                  </Button>
                ) : status === 'pending_received' ? (
                  showRespond ? (
                    <div className="flex items-center gap-2 animate-fade-in">
                      <Button
                        onClick={handleAccept}
                        loading={loading}
                        className="bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20"
                      >
                        <Check className="h-4 w-4 mr-1" /> Accept
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleDecline}
                        loading={loading}
                        className="bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20"
                      >
                        <X className="h-4 w-4 mr-1" /> Decline
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowRespond(true)}
                      className="bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20"
                    >
                      Respond to Request
                    </Button>
                  )
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      disabled
                      className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    >
                      <UserCheck className="h-4 w-4 mr-2" /> Connected
                    </Button>
                    <Button
                      onClick={handleMessage}
                      loading={loading}
                      className="bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/20"
                    >
                      <MessageSquare className="h-4 w-4 mr-2" /> Send Message
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
