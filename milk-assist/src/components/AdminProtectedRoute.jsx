import { Navigate } from 'react-router-dom'

export default function AdminProtectedRoute({ children }) {
  const adminToken = localStorage.getItem('adminToken')

  if (!adminToken) {
    localStorage.removeItem('adminPin')
    return <Navigate to="/admin-login" replace />
  }

  return children
}