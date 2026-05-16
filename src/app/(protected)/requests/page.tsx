import { createClient } from '@/lib/supabase/server'
import { ConnectionRequests } from '@/components/connect/ConnectionRequests'
import type { ConnectionRequest } from '@/types/app'

export default async function RequestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch incoming requests joined with sender profile
  const { data: incoming } = await supabase
    .from('connection_requests')
    .select('*, sender:profiles!sender_id(*)')
    .eq('receiver_id', user!.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Fetch outgoing requests joined with receiver profile
  const { data: outgoing } = await supabase
    .from('connection_requests')
    .select('*, receiver:profiles!receiver_id(*)')
    .eq('sender_id', user!.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  return (
    <ConnectionRequests
      initialIncoming={(incoming as ConnectionRequest[]) ?? []}
      initialOutgoing={(outgoing as ConnectionRequest[]) ?? []}
      currentUserId={user!.id}
    />
  )
}
