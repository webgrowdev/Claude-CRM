'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/i18n/LanguageContext'
import { ThemeMode } from '@/types'
import { cn } from '@/lib/utils'

interface ThemeSwitcherProps {
  variant?: 'toggle' | 'buttons' | 'dropdown'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function ThemeSwitcher({
  variant = 'buttons',
  size = 'md',
  showLabel = false,
  className,
}: ThemeSwitcherProps) {
  const { theme, setTheme, isDark, toggleTheme } = useTheme()
  const { language } = useLanguage()

  const t = {
    light: language === 'es' ? 'Claro' : 'Light',
    dark: language === 'es' ? 'Oscuro' : 'Dark',
    system: language === 'es' ? 'Sistema' : 'System',
    theme: language === 'es' ? 'Tema' : 'Theme',
  }

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  if (variant === 'toggle') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'relative rounded-full transition-colors',
          sizeClasses[size],
          isDark
            ? 'bg-slate-700 text-amber-400'
            : 'bg-slate-200 text-slate-600',
          className
        )}
        aria-label={isDark ? t.light : t.dark}
      >
        {isDark ? (
          <Moon className={iconSizes[size]} />
        ) : (
          <Sun className={iconSizes[size]} />
        )}
      </button>
    )
  }

  if (variant === 'buttons') {
    const options: { value: ThemeMode; icon: typeof Sun; label: string }[] = [
      { value: 'light', icon: Sun, label: t.light },
      { value: 'dark', icon: Moon, label: t.dark },
      { value: 'system', icon: Monitor, label: t.system },
    ]

    return (
      <div className={cn('inline-flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1', className)}>
        {options.map((option) => {
          const Icon = option.icon
          const isActive = theme === option.value

          return (
            <button
              key={option.value}
              onClick={() => setTheme(option.value)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              )}
            >
              <Icon className={iconSizes[size]} />
              {showLabel && <span>{option.label}</span>}
            </button>
          )
        })}
      </div>
    )
  }

  // Dropdown variant
  return (
    <div className={cn('relative', className)}>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as ThemeMode)}
        className="appearance-none bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2 pr-8 text-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <option value="light">{t.light}</option>
        <option value="dark">{t.dark}</option>
        <option value="system">{t.system}</option>
      </select>
      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
        {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
        {theme === 'dark' && <Moon className="w-4 h-4 text-slate-400" />}
        {theme === 'system' && <Monitor className="w-4 h-4 text-slate-500" />}
      </div>
    </div>
  )
}
