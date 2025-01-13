import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'

function Leaderboard() {
  const [scores, setScores] = useState([])
  const [allTimeRecords, setAllTimeRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { player } = usePlayer()
  
  const ADMIN_USERNAMES = ['admin', 'teacher', player?.username]
  const isAdmin = player && ADMIN_USERNAMES.includes(player.username)

  useEffect(() => {
    Promise.all([fetchScores(), fetchAllTimeRecords()])
      .finally(() => setLoading(false))
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
    }
  }

  const fetchAllTimeRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('all_time_records')
        .select(`
          id,
          reaction_time,
          players!all_time_records_player_id_fkey (
            username
          )
        `)
        .order('reaction_time', { ascending: true })
        .limit(3)

      if (error) throw error
      setAllTimeRecords(data || [])
    } catch (error) {
      console.error('Error fetching all-time records:', error)
    }
  }

  const handleClearLeaderboard = async () => {
    if (!isAdmin) return
    
    const confirmed = window.confirm('Are you sure you want to clear the current leaderboard? All-time records will be preserved.')
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('scores')
        .delete()
        .not('id', 'is', null)

      if (error) throw error
      
      // Refresh scores
      fetchScores()
    } catch (error) {
      console.error('Error clearing leaderboard:', error)
      setError('Failed to clear leaderboard')
    }
  }

  return (
    <div className="leaderboard-container">
      {/* All-Time Top 3 */}
      <div className="all-time-records">
        <h2>All-Time Best Reactions</h2>
        <div className="scores-list hall-of-fame">
          {allTimeRecords.map((record, index) => (
            <div key={record.id} className={`score-item rank-${index + 1}`}>
              <span className="rank">#{index + 1}</span>
              <span className="username">
                {record.players?.username || 'Anonymous'}
              </span>
              <span className="time">{record.reaction_time}ms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current Top 10 */}
      <div className="current-leaderboard">
        <h2>Current Top 10</h2>
        <div className="user-controls">
          <button onClick={() => navigate('/')} className="back-button">
            Back to Game
          </button>
          
          {isAdmin && (
            <button 
              onClick={handleClearLeaderboard}
              className="clear-button"
            >
              Clear Current Leaderboard
            </button>
          )}
        </div>
        
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
    </div>
  )
}

export default Leaderboard 