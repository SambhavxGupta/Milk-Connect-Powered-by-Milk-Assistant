import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Pause, Play, History, Gift } from 'lucide-react'
import { AppContext } from '../context/AppContext'

export default function ActionButtons() {
  const { deliveryStatus, setDeliveryStatus } = useContext(AppContext)
  const navigate = useNavigate()

  const actions = [
    {
      label: 'Add Order',
      icon: <Plus size={22} />,
      click: () => navigate('/add-order'),
      active: true,
    },
    {
      label: deliveryStatus === 'Paused' ? 'Resume' : 'Pause',
      icon: deliveryStatus === 'Paused' ? <Play size={22} /> : <Pause size={22} />,
      click: () =>
        setDeliveryStatus(deliveryStatus === 'Paused' ? 'Delivered' : 'Paused'),
    },
    {
      label: 'History',
      icon: <History size={22} />,
      click: () => navigate('/history'),
    },
    {
      label: 'Refer & Earn',
      icon: <Gift size={22} />,
      click: () => navigate('/account'),
    },
  ]

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-white/80 mb-4">
        Quick Actions
      </p>

      <div className="grid grid-cols-4 gap-4">
        {actions.map((item) => (
          <button
            key={item.label}
            onClick={item.click}
            className="flex flex-col items-center gap-2"
          >
            <div
              className={`w-14 h-14 rounded-[22px] flex items-center justify-center border shadow-lg ${
                item.active
                  ? 'bg-[#D9FF57]/15 text-[#D9FF57] border-[#D9FF57]/30'
                  : 'bg-white/10 text-white/80 border-white/10'
              }`}
            >
              {item.icon}
            </div>

            <span className="text-[11px] text-white/75 text-center">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}