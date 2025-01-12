import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../config/supabase'
import io from 'socket.io-client'

function Game() {
  const [gameState, setGameState] = useState('waiting') // waiting, ready, started
  const [backgroundColor, setBackgroundColor] = useState('red')
  const [startTime, setStartTime] = useState(null)
  const [reactionTime, setReactionTime] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Connect to socket server (we'll implement this later)
    const socket = io('http://localhost:3001')

    return () => socket.disconnect()
  }, [])

  const handleClick = () => {
    if (gameState === 'started') {
      const endTime = Date.now()
      const reaction = endTime - startTime
      setReactionTime(reaction)
      setGameState('waiting')
      // We'll implement sending the score to Supabase here
    } else if (backgroundColor === 'red') {
      alert('Too early! Wait for green!')
      setGameState('waiting')
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
    </div>
  )
}

export default Game 