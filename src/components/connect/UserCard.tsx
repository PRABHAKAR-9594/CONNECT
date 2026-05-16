'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { orderPair } from '@/lib/utils'
import type { Profile, ConnectionStatus } from '@/types/app'
import { UserCheck, UserPlus, Clock, Check, X } from 'lucide-react'

interface UserCardProps {
  profile: Profile
  currentUserId: string
  initialStatus: ConnectionStatus
  requestId?: string
}

export function UserCard({ profile, currentUserId, initialStatus, requestId }: UserCardProps) {
  const [status, setStatus] = useState<ConnectionStatus>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [showRespond, setShowRespond] = useState(false)
  const [reqId, setReqId] = useState<string | undefined>(requestId)

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
      console.log('[connect]', err)
      toast.error('Failed to send connection request.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAccept() {
    if (!reqId) return
    try {
      setLoading(true)
      // Update request status
      const { error: reqErr } = await supabase
        .from('connection_requests')
        .update({ status: 'accepted' })
        .eq('id', reqId)

      if (reqErr) throw reqErr

      // Insert connection
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

  return (
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm shadow-xl hover:border-slate-700/80 transition-all group">
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

      <div className="w-full sm:w-auto flex items-center justify-end gap-2 pt-3 sm:pt-0 border-t border-slate-800/60 sm:border-t-0 shrink-0">
        {status === 'none' ? (
          <Button
            size="sm"
            onClick={handleConnect}
            loading={loading}
            className="bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/20"
          >
            <UserPlus className="h-4 w-4" /> Connect
          </Button>
        ) : status === 'pending_sent' ? (
          <Button
            size="sm"
            variant="secondary"
            disabled
            className="bg-slate-800 text-slate-400 border border-slate-700"
          >
            <Clock className="h-4 w-4" /> Pending
          </Button>
        ) : status === 'pending_received' ? (
          showRespond ? (
            <div className="flex items-center gap-1 animate-fade-in">
              <Button
                size="sm"
                onClick={handleAccept}
                loading={loading}
                className="bg-emerald-600 text-white hover:bg-emerald-500 px-2 py-1.5 shadow-lg shadow-emerald-600/20"
                title="Accept"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDecline}
                loading={loading}
                className="bg-red-600 text-white hover:bg-red-500 px-2 py-1.5 shadow-lg shadow-red-600/20"
                title="Decline"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => setShowRespond(true)}
              className="bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-600/20"
            >
              Respond
            </Button>
          )
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled
            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          >
            <UserCheck className="h-4 w-4" /> Connected
          </Button>
        )}
      </div>
    </div>
  )
}
