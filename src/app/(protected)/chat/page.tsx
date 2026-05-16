import { createClient } from '@/lib/supabase/server'
import { ChatList } from '@/components/chat/ChatList'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*, profile_a:profiles!participant_a(*), profile_b:profiles!participant_b(*), messages(*)')
    .or(`participant_a.eq.${user!.id},participant_b.eq.${user!.id}`)
    .order('last_message_at', { ascending: false })
    .order('created_at', { ascending: false, referencedTable: 'messages' })
    .limit(1, { referencedTable: 'messages' })

  return <ChatList conversations={conversations ?? []} currentUserId={user!.id} />
}
