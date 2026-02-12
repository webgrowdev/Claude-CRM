'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function LeadDetailPage() {
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Redirect to pacientes with the patient ID as a query parameter
    router.replace(`/pacientes?id=${params.id}`)
  }, [router, params.id])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <p className="text-slate-600">Redirigiendo a Pacientes...</p>
      </div>
    </div>
  )
}
