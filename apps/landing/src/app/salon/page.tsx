'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SalonPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/salon/dashboard')
  }, [router])

  return (
    <div className="min-h-screen bg-[#0f1419] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}