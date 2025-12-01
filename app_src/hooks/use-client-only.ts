"use client"

import { useEffect, useState } from "react"

export function useClientOnly() {
    const [isClient, setIsClient] = useState(false)

    useEffect(() => {
        setIsClient(true)
    }, [])

    return isClient
}

// Add a new hook for handling hydration-safe rendering
export function useHydrationSafe() {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    return isMounted
}
