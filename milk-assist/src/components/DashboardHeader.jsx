import { Info } from 'lucide-react'
import { motion } from 'framer-motion'
import { useState } from 'react'

export default function DashboardHeader() {
  const customerName = localStorage.getItem('customerName') || 'Customer'

  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
  type: "spring",
  stiffness: 220,
  damping: 22,
}}
        className="flex items-start justify-between mb-6"
      >
        <div>
          <h1 className="text-[30px] font-bold tracking-tight">
            Hello, {customerName}
          </h1>

          <p className="text-white/55 text-sm mt-1">
            Fresh milk delivered daily.
          </p>
        </div>

        <button
          onClick={() => setShowAbout(!showAbout)}
          className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
        >
          <Info size={18} />
        </button>

      </motion.div>

      {showAbout && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="glass-card rounded-[28px] p-5 mb-6"
        >
          <h2 className="text-lg font-bold mb-4">
            About Our Milk
          </h2>

          <div className="space-y-3 text-sm text-white/80">
            <div className="flex items-start gap-3">
              <span className="text-[#D9FF57]">✓</span>
              <p>Fresh raw cow milk delivered daily</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-[#D9FF57]">✓</span>
              <p>Rich in calcium & protein</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-[#D9FF57]">✓</span>
              <p>100% pure & natural</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-[#D9FF57]">✓</span>
              <p>Unprocessed & fresh</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-[#D9FF57]">✓</span>
              <p>Delivered by 6:30 AM daily</p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-[#D9FF57]">✓</span>
              <p>Pause / resume / quantity changes supported</p>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-white/10">
              <p className="text-[#D9FF57] font-semibold text-sm">
                 Trusted by 50+ families in the community.
              </p>
</div>
        </motion.div>
      )}
    </>
  )
}