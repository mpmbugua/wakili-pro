import React from 'react'
import ReactDOM from 'react-dom/client'
import AuthenticatedWakiliApp from './AuthenticatedWakiliApp.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthenticatedWakiliApp />
  </React.StrictMode>,
)