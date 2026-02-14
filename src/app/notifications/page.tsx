'use client'

import React from 'react'
import { AppShell } from '@/components/layout'
import { PageContainer, Header } from '@/components/layout' // ajusta si tu proyecto difiere

export default function NotificationsPage() {
  return (
    <AppShell>
      <Header title="Notifications" showBack={false} />
      <PageContainer>
        <div className="py-12 text-center">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-slate-500 mt-2">Aquí verás las notificaciones del sistema.</p>
        </div>
      </PageContainer>
    </AppShell>
  )
}