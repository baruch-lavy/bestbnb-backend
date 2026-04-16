import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import { Server } from 'socket.io'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { stayRoutes } from './api/stay/stay.routes.js' // ✅ Stay Routes
import { orderRoutes } from './api/order/order.routes.js' // ✅ Import Orders API
import { setupSocketAPI } from './services/socket.service.js'

import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
import { logger } from './services/logger.service.js'

const app = express()
const server = http.createServer(app)


// ✅ Express App Config
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('public')))
} else {
    // ✅ CORS Setup
    const corsOptions = {
        origin: [
            '*',
            'http://127.0.0.1:3000',
            'http://localhost:3030',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'http://localhost:5174',
            'http://127.0.0.1:5174',
            'http://localhost:5175',
            'http://127.0.0.1:5175',
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}

// ✅ Apply AsyncLocalStorage Middleware
app.all('*splat', setupAsyncLocalStorage)

// ✅ API Routes
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/stay', stayRoutes) // ✅ Stay Routes
app.use('/api/order', orderRoutes) // ✅ Orders API


// ✅ Setup WebSockets
setupSocketAPI(server)

// ✅ Serve React App (Handles Frontend Routing)
// app.use(express.static('public'))
// app.get('/**', (req, res) => {
//     res.sendFile(path.resolve('public/index.html'))
// })



// ✅ Start Server
const port = process.env.PORT || 3030
server.listen(port, () => {
    logger.info('🚀 Server is running on port: ' + port)
    console.log('🚀 Server is running at: http://localhost:' + port)
})
