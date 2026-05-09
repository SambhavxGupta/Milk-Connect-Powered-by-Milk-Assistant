import { BrowserRouter, Routes, Route } from 'react-router-dom'

import Support from './pages/Support'
import Splash from './pages/Splash'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Account from './pages/Account'
import AddOrder from './pages/AddOrder'
import Cart from './pages/Cart'
import ProductDetail from './pages/ProductDetail'
import History from './pages/History'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/support" element={<Support />} />
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/account" element={<Account />} />
        <Route path="/add-order" element={<AddOrder />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/product/:productName" element={<ProductDetail />} />
        <Route path="/history" element={<History />} />
      </Routes>
    </BrowserRouter>
  )
}