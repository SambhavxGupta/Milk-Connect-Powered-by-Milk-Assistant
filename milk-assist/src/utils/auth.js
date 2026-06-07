export function getCustomerAuth(extra = {}) {
  return {
    mobile: localStorage.getItem('customerMobile'),
    ...extra,
  }
}

export function getCustomerHeaders() {
  const token = localStorage.getItem('authToken')

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
  }
}

export function getAdminHeaders() {
  const token = localStorage.getItem('adminToken')

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token || ''}`,
  }
}