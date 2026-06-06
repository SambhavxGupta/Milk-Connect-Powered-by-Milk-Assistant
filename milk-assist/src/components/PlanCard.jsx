import { ChevronRight, Gift, Milk, Wallet } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PlanCard() {
  const milkQuantity = localStorage.getItem('litres') || '1L'
  const navigate = useNavigate()

  return (
    <div className="space-y-4">
      <div className="glass-card rounded-[26px] p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full border border-white/25 bg-white/10 flex items-center justify-center">
            <Milk size={27} className="text-white" />
          </div>

          <div>
            <p className="text-white/70 text-sm">Current Quantity</p>
            <h3 className="font-bold mt-1">{milkQuantity}</h3>
            <p className="text-white/55 text-sm">Morning delivery only</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/calendar')}
          className="flex items-center gap-2"
        >
          <span className="px-4 py-2 rounded-2xl bg-[#D9FF57] text-[#1F2430] text-xs font-bold">
            Edit
          </span>
          <ChevronRight size={18} className="text-white/55" />
        </button>
      </div>

      <div
        onClick={() => navigate('/history')}
        className="glass-card rounded-[26px] p-4 flex items-center justify-between press cursor-pointer"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wallet size={18} className="text-[#D9FF57]" />
            <h3 className="font-bold">Remaining Balance</h3>
          </div>
          <p className="text-[#D9FF57] text-2xl font-bold">
  {localStorage.getItem('remainingBalance') || '₹0'}
</p>
        </div>

        <ChevronRight size={18} className="text-white/55" />
      </div>

      <div className="glass-card rounded-[26px] p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Gift size={18} className="text-[#D9FF57]" />
            <h3 className="font-bold">Refer a friend and get ₹100</h3>
          </div>
          <p className="text-white/55 text-sm">
            They get ₹100 off too!
          </p>
        </div>

        <div className="text-3xl">🎁</div>
      </div>
    </div>
  )
}