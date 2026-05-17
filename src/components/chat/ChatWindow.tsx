'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { useChatPresence } from '@/hooks/useChatPresence'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import type { Message, Profile, Conversation } from '@/types/app'
import { ArrowLeft, Send, Paperclip, MoreVertical, Edit2, Trash2, Download, FileText } from 'lucide-react'

interface ChatWindowProps {
  conversation: Conversation & { profile_a?: Profile; profile_b?: Profile }
  initialMessages: Message[]
  currentUserId: string
}

export function ChatWindow({ conversation, initialMessages, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [body, setBody] = useState('')
  const [attaching, setAttaching] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [editingMessage, setEditingMessage] = useState<Message | null>(null)
  const [editBody, setEditBody] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const [deletingMsgId, setDeletingMsgId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const otherProfile = conversation.participant_a === currentUserId ? conversation.profile_b : conversation.profile_a

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Real-time subscriptions
  useRealtimeMessages(conversation.id, setMessages, scrollToBottom)
  const { isOtherTyping, broadcastTyping } = useChatPresence(conversation.id, currentUserId)

  useEffect(() => {
    scrollToBottom()
  }, [])

  async function handleSend() {
    if (!body.trim() && !attaching) return

    const messageText = body.trim()
    setBody('')
    setSending(true)

    try {
      const { data: newMsg, error } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        body: messageText || null,
      }).select().single()

      if (error) throw error

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg as Message]
      })
      router.refresh()

      // Update last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id)

      scrollToBottom()
    } catch (err: any) {
      console.error('[send]', err)
      toast.error('Failed to send message.')
    } finally {
      setSending(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size: image <= 10MB, doc <= 25MB
    const isImage = file.type.startsWith('image/')
    const maxSize = isImage ? 10 * 1024 * 1024 : 25 * 1024 * 1024

    if (file.size > maxSize) {
      toast.error(`File size exceeds limit (${isImage ? '10MB' : '25MB'}).`)
      return
    }

    try {
      setAttaching(true)
      setUploadProgress(10)

      const fileExt = file.name.split('.').pop()
      const filePath = `${conversation.id}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`

      const { error: uploadErr } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file, { upsert: true })

      setUploadProgress(60)
      if (uploadErr) throw uploadErr

      // Get signed URL (valid for 1 year)
      const { data: signedData, error: signErr } = await supabase.storage
        .from('chat-attachments')
        .createSignedUrl(filePath, 31536000)

      if (signErr) throw signErr
      setUploadProgress(90)

      // Insert message
      const { data: newMsg, error: msgErr } = await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        file_url: signedData.signedUrl,
        file_type: isImage ? 'image' : 'document',
        file_name: file.name,
      }).select().single()

      if (msgErr) throw msgErr

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev
        return [...prev, newMsg as Message]
      })
      router.refresh()

      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversation.id)

      toast.success('File attached successfully!')
      scrollToBottom()
    } catch (err: any) {
      console.error('[upload]', err)
      toast.error('Failed to upload attachment.')
    } finally {
      setAttaching(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleSaveEdit(msgId: string) {
    if (!editBody.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ body: editBody.trim(), edited_at: new Date().toISOString() })
        .eq('id', msgId)
        .eq('sender_id', currentUserId)

      if (error) throw error

      setEditingMessage(null)
      toast.success('Message updated.')
    } catch (err: any) {
      console.error('[edit]', err)
      toast.error('Failed to edit message.')
    }
  }

  function initiateDelete(msgId: string) {
    setDeletingMsgId(msgId)
    setActiveMenuId(null)
  }

  async function handleDeleteConfirm() {
    if (!deletingMsgId) return
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_deleted: true })
        .eq('id', deletingMsgId)
        .eq('sender_id', currentUserId)

      if (error) throw error

      toast.success('Message deleted.')
      setDeletingMsgId(null)
    } catch (err: any) {
      console.error('[delete]', err)
      toast.error('Failed to delete message.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (!otherProfile) return null

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] md:h-screen bg-slate-950 relative overflow-hidden animate-fade-in">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-slate-800 px-6 py-4 flex items-center justify-between backdrop-blur-md shrink-0 z-20 shadow-lg">
        <div className="flex items-center gap-4 min-w-0">
          <Link href="/chat" className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Avatar src={otherProfile.avatar_url} name={otherProfile.full_name} size={40} />
          <div className="min-w-0">
            <p className="text-base font-semibold text-white truncate">{otherProfile.full_name}</p>
            {otherProfile.username ? (
              <p className="text-xs text-slate-400 truncate">@{otherProfile.username}</p>
            ) : null}
          </div>
        </div>
      </header>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 relative z-10 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-sm italic">
            No messages here yet. Say hello! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId
            const isEditing = editingMessage?.id === msg.id

            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-end ${isMe ? 'flex-row-reverse' : 'flex-row'} group relative`}
              >
                {!isMe && (
                  <Avatar src={otherProfile.avatar_url} name={otherProfile.full_name} size={32} />
                )}

                <div className={`max-w-[80%] md:max-w-md lg:max-w-lg rounded-2xl p-4 shadow-xl relative overflow-hidden ${
                  msg.is_deleted
                    ? 'bg-slate-900/40 border border-slate-800 text-slate-500 italic'
                    : isMe
                    ? 'bg-brand-600 text-white shadow-brand-600/20'
                    : 'bg-slate-900 border border-slate-800/80 text-slate-100'
                }`}>
                  {msg.is_deleted ? (
                    <p className="text-xs">This message was deleted</p>
                  ) : isEditing ? (
                    <div className="space-y-2 animate-fade-in">
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl p-2 text-sm focus:outline-none focus:border-brand-500"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditingMessage(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => handleSaveEdit(msg.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {msg.file_url ? (
                        msg.file_type === 'image' ? (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-slate-700/50">
                            <Image src={msg.file_url} alt={msg.file_name || 'attachment'} width={300} height={200} className="object-cover hover:scale-105 transition-transform duration-300" />
                          </a>
                        ) : (
                          <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                            <FileText className="h-6 w-6 text-brand-400 shrink-0" />
                            <span className="text-xs font-medium truncate flex-1">{msg.file_name}</span>
                            <Download className="h-4 w-4 text-slate-400 shrink-0" />
                          </a>
                        )
                      ) : null}

                      {msg.body ? <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-hidden">{msg.body}</p> : null}

                      <div className={`flex items-center justify-end gap-1.5 text-[10px] pt-1 ${isMe ? 'text-brand-200' : 'text-slate-400'}`}>
                        {msg.edited_at ? <span className="italic">(edited)</span> : null}
                        <span>{format(new Date(msg.created_at), 'HH:mm')}</span>
                      </div>
                    </div>
                  )}

                  {/* Context Menu (Edit/Delete) */}
                  {isMe && !msg.is_deleted && !isEditing && (
                    <div className="absolute top-2 -left-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === msg.id ? null : msg.id)}
                        className="p-1 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg shadow-lg"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {activeMenuId === msg.id && (
                        <div className="absolute top-8 left-0 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl py-1 z-30 w-28 animate-fade-in">
                          <button
                            onClick={() => { setEditingMessage(msg); setEditBody(msg.body || ''); setActiveMenuId(null) }}
                            className="w-full px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-2"
                          >
                            <Edit2 className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => initiateDelete(msg.id)}
                            className="w-full px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {isOtherTyping && (
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse pl-4">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
            {otherProfile.full_name.split(' ')[0]} is typing...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Upload Progress */}
      {attaching && (
        <div className="px-6 py-2 bg-slate-900/60 border-t border-slate-800 flex items-center gap-4 backdrop-blur-sm z-20">
          <span className="text-xs text-slate-400 shrink-0">Uploading attachment...</span>
          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-3 sm:p-6 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-xl shrink-0 z-20 shadow-2xl relative">
        <div className="flex items-center gap-2 sm:gap-3 max-w-4xl mx-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*,.pdf,.docx,.xlsx,.txt,.zip"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={attaching}
            className="p-2.5 sm:p-3 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-800 hover:border-slate-700 transition-all shrink-0 shadow-md"
            title="Attach File"
          >
            <Paperclip className="h-5 w-5" />
          </button>

          <textarea
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              broadcastTyping()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="Write a message..."
            rows={1}
            className="flex-1 bg-slate-950/90 border border-slate-800/80 rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-base sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 max-h-32 resize-none shadow-inner leading-normal flex items-center"
          />

          <Button
            onClick={handleSend}
            disabled={!body.trim() && !attaching}
            loading={sending || attaching}
            className="bg-brand-600 text-white hover:bg-brand-500 p-2.5 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg shadow-brand-600/20 shrink-0"
            title="Send"
          >
            <Send className="h-5 w-5 shrink-0" />
          </Button>
        </div>
      </div>

      <ConfirmModal
        isOpen={!!deletingMsgId}
        title="Delete Message"
        description="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingMsgId(null)}
        loading={isDeleting}
        variant="danger"
      />
    </div>
  )
}
