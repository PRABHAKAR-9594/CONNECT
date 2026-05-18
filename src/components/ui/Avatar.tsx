'use client'

import { useState } from 'react'
import { getInitials } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
}

export function Avatar({ src, name, size = 40 }: AvatarProps) {
  const [imgError, setImgError] = useState(false)

  if (src && !imgError) {
    return (
      <Image
        src={src}
        alt={name || 'User'}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <div
      className="rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold shrink-0 shadow-inner"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {getInitials(name)}
    </div>
  )
}
