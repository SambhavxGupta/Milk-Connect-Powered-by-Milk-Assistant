import { LogOut, Phone, User, Wallet, Milk, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import FloatingBottomNav from '../components/FloatingBottomNav'
import PageHeader from '../components/PageHeader'

export default function Account() {
  const navigate = useNavigate()

  const name = localStorage.getItem('customerName') || 'Customer'
  const mobile = localStorage.getItem('customerMobile') || 'Not logged in'

  // Temporary values. Later these will come from Google Sheet.
  const flatNo = localStorage.getItem('flatNo') || 'Not added'
  const litres = localStorage.getItem('litres') || '1L'
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹2315'

  function logout() {
    localStorage.clear()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell">
        <div className="h-full overflow-y-auto px-6 pt-8 pb-32 custom-scrollbar">
          <PageHeader title="Profile" icon={<User size={20} />} />

          <div className="glass-card rounded-[32px] p-5 mb-5">
            <div className="w-17 h-17 rounded-[26px] bg-[#D9FF57] text-[#1F2430] flex items-center justify-center mb-5">
              <User size={32} />
            </div>

            <p className="text-white/50 text-sm">Customer</p>
            <h2 className="text-3xl font-bold mt-1">{name}</h2>

            <div className="flex items-center gap-2 mt-4 text-white/60 text-sm">
              <Phone size={15} />
              <span>{mobile}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="glass-card rounded-[28px] p-4">
              <Wallet size={22} className="text-[#D9FF57] mb-4" />
              <p className="text-white/45 text-xs mb-1">Remaining Balance</p>
              <h2 className="text-2xl font-bold text-[#D9FF57]">
                {remainingBalance}
              </h2>
            </div>

            <div className="glass-card rounded-[28px] p-4">
              <Milk size={22} className="text-[#D9FF57] mb-4" />
              <p className="text-white/45 text-xs mb-1">Current Plan</p>
              <h2 className="text-2xl font-bold">{litres}</h2>
            </div>
          </div>

          <div className="glass-card rounded-[28px] p-5 mb-5">
            <div className="flex items-center gap-3 mb-4">
              <Home size={21} className="text-[#D9FF57]" />
              <h2 className="text-xl font-bold">Address</h2>
            </div>

            <p className="text-white/55 text-sm">Flat Number</p>
            <h3 className="text-lg font-semibold mt-1">{flatNo}</h3>
          </div>

          <div className="glass-card rounded-[28px] p-5 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <Wallet size={22} className="text-[#D9FF57]" />
              <h2 className="text-xl font-bold">Payments</h2>
            </div>

            <p className="text-white/60 text-sm">
              View and pay your monthly milk bill.
            </p>

            <button className="w-full mt-5 bg-[#D9FF57] text-[#1F2430] font-bold p-4 rounded-2xl press">
              Make Payment
            </button>
          </div>

          <button
            onClick={logout}
            className="w-full bg-white/10 border border-white/10 text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 press"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}