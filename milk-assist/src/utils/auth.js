export function getCustomerAuth(extra = {}) {
  return {
    mobile: localStorage.getItem('customerMobile'),
    auth_token: localStorage.getItem('authToken'),
    ...extra,
  }
}