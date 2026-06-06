import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { getCustomerAuth } from '../utils/auth'
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  IndianRupee,
  QrCode,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'
import { showToast } from '../utils/toast'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

export default function Payment() {
  const navigate = useNavigate()

  const name = localStorage.getItem('customerName') || 'Customer'
  const mobile = localStorage.getItem('customerMobile') || ''
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹0'

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [infoLoading, setInfoLoading] = useState(true)
  const [safetyAlert, setSafetyAlert] = useState(true)
  const amount = remainingBalance.replace('₹', '').replace(',', '').trim() || '0'

  useEffect(() => {
  loadPaymentInfo()

  const timer = setTimeout(() => {
    setSafetyAlert(false)
  }, 4500)

  return () => clearTimeout(timer)
}, [])

  async function loadPaymentInfo() {
    setInfoLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/payment-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getCustomerAuth({ amount })),
      })

      const data = await res.json()

      if (!data.success) {
        showToast(data.message || 'Payment info unavailable', 'error')
        setInfoLoading(false)
        return
      }

      setPaymentInfo(data)

      const qr = await QRCode.toDataURL(data.upi_link, {
        width: 260,
        margin: 1,
        color: {
          dark: '#1F2430',
          light: '#FFFFFF',
        },
      })

      setQrDataUrl(qr)
    } catch (err) {
      showToast('Failed to load payment info', 'error')
    }

    setInfoLoading(false)
  }

  async function copyUpiId() {
    if (!paymentInfo?.upi_id) {
      showToast('UPI ID not available', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(paymentInfo.upi_id)
      showToast('UPI ID copied', 'success')
    } catch {
      showToast(`UPI ID: ${paymentInfo.upi_id}`, 'info')
    }
  }

  async function copyPaymentLink() {
    if (!paymentInfo?.upi_link) {
      showToast('Payment link not available', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(paymentInfo.upi_link)
      showToast('Payment link copied', 'success')
    } catch {
      showToast('Could not copy payment link', 'error')
    }
  }

  async function markPaid() {
    if (loading || submitted) return

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/payment-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(getCustomerAuth({
  amount,
  note: `Payment submitted from app by ${name}`,
})),
      })

      const data = await res.json()
      showToast(data.message, data.success ? 'success' : 'warning')

      if (data.success) {
        setSubmitted(true)
      }
    } catch (err) {
      showToast('Payment request failed. Please try again.', 'error')
    }

    setLoading(false)
  }

  function openUpiApp() {
    if (!paymentInfo?.upi_link) {
      showToast('Payment link not available', 'warning')
      return
    }

    window.location.href = paymentInfo.upi_link
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

            <h1 className="text-2xl font-semibold">Make Payment</h1>
          </div>

          <div className="glass-card rounded-[34px] p-5 mb-5">
            <p className="text-white/45 text-sm mb-2">Balance Due</p>

            <div className="flex items-center gap-2">
              <IndianRupee className="text-[#D9FF57]" size={28} />
              <h2 className="text-5xl font-bold text-[#D9FF57]">{amount}</h2>
            </div>

            <p className="text-white/45 text-sm mt-4">Customer: {name}</p>
            <p className="text-white/35 text-xs mt-1">Mobile: {mobile}</p>
          </div>

          <div
  className={`payment-safety-card glass-card rounded-[28px] p-5 mb-5 ${
    safetyAlert ? 'payment-safety-alert' : ''
  }`}
>
  <div className="flex items-start gap-3 relative z-10">
    <div
      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
        safetyAlert
          ? 'bg-red-400/20 border border-red-300/50'
          : 'bg-[#D9FF57]/10 border border-[#D9FF57]/25'
      }`}
    >
      <ShieldCheck
        size={21}
        className={safetyAlert ? 'text-red-200' : 'text-[#D9FF57]'}
      />
    </div>

    <div>
      <div className="flex items-center gap-2">
        <h2 className={safetyAlert ? 'text-lg font-bold text-red-100' : 'text-lg font-bold'}>
          Payment Safety Check
        </h2>

        {safetyAlert && (
          <span className="px-2 py-1 rounded-full bg-red-400 text-[#1F2430] text-[10px] font-black uppercase tracking-wide">
            Important
          </span>
        )}
      </div>

      <p className="text-white/50 text-sm mt-2 leading-relaxed">
        Before paying, confirm the receiver name shown in your UPI app:
      </p>

      <p
        className={`text-xl font-bold mt-2 ${
          safetyAlert ? 'text-red-200' : 'text-[#D9FF57]'
        }`}
      >
        {paymentInfo?.payee_name || 'Loading...'}
      </p>

      <p className="text-white/35 text-xs mt-2 leading-relaxed">
        If the receiver name is different, do not pay and contact the vendor.
      </p>
    </div>
  </div>
</div>

          <button
            onClick={copyPaymentLink}
            className="glass-card rounded-[34px] p-5 mb-5 text-center w-full press"
            disabled={infoLoading}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode size={20} className="text-[#D9FF57]" />
              <h2 className="text-xl font-bold">Scan QR to Pay</h2>
            </div>

            <div className="bg-white rounded-[28px] p-5 inline-block min-w-[260px] min-h-[260px]">
              {infoLoading ? (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-[#1F2430] font-bold">
                  Loading QR...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  className="w-[220px] h-[220px]"
                />
              ) : (
                <div className="w-[220px] h-[220px] flex items-center justify-center text-[#1F2430] font-bold">
                  QR unavailable
                </div>
              )}
            </div>

            <p className="text-white/45 text-xs mt-4">
              Tap QR to copy secure payment link.
            </p>
          </button>

          <div className="glass-card rounded-[28px] p-5 mb-5">
            <p className="text-white/45 text-xs mb-2">UPI ID</p>

            <div className="flex items-center justify-between gap-3 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold break-all">
                {paymentInfo?.upi_id || 'Loading...'}
              </p>

              <button
                onClick={copyUpiId}
                className="w-10 h-10 rounded-xl bg-[#D9FF57]/15 border border-[#D9FF57]/30 flex items-center justify-center press"
              >
                <Copy size={17} className="text-[#D9FF57]" />
              </button>
            </div>
          </div>

          <button
            onClick={openUpiApp}
            disabled={!paymentInfo?.upi_link}
            className="w-full bg-[#D9FF57] text-[#1F2430] font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press mb-4 disabled:opacity-50"
          >
            <Wallet size={18} />
            Open UPI App
          </button>

          <button
            onClick={markPaid}
            disabled={loading || submitted}
            className="w-full bg-white/10 border border-white/10 text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press disabled:opacity-50"
          >
            <CheckCircle size={18} />
            {loading
              ? 'Submitting...'
              : submitted
                ? 'Payment Request Submitted'
                : 'I have paid'}
          </button>

          <p className="text-white/35 text-xs text-center mt-4 leading-relaxed">
            After payment, tap “I have paid”. Admin will verify the payment from UPI/bank records.
          </p>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}