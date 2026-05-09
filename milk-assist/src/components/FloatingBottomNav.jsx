import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Wallet, MessageCircle, User } from 'lucide-react'

export default function FloatingBottomNav() {
  const links = [
    { to: '/dashboard', label: 'Home', icon: Home },
    { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    { to: '/history', label: 'Bills', icon: Wallet },
    { to: '/support', label: 'Support', icon: MessageCircle },
    { to: '/account', label: 'Profile', icon: User },
  ]

  return (
    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[88%] rounded-[32px] border border-white/10 bg-[#2E3642]/80 backdrop-blur-2xl px-5 py-4 z-50 shadow-2xl">
      <div className="flex items-center justify-between">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 text-[10px] transition font-medium ${
                isActive
                  ? 'text-[#D9FF57]'
                  : 'text-white/45 hover:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={
                    isActive
                      ? 'w-12 h-12 rounded-full bg-[#D9FF57]/15 border border-[#D9FF57]/70 flex items-center justify-center shadow-[0_0_22px_rgba(217,255,87,0.35)]'
                      : 'w-12 h-12 rounded-full flex items-center justify-center'
                  }
                >
                  <Icon size={21} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  )
}