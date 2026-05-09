import { createContext, useState } from 'react'

export const AppContext = createContext(null)

export default function AppProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [deliveryStatus, setDeliveryStatus] = useState('Delivered')

  const [milkQuantity, setMilkQuantity] = useState(
    localStorage.getItem('litres') || '1L'
  )

  const [deliveryTime, setDeliveryTime] = useState('Morning')
  const [pausedDays, setPausedDays] = useState([])
  const [cart, setCart] = useState([])

  return (
    <AppContext.Provider
      value={{
        orders,
        setOrders,
        deliveryStatus,
        setDeliveryStatus,
        milkQuantity,
        setMilkQuantity,
        deliveryTime,
        setDeliveryTime,
        pausedDays,
        setPausedDays,
        cart,
        setCart,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}