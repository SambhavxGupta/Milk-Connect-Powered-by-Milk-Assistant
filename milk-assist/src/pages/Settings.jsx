import { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import FloatingBottomNav from '../components/FloatingBottomNav'
import BackButton from '../components/BackButton'

export default function Settings() {
  const { milkQuantity, setMilkQuantity, deliveryTime, setDeliveryTime } =
    useContext(AppContext)

  const quantities = ['250ml', '500ml', '1 Litre', '2 Litre']

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell px-5 pt-8 pb-28">
        <div className="flex items-center justify-between mb-7">
          <BackButton />
          <div className="text-center">
            <h1 className="text-lg font-bold">Settings</h1>
            <p className="text-white/55 text-xs">Manage milk plan</p>
          </div>
          <div className="w-11" />
        </div>

        <div className="glass-card rounded-[28px] p-5 mb-5">
          <p className="text-sm font-semibold text-white/70 mb-4">
            Select Quantity
          </p>

          <div className="grid grid-cols-2 gap-3">
            {quantities.map((qty) => (
              <button
                key={qty}
                onClick={() => setMilkQuantity(qty)}
                className={`p-4 rounded-2xl font-bold border ${
                  milkQuantity === qty
                    ? 'bg-[#D9FF57] text-black border-[#D9FF57]'
                    : 'bg-white/10 text-white/70 border-white/10'
                }`}
              >
                {qty}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-[28px] p-5 mb-5">
          <p className="text-sm font-semibold text-white/70 mb-4">
            Delivery Time
          </p>

          <div className="grid grid-cols-2 gap-3">
            {['Morning', 'Evening'].map((time) => (
              <button
                key={time}
                onClick={() => setDeliveryTime(time)}
                className={`p-4 rounded-2xl font-bold border ${
                  deliveryTime === time
                    ? 'bg-[#D9FF57] text-black border-[#D9FF57]'
                    : 'bg-white/10 text-white/70 border-white/10'
                }`}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <button className="w-full bg-[#D9FF57] text-black font-bold p-4 rounded-2xl shadow-lg">
          Save Changes
        </button>

        <FloatingBottomNav />
      </div>
    </div>
  )
}