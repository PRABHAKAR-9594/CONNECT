'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { UserCard } from '@/components/connect/UserCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { getConnectionStatus } from '@/lib/connectionStatus'
import type { Profile, ConnectionRequest, Connection } from '@/types/app'
import { Search, Users } from 'lucide-react'

interface PeopleDiscoveryProps {
  profiles: Profile[]
  currentUserId: string
  requests: ConnectionRequest[]
  connections: Connection[]
}

export function PeopleDiscovery({ profiles, currentUserId, requests, connections }: PeopleDiscoveryProps) {
  const [search, setSearch] = useState('')

  const filteredProfiles = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return profiles

    return profiles.filter(p => 
      p.full_name.toLowerCase().includes(q) ||
      (p.username && p.username.toLowerCase().includes(q))
    )
  }, [profiles, search])

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Discover Professionals</h1>
        <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
          Search for colleagues, industry peers, and new connections. Expand your professional network to start collaborating and sharing ideas.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <Input
          placeholder="Search by name or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-900/60 border-slate-800 h-11 text-base rounded-xl backdrop-blur-sm"
        />
      </div>

      {/* Profiles List */}
      {filteredProfiles.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No professionals found"
          description={search ? `No results match "${search}". Try a different search term.` : "No other profiles are available to connect with right now."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProfiles.map((profile) => {
            const status = getConnectionStatus(currentUserId, profile.id, requests, connections)
            // Find requestId if pending
            const req = requests.find(r => 
              (r.sender_id === currentUserId && r.receiver_id === profile.id) ||
              (r.receiver_id === currentUserId && r.sender_id === profile.id)
            )

            return (
              <UserCard
                key={profile.id}
                profile={profile}
                currentUserId={currentUserId}
                initialStatus={status}
                requestId={req?.id}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
