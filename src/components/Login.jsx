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
      console.log('Attempting to create/find player:', username)
      
      // Check if player exists
      const { data: existingPlayer, error: selectError } = await supabase
        .from('players')
        .select('id, username')
        .eq('username', username)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing player:', selectError)
        throw selectError
      }

      if (existingPlayer) {
        console.log('Found existing player:', existingPlayer)
        localStorage.setItem('player', JSON.stringify(existingPlayer))
      } else {
        console.log('Creating new player')
        const { data: newPlayer, error: insertError } = await supabase
          .from('players')
          .insert([{ username }])
          .select()
          .single()

        if (insertError) {
          console.error('Error creating player:', insertError)
          throw insertError
        }

        console.log('Created new player:', newPlayer)
        localStorage.setItem('player', JSON.stringify(newPlayer))
      }

      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
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