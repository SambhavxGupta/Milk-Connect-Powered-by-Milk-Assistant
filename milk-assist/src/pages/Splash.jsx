import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Milk } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Splash() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState(1)

  useEffect(() => {
    const phaseTimer = setTimeout(() => setPhase(2), 2500)
const navTimer = setTimeout(() => navigate('/login'), 4500)

    return () => {
      clearTimeout(phaseTimer)
      clearTimeout(navTimer)
    }
  }, [navigate])

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell px-7 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 1 ? (
            <motion.div
              key="connect"
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -8 }}
              transition={{ duration: 0.45 }}
              className="text-center"
            >
              <div className="mx-auto w-24 h-24 rounded-[34px] bg-white/10 border border-white/10 flex items-center justify-center shadow-xl">
                <Milk size={52} className="text-[#D9FF57]" />
              </div>

              <h1 className="text-4xl font-bold mt-7">
                Milk <span className="text-[#D9FF57]">Connect</span>
              </h1>

              <p className="text-white/55 mt-3">
                Fresh Milk, Honest Delivery
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="assist"
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45 }}
              className="text-center"
            >
              <div className="relative inline-block">
                <h1 className="text-4xl font-bold">
                  Milk <span className="text-[#D9FF57]">Connect</span>
                </h1>

                <div className="absolute -right-8 top-9 text-right">
                  <p className="text-[10px] text-white/45">Powered by</p>
                  <p className="text-sm font-bold">
                    Milk <span className="text-[#D9FF57]">Assist</span>
                  </p>
                </div>
              </div>

              <p className="text-white/55 mt-12 text-sm">
                Fresh milk. On time. Every time.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}