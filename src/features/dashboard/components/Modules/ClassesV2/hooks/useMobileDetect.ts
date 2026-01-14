import { useEffect, useState } from 'react';

/**
 * Hook: useMobileDetect
 * Simple debounced resize listener for responsive rendering
 */
export const useMobileDetect = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
  });

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleResize = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        setWindowSize({ width: window.innerWidth });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const isMobile = windowSize.width < 768;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isDesktop = windowSize.width >= 1024;

  return { isMobile, isTablet, isDesktop, width: windowSize.width };
};
