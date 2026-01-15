'use client'

import * as React from 'react'

export interface SwitchProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Switch({ label, ...props }: SwitchProps) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <span className="relative inline-flex h-6 w-10 items-center rounded-full bg-slate-300 transition-colors peer-checked:bg-blue-500">
        <input
          type="checkbox"
          className="peer sr-only"
          {...props}
        />
        <span className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4 translate-x-1" />
      </span>
      {label && (
        <span className="text-sm text-slate-700 select-none">{label}</span>
      )}
    </label>
  )
}
