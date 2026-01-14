import { useEffect, useMemo, useState } from 'react'

export type DeviceKinds = {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  width: number
  hasTouch: boolean
}

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

function getDeviceInfo(): DeviceKinds {
  if (typeof window === 'undefined') {
    return {
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      width: 0,
      hasTouch: false,
    }
  }

  const width = window.innerWidth
  const hasTouch = !!(
    'ontouchstart' in window ||
    (navigator as any).maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  )

  const isMobile = width < MOBILE_BREAKPOINT || /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isTablet = !isMobile && width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
  const isDesktop = !isMobile && !isTablet

  return { isMobile, isTablet, isDesktop, width, hasTouch }
}

/**
 * useMobileDetect
 * - Detects mobile/tablet/desktop based on viewport width, user agent and touch capability
 * - Listens for resize events and memoizes the result
 */
export default function useMobileDetect() {
  const [device, setDevice] = useState<DeviceKinds>(() => getDeviceInfo())

  useEffect(() => {
    if (typeof window === 'undefined') return

    let raf = 0
    const onResize = () => {
      // throttle with rAF for smoother updates
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setDevice(getDeviceInfo())
      })
    }

    window.addEventListener('resize', onResize)

    // Also listen for orientation changes on mobile devices
    window.addEventListener('orientationchange', onResize)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [])

  return useMemo(() => ({
    isMobile: device.isMobile,
    isTablet: device.isTablet,
    isDesktop: device.isDesktop,
    width: device.width,
    hasTouch: device.hasTouch,
  }), [device])
}
