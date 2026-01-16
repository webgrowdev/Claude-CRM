'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { translations, Language, TranslationKeys } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es')
  const [isLoaded, setIsLoaded] = useState(false)

  // Load language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('clinic_language') as Language
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    }
    setIsLoaded(true)
  }, [])

  // Save language preference to localStorage
  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('clinic_language', lang)
  }

  const t = translations[language]

  // Don't render children until we've loaded the language preference
  // to avoid hydration mismatch
  if (!isLoaded) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Shorthand hook for just getting translations
export function useTranslation() {
  const { t } = useLanguage()
  return t
}
