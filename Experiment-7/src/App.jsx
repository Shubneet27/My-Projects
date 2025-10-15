import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import ProductsList from './productcard.jsx'
import AxiosPractical from './AxiosPractical.jsx'
import WebSocketChat from './WebSocketChat.jsx'
function App() {
  const [view, setView] = useState('home')

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', padding: '12px' }}>
        <button onClick={() => setView('home')}>Home</button>
        <button onClick={() => setView('axios')}>Practical 1 - Axios</button>
        <button onClick={() => setView('chat')}>Practical 3 - WebSocket Chat</button>
      </div>
      {view === 'home' && <ProductsList />}
      {view === 'axios' && <AxiosPractical />}
      {view === 'chat' && <WebSocketChat />}
    </div>
  )
}

export default App