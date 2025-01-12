const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // Vite's default port
    methods: ["GET", "POST"]
  }
})

const rooms = new Map()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join_game', (roomId) => {
    socket.join(roomId)
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: new Set() })
    }
    rooms.get(roomId).players.add(socket.id)
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
}) 