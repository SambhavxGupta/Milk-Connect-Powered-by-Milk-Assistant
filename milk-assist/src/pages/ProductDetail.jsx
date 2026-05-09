import { useState, useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bookmark, CheckCircle, Leaf, Home as HomeIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { AppContext } from '../context/AppContext'

export default function ProductDetail() {
  const navigate = useNavigate()
  const { productName } = useParams()
  const { cart, setCart } = useContext(AppContext)
  
  const [selectedQty, setSelectedQty] = useState('1 Litre')
  const [selectedFreq, setSelectedFreq] = useState('Daily')

  // Mock data mapping
  const products = {
    '1': { id: 1, name: 'Standard Cow Milk', desc: 'Fresh & healthy cow milk', basePrice: 56 },
    '2': { id: 2, name: 'Buffalo Milk', desc: 'Rich & creamy buffalo milk', basePrice: 62 },
    '3': { id: 3, name: 'A2 Cow Milk', desc: 'Pure A2 milk for better health', basePrice: 68 },
  }

  // Fallback to Standard Cow Milk if not found
  const product = products[productName] || products['1']

  const quantities = [
    { label: '500 ml', price: Math.round(product.basePrice * 0.5) },
    { label: '1 Litre', price: product.basePrice },
    { label: '2 Litre', price: product.basePrice * 2 },
  ]

  const frequencies = ['Daily', 'Alternate Days', 'Custom']

  const currentPrice = quantities.find(q => q.label === selectedQty)?.price || product.basePrice

  function handleAddToCart() {
    const itemKey = `${product.name}-${selectedQty}-${selectedFreq}`
    const existing = cart.find(item => item.key === itemKey)

    if (existing) {
      setCart(cart.map(item => 
        item.key === itemKey ? { ...item, count: item.count + 1 } : item
      ))
    } else {
      setCart([...cart, { 
        ...product, 
        key: itemKey,
        qty: selectedQty,
        frequency: selectedFreq,
        price: currentPrice,
        count: 1 
      }])
    }
    navigate('/cart')
  }

  return (
    <div className="min-h-screen bg-[var(--color-dark-bg)] flex justify-center items-center py-6">
      <div className="w-full max-w-[400px] h-[850px] max-h-[95vh] bg-[var(--color-dark-bg)] relative overflow-hidden flex flex-col shadow-2xl rounded-[40px] border border-white/5">
        
        {/* Header Actions */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white/80 hover:text-white transition-colors">
            <ArrowLeft size={24} />
          </button>
          <button className="p-2 -mr-2 text-white/80 hover:text-white transition-colors">
            <Bookmark size={22} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pb-32">
          
          {/* Hero Image Section */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[340px] relative flex flex-col items-center justify-end pb-10"
          >
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-white/5 blur-[50px] rounded-full"></div>
            
            {/* Mock Big Bottle */}
            <div className="w-32 h-52 bg-white/95 rounded-t-[40px] rounded-b-[20px] shadow-[0_0_40px_rgba(255,255,255,0.1)] relative z-10 flex flex-col items-center pt-2">
              <div className="w-12 h-6 border-4 border-gray-200 rounded-t-xl opacity-40"></div>
              {/* Bottle Cap Mock */}
              <div className="absolute -top-3 w-14 h-4 bg-gray-200 rounded-md"></div>
              
              {/* Splash Mock */}
              <div className="absolute -left-12 bottom-4 w-10 h-6 border-b-4 border-l-4 border-white/40 rounded-bl-full rotate-12"></div>
              <div className="absolute -right-12 bottom-6 w-12 h-8 border-b-4 border-r-4 border-white/40 rounded-br-full -rotate-12"></div>
              <div className="absolute -bottom-4 w-[160px] h-10 bg-white/10 rounded-full blur-md"></div>
            </div>
          </motion.div>

          <div className="px-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-white/50 text-[13px] mt-1">{product.desc}</p>
            </motion.div>

            {/* Features Row */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex justify-between mt-8 border-b border-white/10 pb-8"
            >
              <div className="flex flex-col items-center gap-2">
                <CheckCircle size={24} className="text-[var(--color-accent)]" />
                <span className="text-[10px] text-white/70 font-medium">100% Pure</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Leaf size={24} className="text-[var(--color-accent)]" />
                <span className="text-[10px] text-white/70 font-medium">No Preservatives</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <HomeIcon size={24} className="text-[var(--color-accent)]" />
                <span className="text-[10px] text-white/70 font-medium">Farm Fresh</span>
              </div>
            </motion.div>

            {/* Select Quantity */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
              <h3 className="text-[13px] font-semibold text-white/90 mb-4">Select Quantity</h3>
              <div className="grid grid-cols-3 gap-3">
                {quantities.map(qty => (
                  <button
                    key={qty.label}
                    onClick={() => setSelectedQty(qty.label)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                      selectedQty === qty.label 
                      ? 'border border-[var(--color-accent)] bg-white/5' 
                      : 'border border-transparent bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span className="text-[13px] font-medium text-white/90">{qty.label}</span>
                    <span className="text-[11px] text-white/50 mt-1">₹{qty.price}</span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Delivery Frequency */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
              <h3 className="text-[13px] font-semibold text-white/90 mb-4">Delivery Frequency</h3>
              <div className="flex gap-2">
                {frequencies.map(freq => (
                  <button
                    key={freq}
                    onClick={() => setSelectedFreq(freq)}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${
                      selectedFreq === freq
                      ? 'border border-[var(--color-accent)] bg-white/5 text-white'
                      : 'border border-transparent bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90'
                    }`}
                  >
                    {freq}
                  </button>
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        {/* Bottom Add to Cart */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--color-dark-bg)] via-[var(--color-dark-bg)] to-transparent pt-10 pb-6 px-6">
          <button onClick={handleAddToCart} className="w-full bg-[var(--color-accent)] text-black font-bold py-4 rounded-[20px] shadow-lg flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-transform active:scale-[0.98]">
            Add to Cart <span className="mx-1">•</span> ₹{currentPrice}
          </button>
        </div>

      </div>
    </div>
  )
}