import { useEffect, useState } from 'react'
import { getCustomerAuth } from '../utils/auth'
import {
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  ListChecks,
  Pause,
  Play,
  Repeat,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

export default function History() {
  const navigate = useNavigate()
  const mobile = localStorage.getItem('customerMobile')

  const [activeTab, setActiveTab] = useState('payments')
  const [payments, setPayments] = useState([])
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadHistory() {
    if (!mobile) return

    setLoading(true)

    try {
      const paymentRes = await fetch(`${API_BASE}/api/payment-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getCustomerAuth()),
      })

      const paymentData = await paymentRes.json()
      setPayments(paymentData.history || [])

      const actionRes = await fetch(`${API_BASE}/api/action-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getCustomerAuth()),
      })

      const actionData = await actionRes.json()
      setActions(actionData.history || [])
    } catch (err) {
      console.log('History load failed', err)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadHistory()
  }, [mobile])

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
      return <Pause size={18} className="text-red-200" />
    }

    if (value.includes('resume')) {
      return <Play size={18} className="text-green-200" />
    }

    if (value.includes('qty') || value.includes('quantity')) {
      return <Repeat size={18} className="text-blue-200" />
    }

    if (value.includes('payment')) {
      return <Wallet size={18} className="text-[#D9FF57]" />
    }

    return <ListChecks size={18} className="text-[#D9FF57]" />
  }

  function getActionTitle(action) {
    const value = String(action).toLowerCase()

    if (value === 'pause') return 'Milk Paused'
    if (value === 'resume') return 'Milk Resumed'
    if (value === 'change_qty') return 'Quantity Changed'
    if (value === 'payment_request') return 'Payment Request'

    return action || 'Action'
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
              <ListChecks className="text-[#D9FF57]" size={21} />
            </div>

            <h1 className="text-2xl font-semibold">History</h1>
          </div>

          <div className="glass-card rounded-[32px] p-5 mb-5">
            <p className="text-white/50 text-sm">Activity Records</p>
            <h2 className="text-3xl font-bold mt-1">Your History</h2>
            <p className="text-white/45 text-sm mt-3">
              Track payments, pause/resume requests, and quantity changes.
            </p>
          </div>

          <div className="glass-card rounded-[24px] p-2 mb-5 grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveTab('payments')}
              className={`rounded-2xl py-3 text-sm font-semibold press ${
                activeTab === 'payments'
                  ? 'bg-[#D9FF57] text-[#1F2430]'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              Payments
            </button>

            <button
              onClick={() => setActiveTab('actions')}
              className={`rounded-2xl py-3 text-sm font-semibold press ${
                activeTab === 'actions'
                  ? 'bg-[#D9FF57] text-[#1F2430]'
                  : 'bg-white/5 text-white/60'
              }`}
            >
              Delivery
            </button>
          </div>

          {loading ? (
            <div className="glass-card rounded-[28px] p-5">
              <p className="text-white/50 text-sm">Loading history...</p>
            </div>
          ) : activeTab === 'payments' ? (
            payments.length === 0 ? (
              <div className="glass-card rounded-[28px] p-5 text-center">
                <Wallet className="text-[#D9FF57] mx-auto mb-4" size={34} />
                <h2 className="text-xl font-bold mb-2">No payments yet</h2>
                <p className="text-white/45 text-sm">
                  Your payment requests will appear here after you click “I have paid”.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment, index) => {
                  const status = getPaymentStatusStyle(payment.status)

                  return (
                    <div key={index} className="glass-card rounded-[28px] p-5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="text-white/45 text-xs mb-1">Amount</p>
                          <h2 className="text-3xl font-bold text-[#D9FF57]">
                            ₹{payment.amount}
                          </h2>
                        </div>

                        <div
                          className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 text-xs font-semibold ${status.className}`}
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
                            <p className="text-sm text-white/70">{payment.note}</p>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          ) : actions.length === 0 ? (
            <div className="glass-card rounded-[28px] p-5 text-center">
              <ListChecks className="text-[#D9FF57] mx-auto mb-4" size={34} />
              <h2 className="text-xl font-bold mb-2">No delivery actions yet</h2>
              <p className="text-white/45 text-sm">
                Pause, resume, and quantity changes will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {actions.map((action, index) => (
                <div key={index} className="glass-card rounded-[28px] p-5">
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
                        <p className="text-sm text-white/75">
                          {action.details || 'No details available'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}