import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react'

export default function ToastProvider() {
  const [toast, setToast] = useState(null)

  useEffect(() => {
    function handleToast(event) {
      const { message, type = 'info' } = event.detail || {}

      if (!message) return

      setToast({
        id: Date.now(),
        message,
        type,
      })

      setTimeout(() => {
        setToast(null)
      }, 3600)
    }

    window.addEventListener('app-toast', handleToast)

    return () => {
      window.removeEventListener('app-toast', handleToast)
    }
  }, [])

  function getToastStyle(type) {
    if (type === 'success') {
      return {
        icon: <CheckCircle size={19} />,
        accent: '#D9FF57',
        title: 'Success',
      }
    }

    if (type === 'error') {
      return {
        icon: <AlertCircle size={19} />,
        accent: '#ff6b6b',
        title: 'Error',
      }
    }

    if (type === 'warning') {
      return {
        icon: <AlertCircle size={19} />,
        accent: '#ffd166',
        title: 'Notice',
      }
    }

    return {
      icon: <Info size={19} />,
      accent: '#D9FF57',
      title: 'Info',
    }
  }

  const style = getToastStyle(toast?.type)

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: -22, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -22, scale: 0.96 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-[390px]"
          style={{ '--toast-accent': style.accent }}
        >
          <div className="premium-toast">
  <svg
    className="premium-toast-border"
    viewBox="0 0 390 86"
    preserveAspectRatio="none"
  >
    <rect
      className="premium-toast-glow-line"
      x="3"
      y="3"
      width="384"
      height="80"
      rx="27"
      ry="27"
      pathLength="1000"
    />

    <rect
      className="premium-toast-star-line"
      x="3"
      y="3"
      width="384"
      height="80"
      rx="27"
      ry="27"
      pathLength="1000"
    />
  </svg>

  <div className="premium-toast-inner">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${style.accent}18`,
                    border: `1px solid ${style.accent}55`,
                    color: style.accent,
                    boxShadow: `0 0 18px ${style.accent}35`,
                  }}
                >
                  {style.icon}
                </div>

                <div className="min-w-0">
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: style.accent }}
                  >
                    {style.title}
                  </p>

                  <p className="text-sm font-semibold text-white leading-snug mt-0.5">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setToast(null)}
                className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-white/65 shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}