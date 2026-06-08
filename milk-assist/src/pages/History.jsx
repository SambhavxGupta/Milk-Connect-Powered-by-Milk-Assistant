import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getCustomerAuth, getCustomerHeaders } from '../utils/auth'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ListChecks,
  Pause,
  Play,
  RefreshCw,
  Repeat,
  Wallet,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'
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

export default function History() {
  const navigate = useNavigate()
  const mobile = localStorage.getItem('customerMobile')
  const name = localStorage.getItem('customerName') || 'Customer'

  const [activeTab, setActiveTab] = useState('payments')
  const [payments, setPayments] = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [mobile])

  async function loadHistory() {
    if (!mobile) return

    setLoading(true)

    try {
      const paymentRes = await fetch(`${API_BASE}/api/payment-history`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(getCustomerAuth()),
      })

      const paymentData = await paymentRes.json()

      if (!paymentRes.ok || paymentData.success === false) {
        showToast(paymentData.message || 'Payment history failed', 'warning')
      } else {
        setPayments(paymentData.history || [])
      }

      const actionRes = await fetch(`${API_BASE}/api/action-history`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(getCustomerAuth()),
      })

      const actionData = await actionRes.json()

      if (!actionRes.ok || actionData.success === false) {
        showToast(actionData.message || 'Activity history failed', 'warning')
      } else {
        setActions(actionData.history || [])
      }
    } catch (err) {
      console.log('History load failed', err)
      showToast('History load failed', 'error')
    }

    setLoading(false)
  }

  function getPaymentStatusStyle(status) {
    const value = String(status).toLowerCase()

    if (value === 'verified' || value === 'paid' || value === 'done') {
      return {
        text: 'Verified',
        icon: <CheckCircle size={15} />,
        className: 'bg-green-400/15 border-green-300/30 text-green-200',
      }
    }

    if (value === 'rejected') {
      return {
        text: 'Rejected',
        icon: <XCircle size={15} />,
        className: 'bg-red-400/15 border-red-300/30 text-red-200',
      }
    }

    return {
      text: 'Pending',
      icon: <Clock size={15} />,
      className: 'bg-yellow-400/15 border-yellow-300/30 text-yellow-100',
    }
  }

  function getActionIcon(action) {
    const value = String(action).toLowerCase()

    if (value.includes('pause')) {
      return <Pause size={19} className="text-red-200" />
    }

    if (value.includes('resume')) {
      return <Play size={19} className="text-green-200" />
    }

    if (value.includes('qty') || value.includes('quantity')) {
      return <Repeat size={19} className="text-blue-200" />
    }

    if (value.includes('payment')) {
      return <Wallet size={19} className="text-[#D9FF57]" />
    }

    return <ListChecks size={19} className="text-[#D9FF57]" />
  }

  function getActionTitle(action) {
    const value = String(action).toLowerCase()

    if (value === 'pause') return 'Milk Paused'
    if (value === 'resume') return 'Milk Resumed'
    if (value === 'change_qty') return 'Quantity Changed'
    if (value === 'payment_request') return 'Payment Request'
    if (value === 'change_pin') return 'PIN Changed'

    return action || 'Activity'
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
            className="flex items-center gap-3 mb-7"
          >
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center tap-scale"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center">
              <ListChecks className="text-[#D9FF57]" size={21} />
            </div>

            <div className="flex-1">
              <h1 className="text-2xl font-semibold">History</h1>
              <p className="text-white/40 text-xs mt-0.5">Payments and delivery actions</p>
            </div>

            <button
              onClick={loadHistory}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center tap-scale"
            >
              <RefreshCw size={17} />
            </button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card neon-edge soft-shine rounded-[38px] p-6 mb-5 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#D9FF57]/10 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="w-16 h-16 rounded-[26px] bg-[#D9FF57] text-[#1F2430] flex items-center justify-center mb-5 floating-icon">
                <ListChecks size={34} />
              </div>

              <p className="text-white/50 text-sm">Activity Records</p>
              <h2 className="text-3xl font-black mt-1">{name}'s History</h2>

              <p className="text-white/45 text-sm mt-3 leading-relaxed">
                Track payments, admin verification, pause/resume requests and quantity changes.
              </p>

              
            </div>
          </motion.div>

          <motion.div
  variants={itemVariants}
  className="grid grid-cols-2 gap-4 mb-5"
>
  <StatCard
    icon={<Wallet size={21} />}
    label="Payment Requests"
    value={payments.length}
  />

  <StatCard
    icon={<ListChecks size={21} />}
    label="Delivery Actions"
    value={actions.length}
    highlight
  />
</motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-[24px] p-2 mb-5 grid grid-cols-2 gap-2"
          >
            <button
              onClick={() => setActiveTab('payments')}
              className={`rounded-2xl py-3 text-sm font-bold tap-scale ${
                activeTab === 'payments'
                  ? 'bg-[#D9FF57] text-[#1F2430]'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              Payments
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`rounded-2xl py-3 text-sm font-bold tap-scale ${
                activeTab === 'actions'
                  ? 'bg-[#D9FF57] text-[#1F2430]'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              Delivery
            </button>
          </motion.div>

          {loading ? (
            <motion.div
              variants={itemVariants}
              className="glass-card rounded-[28px] p-5"
            >
              <p className="text-white/50 text-sm">Loading history...</p>
            </motion.div>
          ) : activeTab === 'payments' ? (
            <PaymentHistory
              payments={payments}
              getPaymentStatusStyle={getPaymentStatusStyle}
            />
          ) : (
            <ActionHistory
              actions={actions}
              getActionIcon={getActionIcon}
              getActionTitle={getActionTitle}
            />
          )}
        </motion.div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}

function PaymentHistory({ payments, getPaymentStatusStyle }) {
  if (payments.length === 0) {
    return (
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-[28px] p-6 text-center"
      >
        <Wallet className="text-[#D9FF57] mx-auto mb-4" size={38} />
        <h2 className="text-xl font-bold mb-2">No payments yet</h2>
        <p className="text-white/45 text-sm leading-relaxed">
          Your payment requests will appear here after you tap “I have paid”.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {payments.map((payment, index) => {
        const status = getPaymentStatusStyle(payment.status)

        return (
          <motion.div
            key={index}
            variants={itemVariants}
            className="glass-card rounded-[30px] p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <p className="text-white/45 text-xs mb-1">Amount</p>
                <h2 className="text-4xl font-black text-[#D9FF57]">
                  ₹{payment.amount}
                </h2>
              </div>

              <div
                className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-bold ${status.className}`}
              >
                {status.icon}
                {status.text}
              </div>
            </div>

            <div className="rounded-2xl bg-white/8 border border-white/10 p-4">
              <p className="text-white/40 text-xs mb-1">Submitted On</p>
              <p className="text-sm font-medium">
                {payment.timestamp || 'Not available'}
              </p>

              {payment.note && (
                <>
                  <p className="text-white/40 text-xs mt-3 mb-1">Note</p>
                  <p className="text-sm text-white/70 leading-relaxed">
                    {payment.note}
                  </p>
                </>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function ActionHistory({ actions, getActionIcon, getActionTitle }) {
  if (actions.length === 0) {
    return (
      <motion.div
        variants={itemVariants}
        className="glass-card rounded-[28px] p-6 text-center"
      >
        <ListChecks className="text-[#D9FF57] mx-auto mb-4" size={38} />
        <h2 className="text-xl font-bold mb-2">No delivery actions yet</h2>
        <p className="text-white/45 text-sm leading-relaxed">
          Pause, resume and quantity changes will appear here.
        </p>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {actions.map((action, index) => (
        <motion.div
          key={index}
          variants={itemVariants}
          className="glass-card rounded-[30px] p-5"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
              {getActionIcon(action.action)}
            </div>

            <div className="flex-1">
              <h2 className="text-lg font-bold">
                {getActionTitle(action.action)}
              </h2>

              <p className="text-white/45 text-xs mt-1">
                {action.timestamp || 'Not available'}
              </p>

              <div className="rounded-2xl bg-white/8 border border-white/10 p-4 mt-4">
                <p className="text-white/40 text-xs mb-1">Details</p>
                <p className="text-sm text-white/75 leading-relaxed">
                  {action.details || 'No details available'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}



function StatCard({ icon, label, value, highlight = false }) {
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

