import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { stayRoutes } from './api/stay/stay.routes.js' // ✅ UPDATED to stayRoutes
import { setupSocketAPI } from './services/socket.service.js'

import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
import { dbService } from './services/db.service.js'
import { logger } from './services/logger.service.js'

const app = express()
const server = http.createServer(app)

// ✅ Express App Config
app.use(cookieParser())
app.use(express.json())

// ✅ CORS Setup (Development & Production)
const corsOptions = {
    origin: [
        'http://127.0.0.1:3000',
        'http://localhost:3030',
        'http://127.0.0.1:5173',
        'http://localhost:5173'
    ],
    credentials: true
}
app.use(cors(corsOptions))

// ✅ Apply AsyncLocalStorage Middleware
app.all('*', setupAsyncLocalStorage)

// ✅ API Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/review', reviewRoutes)

app.use('/api/stay', stayRoutes) // ✅ UPDATED to stayRoutes

// ✅ Setup WebSockets
setupSocketAPI(server)

// ✅ Handle `GET /test` route (Debugging)
app.get('/test', async (req, res) => {
    try {
        const collection = await dbService.getCollection('stay')
        if (!collection) {
            console.error("❌ Collection not found")
            return res.status(500).json({ error: 'Collection not found' })
        }

        console.log("✅ Successfully connected to 'stays' collection")

        const stays = await collection.find().toArray()
        console.log("Fetched stays:", stays) // 🔍 Debugging

        res.json(stays)
    } catch (err) {
        console.error("❌ DB connection failed:", err)
        res.status(500).json({ error: 'DB connection failed' })
    }
})

// ✅ Serve React App (Handles Frontend Routing)
// app.get('/**', (req, res) => {
//     res.sendFile(path.resolve('public/index.html'))
// })

// ✅ Start Server
const port = process.env.PORT || 3030
server.listen(port, () => {
    logger.info('🚀 Server is running on port: ' + port)
    console.log('🚀 Server is running at: http://localhost:' + port)
})