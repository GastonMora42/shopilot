// hooks/useRequireAuth.ts
'use client'

import { useSession } from 'next-auth/react'
import { useAuthModal } from '@/contexts/AuthModalContext'
import { useEffect } from 'react'



export function useRequireAuth() {
  const { data: session, status } = useSession()
  const { openAuthModal } = useAuthModal()
  const isAuthenticated = status === 'authenticated'
  const isLoading = status === 'loading'

  return {
    isAuthenticated,
    isLoading,
    user: session?.user,
    requireAuth: () => {
      if (!isAuthenticated && !isLoading) {
        openAuthModal()
        return false
      }
      return true
    }
  }
}