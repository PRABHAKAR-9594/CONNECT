'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import type { Profile } from '@/types/app'
import { Camera, Save } from 'lucide-react'

interface SettingsFormProps {
  profile: Profile
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || '')
  const [username, setUsername] = useState(profile.username || '')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar size must be less than 5MB.')
      return
    }

    try {
      setUploading(true)
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}/${Date.now()}.${fileExt}`

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadErr) throw uploadErr

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const newAvatarUrl = publicUrlData.publicUrl

      // Update profile
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', profile.id)

      if (updateErr) throw updateErr

      setAvatarUrl(newAvatarUrl)
      toast.success('Avatar updated successfully!')
      router.refresh()
    } catch (err: any) {
      console.error('[avatar upload]', err)
      toast.error('Failed to upload avatar.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()

    if (!fullName.trim()) {
      toast.error('Display name cannot be empty.')
      return
    }

    const cleanUsername = username.trim().toLowerCase()

    try {
      setSaving(true)

      // Check username uniqueness if changed
      if (cleanUsername && cleanUsername !== profile.username?.toLowerCase()) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', profile.id)
          .maybeSingle()

        if (existing) {
          toast.error('Username is already taken.')
          setSaving(false)
          return
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          username: cleanUsername || null,
          bio: bio.trim() || null,
        })
        .eq('id', profile.id)

      if (error) throw error

      toast.success('Profile settings saved successfully!')
      router.refresh()
    } catch (err: any) {
      console.error('[save settings]', err)
      toast.error('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-10 max-w-3xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Profile Settings</h1>
        <p className="text-slate-400 text-base">
          Update your personal information, customize your profile URL, and manage your public biography.
        </p>
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-8">
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-6 border-b border-slate-800/80 text-center sm:text-left">
          <div className="relative group">
            <Avatar src={avatarUrl} name={fullName || 'User'} size={88} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium cursor-pointer"
            >
              <Camera className="h-5 w-5 mb-0.5" />
              {uploading ? 'Uploading...' : 'Change'}
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">Profile Picture</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Upload a professional headshot. Recommended size is 256x256px. Maximum file size is 5MB.
            </p>
          </div>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSave} className="space-y-6">
          <Input
            label="Display Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Jane Doe"
            required
            className="bg-slate-955 border-slate-800"
          />

          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="janedoe"
            className="bg-slate-955 border-slate-800"
          />
          <p className="text-xs text-slate-500 -mt-4 pl-1">Your profile URL will be @{username || 'username'}</p>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300 pl-1">Biography</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us a little bit about yourself, your expertise, and your professional goals..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none shadow-inner"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              loading={saving}
              className="bg-brand-600 text-white hover:bg-brand-500 shadow-lg shadow-brand-600/20 px-6 py-2.5"
            >
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
