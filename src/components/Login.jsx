import { useState } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

function Login() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { updatePlayer } = usePlayer()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Validate username
      const trimmedUsername = username.trim()
      if (!trimmedUsername) {
        throw new Error('Username is required')
      }
      if (trimmedUsername.length < 2) {
        throw new Error('Username must be at least 2 characters')
      }

      console.log('Attempting to create/find player:', trimmedUsername)

      // Check if player exists
      const { data: existingPlayer, error: selectError } = await supabase
        .from('players')
        .select('*')
        .eq('username', trimmedUsername)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError
      }

      let player = existingPlayer

      // If player doesn't exist, create new one
      if (!player) {
        const { data: newPlayer, error: insertError } = await supabase
          .from('players')
          .insert([{ username: trimmedUsername }])
          .select()
          .single()

        if (insertError) throw insertError
        player = newPlayer
      }

      // Update context and local storage
      if (player) {
        console.log('Successfully stored player in localStorage')
        localStorage.setItem('player', JSON.stringify(player))
        updatePlayer(player)
        navigate('/')
      } else {
        throw new Error('Failed to create/find player')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to log in')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Enter Username to Play</h2>
        
        {error && (
          <div className="error">{error}</div>
        )}

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
          minLength={2}
          maxLength={20}
          disabled={loading}
          required
        />

        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            opacity: loading ? 0.7 : 1,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Logging in...' : 'Start Playing'}
        </button>
      </form>
    </div>
  )
}

export default Login 