import { motion } from "motion/react"
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import QRCode from 'qrcode'
import PageTransition from "../components/PageTransition";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Copy,
  IndianRupee,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'
import { showToast } from '../utils/toast'
import { getCustomerAuth, getCustomerHeaders } from '../utils/auth'

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

export default function Payment() {
  const navigate = useNavigate()

  const name = localStorage.getItem('customerName') || 'Customer'
  const mobile = localStorage.getItem('customerMobile') || ''
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹0'

  const balanceAmount =
    remainingBalance.replace('₹', '').replace(',', '').trim() || '0'

  const [paidAmount, setPaidAmount] = useState(balanceAmount)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [infoLoading, setInfoLoading] = useState(false)
  const [safetyAlert, setSafetyAlert] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSafetyAlert(false)
    }, 4500)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPaymentInfo()
    }, 450)

    return () => clearTimeout(timer)
  }, [paidAmount])

  function cleanAmount(value) {
    return String(value || '').replace(/[^\d.]/g, '')
  }

  function isValidAmount(value) {
    const amountNumber = Number(value)
    return !Number.isNaN(amountNumber) && amountNumber > 0
  }

  async function loadPaymentInfo() {
    const amount = cleanAmount(paidAmount)

    if (!isValidAmount(amount)) {
      setPaymentInfo(null)
      setQrDataUrl('')
      return
    }

    setInfoLoading(true)
    setSubmitted(false)

    try {
      const res = await fetch(`${API_BASE}/api/payment-info`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(
          getCustomerAuth({
            amount,
          })
        ),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        showToast(data.message || 'Payment info unavailable', 'error')
        setPaymentInfo(null)
        setQrDataUrl('')
        setInfoLoading(false)
        return
      }

      setPaymentInfo(data)

      const qr = await QRCode.toDataURL(data.upi_link, {
        width: 320,
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

  async function copyQrImage() {
    if (!qrDataUrl) {
      showToast('QR is not ready yet', 'warning')
      return
    }

    try {
      if (!navigator.clipboard || !window.ClipboardItem) {
        await copyPaymentLink()
        return
      }

      const response = await fetch(qrDataUrl)
      const blob = await response.blob()

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])

      showToast('QR image copied', 'success')
    } catch (err) {
      await copyPaymentLink()
    }
  }

  async function markPaid() {
    const amount = cleanAmount(paidAmount)

    if (!isValidAmount(amount)) {
      showToast('Enter a valid amount paid', 'warning')
      return
    }

    if (!paymentInfo?.upi_link) {
      showToast('Payment QR is not ready yet', 'warning')
      return
    }

    if (loading || submitted) return

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/payment-request`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(
          getCustomerAuth({
            amount,
            note: `Payment submitted from app by ${name}`,
          })
        ),
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

  function setFullBalance() {
    setPaidAmount(balanceAmount)
    showToast('Full balance selected', 'success')
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell relative overflow-hidden">
        <div className="luxury-glow-orb w-60 h-60 bg-[#D9FF57] top-[-100px] right-[-100px]" />
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
              <Wallet className="text-[#D9FF57]" size={21} />
            </div>

            <div>
              <h1 className="text-2xl font-semibold">Make Payment</h1>
              <p className="text-white/40 text-xs mt-0.5">Secure UPI payment</p>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card neon-edge soft-shine rounded-[38px] p-6 mb-5 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#D9FF57]/10 blur-3xl rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 text-[#D9FF57] mb-4">
                <Sparkles size={16} />
                <p className="text-xs font-bold uppercase tracking-[0.22em]">
                  Balance Due
                </p>
              </div>

              <div className="flex items-center gap-2">
                <IndianRupee className="text-[#D9FF57]" size={30} />
                <h2 className="text-6xl font-black text-[#D9FF57] leading-none">
                  {balanceAmount}
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                  <p className="text-white/35 text-xs">Customer</p>
                  <h3 className="font-bold mt-1 truncate">{name}</h3>
                </div>

                <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                  <p className="text-white/35 text-xs">Mobile</p>
                  <h3 className="font-bold mt-1 truncate">{mobile}</h3>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-[30px] p-5 mb-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/45 text-xs mb-1">Amount Paying</p>
                <h2 className="text-xl font-bold">Enter exact paid amount</h2>
              </div>

              <button
                onClick={setFullBalance}
                className="px-3 py-2 rounded-xl bg-[#D9FF57]/15 border border-[#D9FF57]/30 text-[#D9FF57] text-xs font-bold tap-scale"
              >
                Full Due
              </button>
            </div>

            <div className="relative">
              <IndianRupee
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
              />

              <input
                value={paidAmount}
                onChange={(e) => {
                  setPaidAmount(cleanAmount(e.target.value))
                  setSubmitted(false)
                }}
                placeholder="Enter amount"
                type="text"
                inputMode="decimal"
                className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-4 outline-none text-white text-center text-2xl font-black placeholder:text-white/35 focus:border-[#D9FF57]/50"
              />
            </div>

            <p className="text-white/35 text-xs mt-3 leading-relaxed">
              Enter the exact amount you paid. Wrong amount may delay verification.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
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
                {safetyAlert ? (
                  <AlertTriangle size={21} className="text-red-200" />
                ) : (
                  <ShieldCheck size={21} className="text-[#D9FF57]" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2
                    className={
                      safetyAlert
                        ? 'text-lg font-bold text-red-100'
                        : 'text-lg font-bold'
                    }
                  >
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
                  If the receiver name is different, do not pay and contact support.
                </p>
              </div>
            </div>
          </motion.div>

          <motion.button
            variants={itemVariants}
            onClick={copyQrImage}
            className="glass-card rounded-[36px] p-5 mb-5 text-center w-full tap-scale"
            disabled={infoLoading}
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <QrCode size={20} className="text-[#D9FF57]" />
              <h2 className="text-xl font-bold">Scan QR to Pay</h2>
            </div>

            <div className="bg-white rounded-[30px] p-5 inline-block min-w-[270px] min-h-[270px] shadow-[0_18px_60px_rgba(0,0,0,0.24)]">
              {infoLoading ? (
                <div className="w-[230px] h-[230px] flex items-center justify-center text-[#1F2430] font-bold">
                  Updating QR...
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="UPI QR Code"
                  className="w-[230px] h-[230px]"
                />
              ) : (
                <div className="w-[230px] h-[230px] flex items-center justify-center text-[#1F2430] font-bold">
                  Enter amount
                </div>
              )}
            </div>

            <p className="text-white/45 text-xs mt-4">
              Tap QR to copy QR image. If unsupported, payment link will copy.
            </p>
          </motion.button>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-[28px] p-5 mb-5"
          >
            <p className="text-white/45 text-xs mb-2">UPI ID</p>

            <div className="flex items-center justify-between gap-3 bg-white/10 border border-white/10 rounded-2xl px-4 py-3">
              <p className="text-sm font-semibold break-all">
                {paymentInfo?.upi_id || 'Loading...'}
              </p>

              <button
                onClick={copyUpiId}
                className="w-10 h-10 rounded-xl bg-[#D9FF57]/15 border border-[#D9FF57]/30 flex items-center justify-center tap-scale"
              >
                <Copy size={17} className="text-[#D9FF57]" />
              </button>
            </div>
          </motion.div>

          <motion.button
            variants={itemVariants}
            onClick={openUpiApp}
            disabled={!paymentInfo?.upi_link}
            className="w-full bg-[#D9FF57] text-[#1F2430] font-bold p-4 rounded-2xl flex items-center justify-center gap-2 tap-scale mb-4 disabled:opacity-50"
          >
            <Wallet size={18} />
            Open UPI App for ₹{cleanAmount(paidAmount) || 0}
          </motion.button>

          <motion.button
            variants={itemVariants}
            onClick={markPaid}
            disabled={loading || submitted}
            className="w-full bg-white/10 border border-white/10 text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 tap-scale disabled:opacity-50"
          >
            <CheckCircle size={18} />
            {loading
              ? 'Submitting...'
              : submitted
                ? 'Payment Request Submitted'
                : `I have paid ₹${cleanAmount(paidAmount) || 0}`}
          </motion.button>

          <motion.p
            variants={itemVariants}
            className="text-white/35 text-xs text-center mt-4 leading-relaxed"
          >
            After payment, tap “I have paid”. Admin will verify it from UPI/bank records.
          </motion.p>
        </motion.div>

        <FloatingBottomNav />
      </div>
    </div>
  </PageTransition>
  )
}