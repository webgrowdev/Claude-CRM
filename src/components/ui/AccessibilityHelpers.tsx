'use client'

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  createContext,
  useContext,
  ReactNode,
} from 'react'
import { cn } from '@/lib/utils'

// ============================================
// Skip Navigation Link
// ============================================
interface SkipLinkProps {
  href: string
  children: ReactNode
}

export function SkipLink({ href, children }: SkipLinkProps) {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none"
    >
      {children}
    </a>
  )
}

// ============================================
// Focus Trap - Keeps focus within a container
// ============================================
interface FocusTrapProps {
  children: ReactNode
  active?: boolean
  className?: string
  restoreFocus?: boolean
}

export function FocusTrap({
  children,
  active = true,
  className,
  restoreFocus = true,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!active) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement

    // Find focusable elements
    const container = containerRef.current
    if (!container) return

    const focusableElements = getFocusableElements(container)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    return () => {
      // Restore focus when unmounting
      if (restoreFocus && previousFocusRef.current) {
        previousFocusRef.current.focus()
      }
    }
  }, [active, restoreFocus])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!active || e.key !== 'Tab') return

      const container = containerRef.current
      if (!container) return

      const focusableElements = getFocusableElements(container)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    },
    [active]
  )

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className}
    >
      {children}
    </div>
  )
}

// ============================================
// Keyboard Navigation Hook
// ============================================
interface UseKeyboardNavigationOptions {
  items: HTMLElement[]
  orientation?: 'horizontal' | 'vertical' | 'both'
  loop?: boolean
  onSelect?: (index: number) => void
  onEscape?: () => void
}

export function useKeyboardNavigation({
  items,
  orientation = 'vertical',
  loop = true,
  onSelect,
  onEscape,
}: UseKeyboardNavigationOptions) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const { key } = e
      let newIndex = activeIndex

      const isVertical = orientation === 'vertical' || orientation === 'both'
      const isHorizontal = orientation === 'horizontal' || orientation === 'both'

      switch (key) {
        case 'ArrowDown':
          if (isVertical) {
            e.preventDefault()
            newIndex = activeIndex + 1
          }
          break
        case 'ArrowUp':
          if (isVertical) {
            e.preventDefault()
            newIndex = activeIndex - 1
          }
          break
        case 'ArrowRight':
          if (isHorizontal) {
            e.preventDefault()
            newIndex = activeIndex + 1
          }
          break
        case 'ArrowLeft':
          if (isHorizontal) {
            e.preventDefault()
            newIndex = activeIndex - 1
          }
          break
        case 'Home':
          e.preventDefault()
          newIndex = 0
          break
        case 'End':
          e.preventDefault()
          newIndex = items.length - 1
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          onSelect?.(activeIndex)
          return
        case 'Escape':
          e.preventDefault()
          onEscape?.()
          return
      }

      // Handle bounds
      if (loop) {
        if (newIndex < 0) newIndex = items.length - 1
        if (newIndex >= items.length) newIndex = 0
      } else {
        newIndex = Math.max(0, Math.min(items.length - 1, newIndex))
      }

      if (newIndex !== activeIndex) {
        setActiveIndex(newIndex)
        items[newIndex]?.focus()
      }
    },
    [activeIndex, items, orientation, loop, onSelect, onEscape]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return { activeIndex, setActiveIndex }
}

// ============================================
// Roving Tabindex for Lists
// ============================================
interface RovingTabindexProps {
  children: ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
}

export function RovingTabindex({
  children,
  className,
  orientation = 'vertical',
}: RovingTabindexProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const container = containerRef.current
    if (!container) return

    const items = Array.from(
      container.querySelectorAll('[data-roving-item]')
    ) as HTMLElement[]

    if (items.length === 0) return

    let newIndex = focusedIndex
    const isVertical = orientation === 'vertical'

    switch (e.key) {
      case isVertical ? 'ArrowDown' : 'ArrowRight':
        e.preventDefault()
        newIndex = (focusedIndex + 1) % items.length
        break
      case isVertical ? 'ArrowUp' : 'ArrowLeft':
        e.preventDefault()
        newIndex = (focusedIndex - 1 + items.length) % items.length
        break
      case 'Home':
        e.preventDefault()
        newIndex = 0
        break
      case 'End':
        e.preventDefault()
        newIndex = items.length - 1
        break
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex)
      items[newIndex]?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      role="listbox"
      aria-orientation={orientation}
      className={className}
    >
      {children}
    </div>
  )
}

// ============================================
// Accessible List Item
// ============================================
interface AccessibleListItemProps {
  children: ReactNode
  onClick?: () => void
  selected?: boolean
  disabled?: boolean
  className?: string
}

export function AccessibleListItem({
  children,
  onClick,
  selected,
  disabled,
  className,
}: AccessibleListItemProps) {
  return (
    <div
      data-roving-item
      role="option"
      aria-selected={selected}
      aria-disabled={disabled}
      tabIndex={selected ? 0 : -1}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
          e.preventDefault()
          onClick?.()
        }
      }}
      className={cn(
        'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </div>
  )
}

// ============================================
// Live Region for Announcements
// ============================================
interface LiveRegionContextValue {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}

const LiveRegionContext = createContext<LiveRegionContextValue | null>(null)

export function useLiveRegion() {
  const context = useContext(LiveRegionContext)
  if (!context) {
    throw new Error('useLiveRegion must be used within LiveRegionProvider')
  }
  return context
}

interface LiveRegionProviderProps {
  children: ReactNode
}

export function LiveRegionProvider({ children }: LiveRegionProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('')
  const [assertiveMessage, setAssertiveMessage] = useState('')

  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (priority === 'assertive') {
      setAssertiveMessage('')
      setTimeout(() => setAssertiveMessage(message), 50)
    } else {
      setPoliteMessage('')
      setTimeout(() => setPoliteMessage(message), 50)
    }
  }, [])

  return (
    <LiveRegionContext.Provider value={{ announce }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      <div
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LiveRegionContext.Provider>
  )
}

// ============================================
// Visually Hidden (Screen Reader Only)
// ============================================
interface VisuallyHiddenProps {
  children: ReactNode
  as?: keyof JSX.IntrinsicElements
}

export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return <Component className="sr-only">{children}</Component>
}

// ============================================
// Focus Visible Ring
// ============================================
export const focusRingClasses = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2'

// ============================================
// Helpers
// ============================================
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'a[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(', ')

  return Array.from(container.querySelectorAll(focusableSelectors))
}

// ============================================
// Keyboard Shortcut Display
// ============================================
interface KeyboardShortcutProps {
  keys: string[]
  className?: string
}

export function KeyboardShortcut({ keys, className }: KeyboardShortcutProps) {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)

  const formatKey = (key: string) => {
    if (key === 'mod') return isMac ? '⌘' : 'Ctrl'
    if (key === 'alt') return isMac ? '⌥' : 'Alt'
    if (key === 'shift') return '⇧'
    if (key === 'enter') return '↵'
    if (key === 'escape') return 'Esc'
    if (key === 'backspace') return '⌫'
    if (key === 'delete') return 'Del'
    if (key === 'tab') return 'Tab'
    if (key === 'space') return '␣'
    if (key === 'up') return '↑'
    if (key === 'down') return '↓'
    if (key === 'left') return '←'
    if (key === 'right') return '→'
    return key.toUpperCase()
  }

  return (
    <kbd className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key, i) => (
        <span
          key={i}
          className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono text-slate-600"
        >
          {formatKey(key)}
        </span>
      ))}
    </kbd>
  )
}

// ============================================
// Accessible Dialog Hooks
// ============================================
export function useDialogAccessibility(isOpen: boolean, onClose: () => void) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])
}
