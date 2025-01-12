import { createContext, useContext, useState, useEffect } from 'react'

const PlayerContext = createContext({})

export const PlayerProvider = ({ children }) => {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if player info exists in localStorage
    const storedPlayer = localStorage.getItem('player')
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer))
    }
    setLoading(false)
  }, [])

  return (
    <PlayerContext.Provider value={{ player, loading }}>
      {!loading && children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  return useContext(PlayerContext)
} 