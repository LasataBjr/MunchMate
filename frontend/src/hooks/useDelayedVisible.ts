import { useEffect, useState } from 'react'

// True only if `active` stays true for longer than `delay` ms.
// Fast responses never show a loading skeleton at all.
export function useDelayedVisible(active: boolean, delay = 150): boolean {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!active) return

    const timer = setTimeout(() => setVisible(true), delay)

    return () => {
      clearTimeout(timer)
      setVisible(false)
    }
  }, [active, delay])

  return active && visible
}