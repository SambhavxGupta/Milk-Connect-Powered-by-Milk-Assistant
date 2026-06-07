import { useEffect, useState } from 'react'
import {
  ChevronRight,
  Headphones,
  Info,
  LockKeyhole,
  LogOut,
  ShieldCheck,
  Smartphone,
  User,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'
import BackButton from '../components/BackButton'
import { showToast } from '../utils/toast'

export default function Settings() {
  const navigate = useNavigate()

  const name = localStorage.getItem('customerName') || 'Customer'
  const mobile = localStorage.getItem('customerMobile') || 'Not logged in'
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹0'

  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
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
    if (!deferredPrompt) {
      showToast('Use browser menu → Install app / Add to home screen', 'info')
      return
    }

    deferredPrompt.prompt()
    await deferredPrompt.userChoice
    setDeferredPrompt(null)
  }

  function logout() {
    localStorage.clear()
    sessionStorage.removeItem('adminToken')
    navigate('/login')
  }

  const settingItems = [
    {
      title: 'Profile',
      subtitle: 'View your name, mobile and address',
      icon: <User size={20} />,
      onClick: () => navigate('/account'),
    },
    {
      title: 'Change PIN',
      subtitle: 'Update your secure 6-digit login PIN',
      icon: <LockKeyhole size={20} />,
      onClick: () => navigate('/change-pin'),
    },
    {
      title: 'Payments',
      subtitle: 'Pay bill and submit payment request',
      icon: <Wallet size={20} />,
      onClick: () => navigate('/payment'),
    },
    {
      title: 'Support',
      subtitle: 'Call, WhatsApp or report an issue',
      icon: <Headphones size={20} />,
      onClick: () => navigate('/support'),
    },
    {
      title: 'Install App',
      subtitle: 'Add Milk Connect to your home screen',
      icon: <Smartphone size={20} />,
      onClick: installApp,
    },
  ]

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell">
        <div className="h-full overflow-y-auto px-5 pt-8 pb-32 custom-scrollbar">
          <div className="flex items-center justify-between mb-7">
            <BackButton />

            <div className="text-center">
              <h1 className="text-2xl font-semibold">Settings</h1>
              <p className="text-white/45 text-xs mt-1">Control center</p>
            </div>

            <div className="w-11" />
          </div>

          <div className="glass-card rounded-[34px] p-5 mb-5 relative overflow-hidden">
            <div className="absolute -top-14 -right-14 w-32 h-32 bg-[#D9FF57]/10 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[26px] bg-[#D9FF57] text-[#1F2430] flex items-center justify-center">
                  <User size={30} />
                </div>

                <div>
                  <p className="text-white/45 text-xs">Logged in as</p>
                  <h2 className="text-2xl font-bold mt-1">{name}</h2>
                  <p className="text-white/45 text-sm mt-1">{mobile}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-white/8 border border-white/10 p-4 flex items-center justify-between">
                <div>
                  <p className="text-white/40 text-xs">Remaining Balance</p>
                  <h3 className="text-xl font-bold text-[#D9FF57] mt-1">
                    {remainingBalance}
                  </h3>
                </div>

                <ShieldCheck size={26} className="text-[#D9FF57]" />
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-5">
            {settingItems.map((item) => (
              <button
                key={item.title}
                onClick={item.onClick}
                className="w-full glass-card rounded-[26px] p-4 flex items-center justify-between gap-4 press"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center text-[#D9FF57]">
                    {item.icon}
                  </div>

                  <div>
                    <h3 className="font-bold">{item.title}</h3>
                    <p className="text-white/45 text-xs mt-1">
                      {item.subtitle}
                    </p>
                  </div>
                </div>

                <ChevronRight size={18} className="text-white/35 shrink-0" />
              </button>
            ))}
          </div>

          <div className="glass-card rounded-[28px] p-5 mb-5">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center shrink-0">
                <Info size={20} className="text-[#D9FF57]" />
              </div>

              <div>
                <h2 className="font-bold">About Milk Connect</h2>
                <p className="text-white/45 text-sm mt-2 leading-relaxed">
                  A secure milk delivery app for managing daily delivery,
                  quantity changes, pause/resume requests, payments and vendor
                  support.
                </p>

                <p className="text-white/30 text-xs mt-3">
                  Powered by Milk Assist
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full bg-red-400/15 border border-red-300/30 text-red-200 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}