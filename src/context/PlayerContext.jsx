import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

const PlayerContext = createContext({})

export const PlayerProvider = ({ children }) => {
  const [player, setPlayer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedPlayer = localStorage.getItem('player')
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer))
    }
    setLoading(false)
  }, [])

  const updatePlayer = async (newPlayerData) => {
    try {
      // If newPlayerData is a string (username), convert to object
      const playerData = typeof newPlayerData === 'string' 
        ? { ...player, username: newPlayerData }
        : newPlayerData

      // Update state
      setPlayer(playerData)
      
      // Update localStorage
      localStorage.setItem('player', JSON.stringify(playerData))
      
      return { data: playerData, error: null }
    } catch (error) {
      console.error('Error updating player:', error)
      return { data: null, error }
    }
  }

  return (
    <PlayerContext.Provider value={{ player, loading, updatePlayer }}>
      {!loading && children}
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  return useContext(PlayerContext)
} 