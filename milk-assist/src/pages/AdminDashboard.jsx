import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle,
  Copy,
  IndianRupee,
  LogOut,
  MessageCircle,
  Milk,
  Pause,
  RefreshCw,
  Search,
  ShieldCheck,
  Truck,
  Users,
  Wallet,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { showToast } from '../utils/toast'
import { getAdminHeaders } from '../utils/auth'

const API_BASE = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'http://127.0.0.1:5000'
  : 'https://milk-connect-powered-by-milk-assistant.onrender.com'

const DELIVERY_BOY_WHATSAPP = '917022790646'
const EXTRA_MILK = 0.5

export default function AdminDashboard() {
  const navigate = useNavigate()
  const adminToken = localStorage.getItem('adminToken')

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [customerSearch, setCustomerSearch] = useState('')

  const tomorrow = dashboard?.tomorrow_delivery
  const pendingPayments = dashboard?.pending_payments || []
  const deliveries = tomorrow?.deliveries || []
  const customers = dashboard?.customers || []

  const filteredCustomers = customers.filter((customer) => {
    const search = customerSearch.toLowerCase().trim()

    if (!search) return true

    const name = String(customer.name || '').toLowerCase()
    const flat = String(customer.flat_no || '').toLowerCase()
    const mobile = String(customer.mobile || '').toLowerCase()

    return (
      name.includes(search) ||
      flat.includes(search) ||
      mobile.includes(search)
    )
  })

  useEffect(() => {
    loadDashboard()
  }, [])

  async function loadDashboard() {
    if (!adminToken) {
      navigate('/admin-login')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/admin-dashboard`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({}),
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

  async function updatePaymentStatus(row, status) {
    if (!adminToken) return

    try {
      const res = await fetch(`${API_BASE}/api/admin-payment-status`, {
        method: 'POST',
        headers: getAdminHeaders(),
        body: JSON.stringify({
  row,
  status,
}),
      })

      const data = await res.json()

      showToast(data.message, data.success ? 'success' : 'warning')

      if (data.success) {
        await loadDashboard()
      }
    } catch (err) {
      showToast('Payment status update failed', 'error')
    }
  }

  function logoutAdmin() {
    localStorage.removeItem('adminPin')
localStorage.removeItem('adminToken')
    navigate('/admin-login')
  }

  function formatNumber(value) {
    const number = Number(value)

    if (Number.isNaN(number)) return '0'

    if (Number.isInteger(number)) return String(number)

    return String(number).replace(/\.0$/, '')
  }

  function getTowerNumber(flatNo) {
    const flat = String(flatNo || '').replace(/\D/g, '')

    if (!flat) return 0

    if (flat.length >= 5) {
      return Number(flat.slice(0, 2))
    }

    return Number(flat.slice(0, 1))
  }

  function getQuantityNumber(quantity) {
    return Number(String(quantity || '').replace(/[^\d.]/g, '')) || 0
  }

  function getDeliveryMessage() {
    if (!tomorrow || deliveries.length === 0) {
      return ''
    }

    const deliveryItems = deliveries
      .filter((item) => item.status !== 'Paused')
      .map((item) => ({
        ...item,
        flatNumber: Number(String(item.flat_no || '').replace(/\D/g, '')) || 0,
        towerNumber: getTowerNumber(item.flat_no),
        quantityNumber: getQuantityNumber(item.quantity),
      }))
      .filter((item) => item.quantityNumber > 0)
      .sort((a, b) => b.flatNumber - a.flatNumber)

    const regentItems = deliveryItems.filter(
      (item) => item.towerNumber >= 13 && item.towerNumber <= 18
    )

    const hydeItems = deliveryItems.filter(
      (item) => item.towerNumber >= 1 && item.towerNumber <= 12
    )

    const regentTotal = regentItems.reduce(
      (sum, item) => sum + item.quantityNumber,
      0
    )

    const hydeTotal = hydeItems.reduce(
      (sum, item) => sum + item.quantityNumber,
      0
    )

    const totalMilk = regentTotal + hydeTotal

    const dateParts = String(tomorrow.tomorrow_date || '').split('-')

    const dateObject =
      dateParts.length === 3
        ? new Date(
            Number(dateParts[2]),
            Number(dateParts[1]) - 1,
            Number(dateParts[0])
          )
        : new Date()

    const dateText = `${dateObject.getDate()}-${dateObject.toLocaleDateString(
      'en-IN',
      { month: 'short' }
    )}`

    const dayText = dateObject.toLocaleDateString('en-IN', {
      weekday: 'long',
    })

    function makeLines(items) {
      return items.map((item) => {
        return `${item.flat_no} ${formatNumber(item.quantityNumber)} ${item.name}`
      })
    }

    const messageLines = [
      `${dateText} ${dayText} ${formatNumber(totalMilk)}+${formatNumber(
        EXTRA_MILK
      )}L     #${deliveryItems.length}`,
      '```------ ------ ------------------',
      'Regent',
      ...makeLines(regentItems),
      formatNumber(regentTotal),
      '',
      'Hyde',
      ...makeLines(hydeItems),
      formatNumber(hydeTotal) + ' ```',
    ]

    return messageLines.join('\n')
  }

  async function copyTomorrowDeliveryList() {
    const message = getDeliveryMessage()

    if (!message) {
      showToast('No delivery list to copy', 'warning')
      return
    }

    try {
      await navigator.clipboard.writeText(message)
      showToast('Delivery message copied', 'success')
    } catch (err) {
      showToast('Could not copy delivery message', 'error')
    }
  }

  function openDeliveryWhatsApp() {
    const message = getDeliveryMessage()

    if (!message) {
      showToast('No delivery message found', 'warning')
      return
    }

    const whatsappUrl = `https://wa.me/${DELIVERY_BOY_WHATSAPP}?text=${encodeURIComponent(
      message
    )}`

    window.open(whatsappUrl, '_blank')
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell">
        <div className="h-full overflow-y-auto px-5 pt-8 pb-10 custom-scrollbar">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/admin-login')}
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

            <div className="flex items-center gap-2">
              <button
                onClick={loadDashboard}
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
              >
                <RefreshCw size={18} />
              </button>

              <button
                onClick={logoutAdmin}
                className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
              >
                <LogOut size={18} />
              </button>
            </div>
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users size={22} className="text-[#D9FF57]" />
                    <h2 className="text-xl font-bold">Customers</h2>
                  </div>

                  <span className="text-xs text-white/40">
                    {filteredCustomers.length}/{customers.length}
                  </span>
                </div>

                <div className="relative mb-4">
                  <Search
                    size={17}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35"
                  />

                  <input
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search name, flat or mobile"
                    className="w-full rounded-2xl bg-white/10 border border-white/10 px-11 py-3.5 outline-none text-white placeholder:text-white/35 focus:border-[#D9FF57]/50"
                  />
                </div>

                {filteredCustomers.length === 0 ? (
                  <p className="text-white/45 text-sm">No customer found.</p>
                ) : (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
                    {filteredCustomers.map((customer, index) => {
                      const status = String(customer.status || '').toLowerCase()

                      let statusClass = 'bg-white/10 border-white/10 text-white/60'

                      if (status === 'active') {
                        statusClass = 'bg-green-400/15 border-green-300/30 text-green-200'
                      } else if (status === 'paused') {
                        statusClass = 'bg-yellow-400/15 border-yellow-300/30 text-yellow-100'
                      } else if (status === 'inactive') {
                        statusClass = 'bg-red-400/15 border-red-300/30 text-red-200'
                      } else if (status === 'testing') {
                        statusClass = 'bg-blue-400/15 border-blue-300/30 text-blue-200'
                      }

                      return (
                        <div
                          key={index}
                          className="rounded-2xl bg-white/8 border border-white/10 p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <h3 className="font-bold">{customer.name}</h3>

                              <p className="text-white/40 text-xs mt-1">
                                Flat {customer.flat_no || '-'} • {customer.mobile}
                              </p>
                            </div>

                            <span
                              className={`px-2.5 py-1 rounded-full border text-[10px] font-bold capitalize ${statusClass}`}
                            >
                              {customer.status || 'Unknown'}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mt-3">
                            <div className="rounded-xl bg-white/6 border border-white/10 p-2">
                              <p className="text-white/35 text-[10px]">Quantity</p>

                              <p className="text-sm font-bold text-[#D9FF57] mt-0.5">
                                {customer.liter || 0}L
                              </p>
                            </div>

                            <div className="rounded-xl bg-white/6 border border-white/10 p-2">
                              <p className="text-white/35 text-[10px]">Balance</p>

                              <p className="text-sm font-bold mt-0.5">
                                ₹{customer.remaining_balance || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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

                        <div className="grid grid-cols-2 gap-2 mt-3">
                          <button
                            onClick={() => updatePaymentStatus(payment.row, 'Verified')}
                            className="rounded-xl bg-[#D9FF57] text-[#1F2430] py-2 text-xs font-bold press"
                          >
                            Verify
                          </button>

                          <button
                            onClick={() => updatePaymentStatus(payment.row, 'Rejected')}
                            className="rounded-xl bg-red-400/15 border border-red-300/30 text-red-200 py-2 text-xs font-bold press"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card rounded-[30px] p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <Milk size={22} className="text-[#D9FF57]" />
                    <h2 className="text-xl font-bold">Tomorrow List</h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyTomorrowDeliveryList}
                      className="px-3 py-2 rounded-xl bg-[#D9FF57]/15 border border-[#D9FF57]/30 text-[#D9FF57] text-xs font-bold flex items-center gap-1.5 press"
                    >
                      <Copy size={14} />
                      Copy
                    </button>

                    <button
                      onClick={openDeliveryWhatsApp}
                      className="px-3 py-2 rounded-xl bg-green-400/15 border border-green-300/30 text-green-200 text-xs font-bold flex items-center gap-1.5 press"
                    >
                      <MessageCircle size={14} />
                      WhatsApp
                    </button>
                  </div>
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