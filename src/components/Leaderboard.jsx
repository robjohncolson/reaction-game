import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'

function Leaderboard() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      console.log('Fetching scores...')
      const { data, error } = await supabase
        .from('scores')
        .select(`
          id,
          reaction_time,
          user_id,
          profiles!scores_user_id_fkey (
            username,
            email
          )
        `)
        .order('reaction_time', { ascending: true })
        .limit(10)

      if (error) throw error

      console.log('Fetched scores:', data)
      setScores(data || [])
    } catch (error) {
      console.error('Error fetching scores:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="leaderboard-container">
      <h1>Top 10 Reaction Times</h1>
      <button onClick={() => navigate('/')} className="back-button">
        Back to Game
      </button>
      
      {loading ? (
        <p>Loading scores...</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
      ) : scores.length === 0 ? (
        <p>No scores yet! Be the first to play!</p>
      ) : (
        <div className="scores-list">
          {scores.map((score, index) => (
            <div key={score.id} className="score-item">
              <span className="rank">#{index + 1}</span>
              <span className="username">
                {score.profiles?.username || score.profiles?.email || 'Anonymous'}
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