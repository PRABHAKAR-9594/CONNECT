import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ChatWindow } from '@/components/chat/ChatWindow'
import type { Conversation, Message } from '@/types/app'

export default async function ChatWindowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch conversation details
  const { data: conversation } = await supabase
    .from('conversations')
    .select('*, profile_a:profiles!participant_a(*), profile_b:profiles!participant_b(*)')
    .eq('id', id)
    .single()

  if (!conversation) {
    redirect('/chat')
  }

  // Verify participant
  if (conversation.participant_a !== user!.id && conversation.participant_b !== user!.id) {
    redirect('/chat')
  }

  // Fetch initial 50 messages
  const { data: messages } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', id)
    .order('created_at', { ascending: true })
    .limit(50)

  return (
    <ChatWindow
      conversation={conversation as any}
      initialMessages={(messages as Message[]) ?? []}
      currentUserId={user!.id}
    />
  )
}
