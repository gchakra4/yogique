import { useCallback, useRef, useState } from 'react'

type Callbacks = {
  onSwipeLeft?: (distance: number) => void
  onSwipeRight?: (distance: number) => void
  onSwipeUp?: (distance: number) => void
  onSwipeDown?: (distance: number) => void
}

type Options = Callbacks & {
  threshold?: number
  enableHaptics?: boolean
}

export default function useSwipeGestures({
  threshold = 50,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enableHaptics = true,
}: Options = {}) {
  const startX = useRef<number | null>(null)
  const startY = useRef<number | null>(null)
  const moved = useRef(false)
  const [isSwiping, setIsSwiping] = useState(false)

  const vibrate = (ms = 10) => {
    try {
      if (enableHaptics && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        ;(navigator as any).vibrate(ms)
      }
    } catch (e) {
      // ignore
    }
  }

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    startX.current = t.clientX
    startY.current = t.clientY
    moved.current = false
    setIsSwiping(true)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startX.current == null || startY.current == null) return
    const t = e.touches[0]
    const dx = t.clientX - startX.current
    const dy = t.clientY - startY.current
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moved.current = true
  }, [])

  const onTouchEnd = useCallback((e?: React.TouchEvent) => {
    if (startX.current == null || startY.current == null) {
      setIsSwiping(false)
      return
    }

    // If an event is provided, try to use changedTouches
    let endX: number | null = null
    let endY: number | null = null
    if (e && e.changedTouches && e.changedTouches.length > 0) {
      endX = e.changedTouches[0].clientX
      endY = e.changedTouches[0].clientY
    }

    // Fallback: no changedTouches (call without event)
    if (endX == null || endY == null) {
      endX = startX.current
      endY = startY.current
    }

    const dx = endX - startX.current
    const dy = endY - startY.current

    const absX = Math.abs(dx)
    const absY = Math.abs(dy)

    if (!moved.current) {
      // tap/no meaningful movement
      setIsSwiping(false)
      startX.current = null
      startY.current = null
      return
    }

    if (absX > absY && absX >= threshold) {
      // horizontal swipe
      if (dx < 0) {
        onSwipeLeft?.(absX)
        vibrate()
      } else {
        onSwipeRight?.(absX)
        vibrate()
      }
    } else if (absY > absX && absY >= threshold) {
      // vertical swipe
      if (dy < 0) {
        onSwipeUp?.(absY)
        vibrate()
      } else {
        onSwipeDown?.(absY)
        vibrate()
      }
    }

    setIsSwiping(false)
    startX.current = null
    startY.current = null
    moved.current = false
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, enableHaptics])

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    isSwiping,
  }
}
