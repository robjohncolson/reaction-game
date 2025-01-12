const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
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
    const room = rooms.get(roomId)
    if (!room) return

    room.state = 'ready'
    const delay = Math.floor(Math.random() * 9000) + 1000

    io.to(roomId).emit('game_starting')
    
    room.timer = setTimeout(() => {
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
    
    // Remove player from their room
    rooms.forEach((room, roomId) => {
      if (room.players.has(socket.id)) {
        room.removePlayer(socket.id)
        io.to(roomId).emit('player_left', {
          playerId: socket.id,
          playerCount: room.players.size
        })
        
        // Clean up empty rooms
        if (room.players.size === 0) {
          rooms.delete(roomId)
        }
      }
    })
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 