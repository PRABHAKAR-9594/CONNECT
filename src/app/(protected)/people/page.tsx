import { createClient } from '@/lib/supabase/server'
import { PeopleDiscovery } from '@/components/connect/PeopleDiscovery'
import type { Profile, ConnectionRequest, Connection } from '@/types/app'

export default async function PeoplePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch all profiles except current user
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .neq('id', user!.id)
    .order('full_name')

  // Fetch current user's connection requests
  const { data: requests } = await supabase
    .from('connection_requests')
    .select('*')
    .or(`sender_id.eq.${user!.id},receiver_id.eq.${user!.id}`)

  // Fetch current user's connections
  const { data: connections } = await supabase
    .from('connections')
    .select('*')
    .or(`user_a.eq.${user!.id},user_b.eq.${user!.id}`)

  return (
    <PeopleDiscovery
      profiles={(profiles as Profile[]) ?? []}
      currentUserId={user!.id}
      requests={(requests as ConnectionRequest[]) ?? []}
      connections={(connections as Connection[]) ?? []}
    />
  )
}
