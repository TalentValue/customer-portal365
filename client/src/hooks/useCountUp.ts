import { useEffect, useRef, useState } from 'react'

export function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0)
  const frameRef = useRef<number>()
  const startRef = useRef<number>()

  useEffect(() => {
    if (!target) { setVal(0); return }
    startRef.current = undefined
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const elapsed = ts - startRef.current
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(ease * target))
      if (progress < 1) frameRef.current = requestAnimationFrame(animate)
    }
    frameRef.current = requestAnimationFrame(animate)
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
  }, [target, duration])

  return val
}
