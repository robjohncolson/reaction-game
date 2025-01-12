import { useState } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [username, setUsername] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      // Check if player exists or create new player
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id, username')
        .eq('username', username)
        .single()

      if (existingPlayer) {
        // Store player info in localStorage
        localStorage.setItem('player', JSON.stringify(existingPlayer))
      } else {
        // Create new player
        const { data: newPlayer, error } = await supabase
          .from('players')
          .insert([{ username }])
          .select()
          .single()

        if (error) throw error

        // Store player info in localStorage
        localStorage.setItem('player', JSON.stringify(newPlayer))
      }

      navigate('/')
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Enter Username to Play</h2>
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={2}
          maxLength={20}
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">Start Playing</button>
      </form>
    </div>
  )
}

export default Login 