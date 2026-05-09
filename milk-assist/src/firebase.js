import { initializeApp, getApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDmG_aL8sxWKT6tuO79BAEanUQO8tkZalQ",
  authDomain: "milk-assistant-connect.firebaseapp.com",
  projectId: "milk-assistant-connect",
  storageBucket: "milk-assistant-connect.firebasestorage.app",
  messagingSenderId: "564961849431",
  appId: "1:564961849431:web:c2105f83cb28868065b312",
  measurementId: "G-F0LV6QCWDV"
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

const auth = getAuth(app)
auth.useDeviceLanguage()

export { auth }