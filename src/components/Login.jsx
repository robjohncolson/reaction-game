import { useState } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) throw error

        // Create profile after successful signup
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id, username }])

        if (profileError) throw profileError

        alert('Check your email for verification link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error

        navigate('/')
      }
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{isSignUp ? 'Sign Up' : 'Login'}</h2>
        
        {isSignUp && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit">
          {isSignUp ? 'Sign Up' : 'Login'}
        </button>

        <p onClick={() => setIsSignUp(!isSignUp)} className="toggle-auth">
          {isSignUp 
            ? 'Already have an account? Login' 
            : "Don't have an account? Sign Up"}
        </p>
      </form>
    </div>
  )
}

export default Login 