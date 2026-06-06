import { Navigate } from 'react-router-dom'

export default function AdminProtectedRoute({ children }) {
  const adminPin = localStorage.getItem('adminPin')

  if (!adminPin) {
    return <Navigate to="/admin-login" replace />
  }

  return children
}