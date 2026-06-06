import { useEffect, useState } from 'react'
import { Download, Smartphone, Apple, MonitorDown } from 'lucide-react'
import { showToast } from '../utils/toast'

export default function InstallAppCard() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    setIsInstalled(standalone)

    function handleBeforeInstallPrompt(event) {
      event.preventDefault()
      setDeferredPrompt(event)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function installApp() {
    if (isInstalled) {
      showToast('Milk Connect is already installed', 'success')
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice

      if (result.outcome === 'accepted') {
        showToast('Milk Connect installed successfully', 'success')
        setIsInstalled(true)
      } else {
        showToast('Install cancelled', 'warning')
      }

      setDeferredPrompt(null)
      return
    }

    const isIOS = /iphone|ipad|ipod/i.test(window.navigator.userAgent)

    if (isIOS) {
      showToast('On iPhone: tap Share, then Add to Home Screen', 'info')
    } else {
      showToast('Open browser menu and choose Install App / Add to Home Screen', 'info')
    }
  }

  return (
    <div className="glass-card rounded-[28px] p-5 mb-5 relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#D9FF57]/10 blur-3xl rounded-full" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center">
            {isInstalled ? (
              <Smartphone size={22} className="text-[#D9FF57]" />
            ) : (
              <MonitorDown size={22} className="text-[#D9FF57]" />
            )}
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {isInstalled ? 'App Installed' : 'Install Milk Connect'}
            </h2>
            <p className="text-white/45 text-xs mt-0.5">
              Add it to your home screen
            </p>
          </div>
        </div>

        <p className="text-white/55 text-sm leading-relaxed mb-5">
          Open Milk Connect like a real app with faster access, app icon, and full-screen experience.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
            <Apple size={18} className="text-white/70 mb-2" />
            <p className="text-[11px] text-white/45">iPhone</p>
            <p className="text-xs font-semibold mt-1">Share → Add to Home Screen</p>
          </div>

          <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
            <Smartphone size={18} className="text-white/70 mb-2" />
            <p className="text-[11px] text-white/45">Android</p>
            <p className="text-xs font-semibold mt-1">Install App / Add to Home</p>
          </div>
        </div>

        <button
          onClick={installApp}
          className="w-full bg-[#D9FF57] text-[#1F2430] font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press"
        >
          <Download size={18} />
          {isInstalled ? 'Installed' : 'Install App'}
        </button>
      </div>
    </div>
  )
}