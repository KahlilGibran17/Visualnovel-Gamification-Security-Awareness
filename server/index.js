require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
})

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/users', require('./routes/users'))
app.use('/api/progress', require('./routes/progress'))
app.use('/api/leaderboard', require('./routes/leaderboard'))
app.use('/api/admin', require('./routes/admin'))

// Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Socket.io — real-time leaderboard
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('join-leaderboard', () => {
        socket.join('leaderboard')
        console.log(`${socket.id} joined leaderboard room`)
    })

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
    })
})

// Broadcast leaderboard updates (every 30s in production)
// In demo we expose this as an emitter function
app.set('io', io)

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
    console.log(`🚀 Akebono Cyber Academy Server running on http://localhost:${PORT}`)
    console.log(`📡 Socket.io ready for real-time leaderboard updates`)
})

module.exports = { app, io }
