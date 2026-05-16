import type { ConnectionRequest, Connection, ConnectionStatus } from '@/types/app'

export function getConnectionStatus(
  currentUserId: string,
  targetUserId: string,
  requests: ConnectionRequest[],
  connections: Connection[]
): ConnectionStatus {
  // Check if connected
  const isConnected = connections.some(
    c =>
      (c.user_a === currentUserId && c.user_b === targetUserId) ||
      (c.user_a === targetUserId && c.user_b === currentUserId)
  )
  if (isConnected) return 'connected'

  // Check outgoing request
  const sentRequest = requests.find(
    r => r.sender_id === currentUserId && r.receiver_id === targetUserId && r.status === 'pending'
  )
  if (sentRequest) return 'pending_sent'

  // Check incoming request
  const receivedRequest = requests.find(
    r => r.receiver_id === currentUserId && r.sender_id === targetUserId && r.status === 'pending'
  )
  if (receivedRequest) return 'pending_received'

  return 'none'
}
