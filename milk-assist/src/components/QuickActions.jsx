import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play, FileText, Repeat } from 'lucide-react'
import { AppContext } from '../context/AppContext'

export default function QuickActions() {
  const navigate = useNavigate()
  const { deliveryStatus, setDeliveryStatus } = useContext(AppContext)

  const isPaused = deliveryStatus === 'Paused'

  function toggleTomorrowDelivery() {
    setDeliveryStatus(isPaused ? 'Delivered' : 'Paused')
  }

  const actions = [
    {
      label: isPaused ? 'Resume Tomorrow' : 'Pause Tomorrow',
      icon: isPaused ? <Play size={22} className="text-[#D9FF57]" /> : <Pause size={22} className="text-[#D9FF57]" />,
      onClick: toggleTomorrowDelivery,
      hasDot: true,
    },
    {
      label: 'Change Quantity',
      icon: <Repeat size={22} className="text-white/80" />,
      onClick: () => navigate('/calendar'),
    },
    {
      label: 'History',
      icon: <FileText size={22} className="text-white/80" />,
      onClick: () => navigate('/history'),
    },
  ]

  return (
    <div className="mb-8">
      <h3 className="text-white/90 text-sm font-semibold mb-4">Quick Actions</h3>

      <div className="flex justify-between items-start">
        {actions.map((action, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2 w-[92px]">
            <button
              onClick={action.onClick}
              className="relative w-14 h-14 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shadow-sm press"
            >
              {action.icon}

              {action.hasDot && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-[#D9FF57] border-[2.5px] border-[#1F2430] rounded-full" />
              )}
            </button>

            <span className="text-[11px] font-medium text-white/70 text-center leading-tight">
              {action.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}