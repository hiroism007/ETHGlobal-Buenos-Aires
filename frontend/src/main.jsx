import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CDPReactProvider } from '@coinbase/cdp-react'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CDPReactProvider
      config={{
        projectId: import.meta.env.VITE_CDP_PROJECT_ID,
        ethereum: { createOnLogin: "eoa" },
        appName: "DolarBlue Agent",
        authMethods: ["email"]
      }}
    >
      <App />
    </CDPReactProvider>
  </StrictMode>,
)
