import { useState, useEffect } from 'react'
import { supabase } from '../config/supabase'
import { useNavigate } from 'react-router-dom'
import { usePlayer } from '../context/PlayerContext'
import qrCode from '../assets/qr-code.png'

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
      {/* QR Code Section */}
      <div className="qr-code-section" style={{ background: 'none', padding: 0, marginBottom: '2rem' }}>
        <img 
          src={qrCode} 
          alt="QR Code to play game" 
          style={{
            width: '200px',
            height: '200px',
            margin: '0 auto',
            display: 'block'
          }}
        />
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          gap: '0.5rem',
          marginTop: '1rem' 
        }}>
          <a 
            href="https://github.com/robjohncolson/reaction-game.git"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#00ff00',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '8px 12px',
              borderRadius: '4px',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
            </svg>
            View Source Code
          </a>
          <a 
            href="https://github.com/robjohncolson/reaction-game/releases"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#00ff00',
              textDecoration: 'none',
              fontSize: '0.9rem',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
          >
            v1.0.3
          </a>
        </div>
      </div>

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