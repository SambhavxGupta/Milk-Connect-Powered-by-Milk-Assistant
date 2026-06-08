import { showToast } from '../utils/toast'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pause, Play, FileText, Repeat } from 'lucide-react'
import { getCustomerAuth, getCustomerHeaders } from '../utils/auth'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-backend.onrender.com'

export default function QuickActions() {
  const navigate = useNavigate()
  const mobile = localStorage.getItem('customerMobile')

  const [isPaused, setIsPaused] = useState(false)
  const [loading, setLoading] = useState(false)

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const tomorrowDay = tomorrow.getDate()
  const tomorrowDate = `${String(tomorrow.getDate()).padStart(2, '0')}-${String(
    tomorrow.getMonth() + 1
  ).padStart(2, '0')}-${tomorrow.getFullYear()}`

  async function loadTomorrowStatus() {
    if (!mobile) return

    try {
      const res = await fetch(`${API_BASE}/api/calendar-data`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(getCustomerAuth()),
      })

      const data = await res.json()
      setIsPaused((data.paused_days || []).includes(tomorrowDay))
    } catch (err) {
      console.log('Tomorrow status load failed', err)
    }
  }

  useEffect(() => {
    loadTomorrowStatus()
  }, [mobile])

  async function toggleTomorrowDelivery() {
    if (!mobile || loading) return

    setLoading(true)

    const endpoint = isPaused ? 'resume' : 'pause'

    try {
      const res = await fetch(`${API_BASE}/api/${endpoint}`, {
        method: 'POST',
        headers: getCustomerHeaders(),
        body: JSON.stringify(getCustomerAuth({
  dates: [tomorrowDate],
})),
      })

      const data = await res.json()
      showToast(data.result, data.result.includes('✅') ? 'success' : 'warning')

      if (data.result.includes('✅')) {
        setIsPaused(!isPaused)
      }
    } catch (err) {
      showToast('Action failed. Please try again.', 'error')
    }

    setLoading(false)
  }

  const actions = [
    {
      label: loading ? 'Please wait...' : isPaused ? 'Resume Tomorrow' : 'Pause Tomorrow',
      icon: isPaused ? (
        <Play size={22} className="text-[#D9FF57]" />
      ) : (
        <Pause size={22} className="text-[#D9FF57]" />
      ),
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
              disabled={loading && idx === 0}
              className="relative w-14 h-14 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shadow-sm press disabled:opacity-50"
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