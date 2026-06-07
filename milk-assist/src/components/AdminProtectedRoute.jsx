import { Navigate } from 'react-router-dom'

export default function AdminProtectedRoute({ children }) {
  const adminToken = sessionStorage.getItem('adminToken')

  localStorage.removeItem('adminPin')
  localStorage.removeItem('adminToken')

  if (!adminToken) {
    return <Navigate to="/admin-login" replace />
  }

  return children
}