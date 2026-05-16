import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ProfileView } from '@/components/profile/ProfileView'
import { getConnectionStatus } from '@/lib/connectionStatus'
import { orderPair } from '@/lib/utils'
import type { Profile, ConnectionRequest, Connection } from '@/types/app'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  if (!profile) {
    redirect('/dashboard')
  }

  // Fetch requests & connections
  const { data: reqSent } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('sender_id', user!.id)
    .eq('receiver_id', profile.id)

  const { data: reqRecv } = await supabase
    .from('connection_requests')
    .select('*')
    .eq('sender_id', profile.id)
    .eq('receiver_id', user!.id)

  const requests = [...(reqSent ?? []), ...(reqRecv ?? [])]

  const [user_a, user_b] = orderPair(user!.id, profile.id)
  const { data: connections } = await supabase
    .from('connections')
    .select('*')
    .eq('user_a', user_a)
    .eq('user_b', user_b)

  const status = getConnectionStatus(user!.id, profile.id, (requests as ConnectionRequest[]) ?? [], (connections as Connection[]) ?? [])
  const req = (requests as ConnectionRequest[])?.find(r => r.status === 'pending')

  return (
    <ProfileView
      profile={profile as Profile}
      currentUserId={user!.id}
      initialStatus={status}
      requestId={req?.id}
    />
  )
}
