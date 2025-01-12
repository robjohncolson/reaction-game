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
  const navigate = useNavigate()
  const { user } = useAuth()

  const startGame = useCallback(() => {
    if (gameState !== 'waiting') return
    
    setGameState('ready')
    setBackgroundColor('red')
    setReactionTime(null)
    
    // Random delay between 1-10 seconds
    const delay = Math.floor(Math.random() * 9000) + 1000
    
    setTimeout(() => {
      setBackgroundColor('green')
      setStartTime(Date.now())
      setGameState('started')
    }, delay)
  }, [gameState])

  const handleClick = async () => {
    if (gameState === 'waiting') {
      startGame()
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

      // Save score to Supabase
      try {
        const { error } = await supabase
          .from('scores')
          .insert([
            {
              user_id: user.id,
              reaction_time: reaction
            }
          ])

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