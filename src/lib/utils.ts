import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns'

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format message timestamp: "2:34 PM"
export function formatMessageTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mm a')
}

// Format chat list preview: "Today", "Yesterday", "Mon", "Jan 5"
export function formatChatTime(dateStr: string): string {
  const date = new Date(dateStr)
  if (isToday(date)) return format(date, 'h:mm a')
  if (isYesterday(date)) return 'Yesterday'
  return format(date, 'MMM d')
}

// Relative time: "5 minutes ago"
export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

// Format file size: "2.4 MB"
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Truncate text for previews
export function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}

// Get initials for avatar fallback
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    return parts[0][0].toUpperCase()
  }
  const first = parts[0][0].toUpperCase()
  const last = parts[parts.length - 1][0].toUpperCase()
  return `${first}${last}`
}

// Ensure connection pair is always ordered (user_a < user_b)
export function orderPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a]
}
