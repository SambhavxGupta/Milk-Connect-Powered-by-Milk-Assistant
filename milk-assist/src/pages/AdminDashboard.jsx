import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  IndianRupee,
  LogOut,
  Milk,
  Pause,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const adminPin = localStorage.getItem('adminPin')

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  async function loadDashboard() {
    if (!adminPin) {
      navigate('/admin-login')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/admin-dashboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: adminPin }),
      })

      const data = await res.json()

      if (!data.success) {
        showToast(data.message || 'Unauthorized admin access', 'error')
        localStorage.removeItem('adminPin')
        navigate('/admin-login')
        return
      }

      setDashboard(data.dashboard)
    } catch (err) {
      showToast('Admin dashboard load failed', 'error')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, [])

  function logoutAdmin() {
    localStorage.removeItem('adminPin')
    navigate('/admin-login')
  }

  const tomorrow = dashboard?.tomorrow_delivery
  const pendingPayments = dashboard?.pending_payments || []
  const deliveries = tomorrow?.deliveries || []

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell">
        <div className="h-full overflow-y-auto px-5 pt-8 pb-10 custom-scrollbar">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/dashboard')}
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="w-10 h-10 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center">
                <ShieldCheck className="text-[#D9FF57]" size={21} />
              </div>

              <div>
                <h1 className="text-2xl font-semibold">Admin</h1>
                <p className="text-white/40 text-xs">Vendor dashboard</p>
              </div>
            </div>

            <button
              onClick={logoutAdmin}
              className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
            >
              <LogOut size={18} />
            </button>
          </div>

          {loading ? (
            <div className="glass-card rounded-[30px] p-5">
              <p className="text-white/50 text-sm">Loading admin dashboard...</p>
            </div>
          ) : (
            <>
              <div className="glass-card rounded-[34px] p-5 mb-5 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#D9FF57]/10 blur-3xl rounded-full" />

                <div className="relative z-10">
                  <p className="text-white/50 text-sm">Tomorrow Delivery</p>

                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <h2 className="text-5xl font-bold text-[#D9FF57]">
                        {tomorrow?.total_milk || 0}L
                      </h2>
                      <p className="text-white/45 text-sm mt-2">
                        Date: {tomorrow?.tomorrow_date || '-'}
                      </p>
                    </div>

                    <Truck size={42} className="text-[#D9FF57]" />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-5">
                    <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                      <p className="text-white/40 text-xs">Deliveries</p>
                      <h3 className="text-xl font-bold mt-1">
                        {deliveries.filter((d) => d.status === 'Delivery').length}
                      </h3>
                    </div>

                    <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                      <p className="text-white/40 text-xs">Paused</p>
                      <h3 className="text-xl font-bold mt-1 text-red-200">
                        {tomorrow?.paused_count || 0}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-5">
                <StatCard
                  icon={<Users size={21} />}
                  label="Customers"
                  value={dashboard?.total_customers}
                />

                <StatCard
                  icon={<CheckCircle size={21} />}
                  label="Active"
                  value={dashboard?.active_customers}
                />

                <StatCard
                  icon={<Pause size={21} />}
                  label="Paused"
                  value={dashboard?.paused_customers}
                />

                <StatCard
                  icon={<Wallet size={21} />}
                  label="Pending Pay"
                  value={dashboard?.pending_payment_count}
                />
              </div>

              <div className="glass-card rounded-[30px] p-5 mb-5">
                <div className="flex items-center gap-3 mb-4">
                  <IndianRupee size={22} className="text-[#D9FF57]" />
                  <h2 className="text-xl font-bold">Money Overview</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                    <p className="text-white/40 text-xs">Total Balance</p>
                    <h3 className="text-xl font-bold text-[#D9FF57] mt-1">
                      ₹{dashboard?.total_balance || 0}
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-white/8 border border-white/10 p-3">
                    <p className="text-white/40 text-xs">Pending Amount</p>
                    <h3 className="text-xl font-bold text-yellow-100 mt-1">
                      ₹{dashboard?.pending_payment_amount || 0}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="glass-card rounded-[30px] p-5 mb-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Wallet size={22} className="text-[#D9FF57]" />
                    <h2 className="text-xl font-bold">Pending Payments</h2>
                  </div>

                  <span className="text-xs text-white/40">
                    {pendingPayments.length}
                  </span>
                </div>

                {pendingPayments.length === 0 ? (
                  <p className="text-white/45 text-sm">No pending payments.</p>
                ) : (
                  <div className="space-y-3">
                    {pendingPayments.slice(0, 5).map((payment, index) => (
                      <div
                        key={index}
                        className="rounded-2xl bg-white/8 border border-white/10 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-bold">{payment.name}</h3>
                            <p className="text-white/40 text-xs mt-1">
                              {payment.mobile}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-[#D9FF57] font-bold">
                              ₹{payment.amount}
                            </p>
                            <p className="text-yellow-100 text-xs mt-1">
                              Pending
                            </p>
                          </div>
                        </div>

                        <p className="text-white/35 text-xs mt-3">
                          {payment.timestamp}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-[30px] p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Milk size={22} className="text-[#D9FF57]" />
                    <h2 className="text-xl font-bold">Tomorrow List</h2>
                  </div>

                  <span className="text-xs text-white/40">
                    {deliveries.length}
                  </span>
                </div>

                {deliveries.length === 0 ? (
                  <p className="text-white/45 text-sm">
                    No delivery list found for tomorrow.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {deliveries.map((item, index) => (
                      <div
                        key={index}
                        className="rounded-2xl bg-white/8 border border-white/10 p-3 flex items-center justify-between gap-3"
                      >
                        <div>
                          <h3 className="font-bold">{item.name}</h3>
                          <p className="text-white/40 text-xs mt-1">
                            Flat {item.flat_no || '-'} • {item.mobile}
                          </p>
                        </div>

                        <div className="text-right">
                          <p
                            className={`font-bold ${
                              item.status === 'Paused'
                                ? 'text-red-200'
                                : 'text-[#D9FF57]'
                            }`}
                          >
                            {item.status === 'Paused' ? 'Ab' : `${item.quantity}L`}
                          </p>

                          <p className="text-white/35 text-xs mt-1">
                            {item.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }) {
  return (
    <div className="glass-card rounded-[26px] p-4">
      <div className="w-11 h-11 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center text-[#D9FF57] mb-4">
        {icon}
      </div>

      <p className="text-white/45 text-xs mb-1">{label}</p>
      <h2 className="text-2xl font-bold">{value ?? 0}</h2>
    </div>
  )
}