import { motion } from "motion/react"
import { motion } from 'framer-motion'
import PageTransition from "../components/PageTransition";
import {
  AlertCircle,
  ChevronRight,
  Clipboard,
  Clock,
  CreditCard,
  Headphones,
  LockKeyhole,
  MessageCircle,
  Phone,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import BackButton from '../components/BackButton'
import FloatingBottomNav from '../components/FloatingBottomNav'
import { showToast } from '../utils/toast'

const SUPPORT_PHONE_DISPLAY = '+91 97115 25848'
const SUPPORT_PHONE_CALL = '+9197111525848'
const SUPPORT_WHATSAPP = '919711525848'

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

export default function Support() {
  const name = localStorage.getItem('customerName') || 'Customer'
  const mobile = localStorage.getItem('customerMobile') || 'Not logged in'
  const flatNo = localStorage.getItem('flatNo') || 'Not added'
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹0'
  const litres = localStorage.getItem('litres') || '1L'

  const customerDetails = [
    `Name: ${name}`,
    `Mobile: ${mobile}`,
    `Flat: ${flatNo}`,
    `Current Quantity: ${litres}`,
    `Balance: ${remainingBalance}`,
  ].join('\n')

  function callSupport() {
    window.location.href = `tel:${SUPPORT_PHONE_CALL}`
  }

  function openWhatsApp(topic = 'General Support') {
    const message = [
      `Hi, I need help with ${topic}.`,
      '',
      customerDetails,
    ].join('\n')

    const url = `https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(
      message
    )}`

    window.open(url, '_blank')
  }

  async function copyDetails() {
    try {
      await navigator.clipboard.writeText(customerDetails)
      showToast('Customer details copied', 'success')
    } catch (err) {
      showToast('Could not copy details', 'error')
    }
  }

  const quickIssues = [
    {
      title: 'Delivery Issue',
      subtitle: 'Late, missed or wrong delivery',
      icon: <Truck size={20} />,
      topic: 'Delivery Issue',
    },
    {
      title: 'Payment Issue',
      subtitle: 'Paid but not verified yet',
      icon: <CreditCard size={20} />,
      topic: 'Payment Issue',
    },
    {
      title: 'PIN / Login Issue',
      subtitle: 'Forgot PIN or login problem',
      icon: <LockKeyhole size={20} />,
      topic: 'PIN or Login Issue',
    },
    {
      title: 'Other Problem',
      subtitle: 'Anything else you need help with',
      icon: <AlertCircle size={20} />,
      topic: 'Other Problem',
    },
  ]

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell relative overflow-hidden">
        <div className="luxury-glow-orb w-56 h-56 bg-[#D9FF57] top-[-90px] right-[-90px]" />
        <div className="luxury-glow-orb w-52 h-52 bg-blue-400 bottom-[-100px] left-[-80px]" />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="relative z-10 h-full overflow-y-auto px-5 pt-8 pb-32 custom-scrollbar"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between mb-7"
          >
            <BackButton />

            <div className="text-center">
              <h1 className="text-2xl font-semibold">Support</h1>
              <p className="text-white/45 text-xs mt-1">We are here to help</p>
            </div>

            <div className="w-11" />
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card neon-edge soft-shine rounded-[36px] p-6 mb-5 relative overflow-hidden"
          >
            <div className="absolute -top-16 -right-14 w-36 h-36 bg-[#D9FF57]/10 blur-3xl rounded-full" />

            <div className="relative z-10 text-center">
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 rgba(217,255,87,0)',
                    '0 0 36px rgba(217,255,87,0.38)',
                    '0 0 0 rgba(217,255,87,0)',
                  ],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="w-20 h-20 rounded-[30px] bg-[#D9FF57] text-[#1F2430] flex items-center justify-center mx-auto mb-5 floating-icon"
              >
                <Headphones size={40} />
              </motion.div>

              <h2 className="text-3xl font-bold">Need help?</h2>

              <p className="text-white/50 text-sm leading-relaxed mt-3">
                Contact support for delivery, payment, login or account-related
                help.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  onClick={callSupport}
                  className="rounded-2xl bg-[#D9FF57] text-[#1F2430] py-3 font-bold flex items-center justify-center gap-2 tap-scale"
                >
                  <Phone size={17} />
                  Call
                </button>

                <button
                  onClick={() => openWhatsApp()}
                  className="rounded-2xl bg-green-400/15 border border-green-300/30 text-green-200 py-3 font-bold flex items-center justify-center gap-2 tap-scale"
                >
                  <MessageCircle size={17} />
                  WhatsApp
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-[28px] p-5 mb-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center shrink-0">
                <ShieldCheck size={21} className="text-[#D9FF57]" />
              </div>

              <div>
                <h2 className="font-bold">Your Support Details</h2>
                <p className="text-white/45 text-sm mt-2 leading-relaxed">
                  Support may ask for these details to find your account faster.
                </p>

                <div className="mt-4 rounded-2xl bg-white/8 border border-white/10 p-4 space-y-2 text-sm">
                  <p className="text-white/60">
                    <span className="text-white/35">Name:</span> {name}
                  </p>
                  <p className="text-white/60">
                    <span className="text-white/35">Mobile:</span> {mobile}
                  </p>
                  <p className="text-white/60">
                    <span className="text-white/35">Flat:</span> {flatNo}
                  </p>
                  <p className="text-white/60">
                    <span className="text-white/35">Quantity:</span> {litres}
                  </p>
                  <p className="text-[#D9FF57] font-bold">
                    <span className="text-white/35 font-normal">Balance:</span>{' '}
                    {remainingBalance}
                  </p>
                </div>

                <button
                  onClick={copyDetails}
                  className="w-full mt-4 rounded-2xl bg-[#D9FF57]/15 border border-[#D9FF57]/30 text-[#D9FF57] py-3 font-bold flex items-center justify-center gap-2 tap-scale"
                >
                  <Clipboard size={17} />
                  Copy Details
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="premium-divider mb-5" />

          <div className="space-y-3 mb-5">
            {quickIssues.map((issue) => (
              <motion.button
                key={issue.title}
                variants={itemVariants}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.965 }}
                onClick={() => openWhatsApp(issue.topic)}
                className="w-full glass-card rounded-[26px] p-4 flex items-center justify-between gap-4 tap-scale"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center text-[#D9FF57]">
                    {issue.icon}
                  </div>

                  <div>
                    <h3 className="font-bold">{issue.title}</h3>
                    <p className="text-white/45 text-xs mt-1">
                      {issue.subtitle}
                    </p>
                  </div>
                </div>

                <ChevronRight size={18} className="text-white/35 shrink-0" />
              </motion.button>
            ))}
          </div>

          <motion.div
            variants={itemVariants}
            className="glass-card rounded-[28px] p-5"
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                <Clock size={20} className="text-white/70" />
              </div>

              <div>
                <h2 className="font-bold">Support Hours</h2>
                <p className="text-white/45 text-sm mt-2 leading-relaxed">
                  For urgent delivery issues, contact support before morning
                  delivery time whenever possible.
                </p>

                <p className="text-[#D9FF57]/80 text-xs mt-3">
                  Milk Connect • Fresh milk. On time. Every time.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <FloatingBottomNav />
      </div>
    </div>
  </PageTransition>
  )
}