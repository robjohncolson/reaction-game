const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors({
  // Allow connections from any origin in development
  // In production, specify your Vercel app's URL
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : "http://localhost:5173"
}))

// Add a basic health check route
app.get('/', (req, res) => {
  res.send('Server is running')
})

app.get('/health', (req, res) => {
  res.send('OK')
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL
      : "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

const rooms = new Map()

class GameRoom {
  constructor() {
    this.players = new Set()
    this.state = 'waiting' // waiting, ready, started
    this.scores = new Map()
    this.timer = null
  }

  addPlayer(playerId) {
    this.players.add(playerId)
  }

  removePlayer(playerId) {
    this.players.delete(playerId)
    this.scores.delete(playerId)
  }

  setScore(playerId, score) {
    this.scores.set(playerId, score)
  }

  getScores() {
    return Array.from(this.scores.entries()).map(([playerId, score]) => ({
      playerId,
      score
    }))
  }

  reset() {
    this.state = 'waiting'
    this.scores.clear()
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = null
    }
  }
}

io.on('connection', (socket) => {
  console.log('New connection:', {
    id: socket.id,
    rooms: Array.from(socket.rooms),
    headers: socket.handshake.headers
  })

  console.log('User connected:', socket.id)

  socket.on('join_game', ({ roomId, username }) => {
    socket.join(roomId)
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new GameRoom())
    }
    
    const room = rooms.get(roomId)
    room.addPlayer(socket.id)
    
    // Notify room of new player
    io.to(roomId).emit('player_joined', {
      playerId: socket.id,
      playerCount: room.players.size,
      username
    })
  })

  socket.on('start_game', ({ roomId }) => {
    console.log('Received start_game event for room:', roomId)
    
    const room = rooms.get(roomId)
    if (!room) {
      console.error('Room not found:', roomId)
      return
    }

    console.log('Starting game in room:', roomId)
    room.state = 'ready'
    const delay = Math.floor(Math.random() * 9000) + 1000
    console.log('Game will turn green in:', delay, 'ms')

    io.to(roomId).emit('game_starting')
    
    room.timer = setTimeout(() => {
      console.log('Turning green in room:', roomId)
      room.state = 'started'
      io.to(roomId).emit('turn_green', {
        timestamp: Date.now()
      })
    }, delay)
  })

  socket.on('submit_score', ({ roomId, score }) => {
    const room = rooms.get(roomId)
    if (!room) return

    room.setScore(socket.id, score)
    
    // If all players have submitted scores
    if (room.scores.size === room.players.size) {
      const scores = room.getScores()
      io.to(roomId).emit('game_results', { scores })
      room.reset()
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    
    // Remove player from their room and clean up
    for (const [roomId, room] of rooms.entries()) {
      if (room.players.has(socket.id)) {
        room.removePlayer(socket.id)
        
        // Notify remaining players
        io.to(roomId).emit('player_left', {
          playerId: socket.id,
          playerCount: room.players.size
        })
        
        // If room is empty, remove it
        if (room.players.size === 0) {
          console.log('Removing empty room:', roomId)
          rooms.delete(roomId)
        }
        
        // Only need to remove from one room since a socket can only be in one room
        break
      }
    }
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 