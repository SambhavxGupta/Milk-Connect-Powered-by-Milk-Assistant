import { useContext } from 'react'
import { AppContext } from '../context/AppContext'

export default function StatusCard() {

  const {
    deliveryStatus,
    milkQuantity,
    deliveryTime,
  } = useContext(AppContext)

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">

      <div className="flex items-start justify-between">

        <div>

          <p className="text-gray-500 text-sm">
            Today's Delivery
          </p>

          <h2 className="text-3xl font-bold mt-2">
            {deliveryStatus}
          </h2>

          <p className="text-gray-500 mt-2">
            {milkQuantity} • {deliveryTime}
          </p>

        </div>

        <div
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            deliveryStatus === 'Paused'
              ? 'bg-red-100 text-red-700'
              : 'bg-lime-100 text-lime-700'
          }`}
        >
          {deliveryStatus}
        </div>

      </div>

    </div>
  )
}