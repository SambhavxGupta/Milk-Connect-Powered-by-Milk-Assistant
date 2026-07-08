import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { AppContext } from '../context/AppContext'
import BackButton from '../components/BackButton'
import FloatingBottomNav from '../components/FloatingBottomNav'
import { motion } from "motion/react"
import PageTransition from "../components/PageTransition";
export default function Cart() {
  const { cart, setCart, orders, setOrders } = useContext(AppContext)
  const navigate = useNavigate()

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.count, 0)
  const deliveryFee = cart.length > 0 ? 10 : 0
  const total = subtotal + deliveryFee

  function increaseItem(name) {
    setCart(
      cart.map((item) =>
        item.name === name ? { ...item, count: item.count + 1 } : item
      )
    )
  }

  function decreaseItem(name) {
    setCart(
      cart
        .map((item) =>
          item.name === name ? { ...item, count: item.count - 1 } : item
        )
        .filter((item) => item.count > 0)
    )
  }

  function removeItem(name) {
    setCart(cart.filter((item) => item.name !== name))
  }

  function placeOrder() {
  const newOrder = {
    id: Date.now(),
    date: new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    items: cart,
    total,
  }

  setOrders([newOrder, ...orders])
  setCart([])
  navigate('/history')
}

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#E9EDF2] flex justify-center items-start py-6">
      <div className="phone-shell px-5 pt-8 pb-28">
        <div className="flex items-center justify-between mb-7">
          <BackButton />

          <div className="text-center">
            <h1 className="text-lg font-bold">Cart</h1>
            <p className="text-white/55 text-xs">Review your order</p>
          </div>

          <div className="w-11" />
        </div>

        {cart.length === 0 ? (
          <div className="glass-card rounded-[30px] p-8 text-center mt-20">
            <ShoppingBag size={44} className="mx-auto text-[#D9FF57]" />

            <h2 className="text-xl font-bold mt-4">
              Your cart is empty
            </h2>

            <p className="text-white/55 text-sm mt-2">
              Add dairy products to continue.
            </p>

            <button
              onClick={() => navigate('/add-order')}
              className="press w-full mt-6 bg-[#D9FF57] text-black font-bold p-4 rounded-2xl"
            >
              Add Products
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.name}
                  className="glass-card rounded-[28px] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-[20px] bg-white/10 border border-white/10 flex items-center justify-center text-3xl">
                        {item.image}
                      </div>

                      <div>
                        <h2 className="font-bold">{item.name}</h2>
                        <p className="text-white/55 text-sm">
                          ₹{item.price} each
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.name)}
                      className="press w-10 h-10 rounded-2xl bg-red-400/20 text-red-200 flex items-center justify-center"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => decreaseItem(item.name)}
                        className="press w-9 h-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>

                      <span className="font-bold w-6 text-center">
                        {item.count}
                      </span>

                      <button
                        onClick={() => increaseItem(item.name)}
                        className="press w-9 h-9 rounded-xl bg-[#D9FF57] text-black flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <p className="text-xl font-bold">
                      ₹{item.price * item.count}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card rounded-[30px] p-5 mt-5">
              <h2 className="text-xl font-bold mb-4">Bill Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-white/65">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>

                <div className="flex justify-between text-white/65">
                  <span>Delivery Fee</span>
                  <span>₹{deliveryFee}</span>
                </div>

                <div className="h-px bg-white/10 my-3" />

                <div className="flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="text-3xl font-bold">₹{total}</span>
                </div>
              </div>

              <button
                onClick={placeOrder}
                className="press w-full mt-5 bg-[#D9FF57] text-black font-bold p-4 rounded-2xl"
              >
                Place Order
              </button>
            </div>
          </>
        )}

        <FloatingBottomNav />
      </div>
    </div>
  </PageTransition>
  )
}