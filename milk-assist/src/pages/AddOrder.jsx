import { motion } from "motion/react"
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Bookmark, ShoppingBag, ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import PageTransition from "../components/PageTransition";

export default function AddOrder() {
  const navigate = useNavigate()
  const [activeCategory, setActiveCategory] = useState('All')
  const [selectedQuantities, setSelectedQuantities] = useState({
    1: '1 Litre',
    2: '1 Litre',
    3: '1 Litre',
  })
  const [cartItems, setCartItems] = useState(1)

  const categories = ['All', 'Cow Milk', 'Buffalo Milk', 'A2 Milk']

  const products = [
    {
      id: 1,
      name: 'Standard Cow Milk',
      desc: 'Fresh & healthy cow milk',
      price: 56,
      img: 'bg-white/90',
    },
    {
      id: 2,
      name: 'Buffalo Milk',
      desc: 'Rich & creamy buffalo milk',
      price: 62,
      img: 'bg-white/90',
    },
    {
      id: 3,
      name: 'A2 Cow Milk',
      desc: 'Pure A2 milk for better health',
      price: 68,
      img: 'bg-white/90',
    },
  ]

  const quantities = ['500 ml', '1 Litre', '2 Litre']

  return (
    <PageTransition>
    <div className="min-h-screen bg-[var(--color-dark-bg)] flex justify-center items-center py-6">
      <div className="w-full max-w-[400px] h-[850px] max-h-[95vh] bg-[var(--color-dark-bg)] relative overflow-hidden flex flex-col shadow-2xl rounded-[40px] border border-white/5">
        
        {/* Header */}
        <div className="pt-12 pb-4 px-6 flex items-center relative z-10">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1 text-center pr-8">
            <h1 className="text-lg font-semibold tracking-wide">Add Order</h1>
            <p className="text-white/50 text-xs">Choose your milk</p>
          </div>
        </div>

        {/* Categories */}
        <div className="px-6 py-4 flex gap-3 overflow-x-auto custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-card-bg)] text-white/60 border border-white/5 hover:text-white/90'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 custom-scrollbar">
          <div className="flex flex-col gap-5 mt-2">
            {products.map((product, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={product.id}
                className="glass-card p-4 relative"
              >
                <button className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors">
                  <Bookmark size={18} />
                </button>

                <div className="flex gap-4">
                  {/* Mock Bottle Image Container */}
                  <div className={`w-16 h-24 rounded-t-xl rounded-b-2xl ${product.img} flex-shrink-0 shadow-inner flex items-center justify-center relative overflow-hidden`}>
                    {/* Bottle Shape */}
                    <div className="w-8 h-14 border-2 border-[#E9EDF2] rounded-t-md rounded-b-xl opacity-30 relative z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                  </div>

                  <div className="flex-1 pt-1">
                    <h3 className="font-semibold text-[15px]">{product.name}</h3>
                    <p className="text-white/50 text-xs mt-0.5">{product.desc}</p>

                    {/* Radio Options */}
                    <div className="flex items-center gap-3 mt-4">
                      {quantities.map((q) => (
                        <label key={q} className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setSelectedQuantities(prev => ({...prev, [product.id]: q}))}>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center transition-colors ${
                            selectedQuantities[product.id] === q ? 'border-[var(--color-accent)]' : 'border-white/30 group-hover:border-white/60'
                          }`}>
                            {selectedQuantities[product.id] === q && (
                              <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full"></div>
                            )}
                          </div>
                          <span className={`text-[10px] ${selectedQuantities[product.id] === q ? 'text-white' : 'text-white/50'}`}>
                            {q}
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      <p className="font-bold text-[15px]">
                        ₹{product.price} <span className="text-[10px] font-normal text-white/50">/ litre</span>
                      </p>
                      
                      <button
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="px-5 py-1.5 bg-[var(--color-accent)] text-black text-[11px] font-bold rounded-xl hover:bg-[var(--color-accent-hover)] transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Floating Cart Bar */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="glass-card bg-[#38404E]/95 rounded-[24px] p-2 pr-2.5 flex items-center justify-between shadow-2xl backdrop-blur-xl border-white/10">
            <div className="flex items-center gap-3 pl-1">
              <div className="w-11 h-11 bg-white/5 rounded-full flex items-center justify-center relative border border-white/5">
                <ShoppingBag size={18} className="text-white/80" />
                <div className="absolute -top-0.5 -right-0.5 w-[18px] h-[18px] bg-[var(--color-accent)] text-black text-[9px] font-bold rounded-full flex items-center justify-center border-[2px] border-[#38404E]">
                  {cartItems}
                </div>
              </div>
              <div>
                <p className="text-[13px] font-semibold text-white/90 leading-tight">{cartItems} Item</p>
                <p className="text-[11px] text-[var(--color-accent)] cursor-pointer hover:underline mt-0.5">View Cart</p>
              </div>
            </div>

            <button className="flex items-center gap-1.5 bg-[var(--color-accent)] text-black px-5 py-3 rounded-[18px] font-bold text-[13px] shadow-md hover:bg-[var(--color-accent-hover)] transition-transform active:scale-95">
              ₹56
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  </PageTransition>
  )
}