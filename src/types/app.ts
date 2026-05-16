export interface Profile {
  id: string
  email: string
  full_name: string
  username: string | null
  bio: string | null
  avatar_url: string | null
  created_at: string
}

export type ConnectionStatus = 'none' | 'pending_sent' | 'pending_received' | 'connected'

export interface ConnectionRequest {
  id: string
  sender_id: string
  receiver_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  sender?: Profile
  receiver?: Profile
}

export interface Connection {
  id: string
  user_a: string
  user_b: string
  connected_at: string
  other_user?: Profile
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  body: string | null
  file_url: string | null
  file_type: 'image' | 'document' | null
  file_name: string | null
  is_deleted: boolean
  edited_at: string | null
  created_at: string
  sender?: Profile
}

export interface Conversation {
  id: string
  participant_a: string
  participant_b: string
  last_message_at: string
  created_at: string
  other_participant?: Profile
  last_message?: Message
  unread_count?: number
}
