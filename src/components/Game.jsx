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

      socketInstance.on('turn_green', () => {
        setBackgroundColor('green')
        setStartTime(Date.now())
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
    if (!socket?.connected) {
      console.error('Socket not connected')
      return
    }

    if (gameState === 'started') {
      const clickTime = Date.now()
      const reaction = clickTime - startTime

      console.log({
        clickTime,
        startTime,
        reaction,
        device: /mobile/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop'
      })

      if (reaction < 100 || reaction > 2000) {
        console.warn('Invalid reaction time:', reaction)
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
        // First, check if this is an all-time top 3 score
        const { data: topScores } = await supabase
          .from('all_time_records')
          .select('reaction_time')
          .order('reaction_time', { ascending: true })
          .limit(3)

        const isNewRecord = !topScores.length || 
          reaction < Math.max(...topScores.map(s => s.reaction_time))

        if (isNewRecord) {
          await supabase
            .from('all_time_records')
            .insert([{
              player_id: player.id,
              reaction_time: reaction
            }])
            
          // Optionally delete the lowest record if we have more than 3
          if (topScores.length >= 3) {
            await supabase
              .from('all_time_records')
              .delete()
              .gt('reaction_time', Math.min(...topScores.map(s => s.reaction_time)))
              .limit(1)
          }
        }

        // Save to regular scores
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
    } else if (gameState === 'waiting') {
      socket.emit('start_game', { roomId })
    }
  }

  const handleTouchStart = (e) => {
    // Stop event propagation to prevent double handling
    e.stopPropagation()
    e.preventDefault()
    
    // Only handle touch if we're in a valid state
    if (gameState === 'waiting' || gameState === 'started') {
      handleClick()
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
        cursor: 'pointer',
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'none' // Prevent default touch actions
      }}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={(e) => e.preventDefault()}
      onTouchEnd={(e) => e.preventDefault()}
    >
      <div style={{ position: 'absolute', top: '20px', left: '20px', color: 'white' }}>
        Players in room: {playerCount}
      </div>

      <h1 style={{ color: 'white', pointerEvents: 'none' }}>
        {gameState === 'waiting' && 'Click to start'}
        {gameState === 'ready' && 'Wait for green...'}
        {gameState === 'started' && 'Click!'}
      </h1>

      {reactionTime && (
        <h2 style={{ color: 'white', pointerEvents: 'none' }}>
          Your reaction time: {reactionTime}ms
        </h2>
      )}

      {results && (
        <div style={{ 
          color: 'white', 
          marginTop: '20px',
          pointerEvents: 'none'
        }}>
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
          e.preventDefault()
          navigate('/leaderboard')
        }}
        onTouchStart={(e) => {
          e.stopPropagation()
          e.preventDefault()
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
          cursor: 'pointer',
          zIndex: 10,
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          userSelect: 'none'
        }}
      >
        View Leaderboard
      </button>
    </div>
  )
}

export default Game 