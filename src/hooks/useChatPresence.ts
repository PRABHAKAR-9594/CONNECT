import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useChatPresence(conversationId: string, currentUserId: string) {
  const [isOtherTyping, setIsOtherTyping] = useState(false)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!conversationId || !currentUserId) return

    const channel = supabase.channel(`presence:${conversationId}`)
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const otherTyping = Object.values(state)
          .flat()
          .some((p: any) => p.user_id !== currentUserId && p.is_typing)
        setIsOtherTyping(otherTyping)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, is_typing: false })
        }
      })

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [conversationId, currentUserId])

  const broadcastTyping = useCallback(async () => {
    if (!channelRef.current) return

    try {
      await channelRef.current.track({ user_id: currentUserId, is_typing: true })

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(async () => {
        if (channelRef.current) {
          await channelRef.current.track({ user_id: currentUserId, is_typing: false })
        }
      }, 2000)
    } catch (err) {
      console.error('[presence track]', err)
    }
  }, [currentUserId])

  return { isOtherTyping, broadcastTyping }
}
