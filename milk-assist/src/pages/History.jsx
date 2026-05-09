import qrImage from '../assets/qr.png'
import { Wallet, Milk, Phone, ReceiptText } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import FloatingBottomNav from '../components/FloatingBottomNav'

export default function History() {
  const remainingBalance = localStorage.getItem('remainingBalance') || '₹0'
  const currentQuantity = localStorage.getItem('litres') || '1L'
  const vendorNumber = '9711525845'

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell">
        <div className="h-full overflow-y-auto px-6 pt-8 pb-32 custom-scrollbar">
          <PageHeader title="Bills" icon={<Wallet size={20} />} />

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
              <p className="text-white/45 text-xs mb-1">Current Quantity</p>
              <h2 className="text-2xl font-bold">{currentQuantity}</h2>
            </div>
          </div>

          <div className="glass-card rounded-[32px] p-6 text-center mb-5 relative overflow-hidden">
            <div className="absolute inset-0 bg-[#D9FF57]/5 blur-3xl" />

            <img
              src={qrImage}
              alt="Payment QR"
              className="relative z-10 w-52 h-52 mx-auto rounded-[26px] bg-white p-2 object-contain shadow-2xl"
            />

            <p className="relative z-10 text-white/75 text-sm font-medium mt-5">
              Scan to Pay
            </p>
          </div>

          <div className="glass-card rounded-[28px] p-5 mb-5">
            <div className="flex items-center gap-3 mb-3">
              <Phone size={21} className="text-[#D9FF57]" />
              <h2 className="text-xl font-bold">Payment Help</h2>
            </div>

            <p className="text-white/55 text-sm">
              For payment confirmation, contact vendor:
            </p>

            <p className="text-[#D9FF57] text-2xl font-bold mt-2">
              {vendorNumber}
            </p>
          </div>

          <div className="glass-card rounded-[28px] p-5">
            <div className="flex items-center gap-3 mb-3">
              <ReceiptText size={21} className="text-[#D9FF57]" />
              <h2 className="text-xl font-bold">Payment History</h2>
            </div>

            <p className="text-white/55 text-sm">
              Payment records will appear here after Google Sheet connection.
            </p>
          </div>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}