export default function Navbar() {
  const customerName = localStorage.getItem('customerName') || 'Customer'

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold">
          Good Morning 👋
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome back, {customerName}
        </p>
      </div>

      <div className="w-12 h-12 rounded-2xl bg-lime-100 flex items-center justify-center text-xl">
        🥛
      </div>
    </div>
  )
}