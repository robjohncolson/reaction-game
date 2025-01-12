import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'

function Leaderboard() {
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchScores()
  }, [])

  const fetchScores = async () => {
    try {
      const { data, error } = await supabase
        .from('scores')
        .select(`
          reaction_time,
          profiles:user_id (username)
        `)
        .order('reaction_time', { ascending: true })
        .limit(10)

      if (error) throw error

      setScores(data)
    } catch (error) {
      console.error('Error fetching scores:', error)
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
      ) : (
        <div className="scores-list">
          {scores.map((score, index) => (
            <div key={index} className="score-item">
              <span className="rank">#{index + 1}</span>
              <span className="username">{score.profiles.username}</span>
              <span className="time">{score.reaction_time}ms</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Leaderboard 