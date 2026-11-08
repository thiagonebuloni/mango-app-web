import { useState, useEffect } from 'react'
import { useI18n } from '../utils/i18n'

export function ThemeToggle() {
  const { t } = useI18n()
  const [isDark, setIsDark] = useState(() => {
    // Check for saved theme preference or prefers-color-scheme
    const saved = localStorage.getItem('mango-theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.classList.remove('light')
      localStorage.setItem('mango-theme', 'dark')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
      localStorage.setItem('mango-theme', 'light')
    }
  }, [isDark])

  return (
    <button
      onClick={() => setIsDark((prev) => !prev)}
      className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      aria-label={t('Alternar claro/escuro')}
    >
      {isDark ? (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.394 6.898a10.05 10.05 0 0 0-1.831-1.831l-.252.253-1.579 1.579a8.06 8.06 0 0 1-2.777-.56l-.136-.077a6.048 6.048 0 0 0-1.524 1.1l-.292.585a4.968 4.968 0 0 1-4.6 1.065a4.92 4.92 0 0 1-1.82-4.378l-.166-.318a3.996 3.996 0 0 1 .295-3.613l8.26-8.26a3.993 3.993 0 0 1 3.608.293l.318.166a3.988 3.988 0 0 1 1.865 4.353l-.592 1.585ZM10.09 11.268l1.586 1.586 1.414-1.414-1.586-1.586-1.414 1.414ZM15.79 11.268l1.586 1.586 1.414-1.414-1.586-1.586-1.414 1.414Z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2 21l3.09-2.88 1.45-1.52L5 10l-1.83-1.73L2 8l5.58 4.25L9 18l3.08 1.62ZM7 17l5.58-4.25L17 8l1.83 1.73L5 10l1.45 1.52L3.09 7.12L7 6Z" />
        </svg>
      )}
    </button>
  )
}