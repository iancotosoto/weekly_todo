import { useEffect, useState } from 'react'

export type ThemePref = 'auto' | 'light' | 'dark'

function resolve(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#14171a' : '#e9e6df')
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => {
    try {
      return (localStorage.getItem('theme') as ThemePref) || 'auto'
    } catch {
      return 'auto'
    }
  })
  useEffect(() => {
    resolve(pref)
    try {
      localStorage.setItem('theme', pref)
    } catch {}
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => pref === 'auto' && resolve('auto')
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [pref])
  return [pref, setPref] as const
}
