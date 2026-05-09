import { MessageCircle, Phone } from 'lucide-react'
import FloatingBottomNav from '../components/FloatingBottomNav'
import PageHeader from '../components/PageHeader'

export default function Support() {
  const phone = '919999999999'
  const message = 'Hello, I need help with my milk delivery.'

  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center px-3 py-4">
      <div className="phone-shell">
        <div className="h-full px-6 pt-8 pb-32">
          <PageHeader title="Support" icon={<MessageCircle size={20} />} />

          <p className="text-white/50 mb-7">
            Contact your milk vendor directly.
          </p>

          <div className="glass-card rounded-[32px] p-5 space-y-4">
            <a
              href={`https://wa.me/${phone}?text=${encodeURIComponent(message)}`}
              target="_blank"
              className="flex items-center gap-4 rounded-3xl bg-[#D9FF57] text-[#1F2430] p-4 font-semibold press"
            >
              <MessageCircle />
              WhatsApp Support
            </a>

           <button
  onClick={() => {
    navigator.clipboard.writeText('9711525845')
    alert('Vendor number copied')
  }}
  className="w-full flex items-center gap-4 rounded-3xl bg-white/10 border border-white/10 p-4 font-semibold press"
>
  <Phone />
  Copy Vendor Number
</button>
          </div>
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}