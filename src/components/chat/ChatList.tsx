'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDistanceToNow } from 'date-fns'
import type { Conversation, Profile, Message } from '@/types/app'
import { MessageSquare } from 'lucide-react'

type ConversationWithDetails = Conversation & {
  profile_a?: Profile
  profile_b?: Profile
  messages?: Message[]
}

interface ChatListProps {
  conversations: ConversationWithDetails[]
  currentUserId: string
}

export function ChatList({ conversations, currentUserId }: ChatListProps) {
  const router = useRouter()

  useEffect(() => {
    const channel = supabase
      .channel(`chatlist_realtime:${currentUserId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `participant_a=eq.${currentUserId}` },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `participant_b=eq.${currentUserId}` },
        () => { router.refresh() }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => { router.refresh() }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, router])

  if (conversations.length === 0) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto w-full animate-fade-in">
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title="No conversations yet"
          description="You haven't started any chats yet. Go to the Discover or Connections page to connect with someone and start chatting."
        />
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Messages</h1>
        <p className="text-slate-400 text-base">
          Connect and collaborate through real-time messaging with your professional network.
        </p>
      </div>

      <div className="space-y-3">
        {conversations.map((conv) => {
          const otherProfile = conv.participant_a === currentUserId ? conv.profile_b : conv.profile_a
          if (!otherProfile) return null

          const lastMessage = conv.messages?.[0]

          return (
            <Link
              key={conv.id}
              href={`/chat/${conv.id}`}
              className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 backdrop-blur-sm shadow-xl hover:border-slate-700/80 hover:bg-slate-800/30 transition-all group block"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <Avatar src={otherProfile.avatar_url} name={otherProfile.full_name} size={48} />
                <div className="min-w-0 space-y-1 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-base font-semibold text-slate-100 truncate group-hover:text-brand-400 transition-colors">
                      {otherProfile.full_name}
                    </p>
                    {lastMessage ? (
                      <span className="text-xs text-slate-500 shrink-0">
                        {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                      </span>
                    ) : null}
                  </div>
                  {lastMessage ? (
                    <p className="text-xs text-slate-400 truncate">
                      {lastMessage.is_deleted ? (
                        <span className="italic text-slate-500">This message was deleted</span>
                      ) : lastMessage.body ? (
                        lastMessage.body
                      ) : lastMessage.file_name ? (
                        <span className="text-slate-400">📎 {lastMessage.file_name}</span>
                      ) : (
                        'Attachment'
                      )}
                    </p>
                  ) : (
                    <p className="text-xs italic text-slate-600">No messages yet. Start the conversation!</p>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
