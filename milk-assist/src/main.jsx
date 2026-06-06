import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import AppProvider from './context/AppContext'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(() => {
        console.log('Milk Connect service worker registered')
      })
      .catch((error) => {
        console.log('Service worker registration failed:', error)
      })
  })
}