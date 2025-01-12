import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider } from './context/PlayerContext'
import { usePlayer } from './context/PlayerContext'
import Game from './components/Game'
import Leaderboard from './components/Leaderboard'
import Login from './components/Login'

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { player } = usePlayer()
  
  if (!player) {
    return <Navigate to="/login" />
  }
  
  return children
}

function App() {
  return (
    <PlayerProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/leaderboard" 
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </Router>
    </PlayerProvider>
  )
}

export default App 