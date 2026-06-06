import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ children }) {
  const mobile = localStorage.getItem('customerMobile')
  const token = localStorage.getItem('authToken')

  if (!mobile || !token) {
    localStorage.removeItem('customerMobile')
    localStorage.removeItem('authToken')
    localStorage.removeItem('customerName')
    localStorage.removeItem('litres')
    localStorage.removeItem('flatNo')
    localStorage.removeItem('remainingBalance')

    return <Navigate to="/" replace />
  }

  return children
}