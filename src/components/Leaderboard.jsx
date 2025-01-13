import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

function Leaderboard() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newUsername, setNewUsername] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()
  const { player, updatePlayer } = usePlayer()
  
  // Admin users - you might want to store this in your database
  const ADMIN_USERNAMES = ['admin', 'teacher', player?.username]
  const isAdmin = player && ADMIN_USERNAMES.includes(player.username)

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          reaction_time,
          players!scores_player_id_fkey (
            username
          )
        `)
        .order('reaction_time', { ascending: true })
        .limit(10)

      if (error) throw error
      setScores(data || [])
    } catch (error) {
      console.error('Error fetching scores:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClearLeaderboard = async () => {
    if (!isAdmin) return
    
    const confirmed = window.confirm('Are you sure you want to clear the leaderboard? This cannot be undone.')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('scores')
        .delete()
        .not('id', 'is', null) // Deletes all records

      if (error) throw error
      
      // Refresh scores
      fetchScores()
    } catch (error) {
      console.error('Error clearing leaderboard:', error)
      setError('Failed to clear leaderboard')
    }
  }

  const handleUpdateUsername = async (e) => {
    e.preventDefault()
    if (!newUsername.trim() || newUsername === player.username) {
      setIsEditing(false)
      return
    }

    try {
      const { error } = await updatePlayer(newUsername)
      if (error) throw error
      
      setIsEditing(false)
      // Refresh scores to show new username
      fetchScores()
    } catch (error) {
      console.error('Error updating username:', error)
      setError('Failed to update username')
    }
  }

  return (
    <div className="leaderboard-container">
      <h1>Top 10 Reaction Times</h1>
      
      <div className="user-controls">
        <button onClick={() => navigate('/')} className="back-button">
          Back to Game
        </button>
        
        {isAdmin && (
          <button 
            onClick={handleClearLeaderboard}
            className="clear-button"
          >
            Clear Leaderboard
          </button>
        )}
      </div>

      {/* Username edit section */}
      <div className="username-section">
        {isEditing ? (
          <form onSubmit={handleUpdateUsername} className="username-form">
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="New username"
              minLength={2}
              maxLength={20}
              required
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
          </form>
        ) : (
          <div className="current-user">
            <span>Playing as: {player?.username}</span>
            <button onClick={() => {
              setNewUsername(player?.username || '')
              setIsEditing(true)
            }}>
              Change Username
            </button>
          </div>
        )}
      </div>
      
      {error && <p className="error">{error}</p>}
      
      {loading ? (
        <p>Loading scores...</p>
      ) : scores.length === 0 ? (
        <p>No scores yet! Be the first to play!</p>
      ) : (
        <div className="scores-list">
          {scores.map((score, index) => (
            <div key={score.id} className="score-item">
              <span className="rank">#{index + 1}</span>
              <span className="username">
                {score.players?.username || 'Anonymous'}
              </span>
              <span className="time">{score.reaction_time}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Leaderboard 