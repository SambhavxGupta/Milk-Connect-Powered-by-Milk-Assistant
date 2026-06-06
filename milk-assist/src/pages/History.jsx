import { useEffect, useState } from 'react'
import { ArrowLeft, Clock, CheckCircle, XCircle, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

export default function History() {
  const navigate = useNavigate()
  const mobile = localStorage.getItem('customerMobile')

  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadPaymentHistory() {
    if (!mobile) return

    try {
      const res = await fetch(`${API_BASE}/api/payment-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      })

      const data = await res.json()
      setPayments(data.history || [])
    } catch (err) {
      console.log('Payment history failed', err)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadPaymentHistory()
  }, [mobile])

  function getStatusStyle(status) {
    const value = String(status).toLowerCase()

    if (value === 'verified' || value === 'paid') {
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
              <Wallet className="text-[#D9FF57]" size={21} />
            </div>

            <h1 className="text-2xl font-semibold">History</h1>
          </div>

          <div className="glass-card rounded-[32px] p-5 mb-5">
            <p className="text-white/50 text-sm">Payment Records</p>
            <h2 className="text-3xl font-bold mt-1">Your Payments</h2>
            <p className="text-white/45 text-sm mt-3">
              Track your payment requests and verification status.
            </p>
          </div>

          {loading ? (
            <div className="glass-card rounded-[28px] p-5">
              <p className="text-white/50 text-sm">Loading payment history...</p>
            </div>
          ) : payments.length === 0 ? (
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
                const status = getStatusStyle(payment.status)

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
                      <p className="text-sm font-medium">{payment.timestamp || 'Not available'}</p>

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
          )}
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}