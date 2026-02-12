'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeadsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/pacientes')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Redirigiendo a Pacientes...</p>
      </div>
    </div>
  )
}
