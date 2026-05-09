import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, icon }) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-7">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center press"
        >
          <ArrowLeft size={18} />
        </button>

        {icon && (
          <div className="w-10 h-10 rounded-2xl bg-[#D9FF57]/10 border border-[#D9FF57]/25 flex items-center justify-center text-[#D9FF57]">
            {icon}
          </div>
        )}

        <h1 className="text-2xl font-semibold">{title}</h1>
      </div>
    </div>
  )
}