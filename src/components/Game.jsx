import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { useAuth } from '../context/AuthContext'
import io from 'socket.io-client'

function Game() {
  const [gameState, setGameState] = useState('waiting') // waiting, ready, started
  const [backgroundColor, setBackgroundColor] = useState('red')
  const [startTime, setStartTime] = useState(null)
  const [reactionTime, setReactionTime] = useState(null)
  const [playerCount, setPlayerCount] = useState(1)
  const [results, setResults] = useState(null)
  const [socket, setSocket] = useState(null)
  const [roomId, setRoomId] = useState('default-room') // You might want to make this dynamic
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    let mounted = true
    let socketInstance = null

    const initSocket = () => {
      if (socketInstance) return

      socketInstance = io('http://localhost:3001', {
        transports: ['websocket'],
        reconnection: false
      })

      socketInstance.on('connect', () => {
        console.log('Connected with ID:', socketInstance.id)
        
        if (mounted) {
          socketInstance.emit('join_game', {
            roomId,
            username: user.email
          })
        }
      })

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error)
      })

      socketInstance.on('player_joined', ({ playerCount: count }) => {
        setPlayerCount(count)
      })

      socketInstance.on('player_left', ({ playerCount: count }) => {
        setPlayerCount(count)
      })

      socketInstance.on('game_starting', () => {
        setGameState('ready')
        setBackgroundColor('red')
        setReactionTime(null)
        setResults(null)
      })

      socketInstance.on('turn_green', ({ timestamp }) => {
        setBackgroundColor('green')
        setStartTime(timestamp)
        setGameState('started')
      })

      socketInstance.on('game_results', ({ scores }) => {
        const sortedScores = scores
          .sort((a, b) => a.score - b.score)
          .map((score, index) => ({
            ...score,
            rank: index + 1
          }))
        setResults(sortedScores)
      })
    }

    initSocket()

    return () => {
      mounted = false
      if (socketInstance) {
        console.log('Cleaning up socket:', socketInstance.id)
        socketInstance.disconnect()
        socketInstance = null
      }
    }
  }, [roomId, user.email])

  const handleClick = async () => {
    if (!socket?.connected) {
      console.error('Socket not connected')
      return
    }

    if (gameState === 'waiting') {
      try {
        socket.emit('start_game', { roomId })
      } catch (error) {
        console.error('Error starting game:', error)
      }
      return
    }
    
    if (gameState === 'ready') {
      alert('Too early! Wait for green!')
      setGameState('waiting')
      setBackgroundColor('red')
      return
    }
    
    if (gameState === 'started') {
      const endTime = Date.now()
      const reaction = endTime - startTime
      setReactionTime(reaction)
      setGameState('waiting')
      setBackgroundColor('red')

      // Submit score to room
      socket.emit('submit_score', {
        roomId,
        score: reaction
      })

      // Save score to Supabase
      try {
        const { error } = await supabase
          .from('scores')
          .insert([{
            user_id: user.id,
            reaction_time: reaction
          }])

        if (error) throw error
      } catch (error) {
        console.error('Error saving score:', error)
      }
    }
  }

  return (
    <div
      style={{
        backgroundColor,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer'
      }}
      onClick={handleClick}
    >
      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'white' }}>
        Players in room: {playerCount}
      </div>

      <h1 style={{ color: 'white' }}>
        {gameState === 'waiting' && 'Click to start'}
        {gameState === 'ready' && 'Wait for green...'}
        {gameState === 'started' && 'Click!'}
      </h1>

      {reactionTime && (
        <h2 style={{ color: 'white' }}>
          Your reaction time: {reactionTime}ms
        </h2>
      )}

      {results && (
        <div style={{ color: 'white', marginTop: '20px' }}>
          <h3>Results:</h3>
          {results.map((result, index) => (
            <div key={index}>
              #{result.rank}: {result.score}ms
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={(e) => {
          e.stopPropagation()
          navigate('/leaderboard')
        }}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          padding: '10px 20px',
          backgroundColor: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        View Leaderboard
      </button>
    </div>
  )
}

export default Game 