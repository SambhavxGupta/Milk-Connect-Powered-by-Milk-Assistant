import { BrowserRouter, Routes, Route } from 'react-router-dom'

import ToastProvider from './components/ToastProvider'
import ProtectedRoute from './components/ProtectedRoute'
import AdminProtectedRoute from './components/AdminProtectedRoute'

import Splash from './pages/Splash'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Calendar from './pages/Calendar'
import Settings from './pages/Settings'
import Account from './pages/Account'
import Payment from './pages/Payment'
import Support from './pages/Support'
import AddOrder from './pages/AddOrder'
import Cart from './pages/Cart'
import ProductDetail from './pages/ProductDetail'
import History from './pages/History'
import ChangePin from './pages/ChangePin'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider />

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Splash />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Customer protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />

        <Route
          path="/support"
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-order"
          element={
            <ProtectedRoute>
              <AddOrder />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/product/:productName"
          element={
            <ProtectedRoute>
              <ProductDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-pin"
          element={
            <ProtectedRoute>
              <ChangePin />
            </ProtectedRoute>
          }
        />

        {/* Admin protected routes */}
        <Route
          path="/admin-dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}