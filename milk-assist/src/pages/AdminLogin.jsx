import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, LockKeyhole } from 'lucide-react'
import { motion } from 'framer-motion'
import { showToast } from '../utils/toast'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

export default function AdminLogin() {
  const navigate = useNavigate()

  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdminLogin() {
    if (pin.length !== 6) {
      showToast('Enter 6-digit admin PIN', 'warning')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      })

      const data = await res.json()

      showToast(data.message, data.success ? 'success' : 'error')

      if (data.success) {
        localStorage.removeItem('adminPin')
        localStorage.setItem('adminToken', data.admin_token || '')

        setTimeout(() => {
          navigate('/admin-dashboard')
        }, 450)
      }
    } catch (err) {
      showToast('Admin server connection failed', 'error')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell px-7 pt-12 pb-10 bg-gradient-to-b from-[#4E5969] via-[#2B3340] to-[#171B24] overflow-hidden">
        <div className="absolute top-[-130px] right-[-90px] w-[280px] h-[280px] bg-[#D9FF57]/14 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-150px] left-[-80px] w-[260px] h-[260px] bg-blue-400/10 blur-[100px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 min-h-[720px] flex flex-col"
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.84 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="relative mb-7"
            >
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.4, 0.85, 0.4],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-[-12px] rounded-[44px] bg-[#D9FF57]/20 blur-xl"
              />

              <div className="relative w-28 h-28 rounded-[38px] bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center shadow-2xl">
                <ShieldCheck size={58} className="text-[#D9FF57]" />
              </div>
            </motion.div>

            <h1 className="text-4xl font-semibold tracking-wide">
              Admin <span className="text-[#D9FF57]">Panel</span>
            </h1>

            <p className="text-white/60 text-[15px] leading-relaxed mt-4">
              Milk Connect control center.
              <br />
              Secure vendor access.
            </p>
          </div>

          <div className="w-full mt-auto">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-[32px] p-5 mb-4 bg-white/8"
            >
              <label className="block text-white/50 text-xs mb-2 text-center">
                Admin PIN
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter admin PIN"
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-4 outline-none text-white text-center placeholder:text-white/35 focus:border-[#D9FF57]/50"
                />
              </div>
            </motion.div>

            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="press w-full bg-[#D9FF57] shadow-[0_10px_40px_rgba(217,255,87,0.25)] text-black font-semibold text-[17px] p-4 rounded-[22px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Checking...' : 'Enter Admin Dashboard'}
              {!loading && <ArrowRight size={19} />}
            </button>

            <button
              onClick={() => navigate('/')}
              className="w-full mt-4 text-white/50 text-sm"
            >
              Back to customer login
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}