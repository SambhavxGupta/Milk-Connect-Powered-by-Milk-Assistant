import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Milk,
  Pause,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'

export default function Calendar() {
  const navigate = useNavigate()
  const mobile = localStorage.getItem('customerMobile')
  const defaultQuantity =
  (localStorage.getItem('litres') || '1L').replace('L', '')
  const today = new Date()
  const currentDay = today.getDate()
  const currentMonthIndex = today.getMonth()
  const currentYear = today.getFullYear()
  const currentMonth = today.toLocaleString('default', { month: 'long' })
  const daysInMonth = new Date(currentYear, currentMonthIndex + 1, 0).getDate()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const [selectedDays, setSelectedDays] = useState([])
 const [pausedDays, setPausedDays] = useState([])
  const [quantityDays, setQuantityDays] = useState({})
  const [quantity, setQuantity] = useState('')
  const [popup, setPopup] = useState(false)

useEffect(() => {
  async function loadCalendarData() {
    if (!mobile) return

    try {
      const res = await fetch('https://milk-connect-powered-by-milk-assistant.onrender.com/api/calendar-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      })

      const data = await res.json()

      setPausedDays(data.paused_days || [])
    } catch (err) {
      console.log('Calendar data load failed', err)
    }
  }

  loadCalendarData()
}, [mobile])

  function showPastPopup() {
    setPopup(true)
    setTimeout(() => setPopup(false), 1500)
  }

  function toggleDay(day) {
    if (day < currentDay) return

    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    )
  }

async function pauseSelected() {
  if (selectedDays.length === 0) return

  const firstDay = Math.min(...selectedDays)
  const pauseDate = `${String(firstDay).padStart(2, '0')}-${String(currentMonthIndex + 1).padStart(2, '0')}-${currentYear}`

  const res = await fetch('https://milk-connect-powered-by-milk-assistant.onrender.com/api/pause', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile,
      start_date: pauseDate,
      days: selectedDays.length
    })
  })

  const data = await res.json()
  alert(data.result)

  if (data.result.includes('✅')) {
    setPausedDays((prev) => [...new Set([...prev, ...selectedDays])])
    setSelectedDays([])
  }
}

  async function resumeSelected() {

  try {

    await fetch('https://milk-connect-powered-by-milk-assistant.onrender.com/api/resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        mobile
      })
    })

    setPausedDays((prev) =>
      prev.filter((day) => !selectedDays.includes(day))
    )

    setSelectedDays([])

    alert('Milk resumed successfully')

  } catch (err) {
    alert('Resume failed')
  }
}

 async function changeQuantity() {
  if (!quantity || selectedDays.length === 0) return

  const res = await fetch('https://milk-connect-powered-by-milk-assistant.onrender.com/api/change-quantity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobile,
      quantity
    })
  })

  const data = await res.json()
  alert(data.result)

  if (data.result.includes('✅')) {
    const updated = { ...quantityDays }

    selectedDays.forEach((day) => {
      updated[day] = quantity
    })

    setQuantityDays(updated)
    setQuantity('')
    setSelectedDays([])
  }
}

  const selectedHasPaused = selectedDays.some((day) => pausedDays.includes(day))
  const selectedHasActive = selectedDays.some((day) => !pausedDays.includes(day))

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell">

        {popup && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[100] bg-[#D9FF57] text-[#1F2430] px-5 py-3 rounded-2xl text-sm font-semibold shadow-2xl">
            Past Data not Available
          </div>
        )}

        <div className="h-full overflow-y-auto px-5 pt-8 pb-32 custom-scrollbar">

          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center">
                <Milk className="text-[#D9FF57]" size={21} />
              </div>

              <h1 className="text-2xl font-semibold">Calendar</h1>
            </div>

            <button className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center">
              <CalendarDays size={18} />
            </button>
          </div>

          <div className="glass-card rounded-[34px] p-5">
            <div className="flex items-center justify-between mb-7">
              <button
                onClick={showPastPopup}
                className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
              >
                <ChevronLeft size={22} />
              </button>

              <h2 className="text-2xl font-semibold">
                {currentMonth} {currentYear}
              </h2>

              <button
                onClick={() => {}}
                className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center opacity-50"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs text-white/50 mb-4">
              <p>S</p>
              <p>M</p>
              <p>T</p>
              <p>W</p>
              <p>T</p>
              <p>F</p>
              <p>S</p>
            </div>

            <div className="grid grid-cols-7 gap-y-5">
              {days.map((day) => {
                const dayQuantity = quantityDays[day] || defaultQuantity
                const isPast = day < currentDay
                const isToday = day === currentDay
                const isPaused = pausedDays.includes(day)
                const isSelected = selectedDays.includes(day)
                

                let circleClass = ''

                if (isPast) {
                  circleClass = 'bg-white/5 border-white/10 text-white/25'
                } else if (isSelected) {
                  circleClass = 'bg-[#D9FF57] text-[#1F2430] border-[#D9FF57] shadow-[0_0_24px_rgba(217,255,87,0.55)]'
                } else if (isPaused) {
                  circleClass = 'bg-white/10 border-white/15 text-white/60'
                } else if (isToday) {
                  circleClass = 'bg-[#D9FF57]/15 border-[#D9FF57] text-[#D9FF57] shadow-[0_0_20px_rgba(217,255,87,0.35)]'
                } else {
                  circleClass = 'border-dashed border-[#D9FF57]/45 text-white'
                }

                return (
                  <button
                    key={day}
                    disabled={isPast}
                    onClick={() => toggleDay(day)}
                    className={`flex flex-col items-center press ${
                      isPast ? 'cursor-not-allowed' : ''
                    }`}
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center border text-sm transition-all duration-300 ${circleClass}`}
                    >
                      {isPaused ? <Pause size={15} /> : day}
                    </div>

                    <p className={`text-[11px] mt-1 ${isPast ? 'text-white/20' : 'text-white/55'}`}>
                      {dayQuantity}L
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="glass-card mt-5 rounded-3xl px-4 py-4 flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border border-[#D9FF57] bg-[#D9FF57]/15 shadow-[0_0_12px_rgba(217,255,87,0.35)]" />
              <p>Today</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-white/30" />
              <p>Paused</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full border border-dashed border-[#D9FF57]" />
              <p>Upcoming</p>
            </div>
          </div>

          {selectedDays.length > 0 && (
            <div className="glass-card mt-5 rounded-[30px] p-5">
              <h3 className="text-lg font-semibold mb-1">
                {selectedDays.length} date selected
              </h3>

              <p className="text-sm text-white/50 mb-5">
                Selected: {selectedDays.sort((a, b) => a - b).join(', ')}
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {selectedHasActive && (
                  <button
                    onClick={pauseSelected}
                    className="rounded-2xl bg-[#D9FF57] text-[#1F2430] py-3 font-semibold press"
                  >
                    Pause
                  </button>
                )}

                {selectedHasPaused && (
                  <button
                    onClick={resumeSelected}
                    className="rounded-2xl bg-white/10 border border-white/10 py-3 font-semibold press"
                  >
                    Resume
                  </button>
                )}
              </div>

              <div className="flex gap-3">
                <input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Enter litres"
                  type="number"
                  min="0"
                  step="0.5"
                  className="w-full rounded-2xl bg-white/10 border border-white/10 px-4 py-3 outline-none"
                />

                <button
                  onClick={changeQuantity}
                  className="rounded-2xl bg-[#D9FF57]/15 border border-[#D9FF57]/40 text-[#D9FF57] px-5 font-semibold press"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          <div className="glass-card mt-5 rounded-[34px] p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">{currentMonth} Summary</h3>

              <span className="px-4 py-1 rounded-full bg-[#D9FF57]/10 border border-[#D9FF57]/25 text-[#D9FF57] text-xs">
                Current Month
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                <p className="text-white/45 text-xs mb-2">Total Milk</p>
                <h2 className="text-2xl font-bold">24L</h2>
              </div>

              <div className="rounded-3xl bg-white/10 border border-white/10 p-4">
                <p className="text-white/45 text-xs mb-2">Remaining Balance</p>
                <h2 className="text-2xl font-bold text-[#D9FF57]">
  {localStorage.getItem('remainingBalance') || '₹0'}
</h2>
              </div>
            </div>
          </div>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}