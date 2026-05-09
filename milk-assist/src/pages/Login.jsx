import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Milk } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Login() {
  const [mobile, setMobile] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showInput, setShowInput] = useState(false)

  const navigate = useNavigate()

  async function handleLogin() {
    if (!mobile.trim() || mobile.length !== 10) {
      setError('Enter valid 10-digit registered mobile number')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('https://milk-connect-powered-by-milk-assistant.onrender.com/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('customerMobile', mobile)
        localStorage.setItem('customerName', data.customer.name || 'Customer')
        localStorage.setItem('litres', `${data.customer.liter || 1}L`)
        localStorage.setItem('flatNo', data.customer.flat_no || '')
        localStorage.setItem(
          'remainingBalance',
          `₹${data.customer.remaining_balance || 0}`
        )

        navigate('/dashboard')
      } else {
        setError(data.message || 'Mobile number not registered')
      }
    } catch (err) {
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
                <p className="text-white/50 text-xs mb-2 text-center">
                  Registered Mobile Number
                </p>

                <input
                  type="text"
                  placeholder="Enter mobile number"
                  value={mobile}
                  maxLength={10}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent outline-none text-lg text-center placeholder:text-white/35"
                  autoFocus
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
              className="press w-full bg-[#D9FF57] shadow-[0_10px_40px_rgba(217,255,87,0.25)] text-black font-semibold text-[17px] p-4 rounded-[22px] flex items-center justify-center gap-2"
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