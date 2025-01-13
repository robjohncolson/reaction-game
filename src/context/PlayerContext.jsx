import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../config/supabase'

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

  const updatePlayer = async (newUsername) => {
    try {
      // Update player in Supabase
      const { data, error } = await supabase
        .from('players')
        .update({ username: newUsername })
        .eq('id', player.id)
        .select()
        .single()

      if (error) throw error

      // Update local storage and state
      const updatedPlayer = { ...player, username: newUsername }
      localStorage.setItem('player', JSON.stringify(updatedPlayer))
      setPlayer(updatedPlayer)
      
      return { data, error: null }
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