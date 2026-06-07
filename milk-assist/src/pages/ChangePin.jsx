import { useState } from 'react'
import { ArrowLeft, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'
import { showToast } from '../utils/toast'
import { getCustomerAuth, getCustomerHeaders } from '../utils/auth'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

export default function ChangePin() {
  const navigate = useNavigate()
  const mobile = localStorage.getItem('customerMobile')

  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleChangePin() {
    if (currentPin.length !== 6) {
      showToast('Enter your current 6-digit PIN', 'warning')
      return
    }

    if (newPin.length !== 6) {
      showToast('New PIN must be 6 digits', 'warning')
      return
    }

    if (newPin !== confirmPin) {
      showToast('New PIN and confirm PIN do not match', 'error')
      return
    }

    if (currentPin === newPin) {
      showToast('New PIN cannot be same as current PIN', 'warning')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/change-pin`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(getCustomerAuth({
  current_pin: currentPin,
  new_pin: newPin,
})),
      })

      const data = await res.json()

      showToast(data.message, data.success ? 'success' : 'warning')

      if (data.success) {
        setCurrentPin('')
        setNewPin('')
        setConfirmPin('')

        setTimeout(() => {
          navigate('/account')
        }, 600)
      }
    } catch (err) {
      showToast('PIN change failed. Please try again.', 'error')
    }

    setLoading(false)
  }

  function onlyNumbers(value, setter) {
    setter(value.replace(/\D/g, '').slice(0, 6))
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell">
        <div className="h-full overflow-y-auto px-6 pt-8 pb-32 custom-scrollbar">
          <div className="flex items-center gap-3 mb-7">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center">
              <ShieldCheck className="text-[#D9FF57]" size={21} />
            </div>

            <h1 className="text-2xl font-semibold">Change PIN</h1>
          </div>

          <div className="glass-card rounded-[34px] p-5 mb-5">
            <p className="text-white/50 text-sm">Security</p>
            <h2 className="text-3xl font-bold mt-1">Update Login PIN</h2>
            <p className="text-white/45 text-sm mt-3 leading-relaxed">
              Choose a 6-digit PIN that only you know. You will use it with your registered mobile number to login.
            </p>
          </div>

          <div className="glass-card rounded-[34px] p-5">
            <div className="space-y-4">
              <div>
                <label className="text-white/50 text-xs mb-2 block">
                  Current PIN
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    value={currentPin}
                    onChange={(e) => onlyNumbers(e.target.value, setCurrentPin)}
                    placeholder="Enter current PIN"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-4 outline-none text-white text-center placeholder:text-white/35 focus:border-[#D9FF57]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs mb-2 block">
                  New PIN
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    value={newPin}
                    onChange={(e) => onlyNumbers(e.target.value, setNewPin)}
                    placeholder="Enter new 6-digit PIN"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-4 outline-none text-white text-center placeholder:text-white/35 focus:border-[#D9FF57]/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/50 text-xs mb-2 block">
                  Confirm New PIN
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    value={confirmPin}
                    onChange={(e) => onlyNumbers(e.target.value, setConfirmPin)}
                    placeholder="Confirm new PIN"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-4 outline-none text-white text-center placeholder:text-white/35 focus:border-[#D9FF57]/50"
                  />
                </div>
              </div>

              <button
                onClick={handleChangePin}
                disabled={loading}
                className="w-full mt-3 bg-[#D9FF57] text-[#1F2430] font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press disabled:opacity-50"
              >
                <ShieldCheck size={18} />
                {loading ? 'Updating...' : 'Change PIN'}
              </button>
            </div>
          </div>

          <p className="text-white/35 text-xs text-center mt-4 leading-relaxed">
            If you forget your PIN, contact your milk vendor to reset it.
          </p>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}