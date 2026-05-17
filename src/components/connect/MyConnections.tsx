'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import toast from 'react-hot-toast'
import { orderPair } from '@/lib/utils'
import type { Connection, Profile } from '@/types/app'
import { UserCheck, MessageSquare, UserMinus } from 'lucide-react'

type ConnectionWithProfiles = Connection & {
  profile_a?: Profile
  profile_b?: Profile
}

interface MyConnectionsProps {
  initialConnections: ConnectionWithProfiles[]
  currentUserId: string
}

export function MyConnections({ initialConnections, currentUserId }: MyConnectionsProps) {
  const [connections, setConnections] = useState(initialConnections)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmingRemove, setConfirmingRemove] = useState<{ id: string; name: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    setConnections(initialConnections)
  }, [initialConnections])

  useEffect(() => {
    const channel = supabase
      .channel(`connections_realtime:${currentUserId}`)
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
  }, [currentUserId, router])

  async function handleMessage(targetUserId: string, connId: string) {
    try {
      setLoadingId(connId)

      // Check if conversation exists
      const [participant_a, participant_b] = orderPair(currentUserId, targetUserId)
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

      // Create new conversation
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
      setLoadingId(null)
    }
  }

  function initiateRemove(connId: string, name: string) {
    setConfirmingRemove({ id: connId, name })
  }

  async function handleRemoveConfirm() {
    if (!confirmingRemove) return
    const { id: connId, name } = confirmingRemove
    try {
      setLoadingId(connId)
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connId)

      if (error) throw error

      setConnections(prev => prev.filter(c => c.id !== connId))
      toast.success(`Removed ${name} from connections.`)
      setConfirmingRemove(null)
    } catch (err: any) {
      console.error('[remove]', err)
      toast.error('Failed to remove connection.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">My Connections</h1>
        <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
          View your professional network. Start a direct message to collaborate, or manage your existing connections.
        </p>
      </div>

      {connections.length === 0 ? (
        <EmptyState
          icon={<UserCheck className="h-8 w-8" />}
          title="No connections yet"
          description="You haven't established any connections yet. Go to the Discover page to find professionals in your industry."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connections.map((conn) => {
            const profile = conn.user_a === currentUserId ? conn.profile_b : conn.profile_a
            if (!profile) return null

            const isLoading = loadingId === conn.id

            return (
              <div key={conn.id} className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-sm shadow-xl hover:border-slate-700/80 transition-all group">
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
                    onClick={() => handleMessage(profile.id, conn.id)}
                    loading={isLoading}
                    className="bg-brand-600 text-white hover:bg-brand-500 px-3 py-2 shadow-lg shadow-brand-600/20"
                    title="Send Message"
                  >
                    <MessageSquare className="h-4 w-4 mr-1" /> Message
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => initiateRemove(conn.id, profile.full_name)}
                    disabled={isLoading}
                    className="bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-slate-700 px-3 py-2 shadow-lg"
                    title="Remove Connection"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmingRemove}
        title="Remove Connection"
        description={`Are you sure you want to remove ${confirmingRemove?.name} from your connections? This action cannot be undone.`}
        confirmText="Remove"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setConfirmingRemove(null)}
        loading={loadingId === confirmingRemove?.id}
        variant="danger"
      />
    </div>
  )
}
