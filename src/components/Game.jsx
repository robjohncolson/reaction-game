import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import { usePlayer } from '../context/PlayerContext'
import io from 'socket.io-client'
import { SOCKET_URL } from '../config/constants'

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
  const { player } = usePlayer()

  useEffect(() => {
    let mounted = true
    let socketInstance = null

    const initSocket = () => {
      if (socketInstance) return

      socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: false
      })

      socketInstance.on('connect', () => {
        console.log('Connected with ID:', socketInstance.id)
        
        if (mounted) {
          setSocket(socketInstance)
          
          socketInstance.emit('join_game', {
            roomId,
            username: player.username
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

      socketInstance.on('turn_green', ({ timestamp: serverTimestamp }) => {
        // Use Performance API for more precise timing
        const clientTimestamp = performance.now()
        const serverTimeOffset = clientTimestamp - serverTimestamp
        console.log('Server-client time offset:', serverTimeOffset)
        
        setBackgroundColor('green')
        setStartTime(clientTimestamp)
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
        setSocket(null)
      }
    }
  }, [roomId, player.username])

  const handleClick = async () => {
    // Use Performance API instead of Date.now()
    const clickTime = performance.now()
    
    if (!socket?.connected) {
      console.error('Socket not connected')
      return
    }

    if (gameState === 'waiting') {
      try {
        console.log('Emitting start_game event')
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
      const reaction = Math.round(clickTime - startTime)
      console.log({
        clickTime,
        startTime,
        reaction,
        device: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
      })

      // Add a reasonable minimum threshold (human reaction time is rarely below 100ms)
      if (reaction < 100) {
        console.warn('Suspiciously fast reaction time detected')
        return
      }

      setReactionTime(reaction)
      setGameState('waiting')
      setBackgroundColor('red')

      socket.emit('submit_score', {
        roomId,
        score: reaction
      })

      try {
        const { error } = await supabase
          .from('scores')
          .insert([{
            player_id: player.id,
            reaction_time: reaction
          }])

        if (error) throw error
      } catch (error) {
        console.error('Error saving score:', error)
      }
    }
  }

  // Add touch event handlers
  const handleTouchStart = (e) => {
    // Prevent double-firing on devices that send both touch and click events
    e.preventDefault()
    handleClick()
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
        cursor: 'pointer',
        // Disable touch highlighting
        WebkitTapHighlightColor: 'transparent',
        // Prevent text selection
        userSelect: 'none'
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      // Prevent default touch behaviors
      onTouchMove={(e) => e.preventDefault()}
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
            <div key={index} style={{ 
              padding: '8px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              margin: '4px 0',
              borderRadius: '4px'
            }}>
              #{result.rank}: {result.username || 'Anonymous'} - {result.score}ms
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