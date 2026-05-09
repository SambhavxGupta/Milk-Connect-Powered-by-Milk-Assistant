import DashboardHeader from '../components/DashboardHeader'
import DeliveryCard from '../components/DeliveryCard'
import QuickActions from '../components/QuickActions'
import PlanCard from '../components/PlanCard'
import FloatingBottomNav from '../components/FloatingBottomNav'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-center py-6">
      <div className="phone-shell">
        <div className="flex-1 h-full overflow-y-auto px-6 pt-10 pb-32 custom-scrollbar">
          <DashboardHeader />
          <DeliveryCard />
          <QuickActions />
          <PlanCard />
        </div>

        <FloatingBottomNav />
      </div>
    </div>
  )
}