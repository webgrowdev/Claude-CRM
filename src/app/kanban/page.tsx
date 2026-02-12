'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function KanbanPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/pacientes?view=kanban')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Redirigiendo a vista Kanban...</p>
      </div>
    </div>
  )
}
