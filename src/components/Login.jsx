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

      console.log('Select response:', { existingPlayer, selectError })

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing player:', selectError)
        throw selectError
      }

      if (existingPlayer) {
        console.log('Found existing player:', existingPlayer)
        try {
          localStorage.setItem('player', JSON.stringify(existingPlayer))
          console.log('Successfully stored player in localStorage')
        } catch (storageError) {
          console.error('localStorage error:', storageError)
          throw new Error('Could not save player data: ' + storageError.message)
        }
      } else {
        console.log('Creating new player')
        const { data: newPlayer, error: insertError } = await supabase
          .from('players')
          .insert([{ username }])
          .select()
          .single()

        console.log('Insert response:', { newPlayer, insertError })

        if (insertError) {
          console.error('Error creating player:', insertError)
          throw insertError
        }

        try {
          localStorage.setItem('player', JSON.stringify(newPlayer))
          console.log('Successfully stored new player in localStorage')
        } catch (storageError) {
          console.error('localStorage error:', storageError)
          throw new Error('Could not save player data: ' + storageError.message)
        }
      }

      console.log('Attempting to navigate to /')
      navigate('/')
    } catch (error) {
      console.error('Login error:', error)
      // Show a more user-friendly error message
      setError(error.message || 'Failed to log in. Please try again.')
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

        {error && (
          <p className="error" style={{ 
            color: 'red', 
            padding: '10px', 
            margin: '10px 0',
            backgroundColor: 'rgba(255,0,0,0.1)',
            borderRadius: '4px'
          }}>
            Error: {error}
          </p>
        )}

        <button 
          type="submit"
          style={{
            opacity: username.length < 2 ? 0.5 : 1
          }}
          disabled={username.length < 2}
        >
          Start Playing
        </button>
      </form>
    </div>
  )
}

export default Login 