export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        console.log('Service worker registered for Yogique PWA:', reg.scope)
      }).catch(err => {
        console.warn('Service worker registration failed:', err)
      })
    })
  }
}

export function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
  }
}
