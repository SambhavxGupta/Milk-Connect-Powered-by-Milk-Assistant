import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export default function BackButton() {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate(-1)}
      className="w-11 h-11 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white"
    >
      <ChevronLeft size={22} />
    </button>
  )
}