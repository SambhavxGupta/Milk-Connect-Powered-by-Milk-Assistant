import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole, Phone, Sparkles } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { showToast } from '../utils/toast'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

export default function Login() {
  const navigate = useNavigate()

  const [mobile, setMobile] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInput, setShowInput] = useState(false)

  async function handleLogin() {
    const cleanMobile = mobile.trim()
    const cleanPin = pin.trim()

    if (cleanMobile.length !== 10) {
      setError('Enter valid 10-digit registered mobile number')
      showToast('Enter valid 10-digit mobile number', 'warning')
      return
    }

    if (cleanPin.length !== 6) {
      setError('Enter your 6-digit PIN')
      showToast('Enter your 6-digit PIN', 'warning')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_BASE}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile: cleanMobile,
          pin: cleanPin,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        const message = data.message || 'Invalid mobile number or PIN'
        setError(message)
        showToast(message, 'error')
        setLoading(false)
        return
      }

      const customer = data.customer || data
      
      localStorage.setItem('authToken', data.auth_token || '')
      localStorage.setItem('customerMobile', customer.mobile || cleanMobile)
      localStorage.setItem('customerName', customer.name || 'Customer')
      localStorage.setItem('litres', `${customer.liter || '1'}L`)
      localStorage.setItem('flatNo', customer.flat_no || '')
      localStorage.removeItem('adminPin')
      localStorage.removeItem('adminToken')
      sessionStorage.removeItem('adminToken')
      localStorage.setItem(
        'remainingBalance',
        `₹${customer.remaining_balance || 0}`
      )

      showToast('Welcome to Milk Connect', 'success')

      setTimeout(() => {
        navigate('/dashboard')
      }, 450)
    } catch (err) {
      console.log('Login error:', err)
      setError('Server connection failed')
      showToast('Server connection failed', 'error')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell px-7 pt-10 pb-10 bg-gradient-to-b from-[#4E5969] via-[#2B3340] to-[#171B24] overflow-hidden">
        <div className="absolute top-[-130px] right-[-90px] w-[280px] h-[280px] bg-[#D9FF57]/14 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-150px] left-[-80px] w-[260px] h-[260px] bg-blue-400/10 blur-[100px] rounded-full" />
        <div className="absolute top-[38%] left-[-120px] w-[240px] h-[240px] bg-white/5 blur-[100px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 min-h-[720px] flex flex-col"
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.82, rotate: -4 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="relative mb-7"
            >
              <motion.div
                animate={{
                  scale: [1, 1.08, 1],
                  opacity: [0.45, 0.85, 0.45],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-[-12px] rounded-[44px] bg-[#D9FF57]/20 blur-xl"
              />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute inset-[-10px] rounded-[44px] border border-dashed border-[#D9FF57]/35"
              />

              <div className="relative w-30 h-30 rounded-[38px] bg-white p-2.5 flex items-center justify-center shadow-2xl overflow-hidden">
                <img
                  src="/icons/milkconnect-logo.png"
                  alt="Milk Connect"
                  className="w-full h-full object-contain"
                />
              </div>

              <motion.div
                animate={{
                  y: [0, -5, 0],
                  opacity: [0.65, 1, 0.65],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute -right-1 top-4 w-4 h-4 bg-[#D9FF57] rounded-full blur-[2px]"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/8 border border-white/10 px-4 py-2 mb-5">
                <Sparkles size={14} className="text-[#D9FF57]" />
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/55 font-bold">
                  Powered by Milk Assistant
                </p>
              </div>

              <h1 className="text-4xl font-semibold tracking-wide">
                Milk <span className="text-[#D9FF57]">Connect</span>
              </h1>

              <p className="text-white/60 text-[15px] leading-relaxed mt-4">
                Fresh Milk. Honest Delivery.
                <br />
                Manage your milk in one tap.
              </p>
            </motion.div>
          </div>

          <div className="w-full mt-auto">
            <AnimatePresence>
              {showInput && (
                <motion.div
                  initial={{ opacity: 0, y: 18, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.97 }}
                  transition={{ duration: 0.28 }}
                  className="glass-card rounded-[32px] p-5 mb-4 bg-white/8"
                >
                  <div className="mb-4">
                    <label className="block text-white/50 text-xs mb-2 text-center">
                      Registered Mobile Number
                    </label>

                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                      />

                      <input
                        type="tel"
                        placeholder="Enter mobile number"
                        value={mobile}
                        maxLength={10}
                        inputMode="numeric"
                        onChange={(e) => {
                          setMobile(e.target.value.replace(/\D/g, ''))
                          setError('')
                        }}
                        className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-4 outline-none text-white text-center placeholder:text-white/35 focus:border-[#D9FF57]/50 focus:bg-white/12 transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/50 text-xs mb-2 text-center">
                      Secure Login PIN
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                      />

                      <input
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value.replace(/\D/g, ''))
                          setError('')
                        }}
                        placeholder="Enter 6-digit PIN"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-4 outline-none text-white text-center placeholder:text-white/35 focus:border-[#D9FF57]/50 focus:bg-white/12 transition-all"
                      />
                    </div>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-red-300 text-sm text-center mt-4"
                    >
                      {error}
                    </motion.p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (showInput) {
                  handleLogin()
                } else {
                  setShowInput(true)
                }
              }}
              disabled={loading}
              className="relative overflow-hidden w-full bg-[#D9FF57] shadow-[0_10px_40px_rgba(217,255,87,0.25)] text-black font-semibold text-[17px] p-4 rounded-[22px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <motion.span
                animate={{ x: ['-120%', '220%'] }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute top-0 left-0 h-full w-20 bg-white/35 blur-xl rotate-12"
              />

              <span className="relative z-10">
                {loading ? 'Checking...' : showInput ? 'Login Securely' : 'Get Started'}
              </span>

              {!loading && <ArrowRight size={19} className="relative z-10" />}
            </motion.button>

            {!showInput && (
              <p className="text-center text-white/50 text-sm mt-5">
                Already have an account?{' '}
                <span
                  className="text-[#D9FF57] cursor-pointer font-semibold"
                  onClick={() => setShowInput(true)}
                >
                  Login
                </span>
              </p>
            )}

            {showInput && (
              <p className="text-center text-white/35 text-xs mt-4 leading-relaxed">
                Use the mobile number and PIN shared by your milk vendor.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}