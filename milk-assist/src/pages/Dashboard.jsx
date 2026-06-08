import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  ChevronRight,
  FileText,
  Milk,
  ShieldCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import DashboardHeader from '../components/DashboardHeader'
import DeliveryCard from '../components/DeliveryCard'
import QuickActions from '../components/QuickActions'
import FloatingBottomNav from '../components/FloatingBottomNav'

import { getCustomerAuth, getCustomerHeaders } from '../utils/auth'
import { showToast } from '../utils/toast'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-backend.onrender.com'

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.985,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.42,
      ease: 'easeOut',
    },
  },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const mobile = localStorage.getItem('customerMobile')

  const [summary, setSummary] = useState({
    totalMilk: '0',
    remainingMilk: '0',
  })

  useEffect(() => {
    loadDashboardData()
  }, [mobile])

  async function loadDashboardData() {
    if (!mobile) return

    try {
      const res = await fetch(`${API_BASE}/api/calendar-data`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(getCustomerAuth()),
      })

      const data = await res.json()

      if (!res.ok || data.success === false) {
        showToast(data.message || 'Session expired. Please login again.', 'warning')
        return
      }

      setSummary({
        totalMilk: data.total_milk || '0',
        remainingMilk: data.remaining_milk || '0',
      })

      if (data.remaining_balance !== undefined) {
        localStorage.setItem('remainingBalance', `₹${data.remaining_balance || 0}`)
      }
    } catch (err) {
      console.log('Dashboard summary load failed', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center py-6">
      <div className="phone-shell relative overflow-hidden">
        <div className="luxury-glow-orb w-56 h-56 bg-[#D9FF57] top-[-90px] right-[-100px]" />
        <div className="luxury-glow-orb w-52 h-52 bg-blue-400 bottom-[-100px] left-[-90px]" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 flex-1 h-full overflow-y-auto px-6 pt-10 pb-32 custom-scrollbar"
        >
          <motion.div variants={itemVariants}>
            <DashboardHeader />
          </motion.div>

          <motion.div variants={itemVariants}>
            <DeliveryCard />
          </motion.div>

          <motion.div variants={itemVariants}>
            <QuickActions />
          </motion.div>

          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4 mb-5">
            <MiniStat
              icon={<CalendarDays size={20} />}
              label="Month Total"
              value={`${summary.totalMilk}L`}
            />

            <MiniStat
              icon={<Milk size={20} />}
              label="Remaining"
              value={`${summary.remainingMilk}L`}
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            onClick={() => navigate('/history')}
            className="glass-card rounded-[30px] p-5 mb-5 flex items-center justify-between gap-4 tap-scale cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 text-[#D9FF57] flex items-center justify-center">
                <FileText size={23} />
              </div>

              <div>
                <h2 className="font-bold">Activity History</h2>
                <p className="text-white/45 text-sm mt-1">
                  Pause, resume, quantity and payment records
                </p>
              </div>
            </div>

            <ChevronRight size={19} className="text-white/35 shrink-0" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-[30px] p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 text-[#D9FF57] flex items-center justify-center shrink-0">
                <ShieldCheck size={21} />
              </div>

              <div>
                <h2 className="font-bold">Secure by design</h2>
                <p className="text-white/45 text-sm mt-2 leading-relaxed">
                  Protected login, secure sessions, hidden payment config,
                  verified admin actions and automatic backups.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="glass-card rounded-[28px] p-4">
      <div className="w-11 h-11 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 text-[#D9FF57] flex items-center justify-center mb-4">
        {icon}
      </div>

      <p className="text-white/40 text-xs">{label}</p>
      <h2 className="text-2xl font-bold mt-1">{value}</h2>
    </div>
  )
}