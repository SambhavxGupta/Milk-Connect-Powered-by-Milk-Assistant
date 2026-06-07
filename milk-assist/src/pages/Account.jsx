import { motion } from 'framer-motion'
import {
  ChevronRight,
  CreditCard,
  Home,
  KeyRound,
  LogOut,
  Milk,
  Phone,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InstallAppCard from '../components/InstallAppCard'
import FloatingBottomNav from '../components/FloatingBottomNav'
import BackButton from '../components/BackButton'

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
    y: 18,
    scale: 0.98,
  },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
    },
  },
}

export default function Account() {
  const navigate = useNavigate()

  const name = localStorage.getItem('customerName') || 'Customer'
  const mobile = localStorage.getItem('customerMobile') || 'Not logged in'
  const flatNo = localStorage.getItem('flatNo') || 'Not added'
  const litres = localStorage.getItem('litres') || '1L'
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹0'

  function logout() {
    localStorage.clear()
    sessionStorage.removeItem('adminToken')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell relative overflow-hidden">
        <div className="luxury-glow-orb w-60 h-60 bg-[#D9FF57] top-[-100px] right-[-110px]" />
        <div className="luxury-glow-orb w-52 h-52 bg-blue-400 bottom-[-100px] left-[-90px]" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 h-full overflow-y-auto px-6 pt-8 pb-32 custom-scrollbar"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between mb-7"
          >
            <BackButton />

            <div className="text-center">
              <h1 className="text-2xl font-semibold">Profile</h1>
              <p className="text-white/45 text-xs mt-1">Customer account</p>
            </div>

            <div className="w-11" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card neon-edge soft-shine rounded-[38px] p-6 mb-5 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#D9FF57]/10 blur-3xl rounded-full" />

            <div className="relative z-10">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 rgba(217,255,87,0)',
                    '0 0 36px rgba(217,255,87,0.35)',
                    '0 0 0 rgba(217,255,87,0)',
                  ],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-20 h-20 rounded-[30px] bg-[#D9FF57] text-[#1F2430] flex items-center justify-center mb-5 floating-icon"
              >
                <User size={38} />
              </motion.div>

              <p className="text-white/50 text-sm">Customer</p>
              <h2 className="text-3xl font-black mt-1">{name}</h2>

              <div className="flex items-center gap-2 mt-4 text-white/60 text-sm">
                <Phone size={15} />
                <span>{mobile}</span>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            <InstallAppCard />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 gap-4 mb-5"
          >
            <MiniCard
              icon={<Wallet size={22} />}
              label="Remaining Balance"
              value={remainingBalance}
              highlight
            />

            <MiniCard
              icon={<Milk size={22} />}
              label="Current Quantity"
              value={litres}
            />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-[30px] p-5 mb-5"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center shrink-0">
                <Home size={22} className="text-[#D9FF57]" />
              </div>

              <div>
                <h2 className="text-xl font-bold">Address</h2>
                <p className="text-white/45 text-sm mt-2">Flat Number</p>
                <h3 className="text-lg font-semibold mt-1">{flatNo}</h3>
              </div>
            </div>
          </motion.div>

          <div className="space-y-3 mb-5">
            <ActionCard
              icon={<KeyRound size={21} />}
              title="Change PIN"
              subtitle="Update your secure 6-digit login PIN"
              onClick={() => navigate('/change-pin')}
            />

            <ActionCard
              icon={<CreditCard size={21} />}
              title="Make Payment"
              subtitle="Pay your milk bill and submit request"
              onClick={() => navigate('/payment')}
            />

            <ActionCard
              icon={<ShieldCheck size={21} />}
              title="Settings"
              subtitle="Security, support and app controls"
              onClick={() => navigate('/settings')}
            />
          </div>

          <motion.button
            variants={itemVariants}
            whileTap={{ scale: 0.965 }}
            onClick={logout}
            className="w-full bg-red-400/15 border border-red-300/30 text-red-200 font-bold p-4 rounded-2xl flex items-center justify-center gap-2 tap-scale"
          >
            <LogOut size={18} />
            Logout
          </motion.button>
        </motion.div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}

function MiniCard({ icon, label, value, highlight = false }) {
  return (
    <div className="glass-card rounded-[28px] p-4">
      <div className="w-11 h-11 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 text-[#D9FF57] flex items-center justify-center mb-4">
        {icon}
      </div>

      <p className="text-white/45 text-xs mb-1">{label}</p>

      <h2
        className={`text-2xl font-bold ${
          highlight ? 'text-[#D9FF57]' : 'text-white'
        }`}
      >
        {value}
      </h2>
    </div>
  )
}

function ActionCard({ icon, title, subtitle, onClick }) {
  return (
    <motion.button
      variants={itemVariants}
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.965 }}
      onClick={onClick}
      className="w-full glass-card rounded-[28px] p-4 flex items-center justify-between gap-4 tap-scale"
    >
      <div className="flex items-center gap-4 text-left">
        <div className="w-12 h-12 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center text-[#D9FF57]">
          {icon}
        </div>

        <div>
          <h3 className="font-bold">{title}</h3>
          <p className="text-white/45 text-xs mt-1">{subtitle}</p>
        </div>
      </div>

      <ChevronRight size={18} className="text-white/35 shrink-0" />
    </motion.button>
  )
}