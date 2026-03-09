import express from 'express'

import { login, signup, me, logout } from './auth.controller.js'

const router = express.Router()

router.post('/login', login)
router.post('/signup', signup)
router.post('/me', me)
router.post('/logout', logout)

export const authRoutes = router