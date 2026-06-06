import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Milk } from 'lucide-react'
import { motion } from 'framer-motion'
import { AppContext } from '../context/AppContext'

export default function DeliveryCard() {
  const { deliveryStatus } = useContext(AppContext)
  const milkQuantity = localStorage.getItem('litres') || '1L'
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="glass-card rounded-[30px] overflow-hidden mb-6"
    >
      <div className="p-5 flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm font-medium">Next Delivery</p>

          <h2 className="text-3xl font-bold mt-2 tracking-tight">
            Tomorrow
          </h2>

          <p className="text-white/60 mt-2 text-sm">
            Morning delivery
          </p>
        </div>

        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="w-16 h-20 rounded-b-2xl rounded-t-lg bg-white/90 flex items-center justify-center shadow-xl">
            <Milk size={38} className="text-[#59616f]" />
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/calendar')}
        className="w-full bg-white/8 border-t border-white/10 px-5 py-4 flex items-center justify-between text-left"
      >
        <span className="text-sm font-bold">Manage Delivery</span>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              deliveryStatus === 'Paused'
                ? 'bg-white/15 text-white/70'
                : 'bg-[#D9FF57] text-[#1F2430]'
            }`}
          >
            {deliveryStatus}
          </span>

          <ChevronRight size={18} className="text-white/60" />
        </div>
      </button>

      <div className="px-5 pb-4 pt-1 text-xs text-white/55">
        {milkQuantity} • Morning only
      </div>
    </motion.div>
  )
}