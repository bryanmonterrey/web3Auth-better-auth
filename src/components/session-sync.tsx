'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authClient } from '@/lib/auth/client'

export function SessionSync() {
    const queryClient = useQueryClient()

    useEffect(() => {
        // Listen for session changes from better-auth
        const unsubscribe = authClient.$sessionSignal.listen(() => {
            // Invalidate session cache when auth state changes
            queryClient.invalidateQueries({ queryKey: ['session'] })
        })

        return () => {
            unsubscribe()
        }
    }, [queryClient])

    return null
}
