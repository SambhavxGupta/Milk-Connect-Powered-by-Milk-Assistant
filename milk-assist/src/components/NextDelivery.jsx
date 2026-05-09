export default function NextDelivery() {
  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 mt-5 flex items-center justify-between">

      <div>
        <p className="text-gray-500 text-sm">
          Next Delivery
        </p>

        <h2 className="text-2xl font-bold mt-2">
          Tomorrow
        </h2>

        <p className="text-gray-500 mt-1">
          7:00 AM - 8:00 AM
        </p>
      </div>

      <div className="w-16 h-16 rounded-3xl bg-lime-100 flex items-center justify-center text-3xl">
        🥛
      </div>

    </div>
  )
}