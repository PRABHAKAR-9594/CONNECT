import { createClient } from '@/lib/supabase/server'
import { MyConnections } from '@/components/connect/MyConnections'

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch connections joined with both profiles
  const { data: connections } = await supabase
    .from('connections')
    .select('*, profile_a:profiles!user_a(*), profile_b:profiles!user_b(*)')
    .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)
    .order('connected_at', { ascending: false })

  return (
    <MyConnections
      initialConnections={connections ?? []}
      currentUserId={user!.id}
    />
  )
}
