import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Milk } from 'lucide-react'
import { motion } from 'framer-motion'

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
      return
    }

    if (cleanPin.length !== 6) {
      setError('Enter your 6-digit PIN')
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
        setError(data.message || 'Invalid mobile number or PIN')
        setLoading(false)
        return
      }

      const customer = data.customer || data

      localStorage.setItem('customerMobile', customer.mobile || cleanMobile)
      localStorage.setItem('customerName', customer.name || 'Customer')
      localStorage.setItem('litres', `${customer.liter || '1'}L`)
      localStorage.setItem('flatNo', customer.flat_no || '')
      localStorage.setItem(
        'remainingBalance',
        `₹${customer.remaining_balance || 0}`
      )

      navigate('/dashboard')
    } catch (err) {
      console.log('Login error:', err)
      setError('Server connection failed')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell px-7 pt-12 pb-10 bg-gradient-to-b from-[#4E5969] via-[#2B3340] to-[#171B24]">
        <div className="absolute top-[-120px] right-[-80px] w-[260px] h-[260px] bg-[#D9FF57]/12 blur-[100px] rounded-full" />
        <div className="absolute bottom-[-140px] left-[-60px] w-[240px] h-[240px] bg-blue-400/10 blur-[100px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="relative z-10 min-h-[720px] flex flex-col"
        >
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="relative mb-7">
              <div className="w-24 h-24 rounded-[34px] bg-white/10 border border-white/10 flex items-center justify-center shadow-2xl">
                <Milk size={54} className="text-white" strokeWidth={1.3} />
              </div>

              <div className="absolute -right-1 top-4 w-4 h-4 bg-[#D9FF57] rounded-full blur-[2px]" />
            </div>

            <h1 className="text-4xl font-semibold tracking-wide">
              Milk <span className="text-[#D9FF57]">Assist</span>
            </h1>

            <p className="text-white/60 text-[15px] leading-relaxed mt-4">
              Fresh milk. On time.
              <br />
              Every time.
            </p>
          </div>

          <div className="w-full mt-auto">
            {showInput && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-[30px] p-5 mb-4 bg-white/8"
              >
                <label className="block text-white/50 text-xs mb-2 text-center">
                  Registered Mobile Number
                </label>

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
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-4 outline-none text-white text-center placeholder:text-white/35"
                  autoFocus
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
                  className="w-full mt-4 rounded-2xl bg-white/10 border border-white/10 px-4 py-4 outline-none text-white text-center placeholder:text-white/35"
                />

                {error && (
                  <p className="text-red-300 text-sm text-center mt-3">
                    {error}
                  </p>
                )}
              </motion.div>
            )}

            <button
              onClick={() => {
                if (showInput) {
                  handleLogin()
                } else {
                  setShowInput(true)
                }
              }}
              disabled={loading}
              className="press w-full bg-[#D9FF57] shadow-[0_10px_40px_rgba(217,255,87,0.25)] text-black font-semibold text-[17px] p-4 rounded-[22px] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? 'Checking...' : showInput ? 'Login' : 'Get Started'}
              {!loading && <ArrowRight size={19} />}
            </button>

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
          </div>
        </motion.div>
      </div>
    </div>
  )
}