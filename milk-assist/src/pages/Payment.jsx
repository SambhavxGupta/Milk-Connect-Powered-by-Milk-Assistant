import { ArrowLeft, CheckCircle, Copy, IndianRupee, QrCode, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'
const UPI_ID = 'your-upi-id@bank'
const PAYEE_NAME = 'Milk Connect'

export default function Payment() {
  const navigate = useNavigate()

  const name = localStorage.getItem('customerName') || 'Customer'
  const mobile = localStorage.getItem('customerMobile') || ''
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹0'

  const amount = remainingBalance.replace('₹', '').replace(',', '').trim() || '0'

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(
    PAYEE_NAME
  )}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Milk bill payment by ${name}`)}`

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiLink
  )}`

  async function copyUpiId() {
    try {
      await navigator.clipboard.writeText(UPI_ID)
      alert('UPI ID copied')
    } catch {
      alert(`UPI ID: ${UPI_ID}`)
    }
  }

  async function markPaid() {
  try {
    const res = await fetch(`${API_BASE}/api/payment-request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mobile,
        amount,
        note: `Payment submitted from app by ${name}`,
      }),
    })

    const data = await res.json()
    alert(data.message)
  } catch (err) {
    alert('Payment request failed. Please try again.')
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

            <h1 className="text-2xl font-semibold">Make Payment</h1>
          </div>

          <div className="glass-card rounded-[34px] p-5 mb-5">
            <p className="text-white/45 text-sm mb-2">Amount Due</p>

            <div className="flex items-center gap-2">
              <IndianRupee className="text-[#D9FF57]" size={28} />
              <h2 className="text-5xl font-bold text-[#D9FF57]">{amount}</h2>
            </div>

            <p className="text-white/45 text-sm mt-4">
              Customer: {name}
            </p>

            <p className="text-white/35 text-xs mt-1">
              Mobile: {mobile}
            </p>
          </div>

          <div className="glass-card rounded-[34px] p-5 mb-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode size={20} className="text-[#D9FF57]" />
              <h2 className="text-xl font-bold">Scan QR to Pay</h2>
            </div>

            <div className="bg-white rounded-[28px] p-5 inline-block">
              <img
                src={qrUrl}
                alt="UPI QR Code"
                className="w-[220px] h-[220px]"
              />
            </div>

            <p className="text-white/45 text-xs mt-4">
              Scan this QR using any UPI app.
            </p>
          </div>

          <div className="glass-card rounded-[28px] p-5 mb-5">
            <p className="text-white/45 text-xs mb-2">UPI ID</p>

            <div className="flex items-center justify-between gap-3 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold break-all">{UPI_ID}</p>

              <button
                onClick={copyUpiId}
                className="w-10 h-10 rounded-xl bg-[#D9FF57]/15 border border-[#D9FF57]/30 flex items-center justify-center press"
              >
                <Copy size={17} className="text-[#D9FF57]" />
              </button>
            </div>
          </div>

          <a
            href={upiLink}
            className="w-full bg-[#D9FF57] text-[#1F2430] font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press mb-4"
          >
            <Wallet size={18} />
            Open UPI App
          </a>

          <button
            onClick={markPaid}
            className="w-full bg-white/10 border border-white/10 text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press"
          >
            <CheckCircle size={18} />
            I have paid
          </button>

          <p className="text-white/35 text-xs text-center mt-4 leading-relaxed">
            Payments are verified manually by admin. Your balance will update after confirmation.
          </p>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}